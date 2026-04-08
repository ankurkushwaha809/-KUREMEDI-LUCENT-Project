import crypto from "crypto";
import Razorpay from "razorpay";
import express from "express";
import { protect } from "../middleware/protect.js";
import Recharge from "../model/Recharge.js";
import Wallet from "../model/Wallet.js";
import { getValidatedRazorpayConfig } from "../utils/razorpayConfig.js";

const router = express.Router();

function timingSafeSignatureEqual(expectedHex, providedHex) {
  try {
    const expected = Buffer.from(String(expectedHex || ""), "hex");
    const provided = Buffer.from(String(providedHex || ""), "hex");
    if (!expected.length || expected.length !== provided.length) return false;
    return crypto.timingSafeEqual(expected, provided);
  } catch {
    return false;
  }
}

async function fetchRazorpayPayment({ keyId, keySecret, paymentId }) {
  const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { ok: response.ok, status: response.status, data };
}

/**
 * GET /api/wallet
 * Get current user's wallet balance
 */
router.get("/", protect, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user._id, balance: 0 });
    }
    const txns = (wallet.transactions || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 50)
      .map((t) => ({
        amount: t.amount,
        type: t.type,
        description: t.description || (t.type === "CREDIT" ? "Credit" : "Debit"),
        reference: t.reference,
        balanceAfter: t.balanceAfter,
        createdAt: t.createdAt,
      }));
    res.json({
      balance: wallet.balance ?? 0,
      walletId: wallet._id,
      transactions: txns,
    });
  } catch (err) {
    console.error("getWallet:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/wallet/recharge
 * Create Razorpay order for wallet recharge
 * Body: { amount: number } (min 1, in INR)
 */
router.post("/recharge", protect, async (req, res) => {
  try {
    let razorpay;
    try {
      razorpay = getValidatedRazorpayConfig();
    } catch (cfgErr) {
      return res.status(503).json({
        message: cfgErr.message || "Payment gateway not configured",
        code: cfgErr.code || "PAYMENT_GATEWAY_NOT_CONFIGURED",
      });
    }
    const RAZORPAY_KEY_ID = razorpay.keyId;
    const RAZORPAY_KEY_SECRET = razorpay.keySecret;

    const amount = Math.round(Number(req.body.amount) || 0);
    if (amount < 1) {
      return res.status(400).json({ message: "Minimum recharge amount is ₹1" });
    }
    if (amount > 100000) {
      return res.status(400).json({ message: "Maximum recharge amount is ₹1,00,000" });
    }

    const amountPaise = amount * 100;
    if (amountPaise < 100) {
      return res.status(400).json({
        message: "Minimum recharge amount is ₹1",
        code: "RAZORPAY_MIN_AMOUNT_NOT_MET",
      });
    }
    const receipt = `RCH${String(req.user._id).slice(-8)}${Date.now().toString().slice(-6)}`.slice(0, 40);
    
    let razorpayOrder;
    try {
      const razorpayClient = new Razorpay({
        key_id: RAZORPAY_KEY_ID,
        key_secret: RAZORPAY_KEY_SECRET,
      });

      razorpayOrder = await razorpayClient.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt,
        notes: {
          userId: String(req.user._id),
          amount,
          type: "wallet_recharge",
        },
      });
    } catch (sdkErr) {
      const gatewayDescription = sdkErr?.error?.description || sdkErr?.description;
      const errorMsg = gatewayDescription || sdkErr?.message || "Failed to create Razorpay order";
      const isMinAmount = /minimum amount allowed/i.test(errorMsg);
      console.error("Wallet recharge order creation failed:", {
        status: sdkErr?.statusCode,
        message: errorMsg,
        amount: amountPaise,
        error: sdkErr?.error || sdkErr,
      });
      return res.status(isMinAmount ? 400 : 502).json({ 
        message: errorMsg,
        code: isMinAmount ? "RAZORPAY_MIN_AMOUNT_NOT_MET" : "RAZORPAY_ORDER_CREATE_FAILED"
      });
    }

    if (!razorpayOrder?.id) {
      return res.status(500).json({ 
        message: "Invalid Razorpay response",
        code: "RAZORPAY_INVALID_RESPONSE"
      });
    }

    await Recharge.create({
      user: req.user._id,
      amount,
      razorpayOrderId: razorpayOrder.id,
      status: "PENDING",
    });

    res.status(201).json({
      razorpayOrderId: razorpayOrder.id,
      amount,
      keyId: RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("wallet recharge create:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/wallet/recharge/verify
 * Verify Razorpay payment and credit wallet
 * Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature }
 */
router.post("/recharge/verify", protect, async (req, res) => {
  try {
    let razorpay;
    try {
      razorpay = getValidatedRazorpayConfig();
    } catch (cfgErr) {
      return res.status(503).json({
        message: cfgErr.message || "Payment gateway not configured",
        code: cfgErr.code || "PAYMENT_GATEWAY_NOT_CONFIGURED",
      });
    }
    const RAZORPAY_KEY_ID = razorpay.keyId;
    const RAZORPAY_KEY_SECRET = razorpay.keySecret;

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    const recharge = await Recharge.findOne({ razorpayOrderId, user: req.user._id });

    if (!recharge) {
      return res.status(404).json({ message: "Recharge not found or already processed" });
    }

    if (recharge.status !== "PENDING") {
      if (recharge.razorpayPaymentId && recharge.razorpayPaymentId === razorpayPaymentId) {
        const wallet = await Wallet.findOne({ user: req.user._id });
        return res.status(200).json({
          message: "Wallet recharge already verified",
          newBalance: wallet?.balance ?? 0,
          amount: recharge.amount,
          receipt: (razorpayPaymentId || recharge.razorpayOrderId || "").slice(0, 40),
        });
      }

      return res.status(409).json({ message: "Recharge already processed" });
    }

    const duplicatePayment = await Recharge.findOne({
      _id: { $ne: recharge._id },
      razorpayPaymentId,
    }).select("_id");

    if (duplicatePayment) {
      return res.status(409).json({ message: "Payment reference already used" });
    }

    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expected = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");
    const verified = timingSafeSignatureEqual(expected, razorpaySignature);

    if (!verified) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const gatewayPayment = await fetchRazorpayPayment({
      keyId: RAZORPAY_KEY_ID,
      keySecret: RAZORPAY_KEY_SECRET,
      paymentId: razorpayPaymentId,
    });

    if (!gatewayPayment.ok || !gatewayPayment.data?.id) {
      return res.status(502).json({ message: "Unable to validate payment with Razorpay" });
    }

    const paymentData = gatewayPayment.data;
    const expectedAmountPaise = Math.round(Number(recharge.amount || 0) * 100);
    const paymentAmountPaise = Number(paymentData.amount || 0);
    const paymentStatus = String(paymentData.status || "").toLowerCase();

    if (paymentData.order_id !== razorpayOrderId) {
      return res.status(400).json({ message: "Payment order mismatch" });
    }

    if (String(paymentData.currency || "") !== "INR") {
      return res.status(400).json({ message: "Invalid payment currency" });
    }

    if (paymentAmountPaise !== expectedAmountPaise) {
      return res.status(400).json({ message: "Payment amount mismatch" });
    }

    if (!["authorized", "captured"].includes(paymentStatus)) {
      return res.status(400).json({ message: "Payment is not in a valid state" });
    }

    recharge.razorpayPaymentId = razorpayPaymentId;
    recharge.status = "COMPLETED";
    await recharge.save();

    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user._id, balance: 0 });
    }

    const newBalance = (wallet.balance ?? 0) + recharge.amount;
    wallet.balance = newBalance;
    wallet.transactions.push({
      amount: recharge.amount,
      type: "CREDIT",
      description: "Wallet recharge",
      reference: razorpayPaymentId,
      balanceAfter: newBalance,
    });
    await wallet.save();

    const receipt = (razorpayPaymentId || recharge.razorpayOrderId || "").slice(0, 40);
    res.json({
      message: "Wallet recharged successfully",
      newBalance,
      amount: recharge.amount,
      receipt,
    });
  } catch (err) {
    console.error("wallet recharge verify:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
