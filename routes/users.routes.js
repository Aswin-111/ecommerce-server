const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth.middleware.js");
const users = require("../controllers/users.controller.js");

router.get("/users/cart", authenticateToken, users.getCart);
// router.delete("/users/:id", authenticateToken, users.delete);
router.delete("/users/cart", authenticateToken, users.deletefromcart);
router.put("/users/addtocart", authenticateToken, users.addtocart);

router.post("/signup", users.signup);
router.post("/login", users.login);
router.get("/users/getshopdata", authenticateToken, users.getshopdata);
router.get("/users/stream-files", authenticateToken, users.streamFiles);

router.post("/users/:userId/cart/add", authenticateToken, users.addToCart);
router.delete(
  "/users/:userId/cart/remove/:productId",
  authenticateToken,
  users.removeFromCart
);
router.put(
  "/users/:userId/cart/update/:productId",
  authenticateToken,
  users.updateCartQuantity
);

router.put("/api/users/:id", authenticateToken, users.updateUser);

router.post("/users/:userId/checkout", authenticateToken, users.checkout);

router.post("/users/contra/cart", users.updateContraCart);
router.get("/users/checkout", authenticateToken, users.getCheckout);
router.post("/users/placeorder", authenticateToken, users.placeOrder);
router.get("/users/orders", authenticateToken, users.getOrderById);

// add products
router.post("/users/addproducts", authenticateToken, users.addProducts);
router.get("/users/profile", authenticateToken, users.profile);
module.exports = router;
