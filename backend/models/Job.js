const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
  employerEmail:      { type: String, required: true },
  jobTitle:           { type: String, default: "" },
  companyName:        { type: String, default: "" },
  location:           { type: String, default: "" },
  jobDescription:     { type: String, default: "" },
  jobKeywords:        [String],
  requiredExperience: { type: Number, default: 0 },
  status:             { type: String, default: "active" },
  // ✅ NEW FIELDS for Company & Benefits
  salary:             { type: String, default: "" },
  jobType:            { type: String, default: "" },   // Full-time / Part-time / Internship / Contract
  workMode:           { type: String, default: "" },   // On-site / Remote / Hybrid
  benefits:           { type: String, default: "" },   // Free text e.g. EPF, SOCSO, Medical
  companyDescription: { type: String, default: "" },   // About the company
  contactEmail:       { type: String, default: "" },   // HR contact email
}, { timestamps: true });

module.exports = mongoose.model("Job", JobSchema);
