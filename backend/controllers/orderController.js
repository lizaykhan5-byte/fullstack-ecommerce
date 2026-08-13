const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/product");

// ========================================
// CREATE ORDER - SECURE VERSION
// ========================================
const createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod = "Cash on Delivery",
      customerNote = "",
    } = req.body;

    // User MUST come from verified JWT
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Please login to place an order.",
      });
    }

    // -------------------------------
    // Validate items
    // -------------------------------
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty.",
      });
    }

    // -------------------------------
    // Validate shipping address
    // -------------------------------
    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.phone ||
      !shippingAddress.email ||
      !shippingAddress.addressLine1 ||
      !shippingAddress.city
    ) {
      return res.status(400).json({
        success: false,
        message: "Please complete all required shipping details.",
      });
    }

    // -------------------------------
    // Validate payment method
    // -------------------------------
    const allowedPaymentMethods = [
      "Cash on Delivery",
      "Bank Transfer",
      "Card Payment",
    ];

    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method.",
      });
    }

    // -------------------------------
    // Validate product IDs
    // -------------------------------
    for (const item of items) {
      if (
        !item.product ||
        !mongoose.isValidObjectId(item.product) ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product or quantity.",
        });
      }
    }

    // Get unique product IDs
    const productIds = [
      ...new Set(items.map((item) => item.product.toString())),
    ];

    // -------------------------------
    // Fetch REAL products from DB
    // -------------------------------
    const products = await Product.find({
      _id: { $in: productIds },
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more products no longer exist.",
      });
    }

    const productMap = new Map(
      products.map((product) => [
        product._id.toString(),
        product,
      ])
    );

    // -------------------------------
    // Build secure order items
    // -------------------------------
    const secureItems = [];

    let subtotal = 0;

    for (const item of items) {
      const product = productMap.get(
        item.product.toString()
      );

      const quantity = Number(item.quantity);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found.",
        });
      }

      // -------------------------------
      // Check stock
      // -------------------------------
      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} item(s) available for ${product.name}.`,
        });
      }

      // IMPORTANT:
      // price comes from database,
      // NOT frontend.
      const price = Number(product.price);

      subtotal += price * quantity;

      secureItems.push({
        product: product._id,
        quantity,
        price,
      });
    }

    // -------------------------------
    // Server-side pricing
    // -------------------------------
    const shippingFee = 250;
    const discount = 0;

    const totalAmount =
      subtotal + shippingFee - discount;

    // -------------------------------
    // Estimated delivery
    // -------------------------------
    const estimatedDelivery = new Date();

    estimatedDelivery.setDate(
      estimatedDelivery.getDate() + 5
    );

    // -------------------------------
    // Create secure order
    // -------------------------------
    const order = await Order.create({
      user: req.user._id,

      items: secureItems,

      subtotal,

      shippingFee,

      discount,

      totalAmount,

      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),

        phone: shippingAddress.phone.trim(),

        email: shippingAddress.email
          .trim()
          .toLowerCase(),

        addressLine1:
          shippingAddress.addressLine1.trim(),

        addressLine2:
          shippingAddress.addressLine2?.trim() || "",

        city: shippingAddress.city.trim(),

        province:
          shippingAddress.province?.trim() || "",

        postalCode:
          shippingAddress.postalCode?.trim() || "",

        country:
          shippingAddress.country?.trim() ||
          "Pakistan",
      },

      payment: {
        method: paymentMethod,
        status: "Pending",
      },

      status: "Order Placed",

      trackingHistory: [
        {
          status: "Order Placed",

          message:
            "Your order has been placed successfully.",

          timestamp: new Date(),
        },
      ],

      estimatedDelivery,

      customerNote:
        typeof customerNote === "string"
          ? customerNote.trim()
          : "",
    });

    // Populate product information
    await order.populate(
      "items.product",
      "name price image category brand"
    );

    return res.status(201).json({
      success: true,

      message: "Order placed successfully.",

      order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,

      message:
        "Something went wrong while placing your order.",
    });
  }
};

// ========================================
// GET LOGGED-IN USER ORDERS
// ========================================
const getOrders = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const orders = await Order.find({
      user: req.user._id,
    })
      .populate(
        "items.product",
        "name price image category brand"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load orders.",
    });
  }
};

// ========================================
// UPDATE ORDER STATUS - ADMIN
// ========================================
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Order Placed",
      "Confirmed",
      "Processing",
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    const order = await Order.findById(
      req.params.id
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    order.status = status;

    order.trackingHistory.push({
      status,

      message: `Order status updated to ${status}.`,

      timestamp: new Date(),
    });

    if (status === "Delivered") {
      order.deliveredAt = new Date();

      // COD becomes paid when delivered
      if (
        order.payment.method ===
        "Cash on Delivery"
      ) {
        order.payment.status = "Paid";
        order.payment.paidAt = new Date();
      }
    }

    if (status === "Cancelled") {
      order.cancellation.cancelledAt =
        new Date();
    }

    await order.save();

    return res.status(200).json({
      success: true,

      message: "Order status updated.",

      order,
    });
  } catch (error) {
    console.error(
      "Update order status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update order status.",
    });
  }
};

// ========================================
// GET ALL ORDERS - ADMIN
// ========================================
const getAllOrdersForAdmin = async (
  req,
  res
) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate(
        "items.product",
        "name price image category brand"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(
      "Admin get orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load orders.",
    });
  }
};
// ========================================
// GET SINGLE ORDER - CUSTOMER TRACKING
// ========================================
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate(
        "items.product",
        "name price image category brand"
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Customer can only view their own order
    if (
      order.user.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this order.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order tracking error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load order tracking.",
    });
  }
};
// ========================================
// UPDATE DELIVERY LOCATION - ADMIN
// ========================================
const updateDeliveryLocation = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      address = "",
    } = req.body;

    const lat = Number(latitude);
    const lng = Number(longitude);

    // Validate coordinates
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid latitude and longitude are required.",
      });
    }

    if (
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Latitude or longitude is outside the valid range.",
      });
    }

    const order = await Order.findById(
      req.params.id
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (
      order.status === "Delivered" ||
      order.status === "Cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Location cannot be updated for a delivered or cancelled order.",
      });
    }

    // Update current map location
    order.currentLocation = {
      latitude: lat,
      longitude: lng,
      address:
        typeof address === "string"
          ? address.trim()
          : "",
      updatedAt: new Date(),
    };

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Delivery location updated successfully.",
      currentLocation:
        order.currentLocation,
    });
  } catch (error) {
    console.error(
      "Update delivery location error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update delivery location.",
    });
  }
};
module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateDeliveryLocation,
  getAllOrdersForAdmin,
};