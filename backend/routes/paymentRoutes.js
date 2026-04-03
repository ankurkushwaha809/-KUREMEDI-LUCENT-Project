import express from "express";
import { protect } from "../middleware/protect.js";
import { requireKycApproved } from "../middleware/authorize.js";
import Order from "../model/Order.js";
import {
  createPaymentOrder,
  verifyPayment,
  updateOrderStatus,
} from "../controllers/payment.controller.js";

const router = express.Router();

// ============ ADMIN (no auth - admin may use separate session) ============

/**
 * GET /api/payment/orders
 * Returns all orders for admin dashboard
 */
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email phone")
      .populate({ path: "items.product", populate: { path: "category", select: "name" } })
      .sort({ createdAt: -1 });

    const mapped = orders.map((o) => ({
      _id: o._id,
      orderDate: o.createdAt,
      totalAmt: o.payableAmount ?? o.totalAmount ?? 0,
      cartItems: (o.items || []).map((it) => ({
        name: it.productName || (it.product?.productName) || "",
        quantity: it.quantity || 1,
        price: it.price || it.mrp || 0,
        productId: {
          subCategory: [
            {
              name:
                (typeof it.product?.category === "object" && it.product?.category?.name) ||
                "General",
            },
          ],
          name: it.productName || (it.product?.productName) || "",
        },
      })),
      user: o.user,
      status: o.status,
      paymentMethod: o.paymentMethod,
      shiprocketShipmentId: o.shiprocketShipmentId || null,
      shiprocketAwb: o.shiprocketAwb || null,
      shiprocketLabelUrl: o.shiprocketLabelUrl || null,
      trackingUrl: o.trackingUrl || null,
    }));

    res.json(mapped);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

//Arshad's Ai made changes here

/**
 * GET /api/payment/orders/:orderId
 * Returns a single order by ID for admin order detail view
 */
router.get("/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("user", "name email phone")
      .populate({ path: "items.product", populate: { path: "category", select: "name" } });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Map to match frontend expectations (status + tracking for app/website)
    const mapped = {
      _id: order._id,
      status: order.status,
      createdAt: order.createdAt,
      paymentMethod: order.paymentMethod || "COD",
      totalAmt: order.payableAmount ?? order.totalAmount ?? 0,
      user: {
        name: order.user?.name || "",
        phone: order.user?.phone || "",
        email: order.user?.email || "",
      },
      address: order.shippingAddress || {
        name: order.user?.name || "",
        phone: order.shippingAddress?.phone || order.user?.phone || "",
        addressLine1: order.shippingAddress?.address || "",
        addressLine2: "",
        city: order.shippingAddress?.shopName || order.shippingAddress?.city || "",
        state: order.shippingAddress?.state || "",
        pincode: order.shippingAddress?.pincode || "",
      },
      cartItems: (order.items || []).map((it) => ({
        name: it.productName || (it.product?.productName) || "",
        quantity: it.quantity || 1,
        price: it.price || it.mrp || 0,
      })),
      shiprocketShipmentId: order.shiprocketShipmentId || null,
      shiprocketAwb: order.shiprocketAwb || null,
      shiprocketLabelUrl: order.shiprocketLabelUrl || null,
      trackingUrl: order.trackingUrl || null,
    };

    res.json({ data: mapped });
  } catch (err) {
    console.error("Error fetching order by ID:", err);
    res.status(500).json({ message: "Failed to fetch order" });
  }
});

/**
 * PUT /api/payment/update-status
 * Admin: Update order status (or other fields)
 * Body: { orderId, status } or { orderId, [field]: value }
 */
router.put("/update-status", updateOrderStatus);

// ============ USER (protected) ============

/**
 * POST /api/payment/create-order
 * Checkout: Create order in PENDING, return Razorpay order for payment
 * Body: { shippingAddress?, notes? }
 */
router.post("/create-order", protect, requireKycApproved, createPaymentOrder);

/**
 * POST /api/payment/verify-payment
 * Verify Razorpay payment and confirm order (reduce stock, clear cart)
 * Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature }
 */
router.post("/verify-payment", protect, requireKycApproved, verifyPayment);

export default router;
