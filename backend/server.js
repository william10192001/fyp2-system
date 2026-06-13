require("dotenv").config();
const Groq   = require("groq-sdk");
const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY });
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

/* ── MongoDB ── */
mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("MongoDB Error:", err));

/* ── Email Transporter ── */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: { rejectUnauthorized: false }
});

/* ════════════════════════════════════════
   AUTH ROUTES
════════════════════════════════════════ */

/* Register */
app.post("/register", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "Email already registered" });
    const hashed = await bcrypt.hash(password, 10);
    const user   = new User({ email, password: hashed, role });
    await user.save();
    res.json({ msg: "Registered ✅" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Register failed ❌" });
  }
});

/* Login */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ msg: "Incorrect password" });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { email: user.email, role: user.role } });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Login failed ❌" });
  }
});

/* Forgot Password — returns link immediately, sends email in background */
app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email is required" });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ msg: "No account found with this email" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 1000 * 60 * 60; // 1 hour
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "https://fyp2-frontend.onrender.com";
    const resetLink = `${frontendUrl}/reset/${token}`;

    // Return link immediately — never timeout waiting for email
    res.json({ msg: "Reset link ready", resetLink, success: true });

    // Try send email in background (non-blocking)
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Your Password - AI Recruit",
      html: `<div style="font-family:Inter,sans-serif;padding:32px;max-width:500px">
        <h2 style="color:#1e293b">Reset Your Password</h2>
        <p style="color:#64748b">Click below to reset your password. Expires in 1 hour.</p>
        <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#7c3aed);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
      </div>`
    }).then(() => console.log("Email sent:", email))
      .catch(err => console.log("Background email failed:", err.message));

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* Reset Password */
app.post("/reset-password/:token", async (req, res) => {
  try {
    const { token }    = req.params;
    const { password } = req.body;
    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ msg: "Reset link has expired or is invalid." });
    user.password         = await bcrypt.hash(password, 10);
    user.resetToken       = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    res.json({ msg: "Password reset successfully ✅" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Reset failed ❌" });
  }
});

/* ════════════════════════════════════════
   CANDIDATE ROUTES
════════════════════════════════════════ */

app.get("/candidates", async (req, res) => {
  const users = await User.find({ role: "candidate" });
  res.json(users);
});

app.post("/profile", async (req, res) => {
  try {
    const { email, name, phone, skills, experience, education } = req.body;
    await User.findOneAndUpdate({ email }, { name, phone, skills, experience, education }, { new: true });
    res.json({ msg: "Profile saved ✅" });
  } catch (err) {
    res.status(500).json({ msg: "Save failed ❌" });
  }
});

app.post("/upload-resume", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });
    const data = await pdf(req.file.buffer);
    const text = data.text || "";
    if (text.trim().length < 30) return res.status(400).json({ msg: "PDF has no readable text ❌" });

    const expMatch        = text.match(/(\d+)\+?\s+years?/i);
    const experienceYears = expMatch ? parseInt(expMatch[1]) : 0;

    const tokenizer = new natural.WordTokenizer();
    const rawWords  = tokenizer.tokenize(text.toLowerCase());
    const stopwords = ["the","and","is","in","to","of","for","on","with","a","an","or","by","at","from","that","this","are","was","been","have","has","had","its","they","their","our","your","can","will","may","also","all","but","not","we","you","he","she","it","be","do","did","get","use","used","using","etc","as","per","each","about","into","than","more","any","some","other","which","when","then","been","were","his","her","him","my","me","am","us","up","if","so","no","at","by","or","of","to","in","is"];
    const keywords = [...new Set(rawWords.filter(w =>
      !stopwords.includes(w) && w.length > 2 && !/^\d+$/.test(w) && !w.includes("@") && /^[a-zA-Z+#.]+$/.test(w)
    ))];

    await User.findOneAndUpdate(
      { email: req.body.email },
      { resumeKeywords: keywords, experienceYears, resumeText: text.substring(0, 4000) }
    );
    res.json({ msg: "Resume processed ✅", totalKeywords: keywords.length, keywords });
  } catch (err) {
    console.log("UPLOAD ERROR:", err);
    res.status(500).json({ msg: "Upload failed ❌" });
  }
});

