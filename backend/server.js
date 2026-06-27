require("dotenv").config();
const Groq       = require("groq-sdk");
const groq       = new Groq({ apiKey: process.env.GROQ_API_KEY });
const express    = require("express");
const cors       = require("cors");
const mongoose   = require("mongoose");
const bcrypt     = require("bcryptjs");
const jwt        = require("jsonwebtoken");
const crypto     = require("crypto");
const natural    = require("natural");
const multer     = require("multer");
const pdf        = require("pdf-parse");
const { Resend } = require("resend");

const User        = require("./models/User");
const Job         = require("./models/Job");
const Application = require("./models/Application");

const app    = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("MongoDB Error:", err));

/* ── Unified email sender via Resend HTTP API (no SMTP, works on Render free) ── */
async function sendEmailAsync({ to, subject, html }) {
  try {
    const { data, error } = await resend.emails.send({
      from:    "AI Recruit <onboarding@resend.dev>",
      to:      [to],
      subject,
      html,
    });
    if (error) { console.log("❌ Resend error:", error); }
    else        { console.log("✅ Email sent:", data.id); }
  } catch (e) {
    console.log("❌ Email failed:", e.message);
  }
}

/* ── Deterministic keyword scorer ── */
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

/* ════ NLP KEYWORD EXTRACTOR ════ */
const STOPWORDS = new Set([
  "the","and","is","in","to","of","for","on","with","a","an","or","by","at","from",
  "that","this","are","was","been","have","has","had","its","they","their","our","your",
  "can","will","may","also","all","but","not","we","you","he","she","it","be","do",
  "did","get","use","used","using","etc","as","per","each","about","into","than","more",
  "any","some","other","which","when","then","were","his","her","him","my","me","am",
  "us","up","if","so","no","very","just","such","would","could","should","shall",
  "being","having","while","where","who","what","how","why","both","few","many",
  "own","same","too","now","here","there","once",
]);

const PROPER_NAMES = new Set([
  "liew","yong","zheng","wei","hui","ming","chen","wee","tan","lee","ng","lim","ong",
  "koh","chan","wong","teo","goh","chong","yap","khoo","kong","chew","kwan","low",
  "poh","sim","siew","soong","tiong","ting","yeoh","yew","yeap","han","jun","xin",
  "zhi","jia","kai","hao","ling","qian","rui","xuan","yang","lau","loh","mah",
  "quah","saw","seah","teoh","tsai","chia","chin","fong","foong","khaw","kua","kuah",
  "kwek","kwong","leong","leow","liow","looi","loong","loo","ooi","pang","phang",
  "phoon","pua","quek","soo","soon","tay","teh","thong","toh","tong","voon","yam",
  "siti","ahmad","mohd","bin","binti","ali","hassan","hussin","razak","aziz","rahman",
  "rahim","karim","malek","jalil","jamil","azman","azlan","azmi","azri","nur","nurul",
  "noor","hakim","amirul","amirah","faris","farhan","farhana","hafiz","hafizi","haziq",
  "izzati","ainul","aishah","zulaikha","fatimah","farah","faizal","faiz","ismail",
  "ibrahim","idris","ilham","irfan","ishak",
  "seri","jubli","emas","perak","selangor","penang","johor","sabah","sarawak","mara",
  "uitm","utm","upm","ukm","usm","utem","unimap","uniten","iium","tarc","sunway",
  "inti","limkokwing","taylors","monash","curtin","mmu","cyberjaya","multimedia",
  "jan","feb","mar","apr","jun","jul","aug","sep","oct","nov","dec",
  "january","february","march","april","june","july","august","september",
  "october","november","december",
  "gmail","yahoo","hotmail","outlook","com","edu","org","net","gov","my","co",
  "cgpa","gpa","muet","spm","stpm","ptr","ref",
]);

function extractKeywords(text) {
  if (!text) return [];
  const tokenizer = new natural.WordTokenizer();
  const words = tokenizer.tokenize(text.toLowerCase());
  return [...new Set(words.filter(w =>
    !STOPWORDS.has(w) && !PROPER_NAMES.has(w) &&
    w.length > 2 && w.length < 25 &&
    !/^\d+$/.test(w) && /^[a-zA-Z+#.]+$/.test(w)
  ))];
}

/* ════════════════════ AUTH ════════════════════ */

app.post("/register", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ msg: "Email already registered" });
    await new User({ email, password: await bcrypt.hash(password, 10), role }).save();
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

