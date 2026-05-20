require("dotenv").config();

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

    const {
      email,
      jobDescription
    } = req.body;

    const expMatch =
      jobDescription.match(
        /(\d+)\+?\s+years?/i
      );

    const requiredExperience =
      expMatch
        ? parseInt(expMatch[1])
        : 0;

    const tokenizer =
      new natural.WordTokenizer();

    const rawWords =
      tokenizer.tokenize(
        jobDescription.toLowerCase()
      );

    const stopwords = [
      "the","and","is","in","to","of",
      "for","on","with","a","an"
    ];

    const keywords =
      rawWords.filter(word => {

        if (stopwords.includes(word))
          return false;

        if (word.length <= 2)
          return false;

        if (/^\d+$/.test(word))
          return false;

        if (!/^[a-zA-Z+#.]+$/.test(word))
          return false;

        return true;

      });

    await User.findOneAndUpdate(
      { email },
      {
        jobDescription,

        jobKeywords:
          [...new Set(keywords)],

        requiredExperience
      }
    );

    res.json({
      msg: "Job keywords saved ✅",
      keywords
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      msg: "Job save failed ❌"
    });

  }

});

/* AI Matching */
app.post("/match", async (req, res) => {

  try {

    const { employerEmail } = req.body;

    const employer =
      await User.findOne({
        email: employerEmail
      });

    if (!employer) {

      return res.status(404).json({
        msg: "Employer not found"
      });

    }

    const jobKeywords =
      employer.jobKeywords || [];

    const candidates =
      await User.find({
        role: "candidate"
      });

    let results = [];

    for (let candidate of candidates) {

      const resumeWords =
        candidate.resumeKeywords || [];

      let matched = [];

      for (let resumeWord of resumeWords) {

        for (let jobWord of jobKeywords) {

          if (
            resumeWord.toLowerCase().trim() ===
            jobWord.toLowerCase().trim()
          ) {

            if (
              !matched.includes(resumeWord)
            ) {

              matched.push(resumeWord);

            }

          }

        }

      }

      let keywordScore = 0;

      if (jobKeywords.length > 0) {

        keywordScore = Math.round(
          (
            matched.length /
            jobKeywords.length
          ) * 100
        );

      }

      let experienceScore = 0;

      if (
        employer.requiredExperience > 0
      ) {

        if (
          candidate.experienceYears >=
          employer.requiredExperience
        ) {

          experienceScore = 100;

        } else {

          experienceScore =
            Math.round(
              (
                candidate.experienceYears /
                employer.requiredExperience
              ) * 100
            );

        }

      }

      const finalScore =
        Math.round(
          (keywordScore * 0.8) +
          (experienceScore * 0.2)
        );

      if (finalScore >= 30) {

        results.push({

          name: candidate.name,

          email: candidate.email,

          phone: candidate.phone,

          education:
            candidate.education,

          skills:
            candidate.skills,

          experience:
            candidate.experience,

          experienceYears:
            candidate.experienceYears || 0,

          score: finalScore,

          matchedKeywords:
            matched.slice(0, 20),

          resumeText:
            candidate.resumeText || ""

        });

      }

    }

    results.sort(
      (a, b) => b.score - a.score
    );

    res.json(results);

  } catch (err) {

    console.log(
      "MATCH ERROR:",
      err
    );

    res.status(500).json({
      msg: "AI Matching failed ❌"
    });

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