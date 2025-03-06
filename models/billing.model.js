const mongoose = require("mongoose");

const billingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  cardNumber: { type: String, required: true },
  expirationDate: { type: String, required: true },
  cvv: { type: String, required: true },
});

const Billing = mongoose.model("Billing", billingSchema);

module.exports = Billing;
