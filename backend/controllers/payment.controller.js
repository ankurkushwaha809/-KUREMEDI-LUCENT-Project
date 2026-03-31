import crypto from "crypto";
import Cart from "../model/Cart.js";
import Order from "../model/Order.js";
import Product from "../model/Product.js";
import User from "../model/User.js";
import Wallet from "../model/Wallet.js";
import {
  createShiprocketOrder,
  mapOrderToShiprocketPayload,
  generateAWB,
  generateLabel,
  generateManifest,
  schedulePickup,
} from "../config/shiprocket.js";
import { calculateLinePricing } from "../utils/pricing.js";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

/**
 * CREATE PAYMENT ORDER (Checkout - Online / Wallet / Split)
 * POST /api/payment/create-order
 * Body: { shippingAddress?, notes?, walletAmount?: number }
 * walletAmount: amount to deduct from wallet (0 = Razorpay only)
 *
 * Flow:
 * - walletAmount = total → wallet only, order PLACED immediately
 * - walletAmount < total → wallet + Razorpay for remainder
 * - walletAmount = 0 → Razorpay only
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const { shippingAddress, notes, walletAmount: reqWalletAmount = 0 } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let totalAmount = 0;
    let totalGstAmount = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = item.product;
      if (!product || !product.isActive) {
        return res.status(400).json({ message: `Product not available` });
      }
      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.productName}`,
        });
      }

      const pricing = calculateLinePricing(
        {
          sellingPrice: product.sellingPrice,
          discountPercent: product.discountPercent,
          gstPercent: product.gstPercent,
          gstMode: product.gstMode,
        },
        item.quantity,
      );

      totalAmount += pricing.lineSubtotal;
      totalGstAmount += pricing.lineGstAmount;

      orderItems.push({
        product: product._id,
        productName: product.productName,
        quantity: item.quantity,
        price: pricing.finalSellingPrice,
        mrp: product.mrp,
        discountPercent: pricing.discountPercent,
        gstPercent: pricing.gstPercent,
        gstMode: pricing.gstMode,
        gstAmount: pricing.lineGstAmount,
        lineSubtotal: pricing.lineSubtotal,
        lineTotal: pricing.lineTotal,
      });
    }

    const payableAmountRupee = totalAmount + totalGstAmount;
    const payableAmountPaise = Math.round(payableAmountRupee * 100);

    // Validate wallet usage
    let walletAmount = Math.round((reqWalletAmount || 0) * 100) / 100;
    if (walletAmount < 0) walletAmount = 0;
    if (walletAmount > payableAmountRupee) walletAmount = payableAmountRupee;

    let wallet = null;
    if (walletAmount > 0) {
      wallet = await Wallet.findOne({ user: req.user._id });
      if (!wallet) wallet = await Wallet.create({ user: req.user._id, balance: 0 });
      if (wallet.balance < walletAmount) {
        return res.status(400).json({
          message: `Insufficient wallet balance. Available: ₹${wallet.balance?.toFixed(2) ?? 0}`,
        });
      }
    }

    const razorpayAmountRupee = Math.round((payableAmountRupee - walletAmount) * 100) / 100;
    const razorpayAmountPaise = Math.round(razorpayAmountRupee * 100);

    const user = await User.findById(req.user._id);

    const order = await Order.create({
      user: req.user._id,
      createdBy: user?.createdBy || null,
      items: orderItems,
      totalAmount,
      totalGstAmount,
      payableAmount: payableAmountRupee,
      walletAmount,
      razorpayAmount: razorpayAmountRupee,
      status: walletAmount >= payableAmountRupee ? "PLACED" : "PENDING",
      paymentMethod: "ONLINE",
      shippingAddress: shippingAddress || {},
      notes,
    });

    // Wallet-only: deduct wallet, reduce stock, clear cart
    if (walletAmount >= payableAmountRupee) {
      const bal = wallet.balance - walletAmount;
      wallet.balance = Math.max(0, bal);
      wallet.transactions.push({
        amount: -walletAmount,
        type: "DEBIT",
        description: "Order payment",
        order: order._id,
        balanceAfter: wallet.balance,
      });
      await wallet.save();

      for (const item of cart.items) {
        const product = item.product;
        if (product?._id) {
          await Product.findByIdAndUpdate(product._id, {
            $inc: { stockQuantity: -item.quantity },
          });
        }
      }
      cart.items = [];
      await cart.save();

      // Create Shiprocket order on payment success (wallet-only)
      try {
        const orderWithUser = await Order.findById(order._id).populate("user", "name email phone");
        const forShiprocket = mapOrderToShiprocketPayload(orderWithUser);
        const srRes = await createShiprocketOrder(forShiprocket);
        const shipmentId =
          srRes?.shipment_id ?? srRes?.shipments?.[0]?.id ?? srRes?.shipments?.[0]?.shipment_id;
        if (shipmentId) {
          order.shiprocketShipmentId = String(shipmentId);
          await order.save();
        }
      } catch (srErr) {
        console.error("Shiprocket create order (wallet):", srErr.message || srErr);
      }

      return res.status(201).json({
        message: "Order placed successfully (Wallet)",
        orderId: order._id,
        paidByWallet: true,
        walletUsed: walletAmount,
      });
    }

    // Razorpay for remainder (or full if no wallet)
    let razorpayOrderId = null;
    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && razorpayAmountPaise > 0) {
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(RAZORPAY_KEY_ID + ":" + RAZORPAY_KEY_SECRET).toString("base64")}`,
        },
        body: JSON.stringify({
          amount: razorpayAmountPaise,
          currency: "INR",
          receipt: order._id.toString(),
        }),
      });

      const data = await response.json();
      if (data.id) {
        razorpayOrderId = data.id;
        order.razorpayOrderId = razorpayOrderId;
        await order.save();
      }
    }

    res.status(201).json({
      message: "Order created. Complete payment to confirm.",
      orderId: order._id,
      razorpayOrderId,
      amount: razorpayAmountRupee,
      walletUsed: walletAmount,
      currency: "INR",
      keyId: RAZORPAY_KEY_ID || null,
    });
  } catch (err) {
    console.error("createPaymentOrder:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * VERIFY PAYMENT
 * POST /api/payment/verify-payment
 * Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature }
 * On success: deducts wallet (if any), updates order to PLACED, reduces stock, clears cart
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    const order = await Order.findOne({
      razorpayOrderId,
      user: req.user._id,
      status: "PENDING",
    }).populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found or already processed" });
    }

    let verified = false;
    if (RAZORPAY_KEY_SECRET) {
      const body = razorpayOrderId + "|" + razorpayPaymentId;
      const expected = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");
      verified = expected === razorpaySignature;
    } else {
      verified = process.env.NODE_ENV !== "production";
    }

    if (!verified) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    order.status = "PLACED";
    order.razorpayPaymentId = razorpayPaymentId;
    await order.save();

    // Create Shiprocket order on payment success (shipment_id saved; AWB when admin marks DISPATCHED)
    try {
      const orderWithUser = await Order.findById(order._id).populate("user", "name email phone");
      const forShiprocket = mapOrderToShiprocketPayload(orderWithUser);
      const srRes = await createShiprocketOrder(forShiprocket);
      const shipmentId =
        srRes?.shipment_id ?? srRes?.shipments?.[0]?.id ?? srRes?.shipments?.[0]?.shipment_id;
      if (shipmentId) {
        order.shiprocketShipmentId = String(shipmentId);
        await order.save();
      }
    } catch (srErr) {
      console.error("Shiprocket create order (after payment):", srErr.message || srErr);
    }

    // Deduct wallet if split payment (wallet + Razorpay)
    const walletAmount = order.walletAmount ?? 0;
    if (walletAmount > 0) {
      const wallet = await Wallet.findOne({ user: req.user._id });
      if (wallet && wallet.balance >= walletAmount) {
        wallet.balance = Math.max(0, wallet.balance - walletAmount);
        wallet.transactions.push({
          amount: -walletAmount,
          type: "DEBIT",
          description: "Order payment (split)",
          order: order._id,
          balanceAfter: wallet.balance,
        });
        await wallet.save();
      }
    }

    // Reduce stock
    for (const item of order.items) {
      const product = item.product;
      if (product?._id) {
        await Product.findByIdAndUpdate(product._id, {
          $inc: { stockQuantity: -item.quantity },
        });
      }
    }

    // Clear cart
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.json({
      message: "Payment verified. Order confirmed.",
      order,
    });
  } catch (err) {
    console.error("verifyPayment:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * UPDATE ORDER STATUS (Admin)
 * PUT /api/payment/update-status
 * Body: { orderId, status } or { orderId, [field]: value }
 * Used by admin dashboard to update order status
 */
