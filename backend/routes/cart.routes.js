import express from "express";
import { protect } from "../middleware/protect.js";
import { authorizeRoles, requireKycApproved } from "../middleware/authorize.js";
import {
  addToCart,
  getMyCart,
  updateCartQty,
  removeFromCart,
  clearCart,
} from "../controllers/cart.controller.js";

const router = express.Router();

// All cart APIs require: protect → role (user/vendor) → KYC approved
const cartAuth = [protect, authorizeRoles("user", "vendor"), requireKycApproved];

router.post("/add", ...cartAuth, addToCart);
router.get("/", ...cartAuth, getMyCart);
router.put("/update", ...cartAuth, updateCartQty);
router.delete("/remove/:productId", ...cartAuth, removeFromCart);
router.delete("/clear", ...cartAuth, clearCart);

export default router;
