require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const natural = require("natural");

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

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");

    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 1000 * 60 * 15;
    await user.save();

    const link = `${process.env.FRONTEND_URL}/reset/${token}`;

    await transporter.sendMail({
      to: user.email,
      subject: "Reset Password",
      html: `<a href="${link}">${link}</a>`
    });

    console.log("📧 Email sent to:", user.email);

    res.json({ msg: "Email sent ✅" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error" });
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
app.post("/upload-resume", async (req, res) => {
  const { email, text } = req.body;

  const tokenizer = new natural.WordTokenizer();
  const words = tokenizer.tokenize(text.toLowerCase());
  const keywords = [...new Set(words)];

  await User.findOneAndUpdate(
    { email },
    { resumeKeywords: keywords }
  );

  res.json({ msg: "Resume processed", keywords });
});

/* Match */
app.post("/match", async (req, res) => {
  const { jobText } = req.body;

  const tokenizer = new natural.WordTokenizer();
  const jobWords = tokenizer.tokenize(jobText.toLowerCase());

  const users = await User.find({ resumeKeywords: { $exists: true } });

  for (let user of users) {
    const match = user.resumeKeywords.filter(w => jobWords.includes(w));
    const percent = (match.length / jobWords.length) * 100;

    if (percent >= 80) {
      await transporter.sendMail({
        to: process.env.EMAIL_USER,
        subject: "Match Found",
        text: `${user.email} matched ${percent.toFixed(2)}%`
      });
    }
  }

  res.json({ msg: "Matching done" });
});

/* Test */
app.get("/", (req, res) => {
  res.send("Backend running ✅");
});

app.listen(5000, () => {
  console.log("Server running on 5000");
});