/* ════════════════════════════════════════
   JOB ROUTES
════════════════════════════════════════ */

app.post("/job/create", async (req, res) => {
  try {
    const { employerEmail, jobTitle, companyName, location, jobDescription } = req.body;
    if (!jobTitle || !jobDescription) return res.status(400).json({ msg: "Title and description required" });
    const expMatch           = jobDescription.match(/(\d+)\+?\s+years?/i);
    const requiredExperience = expMatch ? parseInt(expMatch[1]) : 0;
    const tokenizer = new natural.WordTokenizer();
    const rawWords  = tokenizer.tokenize(jobDescription.toLowerCase());
    const stopwords = ["the","and","is","in","to","of","for","on","with","a","an","or","by","at","from"];
    const keywords  = [...new Set(rawWords.filter(w => !stopwords.includes(w) && w.length > 2 && !/^\d+$/.test(w) && /^[a-zA-Z+#.]+$/.test(w)))];
    const job = new Job({ employerEmail, jobTitle, companyName: companyName||"", location: location||"", jobDescription, jobKeywords: keywords, requiredExperience });
    await job.save();
    res.json({ msg: "Job created ✅", job });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Create failed ❌" });
  }
});

app.get("/jobs/:email", async (req, res) => {
  try {
    const jobs = await Job.find({ employerEmail: req.params.email }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ msg: "Fetch failed ❌" });
  }
});

app.put("/job/:id", async (req, res) => {
  try {
    const { jobTitle, companyName, location, jobDescription } = req.body;
    const expMatch           = jobDescription.match(/(\d+)\+?\s+years?/i);
    const requiredExperience = expMatch ? parseInt(expMatch[1]) : 0;
    const tokenizer = new natural.WordTokenizer();
    const rawWords  = tokenizer.tokenize(jobDescription.toLowerCase());
    const stopwords = ["the","and","is","in","to","of","for","on","with","a","an","or","by","at","from"];
    const keywords  = [...new Set(rawWords.filter(w => !stopwords.includes(w) && w.length > 2 && !/^\d+$/.test(w) && /^[a-zA-Z+#.]+$/.test(w)))];
    await Job.findByIdAndUpdate(req.params.id, { jobTitle, companyName: companyName||"", location: location||"", jobDescription, jobKeywords: keywords, requiredExperience });
    res.json({ msg: "Job updated ✅" });
  } catch (err) {
    res.status(500).json({ msg: "Update failed ❌" });
  }
});

app.delete("/job/:id", async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ msg: "Job deleted ✅" });
  } catch (err) {
    res.status(500).json({ msg: "Delete failed ❌" });
  }
});

app.post("/upload-job-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });
    const data = await pdf(req.file.buffer);
    const text = data.text || "";
    if (text.trim().length < 30) return res.status(400).json({ msg: "PDF has no readable text ❌" });
    const tokenizer = new natural.WordTokenizer();
    const rawWords  = tokenizer.tokenize(text.toLowerCase());
    const stopwords = ["the","and","is","in","to","of","for","on","with","a","an","or","by","at","from"];
    const keywords  = [...new Set(rawWords.filter(w => !stopwords.includes(w) && w.length > 2 && !/^\d+$/.test(w) && /^[a-zA-Z+#.]+$/.test(w)))];
    res.json({ msg: "PDF processed ✅", text: text.substring(0, 5000), keywords, totalKeywords: keywords.length });
  } catch (err) {
    console.log("UPLOAD-JOB-PDF ERROR:", err);
    res.status(500).json({ msg: "Upload failed ❌" });
  }
});

/* ════════════════════════════════════════
   AI MATCHING ROUTES
════════════════════════════════════════ */

/* Employer: Run AI match — only show candidates with score >= 60% */
app.post("/match", async (req, res) => {
  try {
    const { jobId } = req.body;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ msg: "Job not found" });

    const candidates = await User.find({ role: "candidate" });
    let results = [];

    for (let candidate of candidates) {
      if (!candidate.resumeText && !candidate.skills && (!candidate.resumeKeywords || candidate.resumeKeywords.length === 0)) continue;

      // Keyword score (deterministic)
      const resumeWords = candidate.resumeKeywords || [];
      const jobKeywords = job.jobKeywords || [];
      let matched = [];
      for (let rw of resumeWords) {
        for (let jw of jobKeywords) {
          if (rw.toLowerCase().trim() === jw.toLowerCase().trim() && !matched.includes(rw)) matched.push(rw);
        }
      }
      const keywordScore = jobKeywords.length > 0 ? Math.round((matched.length / jobKeywords.length) * 100) : 0;
      let experienceScore = 0;
      if (job.requiredExperience > 0) {
        experienceScore = candidate.experienceYears >= job.requiredExperience
          ? 100 : Math.round((candidate.experienceYears / job.requiredExperience) * 100);
      }
      const finalScore = Math.round(keywordScore * 0.8 + experienceScore * 0.2);

      // ← Employer view: only show candidates with score >= 60%
      if (finalScore < 60) continue;

      const recommendation =
        finalScore >= 70 ? "Perfect Match" :
        finalScore >= 50 ? "Good Match" :
        finalScore >= 30 ? "Partial Match" : "Weak Match";

      // AI for skill names + summary only
      const prompt = `
You are a recruitment AI. List matched and missing skills.

JOB KEYWORDS: ${jobKeywords.join(", ")}

CANDIDATE:
Skills: ${candidate.skills || "Not provided"}
Experience: ${candidate.experience || "Not provided"}
Resume: ${(candidate.resumeText || "").substring(0, 600)}

Return ONLY JSON:
{
  "matchedSkills": ["skill1"],
  "missingSkills": ["skill2"],
  "summary": "<2 sentence analysis>"
}
`;
      try {
        const aiRes = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 350, temperature: 0.3
        });
        const raw     = aiRes.choices[0].message.content.trim();
        const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed  = JSON.parse(cleaned);
        results.push({
          name: candidate.name, email: candidate.email, phone: candidate.phone,
          education: candidate.education, skills: candidate.skills, experience: candidate.experience,
          score: finalScore, matchedKeywords: parsed.matchedSkills || matched.slice(0, 8),
          missingSkills: parsed.missingSkills || [], summary: parsed.summary || "",
          recommendation, resumeText: candidate.resumeText || ""
        });
      } catch (aiErr) {
        results.push({
          name: candidate.name, email: candidate.email, phone: candidate.phone,
          education: candidate.education, skills: candidate.skills, experience: candidate.experience,
          score: finalScore, matchedKeywords: matched.slice(0, 8),
          missingSkills: [], summary: "", recommendation, resumeText: candidate.resumeText || ""
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    res.json(results);
  } catch (err) {
    console.log("MATCH ERROR:", err);
    res.status(500).json({ msg: "AI Matching failed ❌" });
  }
});

/* Candidate: See all jobs with keyword match score (no filter — show all) */
app.post("/match-jobs", async (req, res) => {
  try {
    const { candidateEmail } = req.body;
    const candidate = await User.findOne({ email: candidateEmail });
    if (!candidate) return res.status(404).json({ msg: "Candidate not found" });

    const jobs    = await Job.find({ status: "active" });
    const resumeWords = candidate.resumeKeywords || [];
    const results = [];

    for (let job of jobs) {
      const jobKeywords = job.jobKeywords || [];
      let matched = [];
      for (let rw of resumeWords) {
        for (let jw of jobKeywords) {
          if (rw.toLowerCase().trim() === jw.toLowerCase().trim() && !matched.includes(rw)) matched.push(rw);
        }
      }
      const keywordScore = jobKeywords.length > 0 ? Math.round((matched.length / jobKeywords.length) * 100) : 0;
      let experienceScore = 0;
      if (job.requiredExperience > 0) {
        experienceScore = candidate.experienceYears >= job.requiredExperience
          ? 100 : Math.round((candidate.experienceYears / job.requiredExperience) * 100);
      }
      const finalScore = Math.round(keywordScore * 0.8 + experienceScore * 0.2);
      const daysAgo = job.updatedAt ? Math.floor((Date.now() - new Date(job.updatedAt)) / 86400000) : 0;
      const recommendation =
        finalScore >= 70 ? "Perfect Match" :
        finalScore >= 50 ? "Good Match" :
        finalScore >= 30 ? "Partial Match" : "Weak Match";

      results.push({
        jobId: job._id.toString(), employerEmail: job.employerEmail,
        jobTitle: job.jobTitle || "Job Opening", companyName: job.companyName || job.employerEmail,
        location: job.location || "Not specified", jobDescription: job.jobDescription || "",
        daysAgo, score: finalScore, matchedSkills: matched.slice(0, 15), recommendation
      });
    }

    results.sort((a, b) => b.score - a.score);
    res.json(results);
  } catch (err) {
    console.log("MATCH-JOBS ERROR:", err);
    res.status(500).json({ msg: "Failed to get job matches" });
  }
});

/* Candidate: Deep AI analysis for a specific job */
app.post("/analyze-job-match", async (req, res) => {
  try {
    const { candidateEmail, jobId } = req.body;
    const candidate = await User.findOne({ email: candidateEmail });
    const job       = await Job.findById(jobId);
    if (!candidate || !job) return res.status(404).json({ msg: "Not found" });

    // No resume → return 0 immediately
    if (!candidate.resumeText && !candidate.skills && (!candidate.resumeKeywords || candidate.resumeKeywords.length === 0)) {
      return res.json({
        score: 0, matchedSkills: [], missingSkills: (job.jobKeywords || []).slice(0, 6),
        summary: "No resume uploaded yet. Please upload your resume to get an accurate match score.",
        recommendation: "Weak Match"
      });
    }

    // Keyword score (consistent with employer view)
    const resumeWords = candidate.resumeKeywords || [];
    const jobKeywords = job.jobKeywords || [];
    let matched = [];
    for (let rw of resumeWords) {
      for (let jw of jobKeywords) {
        if (rw.toLowerCase().trim() === jw.toLowerCase().trim() && !matched.includes(rw)) matched.push(rw);
      }
    }
    const keywordScore = jobKeywords.length > 0 ? Math.round((matched.length / jobKeywords.length) * 100) : 0;
    let experienceScore = 0;
    if (job.requiredExperience > 0) {
      experienceScore = candidate.experienceYears >= job.requiredExperience
        ? 100 : Math.round((candidate.experienceYears / job.requiredExperience) * 100);
    }
    const finalScore = Math.round(keywordScore * 0.8 + experienceScore * 0.2);
    const recommendation =
      finalScore >= 70 ? "Perfect Match" :
      finalScore >= 50 ? "Good Match" :
      finalScore >= 30 ? "Partial Match" : "Weak Match";

    // AI for skill names + summary only
    const prompt = `
You are a recruitment AI. Analyze skill match.

JOB KEYWORDS: ${jobKeywords.join(", ")}

CANDIDATE:
Skills: ${candidate.skills || "Not provided"}
Experience: ${candidate.experience || "Not provided"}
Resume: ${(candidate.resumeText || "").substring(0, 600)}

Return ONLY JSON:
{
  "matchedSkills": ["skill1"],
  "missingSkills": ["skill2"],
  "summary": "<1-2 sentence analysis>"
}
`;
    try {
      const aiRes = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 350, temperature: 0.3
      });
      const raw     = aiRes.choices[0].message.content.trim();
      const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed  = JSON.parse(cleaned);
      res.json({
        score: finalScore,
        matchedSkills: parsed.matchedSkills || matched.slice(0, 8),
        missingSkills: parsed.missingSkills || [],
        summary:       parsed.summary || "",
        recommendation
      });
    } catch (aiErr) {
      res.json({
        score: finalScore, matchedSkills: matched.slice(0, 8),
        missingSkills: jobKeywords.filter(k => !matched.includes(k)).slice(0, 6),
        summary: "", recommendation
      });
    }
  } catch (err) {
    console.log("ANALYZE ERROR:", err.message);
    res.status(500).json({ msg: "Analysis failed" });
  }
});

/* ════════════════════════════════════════
   APPLICATION ROUTES
════════════════════════════════════════ */

/* Apply to job — allow re-apply if previously rejected */
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
        // Allow re-apply: delete old rejected application
        await Application.findByIdAndDelete(existing._id);
      } else {
        return res.status(400).json({ msg: "You have already applied to this job" });
      }
    }

    const application = new Application({
      jobId, jobTitle: job.jobTitle, candidateEmail,
      candidateName: candidate.name || candidateEmail,
      employerEmail: job.employerEmail
    });
    await application.save();

    // Notify employer (non-blocking)
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: job.employerEmail,
      subject: `New Application: ${job.jobTitle} - AI Recruit`,
      html: `<div style="font-family:Inter,sans-serif;padding:32px;max-width:500px">
        <h2>New Application Received</h2>
        <p><strong>${candidate.name || candidateEmail}</strong> applied for <strong>${job.jobTitle}</strong>.</p>
        <table style="width:100%">
          <tr><td style="color:#64748b">Name:</td><td><strong>${candidate.name || "N/A"}</strong></td></tr>
          <tr><td style="color:#64748b">Email:</td><td>${candidateEmail}</td></tr>
          <tr><td style="color:#64748b">Position:</td><td><strong>${job.jobTitle}</strong></td></tr>
        </table>
        <p style="color:#94a3b8;font-size:12px;margin-top:16px">Login to your employer dashboard to view applications.</p>
      </div>`
    }).then(() => console.log("Employer notified:", job.employerEmail))
      .catch(err => console.log("Notification email failed:", err.message));

    res.json({ msg: "Applied successfully ✅", jobTitle: job.jobTitle });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Apply failed ❌" });
  }
});