/* ── MFA: Send 6-digit OTP via Resend HTTP API ── */
app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email is required" });
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ msg: "No account found with this email" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetToken       = `otp:${otp}`;
    user.resetTokenExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Respond immediately, send email async via Resend HTTP (not SMTP)
    res.json({ msg: "Verification code sent to your email" });

    sendEmailAsync({
      to:      email,
      subject: "AI Recruit - Your Verification Code",
      html: `<div style="font-family:Inter,sans-serif;padding:40px 32px;max-width:480px;background:#f8fafc;border-radius:16px">
  <div style="text-align:center;margin-bottom:28px">
    <div style="width:56px;height:56px;background:linear-gradient(135deg,#2563eb,#7c3aed);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:white">AI</div>
  </div>
  <h2 style="color:#1e293b;text-align:center;margin:0 0 8px;font-size:22px">Verification Code</h2>
  <p style="color:#64748b;text-align:center;margin:0 0 28px;font-size:14px">Enter this code to reset your AI Recruit password.</p>
  <div style="background:white;border:2px solid #e2e8f0;border-radius:14px;padding:28px;text-align:center;margin-bottom:24px">
    <div style="font-size:44px;font-weight:800;letter-spacing:14px;color:#2563eb;font-family:monospace">${otp}</div>
    <p style="color:#94a3b8;font-size:12px;margin:10px 0 0">Valid for 10 minutes only</p>
  </div>
  <p style="color:#94a3b8;font-size:12px;text-align:center">If you did not request this, please ignore this email.</p>
</div>`
    });
  } catch (err) { console.log(err); res.status(500).json({ msg: "Server error" }); }
});

/* ── MFA: Verify OTP → return reset token ── */
app.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ msg: "Email and code are required" });
    const user = await User.findOne({
      email:            email.trim().toLowerCase(),
      resetToken:       `otp:${otp.trim()}`,
      resetTokenExpiry: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ msg: "Invalid or expired code. Please request a new one." });
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken       = resetToken;
    user.resetTokenExpiry = Date.now() + 60 * 60 * 1000;
    await user.save();
    res.json({ msg: "Code verified ✅", resetToken });
  } catch (err) { console.log(err); res.status(500).json({ msg: "Verification failed" }); }
});

app.post("/reset-password/:token", async (req, res) => {
  try {
    const user = await User.findOne({ resetToken: req.params.token, resetTokenExpiry: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ msg: "Reset link expired or invalid" });
    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetToken = undefined; user.resetTokenExpiry = undefined;
    await user.save();
    res.json({ msg: "Password reset ✅" });
  } catch { res.status(500).json({ msg: "Reset failed ❌" }); }
});

app.post("/change-password", async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    if (!email || !oldPassword || !newPassword) return res.status(400).json({ msg: "All fields required" });
    if (newPassword.length < 6) return res.status(400).json({ msg: "New password must be at least 6 characters" });
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ msg: "Account not found" });
    if (!await bcrypt.compare(oldPassword, user.password)) return res.status(400).json({ msg: "Old password is incorrect ❌" });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ msg: "Password changed ✅" });
  } catch { res.status(500).json({ msg: "Change failed ❌" }); }
});

/* ════════════════════ CANDIDATE ════════════════════ */

app.get("/candidates", async (req, res) => { res.json(await User.find({ role: "candidate" })); });

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
    const keywords = extractKeywords(text);
    await User.findOneAndUpdate({ email: req.body.email }, {
      resumeKeywords: keywords,
      experienceYears: expMatch ? parseInt(expMatch[1]) : 0,
      resumeText: text.substring(0, 4000)
    });
    res.json({ msg: "Resume processed ✅", totalKeywords: keywords.length, keywords });
  } catch (err) { console.log("UPLOAD ERROR:", err); res.status(500).json({ msg: "Upload failed ❌" }); }
});

/* ════════════════════ JOBS ════════════════════ */

