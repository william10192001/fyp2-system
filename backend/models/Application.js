const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema({
  jobId:          { type: String, required: true },
  jobTitle:       { type: String, default: "" },
  candidateEmail: { type: String, required: true },
  candidateName:  { type: String, default: "" },
  employerEmail:  { type: String, required: true },
  status:         { type: String, default: "pending" }
}, { timestamps: true });

module.exports = mongoose.model("Application", ApplicationSchema);