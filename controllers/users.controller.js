const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const z = require("zod");
const mongoose = require("mongoose");
const Product = require("../models/product.model.js");

const Order = require("../models/order.model.js");

exports.profile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    console.log(user);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send({
      message: error.message || "Some error occurred while fetching the user.",
    });
  }
};
exports.signup = async (req, res) => {
  try {
    const { fname, lname, email, phone, password } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ message: "Email already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new User({
      fname,
      lname,
      email,
      phone,
      password: hashedPassword,
    });

    // Save the user to the database
    await user.save();

    res.status(201).send({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Some error occurred while creating the user.",
    });
  }
};

exports.addProducts = async (req, res) => {
  try {
    const products = req.body;
    // add products to model
    if (products.length > 0) {
      await Product.insertMany(products);

      res.status(201).send({ message: "Products added successfully!" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fname,
      lname,
      address,
      city,
      state,
      zipCode,
      country,
      phone,
      email,
    } = req.body;

    // Find the user by ID and update their information
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { fname, lname, address, city, state, zipCode, country, phone, email },
      { new: true } // Return the updated user
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
};

exports.placeOrder = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch user from database based on userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get cart details
    const cart = user.cart;

    // Calculate total
    let total = 0;
    for (const item of cart) {
      const product = await Product.findById(item.productId);
      if (product) {
        total += product.price * item.quantity;
      }
    }

    // Generate order ID
    const orderId = `ORDER-${Date.now()}`;
    function formatDate(date) {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }

    const today = new Date();
    const formattedDate = formatDate(today);
    console.log(formattedDate);

    // Create new order
    const order = new Order({
      orderId: orderId,
      userId: userId,
      products: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      total: total,
      date: formattedDate,
    });

    // Save order
    await order.save();

    // Clear user's cart
    user.cart = [];
    await user.save();

    return res.status(200).json({
      message: "Order placed successfully",
      orderId: orderId,
      total: total,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to place order" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const userId = req.user.userId;

    //  fetch from orders where userId = userId

    const orders = await Order.find({ userId: userId });

    if (!orders) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json(orders);
  } catch (error) {
    console.error(error);

    return res.status(500).json({ message: "Failed to fetch order" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).send({ message: "Invalid credentials" });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).send({ message: "Invalid credentials" });
    }

    // Generate JWT token
    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "10h",
    });

    res
      .status(200)
      .send({ message: "User logged in successfully!", token: token });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Some error occurred while logging in.",
    });
  }
};

