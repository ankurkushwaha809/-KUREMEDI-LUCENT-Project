/**
 * ORDER FLOW:
 * ─────────────────────────────────────────────────────────────────────────
 * 1. COD (Cash on Delivery):
 *    POST /api/orders (placeOrder) → creates order, reduces stock, clears cart
 *
 * 2. ONLINE PAYMENT (Razorpay):
 *    a) POST /api/payment/create-order → creates order (PENDING), returns Razorpay orderId
 *    b) Client opens Razorpay checkout, user pays
 *    c) POST /api/payment/verify-payment → verifies signature, updates to PLACED, reduces stock, clears cart
 *
 * 3. ADMIN:
 *    GET /api/payment/orders → list all orders
 *    PUT /api/payment/update-status → update order status
 */
import express from "express";
import { protect } from "../middleware/protect.js";
import { authorizeRoles, requireKycApproved } from "../middleware/authorize.js";
import {
  placeOrder,
  getMyOrders,
  getAllOrders,
  getOrderTracking,
  updateOrderStatus,
} from "../controllers/order.controller.js";

const router = express.Router();

// COD: Place order directly (creates order, reduces stock, clears cart)
router.post("/", protect, authorizeRoles("user", "vendor"), requireKycApproved, placeOrder);
router.get("/my", protect, authorizeRoles("user", "vendor"), getMyOrders);
router.get("/all", protect, authorizeRoles("admin"), getAllOrders);
router.get("/:orderId/tracking", protect, authorizeRoles("user", "vendor"), getOrderTracking);
router.put(
  "/:orderId/status",
  protect,
  authorizeRoles("admin"),
  updateOrderStatus
);

export default router;
