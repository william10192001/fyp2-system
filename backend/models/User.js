const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String,

  // forgot password
  resetToken: String,
  resetTokenExpiry: Date,

  // profile
  name: String,
  phone: String,
  skills: String,
  experience: String,
  education: String,

  // NLP resume
  resumeKeywords: [String],
  jobKeywords: [String],
  jobDescription: String,
  matchScore: Number

});

module.exports = mongoose.model("User", userSchema);