require("dotenv").config();
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("./models/User");

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   🔥 MongoDB
========================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log(err));

/* =========================
   🔥 Mail Config（必须在上面）
========================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* =========================
   🔥 Register
========================= */
app.post("/register", async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "User exists" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    await new User({ email, password: hashed, role }).save();

    res.json({ msg: "Registered" });

  } catch (err) {
    res.status(500).json({ msg: "Error" });
  }
});

/* =========================
   🔥 Login
========================= */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ msg: "No user" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ msg: "Wrong password" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: { email: user.email, role: user.role }
  });
});

/* =========================
   🔥 Forgot Password（发邮件）
========================= */
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
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
      html: `<a href="${link}">Reset Password</a>`
    });

    res.json({ msg: "Email sent ✅" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error" });
  }
});

/* =========================
   🔥 Reset Password
========================= */
app.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ msg: "Invalid token" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    user.password = hashed;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.json({ msg: "Password reset success ✅" });

  } catch (err) {
    res.status(500).json({ msg: "Error" });
  }
});

/* =========================
   🔥 Profile
========================= */
app.post("/profile", async (req, res) => {
  const { email, name, phone, skills, experience, education } = req.body;

  await User.findOneAndUpdate(
    { email },
    { name, phone, skills, experience, education }
  );

  res.json({ msg: "Saved" });
});

/* =========================
   🔥 Candidates
========================= */
app.get("/candidates", async (req, res) => {
  const users = await User.find({ role: "candidate" });
  res.json(users);
});

/* =========================
   🔥 Test
========================= */
app.get("/", (req, res) => {
  res.send("Backend running ✅");
});

app.listen(5000, () => {
  console.log("Server running on 5000");
});