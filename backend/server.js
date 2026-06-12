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

/* ════════════════════════════════════════
   EMAIL TRANSPORTER
   重要：EMAIL_PASS 必须是 Gmail App Password（16位），不是普通密码
   设置方法：Google Account → Security → 2-Step Verification → App Passwords
════════════════════════════════════════ */
const createTransporter = () => nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: { rejectUnauthorized: false }
});

// 每次发邮件都创建新的transporter，避免连接超时问题
const sendEmail = async (mailOptions) => {
  const transporter = createTransporter();
  try {
    await transporter.verify();
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);
    return { success: true };
  } catch (err) {
    console.log("❌ Email error:", err.message);
    return { success: false, error: err.message };
  }
};

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
    if (!email) return res.status(400).json({ msg: "Email is required" });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ msg: "No account found with this email" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken       = token;
    user.resetTokenExpiry = Date.now() + 1000 * 60 * 30; // 30 min
    await user.save();

    const link = `${process.env.FRONTEND_URL}/reset/${token}`;
    console.log("🔗 Reset link:", link);  // debug log

    const result = await sendEmail({
      from: `"AI Recruit System" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "🔐 Reset Your AI Recruit Password",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;background:#f8fafc;">
          <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);border-radius:16px;padding:28px;text-align:center;margin-bottom:20px;">
            <div style="font-size:32px;margin-bottom:8px;">🔐</div>
            <h1 style="color:white;font-size:20px;margin:0;">Reset Your Password</h1>
          </div>
          <div style="background:white;border-radius:16px;padding:28px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <p style="color:#374151;font-size:15px;line-height:1.7;">
              We received a request to reset your AI Recruit password. Click below to set a new one.
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${link}" style="background:linear-gradient(135deg,#2563eb,#7c3aed);color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:15px;display:inline-block;">
                Reset Password →
              </a>
            </div>
            <p style="color:#6b7280;font-size:13px;">This link expires in <strong>30 minutes</strong>.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
            <p style="color:#9ca3af;font-size:12px;word-break:break-all;">
              Or copy: <a href="${link}" style="color:#2563eb;">${link}</a>
            </p>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:16px;">
            © 2025 AI Recruit System · NLP-Based Secure Recruitment
          </p>
        </div>
      `
    });

    if (!result.success) {
      console.log("Email failed:", result.error);
      return res.status(500).json({ 
        msg: `Email failed to send. Error: ${result.error}. Please check Gmail App Password settings.` 
      });
    }

    res.json({ msg: "Reset link sent! Check your inbox (and spam folder)." });
  } catch (err) {
    console.log("Forgot password error:", err);
    res.status(500).json({ msg: "Server error: " + err.message });
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

/* Employer: Run AI match */
app.post("/match", async (req, res) => {
  try {
    const { jobId } = req.body;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ msg: "Job not found" });

    const candidates = await User.find({ role: "candidate" });
    let results = [];

    for (let candidate of candidates) {
      if (!candidate.resumeText && !candidate.skills) continue;
      const prompt = `You are an expert recruitment AI. Analyze this job-candidate match.

JOB TITLE: ${job.jobTitle}
JOB DESCRIPTION: ${job.jobDescription || "Not provided"}

CANDIDATE:
Name: ${candidate.name || "Unknown"}
Skills: ${candidate.skills || "Not provided"}
Experience: ${candidate.experience || "Not provided"}
Education: ${candidate.education || "Not provided"}
Resume: ${(candidate.resumeText || "").substring(0, 1000)}

Return ONLY JSON, no markdown:
{"score":<0-100>,"matchedSkills":["skill1"],"missingSkills":["skill2"],"summary":"2 sentences","recommendation":"Perfect Match or Good Match or Partial Match or Weak Match"}`;
      try {
        const aiRes  = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 500, temperature: 0.3
        });
        const raw     = aiRes.choices[0].message.content.trim();
        const cleaned = raw.replace(/```json/g,"").replace(/```/g,"").trim();
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
        console.log("AI error for:", candidate.email, aiErr.message);
      }
    }
    results.sort((a, b) => b.score - a.score);
    res.json(results);
  } catch (err) {
    console.log("MATCH ERROR:", err);
    res.status(500).json({ msg: "AI Matching failed ❌" });
  }
});

/* 
  ════════════════════════════════
  FIX: match-jobs — 没有resume的账号应该返回score=0，不应该乱给分
  ════════════════════════════════
*/
app.post("/match-jobs", async (req, res) => {
  try {
    const { candidateEmail } = req.body;
    const candidate = await User.findOne({ email: candidateEmail });
    if (!candidate) return res.status(404).json({ msg: "Candidate not found" });

    // 如果没有resume，直接返回空列表（不显示假分数）
    const hasResume = candidate.resumeKeywords && candidate.resumeKeywords.length > 0;

    const jobs    = await Job.find({ status: "active" });
    const results = [];

    for (let job of jobs) {
      let finalScore     = 0;
      let matched        = [];
      let recommendation = "Weak Match";

      if (hasResume) {
        const jobKeywords  = job.jobKeywords || [];
        const resumeWords  = candidate.resumeKeywords || [];

        for (let rw of resumeWords) {
          for (let jw of jobKeywords) {
            if (rw.toLowerCase().trim() === jw.toLowerCase().trim() && !matched.includes(rw)) {
              matched.push(rw);
            }
          }
        }

        const keywordScore   = jobKeywords.length > 0 ? Math.round((matched.length / jobKeywords.length) * 100) : 0;
        let experienceScore  = 0;
        if (job.requiredExperience > 0 && candidate.experienceYears > 0) {
          experienceScore = candidate.experienceYears >= job.requiredExperience
            ? 100 : Math.round((candidate.experienceYears / job.requiredExperience) * 100);
        }
        finalScore     = Math.round(keywordScore * 0.8 + experienceScore * 0.2);
        recommendation = finalScore >= 70 ? "Perfect Match" : finalScore >= 50 ? "Good Match" : finalScore >= 30 ? "Partial Match" : "Weak Match";
      }

      const daysAgo = job.updatedAt ? Math.floor((Date.now() - new Date(job.updatedAt)) / 86400000) : 0;
      results.push({
        jobId: job._id.toString(), employerEmail: job.employerEmail,
        jobTitle: job.jobTitle || "Job Opening", companyName: job.companyName || job.employerEmail,
        location: job.location || "Not specified", jobDescription: job.jobDescription || "",
        daysAgo, score: finalScore, matchedSkills: matched.slice(0, 15), recommendation,
        hasResume
      });
    }

    results.sort((a, b) => b.score - a.score);
    res.json(results);
  } catch (err) {
    console.log("MATCH-JOBS ERROR:", err);
    res.status(500).json({ msg: "Failed to get job matches" });
  }
});

