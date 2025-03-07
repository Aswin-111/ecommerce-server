const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

const path = require("path");

app.use(cors());
app.use(express.json());

// Serve static files from the client/public directory
app.use(express.static(path.join(__dirname, "products")));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const usersRoutes = require("./routes/users.routes.js");
app.use("/api", usersRoutes);

const productRoutes = require("./routes/product.routes.js");
app.use("/api/products", productRoutes);

const orderRoutes = require("./routes/order.routes.js");
app.use("/api", orderRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
