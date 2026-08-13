const express = require("express");

const router = express.Router();

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateDeliveryLocation,
  getAllOrdersForAdmin,
} = require("../controllers/orderController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

// ========================================
// CUSTOMER ROUTES
// ========================================

// Place new order
router.post("/", protect, createOrder);

// Get logged-in user's orders
router.get("/", protect, getOrders);

// ========================================
// ADMIN ROUTES
// ========================================

// Get all orders - keep BEFORE /:id
router.get(
  "/admin/all",
  protect,
  adminOnly,
  getAllOrdersForAdmin
);
// Update delivery map location - ADMIN
router.put(
  "/:id/location",
  protect,
  adminOnly,
  updateDeliveryLocation
);
// ========================================
// SINGLE ORDER TRACKING
// ========================================

router.get("/:id", protect, getOrderById);

// ========================================
// UPDATE ORDER STATUS - ADMIN
// ========================================

router.put(
  "/:id",
  protect,
  adminOnly,
  updateOrderStatus
);

module.exports = router;