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
mongoose.connect(process.env.MONGO_URI)
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
    user.resetTokenExpiry = Date.now() + 1000 * 60 * 15;

    await user.save();

    const link = `${process.env.FRONTEND_URL}/reset/${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Reset Password",
      html: `
        <h2>Reset Password</h2>
        <p>Click the link below:</p>
        <a href="${link}">${link}</a>
      `
    });

    res.json({
      msg: "Email sent ✅"
    });

  } catch (err) {

    console.log("EMAIL ERROR:", err);

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
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        msg: "Invalid token"
      });
    }

    user.password = await bcrypt.hash(password, 10);

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
app.post("/upload-resume", upload.single("file"), async (req, res) => {

  try {

    if (!req.file) {
      return res.status(400).json({
        msg: "No file uploaded"
      });
    }

    const data = await pdf(req.file.buffer);

    const text = data.text || "";

    if (text.trim().length < 30) {
      return res.status(400).json({
        msg: "PDF has no readable text ❌"
      });
    }

    const tokenizer = new natural.WordTokenizer();

    const words = tokenizer.tokenize(text.toLowerCase());

    const stopwords = [
      "the","and","is","in","to",
      "of","for","on","with","a","an"
    ];

    const filtered = words.filter(
      w => !stopwords.includes(w)
    );

    const keywords = [...new Set(filtered)];

    await User.findOneAndUpdate(
      { email: req.body.email },
      {
        resumeKeywords: keywords
      }
    );

    res.json({
      msg: "Resume processed ✅",
      keywords
    });

  } catch (err) {

    console.log("UPLOAD ERROR:", err);

    res.status(500).json({
      msg: "Upload failed ❌"
    });
  }
});





/* AI Matching */
app.post("/match", async (req, res) => {
  try {

    const { jobText } = req.body;

    const tokenizer = new natural.WordTokenizer();

    const stopwords = [
      "the","and","is","in","to","of",
      "for","on","with","a","an"
    ];

    const jobWords = tokenizer
      .tokenize(jobText.toLowerCase())
      .filter(w => !stopwords.includes(w));

    const users = await User.find({
      resumeKeywords: { $exists: true }
    });

    let results = [];

    for (let user of users) {

      const resumeWords = user.resumeKeywords || [];

      const matched = resumeWords.filter(w =>
        jobWords.includes(w)
      );

      const score = Math.round(
        (matched.length / jobWords.length) * 100
      );

      await User.findByIdAndUpdate(user._id, {
        matchScore: score
      });

      results.push({
        email: user.email,
        score,
        matchedKeywords: matched.slice(0, 15)
      });
    }

    results.sort((a, b) => b.score - a.score);

    res.json(results);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      msg: "AI Match Failed ❌"
    });
  }
});


/* Candidates */
app.get("/candidates", async (req, res) => {

  const users = await User.find({
    role: "candidate"
  });

  res.json(users);
});





/* Test */
app.get("/", (req, res) => {
  res.send("Backend running ✅");
});





const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});