/* Candidate: Deep AI analysis */
app.post("/analyze-job-match", async (req, res) => {
  try {
    const { candidateEmail, jobId } = req.body;
    const candidate = await User.findOne({ email: candidateEmail });
    const job       = await Job.findById(jobId);
    if (!candidate || !job) return res.status(404).json({ msg: "Not found" });

    // 如果没有resume，直接返回0分
    if (!candidate.resumeText && !candidate.skills) {
      return res.json({
        score: 0,
        matchedSkills: [],
        missingSkills: [],
        summary: "No resume uploaded yet. Please upload your resume to get an accurate match score.",
        recommendation: "Weak Match"
      });
    }

    const prompt = `You are an expert recruitment AI.

JOB TITLE: ${job.jobTitle || "Job Opening"}
JOB DESCRIPTION: ${job.jobDescription || "Not provided"}

CANDIDATE:
Name: ${candidate.name || "Unknown"}
Skills: ${candidate.skills || "Not provided"}
Experience: ${candidate.experience || "Not provided"}
Education: ${candidate.education || "Not provided"}
Resume: ${(candidate.resumeText || "").substring(0, 1200)}

Return ONLY valid JSON, no markdown:
{"score":<0-100>,"matchedSkills":["s1"],"missingSkills":["s2"],"summary":"2 sentences","recommendation":"Perfect Match or Good Match or Partial Match or Weak Match"}`;

    const aiRes   = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500, temperature: 0.3
    });
    const raw     = aiRes.choices[0].message.content.trim();
    const cleaned = raw.replace(/```json/g,"").replace(/```/g,"").trim();
    res.json(JSON.parse(cleaned));
  } catch (err) {
    console.log("ANALYZE ERROR:", err.message);
    res.status(500).json({ msg: "Analysis failed" });
  }
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

    // 检查这个具体账号是否已申请（按candidateEmail精确匹配）
    const existing = await Application.findOne({ jobId, candidateEmail });
    if (existing) return res.status(400).json({ msg: "You have already applied to this job" });

    const application = new Application({
      jobId, jobTitle: job.jobTitle, candidateEmail,
      candidateName: candidate.name || candidateEmail,
      employerEmail: job.employerEmail
    });
    await application.save();

    // 发邮件通知employer
    const emailResult = await sendEmail({
      from: `"AI Recruit System" <${process.env.EMAIL_USER}>`,
      to: job.employerEmail,
      subject: `🎯 New Application for "${job.jobTitle}"`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;padding:32px 20px;">
          <div style="background:linear-gradient(135deg,#7c3aed,#2563eb);border-radius:16px;padding:24px;text-align:center;margin-bottom:20px;">
            <div style="font-size:32px;margin-bottom:8px;">🎯</div>
            <h1 style="color:white;font-size:20px;margin:0;">New Application Received!</h1>
          </div>
          <div style="background:white;border-radius:16px;padding:28px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <p style="color:#374151;font-size:15px;line-height:1.7;margin-top:0;">
              A candidate has applied for <strong>${job.jobTitle}</strong> on AI Recruit System.
            </p>
            <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:20px 0;">
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:120px;">📋 Position</td><td style="padding:8px 0;color:#111827;font-weight:600;font-size:13px;">${job.jobTitle}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">👤 Applicant</td><td style="padding:8px 0;color:#111827;font-weight:600;font-size:13px;">${candidate.name || "Not provided"}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">📧 Email</td><td style="padding:8px 0;color:#2563eb;font-size:13px;">${candidateEmail}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">💼 Experience</td><td style="padding:8px 0;color:#111827;font-size:13px;">${candidate.experience || "Not provided"}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">🎓 Education</td><td style="padding:8px 0;color:#111827;font-size:13px;">${candidate.education || "Not provided"}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">💡 Skills</td><td style="padding:8px 0;color:#111827;font-size:13px;">${candidate.skills || "Not provided"}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">📅 Applied</td><td style="padding:8px 0;color:#111827;font-size:13px;">${new Date().toLocaleString("en-MY")}</td></tr>
              </table>
            </div>
            <p style="color:#6b7280;font-size:13px;">
              Log into your <strong>Employer Dashboard</strong> → <strong>Run AI Match</strong> to see full AI analysis.
            </p>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:16px;">
            © 2025 AI Recruit System · NLP-Based Secure Recruitment
          </p>
        </div>
      `
    });

    if (emailResult.success) {
      console.log(`✅ Employer notified: ${job.employerEmail}`);
    } else {
      console.log(`⚠️  Employer email failed: ${emailResult.error}`);
    }

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

app.put("/application/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const app = await Application.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ msg: "Status updated ✅", app });
  } catch (err) {
    res.status(500).json({ msg: "Update failed ❌" });
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
