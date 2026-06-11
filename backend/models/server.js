require("dotenv").config();
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const natural = require("natural");
const multer = require("multer");
const pdf = require("pdf-parse");

const User = require("./models/User");
const Job = require("./models/Job");
const Application = require("./models/Application");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

/* ── MongoDB ── */
mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("MongoDB Error:", err));

/* ── Nodemailer (Gmail App Password required) ── */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS   // Must be a Gmail App Password, NOT your normal password
  },
  tls: { rejectUnauthorized: false }
});

// Verify email on startup
transporter.verify((error) => {
  if (error) console.log("⚠️  Email config error:", error.message);
  else console.log("✅ Email server ready");
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

/* Forgot Password */
app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "No account found with this email" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken       = token;
    user.resetTokenExpiry = Date.now() + 1000 * 60 * 30; // 30 minutes
    await user.save();

    const link = `${process.env.FRONTEND_URL}/reset/${token}`;

    const mailOptions = {
      from: `"AI Recruit System" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "🔐 Reset Your AI Recruit Password",
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
            <div style="font-size: 32px; margin-bottom: 8px;">🔐</div>
            <h1 style="color: white; font-size: 22px; margin: 0;">Reset Your Password</h1>
          </div>
          <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <p style="color: #374151; font-size: 15px; line-height: 1.7; margin-top: 0;">
              Hi there! We received a request to reset the password for your AI Recruit account.
              Click the button below to set a new password.
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${link}" style="background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px; display: inline-block;">
                Reset Password →
              </a>
            </div>
            <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
              This link will expire in <strong>30 minutes</strong>. If you didn't request a password reset, you can safely ignore this email.
            </p>
            <div style="border-top: 1px solid #e5e7eb; margin-top: 24px; padding-top: 16px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                If the button doesn't work, copy and paste this link: <br/>
                <a href="${link}" style="color: #2563eb; word-break: break-all;">${link}</a>
              </p>
            </div>
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
            © 2025 AI Recruit System · NLP-Based Secure Recruitment Platform
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ msg: "Reset link sent! Check your email inbox." });
  } catch (err) {
    console.log("Forgot password error:", err);
    res.status(500).json({ msg: "Failed to send email. Please check your email address and try again." });
  }
});

/* Reset Password */
app.post("/reset-password/:token", async (req, res) => {
  try {
    const { token }    = req.params;
    const { password } = req.body;
    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ msg: "Reset link has expired or is invalid. Please request a new one." });
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

/* Get all candidates */
app.get("/candidates", async (req, res) => {
  const users = await User.find({ role: "candidate" });
  res.json(users);
});

/* Save profile */
app.post("/profile", async (req, res) => {
  try {
    const { email, name, phone, skills, experience, education } = req.body;
    await User.findOneAndUpdate({ email }, { name, phone, skills, experience, education }, { new: true });
    res.json({ msg: "Profile saved ✅" });
  } catch (err) {
    res.status(500).json({ msg: "Save failed ❌" });
  }
});

/* Upload Resume + NLP */
app.post("/upload-resume", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });
    const data = await pdf(req.file.buffer);
    const text = data.text || "";
    if (text.trim().length < 30) return res.status(400).json({ msg: "PDF has no readable text ❌" });

    const expMatch       = text.match(/(\d+)\+?\s+years?/i);
    const experienceYears = expMatch ? parseInt(expMatch[1]) : 0;

    const tokenizer = new natural.WordTokenizer();
    const rawWords  = tokenizer.tokenize(text.toLowerCase());
    const stopwords = ["the","and","is","in","to","of","for","on","with","a","an","or","by","at","from","that","this","are","was","been","have","has","had","its","they","their","our","your","can","will","may","also","all","but","not","we","you","he","she","it","be","do","did","get","use","used","using","etc","as","per","each","about","into","than","more","any","some","other","which","when","then","than","been","were","his","her","him","my","me","am","us","up","if","so","an","no","at","by","or","of","to","in","is"];
    const keywords = [...new Set(rawWords.filter(word =>
      !stopwords.includes(word) && word.length > 2 && !/^\d+$/.test(word) && !word.includes("@") && /^[a-zA-Z+#.]+$/.test(word)
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

/* Create Job */
app.post("/job/create", async (req, res) => {
  try {
    const { employerEmail, jobTitle, companyName, location, jobDescription } = req.body;
    if (!jobTitle || !jobDescription) return res.status(400).json({ msg: "Title and description required" });

    const expMatch          = jobDescription.match(/(\d+)\+?\s+years?/i);
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

/* Get Jobs by Employer */
app.get("/jobs/:email", async (req, res) => {
  try {
    const jobs = await Job.find({ employerEmail: req.params.email }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ msg: "Fetch failed ❌" });
  }
});

/* Update Job */
app.put("/job/:id", async (req, res) => {
  try {
    const { jobTitle, companyName, location, jobDescription } = req.body;
    const expMatch           = jobDescription.match(/(\d+)\+?\s+years?/i);
    const requiredExperience  = expMatch ? parseInt(expMatch[1]) : 0;
    const tokenizer           = new natural.WordTokenizer();
    const rawWords            = tokenizer.tokenize(jobDescription.toLowerCase());
    const stopwords           = ["the","and","is","in","to","of","for","on","with","a","an","or","by","at","from"];
    const keywords            = [...new Set(rawWords.filter(w => !stopwords.includes(w) && w.length > 2 && !/^\d+$/.test(w) && /^[a-zA-Z+#.]+$/.test(w)))];
    await Job.findByIdAndUpdate(req.params.id, { jobTitle, companyName: companyName||"", location: location||"", jobDescription, jobKeywords: keywords, requiredExperience });
    res.json({ msg: "Job updated ✅" });
  } catch (err) {
    res.status(500).json({ msg: "Update failed ❌" });
  }
});

/* Delete Job */
app.delete("/job/:id", async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ msg: "Job deleted ✅" });
  } catch (err) {
    res.status(500).json({ msg: "Delete failed ❌" });
  }
});

/* Upload Job PDF */
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

/* Employer: Run AI match for a job */
app.post("/match", async (req, res) => {
  try {
    const { jobId } = req.body;
    const job       = await Job.findById(jobId);
    if (!job) return res.status(404).json({ msg: "Job not found" });

    const candidates = await User.find({ role: "candidate" });
    let results = [];

    for (let candidate of candidates) {
      if (!candidate.resumeText && !candidate.skills) continue;
      const prompt = `
You are an expert recruitment AI. Analyze the match between this job and candidate.

JOB TITLE: ${job.jobTitle}
JOB DESCRIPTION: ${job.jobDescription || "Not provided"}

CANDIDATE PROFILE:
Name: ${candidate.name || "Unknown"}
Skills: ${candidate.skills || "Not provided"}
Experience: ${candidate.experience || "Not provided"}
Education: ${candidate.education || "Not provided"}
Resume Text: ${(candidate.resumeText || "").substring(0, 1000)}

Return ONLY a JSON object, no markdown, no explanation:
{
  "score": <0-100 integer>,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3"],
  "summary": "<2 sentence summary of fit>",
  "recommendation": "Perfect Match or Good Match or Partial Match or Weak Match"
}`;
      try {
        const aiRes = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 500, temperature: 0.3
        });
        const raw    = aiRes.choices[0].message.content.trim();
        const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed  = JSON.parse(cleaned);
        if (parsed.score >= 20) {
          results.push({
            name: candidate.name, email: candidate.email, phone: candidate.phone,
            education: candidate.education, skills: candidate.skills, experience: candidate.experience,
            score: parsed.score, matchedKeywords: parsed.matchedSkills || [],
            missingSkills: parsed.missingSkills || [], summary: parsed.summary || "",
            recommendation: parsed.recommendation || "", resumeText: candidate.resumeText || ""
          });
        }
      } catch (aiErr) {
        console.log("AI error for candidate:", candidate.email, aiErr.message);
      }
    }
    results.sort((a, b) => b.score - a.score);
    res.json(results);
  } catch (err) {
    console.log("MATCH ERROR:", err);
    res.status(500).json({ msg: "AI Matching failed ❌" });
  }
});

/* Candidate: Get matched jobs (quick keyword score) */
app.post("/match-jobs", async (req, res) => {
  try {
    const { candidateEmail } = req.body;
    const candidate = await User.findOne({ email: candidateEmail });
    if (!candidate) return res.status(404).json({ msg: "Candidate not found" });

    const jobs        = await Job.find({ status: "active" });
    const resumeWords = candidate.resumeKeywords || [];
    const results     = [];

    for (let job of jobs) {
      const jobKeywords = job.jobKeywords || [];
      let matched = [];
      for (let rw of resumeWords) {
        for (let jw of jobKeywords) {
          if (rw.toLowerCase().trim() === jw.toLowerCase().trim() && !matched.includes(rw)) matched.push(rw);
        }
      }
      const keywordScore    = jobKeywords.length > 0 ? Math.round((matched.length / jobKeywords.length) * 100) : 0;
      let experienceScore   = 0;
      if (job.requiredExperience > 0) {
        experienceScore = candidate.experienceYears >= job.requiredExperience
          ? 100 : Math.round((candidate.experienceYears / job.requiredExperience) * 100);
      }
      const finalScore       = Math.round(keywordScore * 0.8 + experienceScore * 0.2);
      const daysAgo          = job.updatedAt ? Math.floor((Date.now() - new Date(job.updatedAt)) / 86400000) : 0;
      const recommendation   = finalScore >= 70 ? "Perfect Match" : finalScore >= 50 ? "Good Match" : finalScore >= 30 ? "Partial Match" : "Weak Match";

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

/* Candidate: Deep AI analysis for a specific job (called when candidate clicks a job) */
app.post("/analyze-job-match", async (req, res) => {
  try {
    const { candidateEmail, jobId } = req.body;
    const candidate = await User.findOne({ email: candidateEmail });
    const job       = await Job.findById(jobId);
    if (!candidate || !job) return res.status(404).json({ msg: "Not found" });

    const prompt = `
You are an expert recruitment AI. Analyze how well this candidate matches the job.

JOB TITLE: ${job.jobTitle || "Job Opening"}
JOB DESCRIPTION: ${job.jobDescription || "Not provided"}

CANDIDATE:
Name: ${candidate.name || "Unknown"}
Skills: ${candidate.skills || "Not provided"}
Experience: ${candidate.experience || "Not provided"}
Education: ${candidate.education || "Not provided"}
Resume: ${(candidate.resumeText || "").substring(0, 1200)}

Return ONLY valid JSON, no markdown:
{
  "score": <0-100 integer>,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"],
  "summary": "<2 sentence analysis>",
  "recommendation": "Perfect Match or Good Match or Partial Match or Weak Match"
}`;
    const aiRes   = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500, temperature: 0.3
    });
    const raw     = aiRes.choices[0].message.content.trim();
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    res.json(JSON.parse(cleaned));
  } catch (err) {
    console.log("ANALYZE ERROR:", err.message);
    res.status(500).json({ msg: "Analysis failed" });
  }
});

/* ════════════════════════════════════════
   APPLICATION ROUTES
════════════════════════════════════════ */

/* Apply to Job */
app.post("/apply", async (req, res) => {
  try {
    const { jobId, candidateEmail } = req.body;
    const job       = await Job.findById(jobId);
    if (!job) return res.status(404).json({ msg: "Job not found" });
    const candidate = await User.findOne({ email: candidateEmail });
    if (!candidate) return res.status(404).json({ msg: "Candidate not found" });
    const existing  = await Application.findOne({ jobId, candidateEmail });
    if (existing) return res.status(400).json({ msg: "You have already applied to this job" });

    const application = new Application({
      jobId, jobTitle: job.jobTitle, candidateEmail,
      candidateName: candidate.name || candidateEmail,
      employerEmail: job.employerEmail
    });
    await application.save();

    // ✅ Send notification email to employer
    try {
      const employerMailOptions = {
        from: `"AI Recruit System" <${process.env.EMAIL_USER}>`,
        to: job.employerEmail,
        subject: `🎯 New Application for "${job.jobTitle}"`,
        html: `
          <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #7c3aed, #2563eb); border-radius: 16px; padding: 28px; text-align: center; margin-bottom: 24px;">
              <div style="font-size: 32px; margin-bottom: 8px;">🎯</div>
              <h1 style="color: white; font-size: 20px; margin: 0;">New Application Received!</h1>
            </div>
            <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              <p style="color: #374151; font-size: 15px; line-height: 1.7; margin-top: 0;">
                You have received a new application for your job posting on <strong>AI Recruit System</strong>.
              </p>
              <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px; width: 120px;">📋 Position</td><td style="padding: 8px 0; color: #111827; font-weight: 600; font-size: 13px;">${job.jobTitle}</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">👤 Applicant</td><td style="padding: 8px 0; color: #111827; font-weight: 600; font-size: 13px;">${candidate.name || "Not provided"}</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">📧 Email</td><td style="padding: 8px 0; color: #2563eb; font-size: 13px;">${candidateEmail}</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">💼 Experience</td><td style="padding: 8px 0; color: #111827; font-size: 13px;">${candidate.experience || "Not provided"}</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">🎓 Education</td><td style="padding: 8px 0; color: #111827; font-size: 13px;">${candidate.education || "Not provided"}</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">💡 Skills</td><td style="padding: 8px 0; color: #111827; font-size: 13px;">${candidate.skills || "Not provided"}</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">📅 Applied</td><td style="padding: 8px 0; color: #111827; font-size: 13px;">${new Date().toLocaleString("en-MY")}</td></tr>
                </table>
              </div>
              <p style="color: #6b7280; font-size: 13px;">
                Log into your <strong>Employer Dashboard</strong> and use <strong>Run AI Match</strong> to see this candidate's full AI score and analysis.
              </p>
            </div>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
              © 2025 AI Recruit System · NLP-Based Secure Recruitment Platform
            </p>
          </div>
        `
      };
      await transporter.sendMail(employerMailOptions);
      console.log(`✅ Notification sent to employer: ${job.employerEmail}`);
    } catch (mailErr) {
      // Email fail should not block the apply action
      console.log("⚠️  Employer notification email failed:", mailErr.message);
    }

    res.json({ msg: "Applied successfully ✅", jobTitle: job.jobTitle });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Apply failed ❌" });
  }
});

/* Get Applications for a Job (Employer) */
app.get("/applications/:jobId", async (req, res) => {
  try {
    const apps = await Application.find({ jobId: req.params.jobId }).sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ msg: "Fetch failed" });
  }
});

/* Get My Applications (Candidate) */
app.get("/my-applications/:email", async (req, res) => {
  try {
    const apps = await Application.find({ candidateEmail: req.params.email }).sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ msg: "Fetch failed" });
  }
});

/* Update Application Status (Employer) */
app.put("/application/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const app = await Application.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ msg: "Status updated ✅", app });
  } catch (err) {
    res.status(500).json({ msg: "Update failed ❌" });
  }
});

/* Toggle Save Job */
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

/* Get Saved Jobs */
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

/* Health check */
app.get("/", (req, res) => res.send("Backend running ✅"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
