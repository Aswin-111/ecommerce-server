const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fname: { type: String },
  lname: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  country: { type: String },
  password: { type: String },
  cart: { type: Array, default: [] },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