exports.streamFiles = async (req, res) => {
  const filenames = ["mannequin1.glb", "mannequin2.glb", "mannequin3.glb"];

  if (!filenames || !Array.isArray(filenames) || filenames.length === 0) {
    return res.status(400).send({
      message: "Please provide an array of filenames in the request body.",
    });
  }

  try {
    for (const filename of filenames) {
      const filePath = path.join(__dirname, "../uploads", filename);
      const stat = fs.statSync(filePath);

      res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename=${filename}`,
        "Content-Length": stat.size,
      });

      const readStream = fs.createReadStream(filePath);
      await new Promise((resolve, reject) => {
        readStream.pipe(res, { end: false }); // Stream the file directly to the client, but don't end the response yet
        readStream.on("end", () => {
          console.log(`File ${filename} streamed successfully.`);
          resolve();
        });
        readStream.on("error", (err) => {
          console.error(`Error streaming file ${filename}:`, err);
          reject(err);
        });
      });
    }

    console.log("All files streamed successfully.");
  } catch (error) {
    console.error("Error streaming files:", error);
    res.status(500).send({
      message:
        error.message || "Some error occurred while streaming the files.",
    });
  }
};

exports.getshopdata = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products" });
  }
};
exports.addToCart = async (req, res) => {
  try {
    const { userEmail, productIds, quantity } = req.body;

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    for (const productId of productIds) {
      // Check if the product is already in the cart
      const productIndex = user.cart.findIndex(
        (item) => item.productId === productId
      );

      if (productIndex > -1) {
        // If the product is already in the cart, update the quantity
        user.cart[productIndex].quantity += quantity;
      } else {
        // If the product is not in the cart, add it to the cart
        user.cart.push({ productId: productId, quantity: quantity });
      }
    }

    await user.save();

    res.status(200).send({ message: "Product added to cart successfully" });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Some error occurred while adding to cart.",
    });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.params.userId;
    const productId = req.params.productId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Use the $pull operator to remove the item from the cart array
    await User.updateOne(
      { _id: userId },
      { $pull: { cart: { productId: productId } } }
    );

    res.status(200).send({ message: "Product removed from cart successfully" });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Some error occurred while removing from cart.",
    });
  }
};

exports.updateCartQuantity = async (req, res) => {
  try {
    const userId = req.params.userId;
    const productId = req.params.productId;
    const quantity = req.body.quantity;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Check if the product is in the cart
    const productIndex = user.cart.findIndex(
      (item) => item.productId === productId
    );

    if (productIndex === -1) {
      return res.status(404).send({ message: "Product not found in cart" });
    }

    user.cart[productIndex].quantity = quantity;
    await user.save();

    res.status(200).send({ message: "Cart quantity updated successfully" });
  } catch (error) {
    res.status(500).send({
      message:
        error.message || "Some error occurred while updating cart quantity.",
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Update only the provided fields
    Object.keys(updateData).forEach((key) => {
      user[key] = updateData[key];
    });

    await user.save();

    res.status(200).send({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Some error occurred while updating profile.",
    });
  }
};

exports.checkout = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Calculate the total price
    let totalPrice = 0;
    for (const item of user.cart) {
      // Assuming you have a Product model with a price field
      const product = await Product.findById(item.productId);
      if (product) {
        totalPrice += product.price * item.quantity;
      }
    }

    // Clear the cart
    user.cart = [];
    await user.save();

    res
      .status(200)
      .send({ message: "Checkout successful", totalPrice: totalPrice });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Some error occurred while checking out.",
    });
  }
};

exports.deletefromcart = async (req, res) => {
  try {
    console.log(req.body);
    const userId = req.user.userId;
    const productId = req.query.productId;

    console.log(userId, productId);
    // Fetch user from database based on userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    //delete the product from the cart
    const updatedCart = user.cart.filter(
      (item) => item.productId !== productId
    );
    user.cart = updatedCart;

    // Save the updated user

    await user.save();
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.addtocart = async (req, res) => {
  try {
    console.log(req.body);
    const userId = req.user.userId;
    const productId = req.body.productId;

    console.log(userId, productId);
    // Fetch user from database based on userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    //add the product to the cart
    const updatedCart = [...user.cart, { productId: productId, quantity: 1 }];
    user.cart = updatedCart;
    console.log(user);
    await user.save();
    return res.json({
      message: "Product added to cart successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const orders = await Order.find({ userId: userId });

    res
      .status(200)
      .send({ message: "User orders retrieved successfully", orders: orders });
  } catch (error) {
    res.status(500).send({
      message:
        error.message || "Some error occurred while retrieving user orders.",
    });
  }
};

exports.getCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch user from database based on userId
    const user = await User.findById(userId);

    console.log("User ID:", userId); // Debugging
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch product details for each item in the cart
    const cartWithProducts = await Promise.all(
      user.cart.map(async (item) => {
        // Extract the productId and remove quotes (if present)
        let productId = item.productId;

        // Check if productId is already an ObjectId. If not, convert it to string and remove the quotes
        if (typeof productId !== "string") {
          productId = productId.toString(); // Convert to string
        }

        productId = productId.replace(/'/g, ""); // Remove all single quotes
        // Validate if it's a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
          console.warn("Invalid productId encountered:", productId); // Log invalid IDs
          return {
            ...(item.toObject ? item.toObject() : item),
            product: null, // Or handle this case as you see fit (e.g., skip the product)
            error: "Invalid product ID", // Add an error flag
          };
        }

        try {
          const product = await Product.findById(productId);
          return {
            ...(item.toObject ? item.toObject() : item),
            product,
          };
        } catch (err) {
          console.error("Error fetching product:", productId, err);
          return {
            ...(item.toObject ? item.toObject() : item),
            product: null, // Or handle this case as you see fit
            error: "Failed to fetch product", // Add an error flag
          };
        }
      })
    );

    res.status(200).json(cartWithProducts);
  } catch (error) {
    console.error("General error fetching cart:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch cart", error: error.message });
  }
};

exports.getCheckout = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch user from database based on userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch product details for each item in the cart
    const cartWithProducts = await Promise.all(
      user.cart.map(async (item) => {
        const product = await Product.findById(item.productId);
        return {
          ...(item.toObject ? item.toObject() : item),
          product,
        };
      })
    );

    res.status(200).json({
      user: {
        fname: user.fname,
        lname: user.lname,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        country: user.country,
      },
      cart: cartWithProducts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch checkout data" });
  }
};

exports.updateContraCart = async (req, res) => {
  try {
    const { productIds, quantity } = req.body;
    const userEmail = "contra@gmail.com";
    // const userEmail = req.user.email;

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    for (const productId of productIds) {
      // Check if the product is already in the cart
      const productIndex = user.cart.findIndex(
        (item) => item.productId === productId
      );

      if (productIndex > -1) {
        // If the product is already in the cart, update the quantity
        user.cart[productIndex].quantity += quantity;
      } else {
        // If the product is not in the cart, add it to the cart
        user.cart.push({ productId: productId, quantity: quantity });
      }
    }

    await user.save();

    res.status(200).send({ message: "Product added to cart successfully" });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Some error occurred while adding to cart.",
    });
  }
};
