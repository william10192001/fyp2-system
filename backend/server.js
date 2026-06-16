require("dotenv").config();
const Groq       = require("groq-sdk");
const groq       = new Groq({ apiKey: process.env.GROQ_API_KEY });
const express    = require("express");
const cors       = require("cors");
const mongoose   = require("mongoose");
const bcrypt     = require("bcryptjs");
const jwt        = require("jsonwebtoken");
const crypto     = require("crypto");
const nodemailer = require("nodemailer");
const natural    = require("natural");
const multer     = require("multer");
const pdf        = require("pdf-parse");

const User        = require("./models/User");
const Job         = require("./models/Job");
const Application = require("./models/Application");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("MongoDB Error:", err));

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", port: 587, secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls: { rejectUnauthorized: false }
});

/* ── Helper: keyword score ── */
function calcScore(resumeKeywords = [], jobKeywords = [], experienceYears = 0, requiredExperience = 0) {
  let matched = [];
  for (let rw of resumeKeywords) {
    for (let jw of jobKeywords) {
      if (rw.toLowerCase().trim() === jw.toLowerCase().trim() && !matched.includes(rw)) matched.push(rw);
    }
  }
  const keywordScore = jobKeywords.length > 0 ? Math.round((matched.length / jobKeywords.length) * 100) : 0;
  let experienceScore = 0;
  if (requiredExperience > 0) {
    experienceScore = experienceYears >= requiredExperience
      ? 100 : Math.round((experienceYears / requiredExperience) * 100);
  }
  return { finalScore: Math.round(keywordScore * 0.8 + experienceScore * 0.2), matched };
}

function extractKeywords(text) {
  const tokenizer = new natural.WordTokenizer();
  const rawWords  = tokenizer.tokenize(text.toLowerCase());
  const stopwords = ["the","and","is","in","to","of","for","on","with","a","an","or","by","at","from"];
  return [...new Set(rawWords.filter(w => !stopwords.includes(w) && w.length > 2 && !/^\d+$/.test(w) && /^[a-zA-Z+#.]+$/.test(w)))];
}

function sendEmailAsync(mailOptions) {
  transporter.sendMail(mailOptions)
    .then(info => console.log("✅ Email sent:", info.messageId))
    .catch(err  => console.log("❌ Email failed:", err.message));
}

/* ════════════════════════════════════════
   AUTH ROUTES
════════════════════════════════════════ */

app.post("/register", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ msg: "Email already registered" });
    const hashed = await bcrypt.hash(password, 10);
    await new User({ email, password: hashed, role }).save();
    res.json({ msg: "Registered ✅" });
  } catch { res.status(500).json({ msg: "Register failed ❌" }); }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });
    if (!await bcrypt.compare(password, user.password)) return res.status(400).json({ msg: "Incorrect password" });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { email: user.email, role: user.role } });
  } catch { res.status(500).json({ msg: "Login failed ❌" }); }
});

/* Forgot Password — returns link immediately */
app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email is required" });
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ msg: "No account found with this email" });
    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 1000 * 60 * 60;
    await user.save();
    const frontendUrl = process.env.FRONTEND_URL || "https://fyp2-frontend.onrender.com";
    const resetLink = `${frontendUrl}/reset/${token}`;
    res.json({ msg: "Reset link ready", resetLink, success: true });
    sendEmailAsync({
      from: process.env.EMAIL_USER, to: email,
      subject: "Reset Your Password - AI Recruit",
      html: `<div style="font-family:Inter,sans-serif;padding:32px;max-width:500px">
        <h2>Reset Your Password</h2>
        <p>Click below. Expires in 1 hour.</p>
        <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#7c3aed);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
      </div>`
    });
  } catch { res.status(500).json({ msg: "Server error" }); }
});

app.post("/reset-password/:token", async (req, res) => {
  try {
    const user = await User.findOne({ resetToken: req.params.token, resetTokenExpiry: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ msg: "Reset link has expired or is invalid." });
    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetToken = undefined; user.resetTokenExpiry = undefined;
    await user.save();
    res.json({ msg: "Password reset successfully ✅" });
  } catch { res.status(500).json({ msg: "Reset failed ❌" }); }
});