app.post("/job/create", async (req, res) => {
  try {
    const { employerEmail, jobTitle, companyName, location, jobDescription,
            salary, jobType, workMode, benefits, companyDescription, contactEmail } = req.body;
    if (!jobTitle || !jobDescription) return res.status(400).json({ msg: "Title and description required" });
    const expMatch = jobDescription.match(/(\d+)\+?\s+years?/i);
    const allText  = [jobTitle, jobDescription, companyDescription, benefits].filter(Boolean).join(" ");
    const keywords = extractKeywords(allText);
    await new Job({
      employerEmail, jobTitle, companyName: companyName||"", location: location||"",
      jobDescription, jobKeywords: keywords, requiredExperience: expMatch ? parseInt(expMatch[1]) : 0,
      salary: salary||"", jobType: jobType||"", workMode: workMode||"",
      benefits: benefits||"", companyDescription: companyDescription||"", contactEmail: contactEmail||""
    }).save();
    res.json({ msg: "Job created ✅" });
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
    const allText  = [jobTitle, jobDescription, companyDescription, benefits].filter(Boolean).join(" ");
    const keywords = extractKeywords(allText);
    await Job.findByIdAndUpdate(req.params.id, {
      jobTitle, companyName: companyName||"", location: location||"",
      jobDescription, jobKeywords: keywords, requiredExperience: expMatch ? parseInt(expMatch[1]) : 0,
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
    if (text.trim().length < 10) return res.status(400).json({ msg: "PDF has no readable text ❌" });
    const keywords = extractKeywords(text);
    const prompt = `Extract job information from this text. Return ONLY valid JSON, no extra text.
Fields (use empty string "" if not found):
{"jobTitle":"","companyName":"","location":"","salary":"","jobType":"","workMode":"","companyDescription":"","benefits":"","jobDescription":""}
jobType must be one of: Full-time, Part-time, Internship, Contract, Freelance, or ""
workMode must be one of: On-site, Remote, Hybrid, or ""
TEXT:\n${text.substring(0, 3000)}`;
    let extracted = {};
    try {
      const aiRes = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500, temperature: 0.1
      });
      const raw = aiRes.choices[0].message.content.trim().replace(/```json|```/g, "").trim();
      extracted = JSON.parse(raw);
    } catch (e) { console.log("AI extraction failed:", e.message); }
    res.json({
      msg: "PDF processed ✅", text: text.substring(0, 5000), keywords, totalKeywords: keywords.length,
      jobTitle: extracted.jobTitle||"", companyName: extracted.companyName||"",
      location: extracted.location||"", salary: extracted.salary||"",
      jobType: extracted.jobType||"", workMode: extracted.workMode||"",
      companyDescription: extracted.companyDescription||"", benefits: extracted.benefits||"",
      jobDescription: extracted.jobDescription || text.substring(0, 2000),
    });
  } catch (err) { console.log(err); res.status(500).json({ msg: "Upload failed ❌" }); }
});

/* ════════════════════ AI MATCHING ════════════════════ */

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
        jobTitle: job.jobTitle||"Job Opening", companyName: job.companyName||job.employerEmail,
        location: job.location||"Not specified", jobDescription: job.jobDescription||"",
        salary: job.salary||"", jobType: job.jobType||"", workMode: job.workMode||"",
        benefits: job.benefits||"", companyDescription: job.companyDescription||"", contactEmail: job.contactEmail||"",
        jobKeywords: job.jobKeywords||[], daysAgo, score: finalScore,
        matchedSkills: matched.slice(0, 15), recommendation
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
    if (!candidate.resumeText && (!candidate.resumeKeywords || candidate.resumeKeywords.length === 0)) {
      return res.json({ score: 0, matchedSkills: [], missingSkills: (job.jobKeywords||[]).slice(0,6), summary: "No resume uploaded yet.", recommendation: "Weak Match" });
    }
    const { finalScore, matched } = calcScore(candidate.resumeKeywords, job.jobKeywords, candidate.experienceYears, job.requiredExperience);
    const recommendation = finalScore >= 70 ? "Perfect Match" : finalScore >= 50 ? "Good Match" : finalScore >= 30 ? "Partial Match" : "Weak Match";
    const missingKeywords = (job.jobKeywords||[]).filter(k => !matched.includes(k)).slice(0, 6);
    const prompt = `Recruitment AI. Analyze keyword match.
JOB KEYWORDS: ${(job.jobKeywords||[]).join(", ")}
CANDIDATE RESUME KEYWORDS: ${(candidate.resumeKeywords||[]).slice(0,30).join(", ")}
KEYWORD MATCH SCORE: ${finalScore}% (${matched.length} of ${(job.jobKeywords||[]).length} job keywords matched)
Return ONLY JSON: {"summary":"<1-2 sentences explaining the ${finalScore}% match>"}`;
    try {
      const aiRes = await groq.chat.completions.create({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], max_tokens: 150, temperature: 0.3 });
      const parsed = JSON.parse(aiRes.choices[0].message.content.trim().replace(/```json|```/g, "").trim());
      res.json({ score: finalScore, matchedSkills: matched.slice(0,10), missingSkills: missingKeywords, summary: parsed.summary||"", recommendation });
    } catch {
      res.json({ score: finalScore, matchedSkills: matched.slice(0,10), missingSkills: missingKeywords, summary: "", recommendation });
    }
  } catch { res.status(500).json({ msg: "Analysis failed" }); }
});

