const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  imageUrl: { type: String },
  category: { type: String },
  modelUrl: { type: String },
  // Add more fields as needed
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