/* Change Password (know old password) */
app.post("/change-password", async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    if (!email || !oldPassword || !newPassword) return res.status(400).json({ msg: "All fields required" });
    if (newPassword.length < 6) return res.status(400).json({ msg: "New password must be at least 6 characters" });
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ msg: "Account not found" });
    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) return res.status(400).json({ msg: "Old password is incorrect ❌" });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ msg: "Password changed successfully ✅" });
  } catch { res.status(500).json({ msg: "Change password failed ❌" }); }
});

/* ════════════════════════════════════════
   CANDIDATE ROUTES
════════════════════════════════════════ */

app.get("/candidates", async (req, res) => {
  res.json(await User.find({ role: "candidate" }));
});

app.post("/profile", async (req, res) => {
  try {
    const { email, name, phone, skills, experience, education } = req.body;
    await User.findOneAndUpdate({ email }, { name, phone, skills, experience, education }, { new: true });
    res.json({ msg: "Profile saved ✅" });
  } catch { res.status(500).json({ msg: "Save failed ❌" }); }
});

app.post("/upload-resume", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });
    const data = await pdf(req.file.buffer);
    const text = data.text || "";
    if (text.trim().length < 30) return res.status(400).json({ msg: "PDF has no readable text ❌" });
    const expMatch = text.match(/(\d+)\+?\s+years?/i);
    const experienceYears = expMatch ? parseInt(expMatch[1]) : 0;
    const tokenizer = new natural.WordTokenizer();
    const rawWords  = tokenizer.tokenize(text.toLowerCase());
    const stopwords = ["the","and","is","in","to","of","for","on","with","a","an","or","by","at","from","that","this","are","was","been","have","has","had","its","they","their","our","your","can","will","may","also","all","but","not","we","you","he","she","it","be","do","did","get","use","used","using","etc","as","per","each","about","into","than","more","any","some","other","which","when","then","were","his","her","him","my","me","am","us","up","if","so","no"];
    const keywords = [...new Set(rawWords.filter(w => !stopwords.includes(w) && w.length > 2 && !/^\d+$/.test(w) && !w.includes("@") && /^[a-zA-Z+#.]+$/.test(w)))];
    await User.findOneAndUpdate({ email: req.body.email }, { resumeKeywords: keywords, experienceYears, resumeText: text.substring(0, 4000) });
    res.json({ msg: "Resume processed ✅", totalKeywords: keywords.length, keywords });
  } catch (err) { console.log("UPLOAD ERROR:", err); res.status(500).json({ msg: "Upload failed ❌" }); }
});

/* ════════════════════════════════════════
   JOB ROUTES (with full Company & Benefits fields)
════════════════════════════════════════ */

app.post("/job/create", async (req, res) => {
  try {
    const { employerEmail, jobTitle, companyName, location, jobDescription,
            salary, jobType, workMode, benefits, companyDescription, contactEmail } = req.body;
    if (!jobTitle || !jobDescription) return res.status(400).json({ msg: "Title and description required" });
    const expMatch = jobDescription.match(/(\d+)\+?\s+years?/i);
    const requiredExperience = expMatch ? parseInt(expMatch[1]) : 0;
    const keywords = extractKeywords(jobDescription);
    const job = new Job({
      employerEmail, jobTitle, companyName: companyName||"", location: location||"",
      jobDescription, jobKeywords: keywords, requiredExperience,
      salary: salary||"", jobType: jobType||"", workMode: workMode||"",
      benefits: benefits||"", companyDescription: companyDescription||"", contactEmail: contactEmail||""
    });
    await job.save();
    res.json({ msg: "Job created ✅", job });
  } catch { res.status(500).json({ msg: "Create failed ❌" }); }
});

app.get("/jobs/:email", async (req, res) => {
  try { res.json(await Job.find({ employerEmail: req.params.email }).sort({ createdAt: -1 })); }
  catch { res.status(500).json({ msg: "Fetch failed ❌" }); }
});

app.put("/job/:id", async (req, res) => {
  try {
    const { jobTitle, companyName, location, jobDescription,
            salary, jobType, workMode, benefits, companyDescription, contactEmail } = req.body;
    const expMatch = jobDescription.match(/(\d+)\+?\s+years?/i);
    const requiredExperience = expMatch ? parseInt(expMatch[1]) : 0;
    const keywords = extractKeywords(jobDescription);
    await Job.findByIdAndUpdate(req.params.id, {
      jobTitle, companyName: companyName||"", location: location||"",
      jobDescription, jobKeywords: keywords, requiredExperience,
      salary: salary||"", jobType: jobType||"", workMode: workMode||"",
      benefits: benefits||"", companyDescription: companyDescription||"", contactEmail: contactEmail||""
    });
    res.json({ msg: "Job updated ✅" });
  } catch { res.status(500).json({ msg: "Update failed ❌" }); }
});

app.delete("/job/:id", async (req, res) => {
  try { await Job.findByIdAndDelete(req.params.id); res.json({ msg: "Job deleted ✅" }); }
  catch { res.status(500).json({ msg: "Delete failed ❌" }); }
});

app.post("/upload-job-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });
    const data = await pdf(req.file.buffer);
    const text = data.text || "";
    if (text.trim().length < 30) return res.status(400).json({ msg: "PDF has no readable text ❌" });
    const keywords = extractKeywords(text);
    res.json({ msg: "PDF processed ✅", text: text.substring(0, 5000), keywords, totalKeywords: keywords.length });
  } catch { res.status(500).json({ msg: "Upload failed ❌" }); }
});

