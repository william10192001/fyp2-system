const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String,
  name: String,
  phone: String,
  education: String,
  skills: String,
  experience: String,
  resumeKeywords: [String],
  jobKeywords: [String],
  jobDescription: String,
  jobTitle:    { type: String, default: "" },
  companyName: { type: String, default: "" },
  location:    { type: String, default: "" },
  resetToken: String,
  resetTokenExpiry: Date,
  experienceYears:    { type: Number, default: 0 },
  requiredExperience: { type: Number, default: 0 },
  resumeText:  { type: String, default: "" },
  savedJobs:   [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);