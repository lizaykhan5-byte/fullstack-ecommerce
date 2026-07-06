const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  updateOrderStatus,getAllOrdersForAdmin,
} = require("../controllers/orderController");

// Place Order
router.post("/", createOrder);
router.get("/admin/all", getAllOrdersForAdmin);
// Get Orders of Logged-in User
router.get("/:userId", getOrders);

// Update Order Status (Admin)
router.put("/:id", updateOrderStatus);

module.exports = router;