/* ════════════════════════════════════════
   AI MATCHING
════════════════════════════════════════ */

/* Employer match — only >= 60% */
app.post("/match", async (req, res) => {
  try {
    const { jobId } = req.body;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ msg: "Job not found" });
    const candidates = await User.find({ role: "candidate" });
    let results = [];
    for (let candidate of candidates) {
      if (!candidate.resumeText && !candidate.skills && (!candidate.resumeKeywords || candidate.resumeKeywords.length === 0)) continue;
      const { finalScore, matched } = calcScore(candidate.resumeKeywords, job.jobKeywords, candidate.experienceYears, job.requiredExperience);
      if (finalScore < 60) continue;
      const recommendation = finalScore >= 70 ? "Perfect Match" : finalScore >= 50 ? "Good Match" : finalScore >= 30 ? "Partial Match" : "Weak Match";
      const prompt = `You are a recruitment AI. List matched and missing skills.
JOB KEYWORDS: ${(job.jobKeywords||[]).join(", ")}
CANDIDATE Skills: ${candidate.skills || "Not provided"}
Resume: ${(candidate.resumeText || "").substring(0, 500)}
Return ONLY JSON: {"matchedSkills":["s1"],"missingSkills":["s2"],"summary":"<2 sentences>"}`;
      try {
        const aiRes = await groq.chat.completions.create({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], max_tokens: 300, temperature: 0.3 });
        const parsed = JSON.parse(aiRes.choices[0].message.content.trim().replace(/```json|```/g, "").trim());
        results.push({ name: candidate.name, email: candidate.email, phone: candidate.phone, education: candidate.education, skills: candidate.skills, experience: candidate.experience, score: finalScore, matchedKeywords: parsed.matchedSkills || matched.slice(0, 8), missingSkills: parsed.missingSkills || [], summary: parsed.summary || "", recommendation, resumeText: candidate.resumeText || "" });
      } catch {
        results.push({ name: candidate.name, email: candidate.email, phone: candidate.phone, education: candidate.education, skills: candidate.skills, experience: candidate.experience, score: finalScore, matchedKeywords: matched.slice(0, 8), missingSkills: [], summary: "", recommendation, resumeText: candidate.resumeText || "" });
      }
    }
    results.sort((a, b) => b.score - a.score);
    res.json(results);
  } catch (err) { console.log("MATCH ERROR:", err); res.status(500).json({ msg: "AI Matching failed ❌" }); }
});

/* Candidate match — all jobs */
app.post("/match-jobs", async (req, res) => {
  try {
    const { candidateEmail } = req.body;
    const candidate = await User.findOne({ email: candidateEmail });
    if (!candidate) return res.status(404).json({ msg: "Candidate not found" });
    const jobs = await Job.find({ status: "active" });
    const results = [];
    for (let job of jobs) {
      const { finalScore, matched } = calcScore(candidate.resumeKeywords, job.jobKeywords, candidate.experienceYears, job.requiredExperience);
      const daysAgo = job.updatedAt ? Math.floor((Date.now() - new Date(job.updatedAt)) / 86400000) : 0;
      const recommendation = finalScore >= 70 ? "Perfect Match" : finalScore >= 50 ? "Good Match" : finalScore >= 30 ? "Partial Match" : "Weak Match";
      results.push({
        jobId: job._id.toString(), employerEmail: job.employerEmail,
        jobTitle: job.jobTitle || "Job Opening", companyName: job.companyName || job.employerEmail,
        location: job.location || "Not specified", jobDescription: job.jobDescription || "",
        salary: job.salary||"", jobType: job.jobType||"", workMode: job.workMode||"",
        benefits: job.benefits||"", companyDescription: job.companyDescription||"", contactEmail: job.contactEmail||"",
        daysAgo, score: finalScore, matchedSkills: matched.slice(0, 15), recommendation
      });
    }
    results.sort((a, b) => b.score - a.score);
    res.json(results);
  } catch { res.status(500).json({ msg: "Failed to get job matches" }); }
});