export const updateOrderStatus = async (req, res) => {
  let awbError = null;
  try {
    const { orderId, ...fields } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "orderId is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (fields.status) {
      const allowed = ["PLACED", "CONFIRMED", "DISPATCHED", "DELIVERED", "CANCELLED"];
      if (!allowed.includes(fields.status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      order.status = fields.status;

      // If order has no Shiprocket shipment yet, try to create it now
      if (!order.shiprocketShipmentId) {
        try {
          const orderWithUser = await Order.findById(order._id).populate(
            "user",
            "name email phone",
          );
          const forShiprocket = mapOrderToShiprocketPayload(orderWithUser);
          const srRes = await createShiprocketOrder(forShiprocket);
          const shipmentId =
            srRes?.shipment_id ??
            srRes?.shipments?.[0]?.id ??
            srRes?.shipments?.[0]?.shipment_id;
          if (shipmentId) {
            order.shiprocketShipmentId = String(shipmentId);
          } else {
            // If Shiprocket did not return a shipment id, surface the error to client
            return res.status(400).json({
              message: "Shiprocket did not return shipment_id. Check address and credentials.",
              shiprocketResponse: srRes,
            });
          }
        } catch (srErr) {
          const payload = srErr.shiprocket || srErr.response?.data || {
            message: srErr.message,
            status: srErr.response?.status,
          };
          console.error("Shiprocket create order (admin status change):", payload);
          return res.status(400).json({
            message: "Failed to create Shiprocket shipment",
            shiprocketError: payload,
          });
        }
      }

      // When admin marks as DISPATCHED (ship), assign AWB then label, manifest, pickup
      if (fields.status === "DISPATCHED" && order.shiprocketShipmentId && !order.shiprocketAwb) {
        try {
          let awbRes = await generateAWB(order.shiprocketShipmentId);
          if (Array.isArray(awbRes) && awbRes.length) awbRes = awbRes[0];
          const awbCode =
            awbRes?.awb_code ??
            awbRes?.awb ??
            awbRes?.data?.awb_code ??
            awbRes?.data?.awb ??
            (typeof awbRes === "object" && awbRes !== null ? Object.values(awbRes).find((v) => typeof v === "string" && /^\d{10,14}$/.test(v)) : null);
          if (awbCode) {
            order.shiprocketAwb = String(awbCode);
            order.trackingUrl =
              awbRes?.tracking_url ??
              awbRes?.tracking ??
              awbRes?.tracking_url_short ??
              `https://track.shiprocket.in/?awb=${encodeURIComponent(awbCode)}`;

            // After AWB: generate label, manifest, schedule pickup
            try {
              const labelRes = await generateLabel(order.shiprocketShipmentId);
              if (labelRes?.label_url) order.shiprocketLabelUrl = labelRes.label_url;
            } catch (labelErr) {
              console.error("Shiprocket label (after AWB):", labelErr.message);
            }
            try {
              await generateManifest(order.shiprocketShipmentId);
            } catch (manifestErr) {
              console.error("Shiprocket manifest (after AWB):", manifestErr.message);
            }
            try {
              await schedulePickup(order.shiprocketShipmentId);
            } catch (pickupErr) {
              console.error("Shiprocket pickup (after AWB):", pickupErr.message);
            }
          }
        } catch (awbErr) {
          awbError = awbErr.shiprocket || awbErr.message || String(awbErr);
          console.error("Shiprocket AWB (admin ship):", awbError);
        }
      }
    }

    Object.keys(fields).forEach((key) => {
      if (key !== "status" && key !== "orderId" && order.schema.paths[key]) {
        order[key] = fields[key];
      }
    });

    await order.save();

    const json = { message: "Order status updated", order };
    if (awbError) {
      json.awbError = awbError;
      const msg = typeof awbError === "object" && awbError?.response?.message;
      const code = typeof awbError === "object" && awbError?.status;
      if (msg && /kyc|verification|complete your kyc/i.test(msg)) {
        json.awbMessage = "Complete KYC on Shiprocket to generate AWB. Log in to Shiprocket dashboard → complete KYC, then set this order to DISPATCHED again.";
      } else if (code === 403 || (msg && /unauthorized|don't have permission/i.test(msg))) {
        json.awbMessage = "Shiprocket returned 403: Your account does not have permission to assign AWB. Complete KYC, check your plan at app.shiprocket.in, or contact Shiprocket support to enable 'Assign AWB' for your account.";
      }
    }
    res.json(json);
  } catch (err) {
    console.error("updateOrderStatus:", err);
    res.status(500).json({ message: "Server error" });
  }
};