app.get("/applications/:jobId", async (req, res) => {
  try {
    const apps = await Application.find({ jobId: req.params.jobId }).sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ msg: "Fetch failed" });
  }
});

app.get("/my-applications/:email", async (req, res) => {
  try {
    const apps = await Application.find({ candidateEmail: req.params.email }).sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ msg: "Fetch failed" });
  }
});

app.get("/employer-applications/:email", async (req, res) => {
  try {
    const apps = await Application.find({ employerEmail: req.params.email }).sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    console.log("EMPLOYER-APPS ERROR:", err);
    res.status(500).json({ msg: "Fetch failed" });
  }
});

app.put("/application/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const app = await Application.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ msg: "Status updated ✅", app });
  } catch (err) {
    res.status(500).json({ msg: "Update failed ❌" });
  }
});

app.delete("/cancel-application/:id", async (req, res) => {
  try {
    await Application.findByIdAndDelete(req.params.id);
    res.json({ msg: "Application cancelled ✅" });
  } catch (err) {
    res.status(500).json({ msg: "Cancel failed ❌" });
  }
});

app.post("/toggle-save-job", async (req, res) => {
  try {
    const { jobId, candidateEmail, action } = req.body;
    const update = action === "save" ? { $addToSet: { savedJobs: jobId } } : { $pull: { savedJobs: jobId } };
    await User.findOneAndUpdate({ email: candidateEmail }, update);
    res.json({ msg: action === "save" ? "Job saved ✅" : "Job unsaved" });
  } catch (err) {
    res.status(500).json({ msg: "Operation failed" });
  }
});

app.get("/saved-jobs/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ msg: "User not found" });
    const jobs = await Job.find({ _id: { $in: user.savedJobs || [] } });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ msg: "Fetch failed" });
  }
});

app.get("/", (req, res) => res.send("Backend running ✅"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