app.post("/analyze-job-match", async (req, res) => {
  try {
    const { candidateEmail, jobId } = req.body;
    const candidate = await User.findOne({ email: candidateEmail });
    const job       = await Job.findById(jobId);
    if (!candidate || !job) return res.status(404).json({ msg: "Not found" });
    if (!candidate.resumeText && !candidate.skills && (!candidate.resumeKeywords || candidate.resumeKeywords.length === 0)) {
      return res.json({ score: 0, matchedSkills: [], missingSkills: (job.jobKeywords||[]).slice(0,6), summary: "No resume uploaded yet. Please upload your resume to get an accurate match score.", recommendation: "Weak Match" });
    }
    const { finalScore, matched } = calcScore(candidate.resumeKeywords, job.jobKeywords, candidate.experienceYears, job.requiredExperience);
    const recommendation = finalScore >= 70 ? "Perfect Match" : finalScore >= 50 ? "Good Match" : finalScore >= 30 ? "Partial Match" : "Weak Match";
    const prompt = `You are a recruitment AI.
JOB KEYWORDS: ${(job.jobKeywords||[]).join(", ")}
CANDIDATE Skills: ${candidate.skills || "Not provided"}
Resume: ${(candidate.resumeText || "").substring(0, 500)}
Return ONLY JSON: {"matchedSkills":["s1"],"missingSkills":["s2"],"summary":"<1-2 sentences>"}`;
    try {
      const aiRes = await groq.chat.completions.create({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], max_tokens: 300, temperature: 0.3 });
      const parsed = JSON.parse(aiRes.choices[0].message.content.trim().replace(/```json|```/g, "").trim());
      res.json({ score: finalScore, matchedSkills: parsed.matchedSkills || matched.slice(0, 8), missingSkills: parsed.missingSkills || [], summary: parsed.summary || "", recommendation });
    } catch {
      res.json({ score: finalScore, matchedSkills: matched.slice(0, 8), missingSkills: (job.jobKeywords||[]).filter(k => !matched.includes(k)).slice(0, 6), summary: "", recommendation });
    }
  } catch { res.status(500).json({ msg: "Analysis failed" }); }
});

/* ════════════════════════════════════════
   APPLICATION ROUTES
════════════════════════════════════════ */

app.post("/apply", async (req, res) => {
  try {
    const { jobId, candidateEmail } = req.body;
    const job       = await Job.findById(jobId);
    if (!job) return res.status(404).json({ msg: "Job not found" });
    const candidate = await User.findOne({ email: candidateEmail });
    if (!candidate) return res.status(404).json({ msg: "Candidate not found" });

    const existing = await Application.findOne({ jobId, candidateEmail });
    if (existing) {
      if (existing.status === "rejected") {
        await Application.findByIdAndDelete(existing._id);
        console.log(`Re-apply: deleted old rejected app for ${candidateEmail}`);
      } else {
        return res.status(400).json({ msg: "You have already applied to this job" });
      }
    }

    const { finalScore, matched } = calcScore(candidate.resumeKeywords, job.jobKeywords, candidate.experienceYears, job.requiredExperience);
    const application = new Application({
      jobId, jobTitle: job.jobTitle, candidateEmail,
      candidateName: candidate.name || candidateEmail,
      employerEmail: job.employerEmail,
      matchScore: finalScore, matchedKeywords: matched.slice(0, 10)
    });
    await application.save();

    // Notify employer
    sendEmailAsync({
      from: process.env.EMAIL_USER, to: job.employerEmail,
      subject: `New Application: ${job.jobTitle} - AI Recruit`,
      html: `<div style="font-family:Inter,sans-serif;padding:32px;max-width:500px">
        <h2>New Application Received</h2>
        <p><strong>${candidate.name || candidateEmail}</strong> applied for <strong>${job.jobTitle}</strong>.</p>
        <p>Match Score: <strong>${finalScore}%</strong></p>
        <p style="color:#94a3b8;font-size:12px">Login to your employer dashboard → Applications tab to review.</p>
      </div>`
    });

    res.json({ msg: "Applied successfully ✅", jobTitle: job.jobTitle });
  } catch (err) { console.log(err); res.status(500).json({ msg: "Apply failed ❌" }); }
});