/* ════════════════════ APPLICATIONS ════════════════════ */

app.post("/apply", async (req, res) => {
  try {
    const { jobId, candidateEmail } = req.body;
    const job       = await Job.findById(jobId);
    if (!job) return res.status(404).json({ msg: "Job not found" });
    const candidate = await User.findOne({ email: candidateEmail });
    if (!candidate) return res.status(404).json({ msg: "Candidate not found" });
    const existing = await Application.findOne({ jobId, candidateEmail });
    if (existing) {
      if (existing.status === "rejected") { await Application.findByIdAndDelete(existing._id); }
      else return res.status(400).json({ msg: "You have already applied to this job" });
    }
    const { finalScore, matched } = calcScore(candidate.resumeKeywords, job.jobKeywords, candidate.experienceYears, job.requiredExperience);
    await new Application({ jobId, jobTitle: job.jobTitle, candidateEmail, candidateName: candidate.name||candidateEmail, employerEmail: job.employerEmail, matchScore: finalScore, matchedKeywords: matched.slice(0,10) }).save();
    sendEmailAsync({
      to: job.employerEmail, subject: `New Application: ${job.jobTitle}`,
      html: `<p><strong>${candidate.name||candidateEmail}</strong> applied for <strong>${job.jobTitle}</strong>. Match: <strong>${finalScore}%</strong></p>`
    });
    res.json({ msg: "Applied successfully ✅", jobTitle: job.jobTitle });
  } catch (err) { console.log(err); res.status(500).json({ msg: "Apply failed ❌" }); }
});

app.get("/my-applications/:email", async (req, res) => {
  try { res.json(await Application.find({ candidateEmail: req.params.email }).sort({ createdAt: -1 })); }
  catch { res.status(500).json({ msg: "Fetch failed" }); }
});

app.get("/employer-applications/:email", async (req, res) => {
  try {
    const apps = await Application.find({ employerEmail: req.params.email }).sort({ createdAt: -1 });
    const enriched = await Promise.all(apps.map(async (app) => {
      const candidate = await User.findOne({ email: app.candidateEmail }, { phone: 1, name: 1 });
      return { ...app.toObject(), candidatePhone: candidate?.phone || "", candidateName: candidate?.name || app.candidateName };
    }));
    res.json(enriched);
  } catch { res.status(500).json({ msg: "Fetch failed" }); }
});

app.put("/application/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const app = await Application.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!app) return res.status(404).json({ msg: "Application not found" });
    const statusLabel = status === "accepted" ? "Accepted for Future Process" : status === "rejected" ? "Rejected" : "Under Review";
    sendEmailAsync({
      to: app.candidateEmail, subject: `Application Update: ${app.jobTitle}`,
      html: `<p>Your application for <strong>${app.jobTitle}</strong>: <strong>${statusLabel}</strong>.</p>${status==="rejected"?"<p>You may re-apply from Job Matches.</p>":""}`
    });
    res.json({ msg: "Status updated ✅", app });
  } catch { res.status(500).json({ msg: "Update failed ❌" }); }
});

app.delete("/cancel-application/:id", async (req, res) => {
  try { await Application.findByIdAndDelete(req.params.id); res.json({ msg: "Cancelled ✅" }); }
  catch { res.status(500).json({ msg: "Cancel failed ❌" }); }
});

app.post("/toggle-save-job", async (req, res) => {
  try {
    const { jobId, candidateEmail, action } = req.body;
    await User.findOneAndUpdate({ email: candidateEmail }, action === "save" ? { $addToSet: { savedJobs: jobId } } : { $pull: { savedJobs: jobId } });
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

/* ════════════════════ ADMIN ════════════════════ */

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
  try { await User.findOneAndDelete({ email: req.body.email }); res.json({ msg: "User deleted ✅" }); }
  catch { res.status(500).json({ msg: "Delete failed" }); }
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
