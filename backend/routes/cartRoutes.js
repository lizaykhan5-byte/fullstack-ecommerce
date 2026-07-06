const express = require("express");
const router = express.Router();

const {
  addToCart,
  getCartItems,
  removeCartItem,
  updateCartQuantity,
} = require("../controllers/cartController");

// Add item to cart
router.post("/", addToCart);

// Get logged-in user's cart
router.get("/:userId", getCartItems);

router.put("/:id", updateCartQuantity);
// Remove item from cart
router.delete("/:id", removeCartItem);

module.exports = router;