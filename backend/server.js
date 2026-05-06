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
const pdfParse = require("pdf-parse");

const upload = multer({ storage: multer.memoryStorage() });

const User = require("./models/User");

const app = express();
app.use(cors());
app.use(express.json());

/* MongoDB */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log(err));

/* Mail */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
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
    if (exists) return res.status(400).json({ msg: "User exists" });

    const hashed = await bcrypt.hash(password, 10);
    await new User({ email, password: hashed, role }).save();

    res.json({ msg: "Registered" });
  } catch (err) {
    res.status(500).json({ msg: "Error" });
  }
});

/* Login */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ msg: "Wrong password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: { email: user.email, role: user.role } });

  } catch (err) {
    res.status(500).json({ msg: "Error" });
  }
});

/* Forgot Password */
app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    console.log("📧 Request:", email);

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");

    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 1000 * 60 * 15;
    await user.save();

    const link = `${process.env.FRONTEND_URL}/reset/${token}`;

    try {
      await transporter.sendMail({
        to: user.email,
        subject: "Reset Password",
        html: `<h2>Reset Password</h2><a href="${link}">${link}</a>`
      });

      console.log("✅ Email sent");

    } catch (mailErr) {
      console.log("❌ EMAIL ERROR:", mailErr);
      return res.status(500).json({ msg: "Email failed ❌" });
    }

    res.json({ msg: "Email sent ✅" });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ msg: "Server error ❌" });
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

    if (!user) return res.status(400).json({ msg: "Invalid token" });

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.json({ msg: "Password reset success" });

  } catch (err) {
    res.status(500).json({ msg: "Error" });
  }
});

/* Profile */
app.post("/profile", async (req, res) => {
  const { email, name, phone, skills, experience, education } = req.body;

  await User.findOneAndUpdate(
    { email },
    { name, phone, skills, experience, education }
  );

  res.json({ msg: "Saved" });
});

/* Candidates */
app.get("/candidates", async (req, res) => {
  const users = await User.find({ role: "candidate" });
  res.json(users);
});

/* NLP Resume */
app.post("/upload-resume", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    let text = "";

    try {
      const data = await pdfParse(req.file.buffer);
      text = data.text || "";
    } catch (err) {
      console.log("PDF ERROR:", err);
      return res.status(400).json({ msg: "Cannot read PDF ❌" });
    }

    if (!text || text.trim().length < 30) {
      return res.status(400).json({ msg: "PDF has no readable text ❌" });
    }

    // 🔥 NLP处理（升级版）
    const tokenizer = new natural.WordTokenizer();
    const words = tokenizer.tokenize(text.toLowerCase());

    // 去掉无用词
    const stopwords = ["the","and","is","in","to","of","for","on","with","a","an"];
    const filtered = words.filter(w => !stopwords.includes(w));

    const keywords = [...new Set(filtered)];

    await User.findOneAndUpdate(
      { email: req.body.email },
      { resumeKeywords: keywords }
    );

    res.json({
      msg: "Resume processed ✅",
      totalKeywords: keywords.length,
      keywords
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ msg: "Upload failed ❌" });
  }
});

/* Match */
app.post("/match", async (req, res) => {
  try {
    const { jobText } = req.body;

    const tokenizer = new natural.WordTokenizer();
    const jobWords = tokenizer.tokenize(jobText.toLowerCase());

    const users = await User.find({ resumeKeywords: { $exists: true } });

    let results = [];

    for (let user of users) {
      const resumeWords = user.resumeKeywords || [];

      const match = resumeWords.filter(w => jobWords.includes(w));

      const score = Math.round((match.length / jobWords.length) * 100);

      results.push({
        email: user.email,
        score,
        matched: match.slice(0, 10)
      });
    }

    // 🔥 排序（AI ranking）
    results.sort((a, b) => b.score - a.score);

    res.json(results);

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Match failed ❌" });
  }
});