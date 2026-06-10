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

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage()
});

/* MongoDB */
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log(err));

/* Mail */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* Register */
app.post("/register", async (req, res) => {

  try {

    const { email, password, role } = req.body;

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({
        msg: "User exists"
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashed,
      role
    });

    await user.save();

    res.json({
      msg: "Registered ✅"
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      msg: "Register failed ❌"
    });

  }

});

/* Login */
app.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        msg: "User not found"
      });
    }

    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      return res.status(400).json({
        msg: "Wrong password"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      token,
      user: {
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      msg: "Login failed ❌"
    });

  }

});

/* Forgot Password */
app.post("/forgot-password", async (req, res) => {

  try {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        msg: "User not found"
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.resetToken = token;

    user.resetTokenExpiry =
      Date.now() + 1000 * 60 * 15;

    await user.save();

    const link =
      `${process.env.FRONTEND_URL}/reset/${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Reset Password",
      html: `
        <h2>Reset Password</h2>
        <a href="${link}">${link}</a>
      `
    });

    res.json({
      msg: "Email sent ✅"
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      msg: "Email failed ❌"
    });

  }

});

/* Reset Password */
app.post("/reset-password/:token", async (req, res) => {

  try {

    const { token } = req.params;

    const { password } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: {
        $gt: Date.now()
      }
    });

    if (!user) {
      return res.status(400).json({
        msg: "Invalid token"
      });
    }

    user.password =
      await bcrypt.hash(password, 10);

    user.resetToken = undefined;

    user.resetTokenExpiry = undefined;

    await user.save();

    res.json({
      msg: "Password reset success ✅"
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      msg: "Reset failed ❌"
    });

  }

});

/* Resume Upload + NLP */
app.post(
  "/upload-resume",
  upload.single("file"),
  async (req, res) => {

    try {

      if (!req.file) {
        return res.status(400).json({
          msg: "No file uploaded"
        });
      }

      const data = await pdf(req.file.buffer);

      const text = data.text || "";

      const experienceMatch =
        text.match(/(\d+)\+?\s+years?/i);

      const experienceYears =
        experienceMatch
          ? parseInt(experienceMatch[1])
          : 0;

      if (text.trim().length < 30) {

        return res.status(400).json({
          msg: "PDF has no readable text ❌"
        });

      }

      const tokenizer =
        new natural.WordTokenizer();

      const rawWords =
        tokenizer.tokenize(
          text.toLowerCase()
        );

      const stopwords = [
        "the","and","is","in","to","of",
        "for","on","with","a","an",
        "or","by","at","from"
      ];

      const words = rawWords.filter(word => {

        if (stopwords.includes(word))
          return false;

        if (word.length <= 2)
          return false;

        if (/^\d+$/.test(word))
          return false;

        if (word.includes("@"))
          return false;

        if (!/^[a-zA-Z+#.]+$/.test(word))
          return false;

        return true;

      });

      const keywords = [...new Set(words)];

      // limit preview text
      const resumePreview =
        text.substring(0, 4000);

      await User.findOneAndUpdate(
        {
          email: req.body.email
        },
        {
          resumeKeywords: keywords,

          experienceYears:

            experienceYears,

          resumeText:
            resumePreview
        }
      );

      res.json({
        msg: "Resume processed ✅",
        totalKeywords:
          keywords.length,
        keywords
      });

    } catch (err) {

      console.log(
        "UPLOAD ERROR:",
        err
      );

      res.status(500).json({
        msg: "Upload failed ❌"
      });

    }

  }
);

/* Employer Job Keywords */
app.post("/job", async (req, res) => {
  try {
    const { email, jobDescription, jobTitle, companyName, location } = req.body;

    const expMatch = jobDescription.match(/(\d+)\+?\s+years?/i);
    const requiredExperience = expMatch ? parseInt(expMatch[1]) : 0;

    const tokenizer = new natural.WordTokenizer();
    const rawWords   = tokenizer.tokenize(jobDescription.toLowerCase());
    const stopwords  = ["the","and","is","in","to","of","for","on","with","a","an"];

    const keywords = rawWords.filter(w =>
      !stopwords.includes(w) &&
      w.length > 2 &&
      !/^\d+$/.test(w) &&
      /^[a-zA-Z+#.]+$/.test(w)
    );

    await User.findOneAndUpdate(
      { email },
      {
        jobDescription,
        jobTitle:    jobTitle    || "",
        companyName: companyName || "",
        location:    location    || "",
        jobKeywords: [...new Set(keywords)],
        requiredExperience
      }
    );

    res.json({ msg: "Job saved ✅" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Job save failed ❌" });
  }
});app.post("/job", async (req, res) => {
  try {
    const { email, jobDescription, jobTitle, companyName, location } = req.body;

    const expMatch = jobDescription.match(/(\d+)\+?\s+years?/i);
    const requiredExperience = expMatch ? parseInt(expMatch[1]) : 0;

    const tokenizer = new natural.WordTokenizer();
    const rawWords   = tokenizer.tokenize(jobDescription.toLowerCase());
    const stopwords  = ["the","and","is","in","to","of","for","on","with","a","an"];

    const keywords = rawWords.filter(w =>
      !stopwords.includes(w) &&
      w.length > 2 &&
      !/^\d+$/.test(w) &&
      /^[a-zA-Z+#.]+$/.test(w)
    );

    await User.findOneAndUpdate(
      { email },
      {
        jobDescription,
        jobTitle:    jobTitle    || "",
        companyName: companyName || "",
        location:    location    || "",
        jobKeywords: [...new Set(keywords)],
        requiredExperience
      }
    );

    res.json({ msg: "Job saved ✅" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Job save failed ❌" });
  }
});

/* AI Matching */
const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post("/match", async (req, res) => {
  try {
    const { employerEmail } = req.body;

    const employer = await User.findOne({ email: employerEmail });
    if (!employer) return res.status(404).json({ msg: "Employer not found" });

    const candidates = await User.find({ role: "candidate" });

    let results = [];

    for (let candidate of candidates) {

      if (!candidate.resumeText && !candidate.skills) continue;

      const prompt = `
You are an expert recruitment AI. Analyze the match between this job and candidate.

JOB DESCRIPTION:
${employer.jobDescription || "Not provided"}

CANDIDATE PROFILE:
Name: ${candidate.name || "Unknown"}
Skills: ${candidate.skills || "Not provided"}
Experience: ${candidate.experience || "Not provided"}
Education: ${candidate.education || "Not provided"}
Resume Text: ${(candidate.resumeText || "").substring(0, 1500)}

Return ONLY a JSON object (no markdown, no explanation):
{
  "score": <0-100 integer>,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3"],
  "summary": "<2 sentence summary of fit>",
  "recommendation": "Strong Match" | "Good Match" | "Partial Match" | "Weak Match"
}
`;

      try {
        const aiRes = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }]
        });

        const raw = aiRes.content[0].text.trim();
        const parsed = JSON.parse(raw);

        if (parsed.score >= 20) {
          results.push({
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone,
            education: candidate.education,
            skills: candidate.skills,
            experience: candidate.experience,
            score: parsed.score,
            matchedKeywords: parsed.matchedSkills || [],
            missingSkills: parsed.missingSkills || [],
            summary: parsed.summary || "",
            recommendation: parsed.recommendation || "",
            resumeText: candidate.resumeText || ""
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

/* ─── 候选人视角：看哪些工作匹配我（关键词快速匹配）─── */
app.post("/match-jobs", async (req, res) => {
  try {
    const { candidateEmail } = req.body;

    const candidate = await User.findOne({ email: candidateEmail });
    if (!candidate) return res.status(404).json({ msg: "Candidate not found" });

    const employers = await User.find({
      role: "employer",
      jobDescription: { $exists: true, $ne: "" }
    });

    const resumeWords = candidate.resumeKeywords || [];
    const results = [];

    for (let employer of employers) {
      const jobKeywords = employer.jobKeywords || [];

      let matched = [];
      for (let rw of resumeWords) {
        for (let jw of jobKeywords) {
          if (rw.toLowerCase().trim() === jw.toLowerCase().trim() && !matched.includes(rw)) {
            matched.push(rw);
          }
        }
      }

      const keywordScore = jobKeywords.length > 0
        ? Math.round((matched.length / jobKeywords.length) * 100)
        : 0;

      let experienceScore = 0;
      if (employer.requiredExperience > 0) {
        experienceScore = candidate.experienceYears >= employer.requiredExperience
          ? 100
          : Math.round((candidate.experienceYears / employer.requiredExperience) * 100);
      }

      const finalScore = Math.round(keywordScore * 0.8 + experienceScore * 0.2);

      const daysAgo = employer.updatedAt
        ? Math.floor((Date.now() - new Date(employer.updatedAt)) / 86400000)
        : 0;

      const recommendation =
        finalScore >= 70 ? "Perfect Match" :
        finalScore >= 50 ? "Good Match" :
        finalScore >= 30 ? "Partial Match" : "Weak Match";

      results.push({
        jobId:        employer._id.toString(),
        employerEmail: employer.email,
        jobTitle:     employer.jobTitle    || "Job Opening",
        companyName:  employer.companyName || employer.email,
        location:     employer.location    || "Not specified",
        jobDescription: employer.jobDescription || "",
        daysAgo,
        score: finalScore,
        matchedSkills: matched.slice(0, 15),
        recommendation
      });
    }

    results.sort((a, b) => b.score - a.score);
    res.json(results);

  } catch (err) {
    console.log("MATCH-JOBS ERROR:", err);
    res.status(500).json({ msg: "Failed to get job matches" });
  }
});

/* ─── AI 深度分析：候选人点击某工作时，Groq 给出详细报告 ─── */
app.post("/analyze-job-match", async (req, res) => {
  try {
    const { candidateEmail, jobId } = req.body;

    const candidate = await User.findOne({ email: candidateEmail });
    const employer  = await User.findById(jobId);
    if (!candidate || !employer) return res.status(404).json({ msg: "Not found" });

    const prompt = `
You are an expert recruitment AI. Analyze how well this candidate matches the job.

JOB TITLE: ${employer.jobTitle || "Job Opening"}
JOB DESCRIPTION: ${employer.jobDescription || "Not provided"}

CANDIDATE:
Name: ${candidate.name || "Unknown"}
Skills: ${candidate.skills || "Not provided"}
Experience: ${candidate.experience || "Not provided"}
Education: ${candidate.education || "Not provided"}
Resume: ${(candidate.resumeText || "").substring(0, 1200)}

Return ONLY valid JSON, no markdown, no preamble:
{
  "score": <0-100 integer>,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"],
  "summary": "<2 sentence analysis>",
  "recommendation": "Perfect Match or Good Match or Partial Match or Weak Match"
}
`;

    const aiRes = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.3
    });

    const raw     = aiRes.choices[0].message.content.trim();
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed  = JSON.parse(cleaned);

    res.json(parsed);
  } catch (err) {
    console.log("ANALYZE ERROR:", err.message);
    res.status(500).json({ msg: "Analysis failed" });
  }
});

/* Candidates */
app.get("/candidates", async (req, res) => {

  const users =
    await User.find({
      role: "candidate"
    });

  res.json(users);

});

/* Test */
app.get("/", (req, res) => {
  res.send("Backend running ✅");
});

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(
    `Server running on ${PORT}`
  );

});