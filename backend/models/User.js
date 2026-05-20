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

  resetToken: String,

  resetTokenExpiry: Date,

  experienceYears: {
    type: Number,
    default: 0
  },

  requiredExperience: {
    type: Number,
    default: 0
  },

  // 🔥 NEW
  resumeText: {
    type: String,
    default: ""
  }

});

module.exports = mongoose.model("User", UserSchema);