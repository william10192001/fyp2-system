const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String,

  // profile
  name: String,
  phone: String,
  skills: String,
  experience: String,
  education: String
});

module.exports = mongoose.model("User", UserSchema);