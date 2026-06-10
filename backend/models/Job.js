const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
  employerEmail:      { type: String, required: true },
  jobTitle:           { type: String, default: "" },
  companyName:        { type: String, default: "" },
  location:           { type: String, default: "" },
  jobDescription:     { type: String, default: "" },
  jobKeywords:        [String],
  requiredExperience: { type: Number, default: 0 },
  status:             { type: String, default: "active" }
}, { timestamps: true });

module.exports = mongoose.model("Job", JobSchema);