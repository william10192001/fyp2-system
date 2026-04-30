require("dotenv").config();

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
   🔥 1. 连接 MongoDB
========================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("Mongo Error:", err));

/* =========================
   🔥 2. Register
========================= */
app.post("/register", async (req, res) => {
  const { email, password, role } = req.body;

  if (!email.includes("@")) {
    return res.status(400).json({ msg: "Invalid email" });
  }

  if (password.length < 6) {
    return res.status(400).json({ msg: "Password min 6 chars" });
  }

  try {
    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
  email,
  password: hashedPassword,
  role: role
});

    await newUser.save();

    res.json({ msg: "Registered successfully" });

  } catch (err) {
    console.log("REGISTER ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* =========================
   🔥 3. Login
========================= */
app.post("/login", async (req, res) => {
  try {
    console.log("👉 LOGIN HIT");

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      console.log("❌ USER NOT FOUND:", email);
      return res.status(400).json({ msg: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: "Wrong password" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("✅ LOGIN SUCCESS:", email);

    res.json({
      token,
      user: {
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.log("🔥 LOGIN ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* =========================
   🔥 4. Forgot Password（已修复🔥）
========================= */
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  console.log("Forgot password:", email);

  try {
    // 假设你用 mongoose
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // 先做测试用（不发邮件）
    res.json({ msg: "Reset link sent (mock)" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* =========================
   🔥 5. Reset Password
========================= */
app.post("/reset-password/:token", async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.findByIdAndUpdate(decoded.id, {
      password: hashedPassword
    });

    console.log("✅ PASSWORD RESET SUCCESS");

    res.json({ msg: "Password reset success ✅" });

  } catch (err) {
    console.log("🔥 RESET ERROR:", err);
    res.status(400).json({ msg: "Invalid or expired token" });
  }
});

/* =========================
   🔥 6. Test
========================= */
app.get("/", (req, res) => {
  res.send("Backend running ✅");
});

/* =========================
   🔥 7. Start
========================= */
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

app.post("/profile", async (req, res) => {
  const { email, name, phone, skills, experience, education } = req.body;

  await User.findOneAndUpdate(
    { email },
    { name, phone, skills, experience, education },
    { new: true }
  );

  res.json({ msg: "Profile saved" });
});

app.get("/candidates", async (req, res) => {
  const users = await User.find({ role: "candidate" });
  res.json(users);
});