app.get("/my-applications/:email", async (req, res) => {
  try { res.json(await Application.find({ candidateEmail: req.params.email }).sort({ createdAt: -1 })); }
  catch { res.status(500).json({ msg: "Fetch failed" }); }
});

app.get("/employer-applications/:email", async (req, res) => {
  try { res.json(await Application.find({ employerEmail: req.params.email }).sort({ createdAt: -1 })); }
  catch { res.status(500).json({ msg: "Fetch failed" }); }
});

app.put("/application/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const app = await Application.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!app) return res.status(404).json({ msg: "Application not found" });
    // Notify candidate
    sendEmailAsync({
      from: process.env.EMAIL_USER, to: app.candidateEmail,
      subject: `Application Update: ${app.jobTitle} - AI Recruit`,
      html: `<div style="font-family:Inter,sans-serif;padding:32px;max-width:500px">
        <h2>Application ${status === "accepted" ? "Accepted 🎉" : "Update"}</h2>
        <p>Your application for <strong>${app.jobTitle}</strong> has been <strong>${status === "accepted" ? "accepted" : "rejected"}</strong>.</p>
        ${status === "rejected" ? "<p>You may re-apply from the Job Matches tab.</p>" : "<p>The employer will contact you soon.</p>"}
      </div>`
    });
    res.json({ msg: "Status updated ✅", app });
  } catch { res.status(500).json({ msg: "Update failed ❌" }); }
});

app.delete("/cancel-application/:id", async (req, res) => {
  try { await Application.findByIdAndDelete(req.params.id); res.json({ msg: "Application cancelled ✅" }); }
  catch { res.status(500).json({ msg: "Cancel failed ❌" }); }
});

app.post("/toggle-save-job", async (req, res) => {
  try {
    const { jobId, candidateEmail, action } = req.body;
    const update = action === "save" ? { $addToSet: { savedJobs: jobId } } : { $pull: { savedJobs: jobId } };
    await User.findOneAndUpdate({ email: candidateEmail }, update);
    res.json({ msg: action === "save" ? "Job saved ✅" : "Job unsaved" });
  } catch { res.status(500).json({ msg: "Operation failed" }); }
});

app.get("/saved-jobs/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(await Job.find({ _id: { $in: user.savedJobs || [] } }));
  } catch { res.status(500).json({ msg: "Fetch failed" }); }
});

/* ════════════════════════════════════════
   ADMIN ROUTES
════════════════════════════════════════ */

app.get("/admin/all-users", async (req, res) => {
  try { res.json(await User.find({}, { password: 0, resetToken: 0, resetTokenExpiry: 0 })); }
  catch { res.status(500).json({ msg: "Fetch failed" }); }
});

app.get("/admin/all-jobs", async (req, res) => {
  try { res.json(await Job.find({}).sort({ createdAt: -1 })); }
  catch { res.status(500).json({ msg: "Fetch failed" }); }
});

app.get("/admin/all-applications", async (req, res) => {
  try { res.json(await Application.find({}).sort({ createdAt: -1 })); }
  catch { res.status(500).json({ msg: "Fetch failed" }); }
});

app.delete("/admin/delete-user", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email required" });
    await User.findOneAndDelete({ email });
    res.json({ msg: `User ${email} deleted ✅` });
  } catch { res.status(500).json({ msg: "Delete failed" }); }
});

app.delete("/admin/delete-job/:id", async (req, res) => {
  try { await Job.findByIdAndDelete(req.params.id); res.json({ msg: "Job deleted ✅" }); }
  catch { res.status(500).json({ msg: "Delete failed" }); }
});

app.delete("/admin/delete-application/:id", async (req, res) => {
  try { await Application.findByIdAndDelete(req.params.id); res.json({ msg: "Application deleted ✅" }); }
  catch { res.status(500).json({ msg: "Delete failed" }); }
});

app.get("/", (req, res) => res.send("Backend running ✅"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
