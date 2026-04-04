import crypto from "crypto";
import Cart from "../model/Cart.js";
import Order from "../model/Order.js";
import Product from "../model/Product.js";
import User from "../model/User.js";
import Wallet from "../model/Wallet.js";
import Config from "../model/Config.js";
import {
  createShiprocketOrder,
  mapOrderToShiprocketPayload,
  generateAWB,
  generateLabel,
  generateManifest,
  schedulePickup,
} from "../config/shiprocket.js";
import { calculateLinePricing } from "../utils/pricing.js";

const MIN_CHECKOUT_AMOUNT_KEY = "minimumCheckoutAmount";

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
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        message: "Payment gateway not configured",
        code: "PAYMENT_GATEWAY_NOT_CONFIGURED",
      });
    }

    const { shippingAddress, notes, walletAmount: reqWalletAmount = 0 } = req.body;

    if (!shippingAddress || typeof shippingAddress !== "object") {
      return res.status(400).json({
        message: "Shipping address is required",
        code: "SHIPPING_ADDRESS_REQUIRED",
      });
    }

    const normalizedShippingAddress = {
      shopName: String(shippingAddress.shopName || "").trim(),
      address: String(shippingAddress.address || "").trim(),
      phone: String(shippingAddress.phone || "").trim(),
      city: String(shippingAddress.city || "").trim(),
      state: String(shippingAddress.state || "").trim(),
      pincode: String(shippingAddress.pincode || "").trim(),
    };

    if (
      !normalizedShippingAddress.address ||
      !normalizedShippingAddress.city ||
      !normalizedShippingAddress.pincode ||
      !normalizedShippingAddress.phone
    ) {
      return res.status(400).json({
        message: "Address, city, pincode and phone are required",
        code: "INVALID_SHIPPING_ADDRESS",
      });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty", code: "CART_EMPTY" });
    }

    let cartAdjusted = false;
    const adjustments = [];
    const nextCartItems = [];

    for (const item of cart.items) {
      const product = item.product;
      const requestedQty = Math.max(1, Number(item.quantity || 1));

      if (!product || !product.isActive) {
        cartAdjusted = true;
        adjustments.push({
          productId: product?._id ? String(product._id) : null,
          productName: product?.productName || "Unknown product",
          previousQty: requestedQty,
          newQty: 0,
          reason: "product_not_available",
        });
        continue;
      }

      const availableStock = Number(product.stockQuantity ?? 0);

      if (availableStock <= 0) {
        cartAdjusted = true;
        adjustments.push({
          productId: String(product._id),
          productName: product.productName,
          previousQty: requestedQty,
          newQty: 0,
          reason: "out_of_stock",
        });
        continue;
      }

      if (requestedQty > availableStock) {
        cartAdjusted = true;
        adjustments.push({
          productId: String(product._id),
          productName: product.productName,
          previousQty: requestedQty,
          newQty: availableStock,
          reason: "reduced_to_available_stock",
        });
        item.quantity = availableStock;
      }

      nextCartItems.push(item);
    }

    if (cartAdjusted) {
      cart.items = nextCartItems.map((item) => ({
        product: item.product?._id || item.product,
        quantity: item.quantity,
      }));
      await cart.save();
      await cart.populate("items.product");
    }

    if (!cart.items.length) {
      const hasUnavailableProducts = adjustments.some(
        (a) => a?.reason === "product_not_available" || a?.reason === "out_of_stock",
      );
      return res.status(200).json({
        success: false,
        requiresCartReview: true,
        message: hasUnavailableProducts
          ? "Some products are no longer available. Please review your cart."
          : "All items in cart are out of stock",
        code: "CART_EMPTY_AFTER_SYNC",
        adjustments,
      });
    }

    let totalAmount = 0;
    let totalGstAmount = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = item.product;

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

    const payableAmountRupee = Math.round((totalAmount + totalGstAmount) * 100) / 100;

    const minCheckoutDoc = await Config.findOne({ key: MIN_CHECKOUT_AMOUNT_KEY });
    const minCheckoutAmount = Math.round(
      Math.max(0, Number(minCheckoutDoc?.value) || 0) * 100
    ) / 100;

    if (minCheckoutAmount > 0 && payableAmountRupee < minCheckoutAmount) {
      return res.status(400).json({
        message: `Minimum checkout amount is ₹${minCheckoutAmount.toFixed(2)}. Please add more items to continue.`,
        code: "MIN_CHECKOUT_NOT_MET",
        minimumCheckoutAmount: minCheckoutAmount,
        currentCheckoutAmount: payableAmountRupee,
        shortBy: Math.round((minCheckoutAmount - payableAmountRupee) * 100) / 100,
      });
    }

    if (payableAmountRupee <= 0) {
      return res.status(400).json({
        message: "Unable to create order for zero amount",
        code: "INVALID_ORDER_AMOUNT",
      });
    }

    const parsedWalletAmount = Number(reqWalletAmount);
    let walletAmount = Number.isFinite(parsedWalletAmount)
      ? Math.round(parsedWalletAmount * 100) / 100
      : 0;
    if (walletAmount < 0) walletAmount = 0;
    if (walletAmount > payableAmountRupee) walletAmount = payableAmountRupee;

    let wallet = null;
    if (walletAmount > 0) {
      wallet = await Wallet.findOne({ user: req.user._id });
      if (!wallet) wallet = await Wallet.create({ user: req.user._id, balance: 0 });
      if (wallet.balance < walletAmount) {
        walletAmount = Math.round((wallet.balance || 0) * 100) / 100;
      }
    }

    const razorpayAmountRupee = Math.round((payableAmountRupee - walletAmount) * 100) / 100;
    const razorpayAmountPaise = Math.round(razorpayAmountRupee * 100);

    const user = await User.findById(req.user._id);

    // Reuse a very recent pending Razorpay order to avoid duplicate order creation
    // when users tap "Place Order" repeatedly.
    if (razorpayAmountRupee > 0) {
      const recentThreshold = new Date(Date.now() - 15 * 60 * 1000);
      const recentPendingOrder = await Order.findOne({
        user: req.user._id,
        status: "PENDING",
        paymentMethod: "ONLINE",
        createdAt: { $gte: recentThreshold },
        razorpayAmount: razorpayAmountRupee,
        walletAmount,
        razorpayOrderId: { $exists: true, $ne: null },
      }).sort({ createdAt: -1 });

      if (recentPendingOrder) {
        return res.status(200).json({
          message: "Resume pending payment",
          orderId: recentPendingOrder._id,
          razorpayOrderId: recentPendingOrder.razorpayOrderId,
          amount: recentPendingOrder.razorpayAmount,
          walletUsed: recentPendingOrder.walletAmount || 0,
          cartAdjusted,
          adjustments,
          currency: "INR",
          keyId: RAZORPAY_KEY_ID || null,
          reusedPendingOrder: true,
        });
      }
    }

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
      shippingAddress: normalizedShippingAddress,
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
        cartAdjusted,
        adjustments,
      });
    }

    if (razorpayAmountPaise <= 0) {
      return res.status(201).json({
        message: "Order created",
        orderId: order._id,
        amount: 0,
        walletUsed: walletAmount,
        paidByWallet: false,
        cartAdjusted,
        adjustments,
        currency: "INR",
        keyId: RAZORPAY_KEY_ID,
      });
    }

    const gatewayRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: razorpayAmountPaise,
        currency: "INR",
        receipt: order._id.toString(),
      }),
    });

    const gatewayData = await gatewayRes.json();
    if (!gatewayRes.ok || !gatewayData?.id) {
      await Order.findByIdAndDelete(order._id);
      const gatewayMessage = gatewayData?.error?.description || "Failed to create Razorpay order";
      const isRateLimited = /too many requests|rate limit/i.test(gatewayMessage);
      return res.status(isRateLimited ? 429 : 502).json({
        message: gatewayMessage,
        code: isRateLimited ? "RAZORPAY_RATE_LIMIT" : "RAZORPAY_CREATE_ORDER_FAILED",
        retryable: isRateLimited,
      });
    }

    order.razorpayOrderId = gatewayData.id;
    await order.save();

    res.status(201).json({
      message: "Order created. Complete payment to confirm.",
      orderId: order._id,
      razorpayOrderId: gatewayData.id,
      amount: razorpayAmountRupee,
      walletUsed: walletAmount,
      cartAdjusted,
      adjustments,
      currency: "INR",
      keyId: RAZORPAY_KEY_ID || null,
    });
  } catch (err) {
    console.error("createPaymentOrder:", err);
    res.status(500).json({ message: "Server error", code: "CREATE_ORDER_FAILED" });
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
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        message: "Payment gateway not configured",
        code: "PAYMENT_GATEWAY_NOT_CONFIGURED",
      });
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        message: "Missing payment details",
        code: "MISSING_PAYMENT_DETAILS",
      });
    }

    const order = await Order.findOne({
      razorpayOrderId,
      user: req.user._id,
    }).populate("items.product");

    if (!order) {
      return res.status(404).json({
        message: "Order not found or already processed",
        code: "ORDER_NOT_FOUND",
      });
    }

    if (order.status !== "PENDING") {
      if (order.razorpayPaymentId && order.razorpayPaymentId === razorpayPaymentId) {
        return res.status(200).json({
          message: "Payment already verified",
          code: "PAYMENT_ALREADY_VERIFIED",
          order,
        });
      }

      return res.status(409).json({
        message: "Order is already processed with a different payment reference",
        code: "ORDER_ALREADY_PROCESSED",
      });
    }

    const duplicatePayment = await Order.findOne({
      _id: { $ne: order._id },
      razorpayPaymentId,
    }).select("_id");

    if (duplicatePayment) {
      return res.status(409).json({
        message: "Payment reference already used",
        code: "DUPLICATE_PAYMENT_REFERENCE",
      });
    }

    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expected = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");
    const verified = timingSafeSignatureEqual(expected, razorpaySignature);

    if (!verified) {
      return res.status(400).json({
        message: "Payment verification failed",
        code: "PAYMENT_VERIFICATION_FAILED",
      });
    }

    const gatewayPayment = await fetchRazorpayPayment({
      keyId: RAZORPAY_KEY_ID,
      keySecret: RAZORPAY_KEY_SECRET,
      paymentId: razorpayPaymentId,
    });

    if (!gatewayPayment.ok || !gatewayPayment.data?.id) {
      return res.status(502).json({
        message: "Unable to validate payment with Razorpay",
        code: "RAZORPAY_VERIFY_FETCH_FAILED",
      });
    }

    const paymentData = gatewayPayment.data;
    const expectedAmountPaise = Math.round(Number(order.razorpayAmount || 0) * 100);
    const paymentAmountPaise = Number(paymentData.amount || 0);
    const paymentStatus = String(paymentData.status || "").toLowerCase();

    if (paymentData.order_id !== razorpayOrderId) {
      return res.status(400).json({
        message: "Payment order mismatch",
        code: "PAYMENT_ORDER_MISMATCH",
      });
    }

    if (String(paymentData.currency || "") !== "INR") {
      return res.status(400).json({
        message: "Invalid payment currency",
        code: "PAYMENT_CURRENCY_MISMATCH",
      });
    }

    if (paymentAmountPaise !== expectedAmountPaise) {
      return res.status(400).json({
        message: "Payment amount mismatch",
        code: "PAYMENT_AMOUNT_MISMATCH",
      });
    }

    if (!["authorized", "captured"].includes(paymentStatus)) {
      return res.status(400).json({
        message: "Payment is not in a valid state",
        code: "PAYMENT_NOT_AUTHORIZED",
      });
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
      if (wallet) {
        const debitAmount = Math.min(wallet.balance || 0, walletAmount);
        wallet.balance = Math.max(0, wallet.balance - debitAmount);
        wallet.transactions.push({
          amount: -debitAmount,
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
    res.status(500).json({ message: "Server error", code: "VERIFY_PAYMENT_FAILED" });
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

          const readAwbFromKnownKeys = (payload) => {
            const direct = [
              payload?.awb_code,
              payload?.awb,
              payload?.data?.awb_code,
              payload?.data?.awb,
              payload?.response?.awb_code,
              payload?.response?.awb,
              payload?.response?.data?.awb_code,
              payload?.response?.data?.awb,
            ].find((v) => typeof v === "string" || typeof v === "number");
            if (direct != null && String(direct).trim()) return String(direct).trim();

            // Safety: only pick nested values whose key name explicitly includes "awb".
            const scan = (node) => {
              if (!node || typeof node !== "object") return null;
              for (const [key, value] of Object.entries(node)) {
                if (key.toLowerCase().includes("awb") && (typeof value === "string" || typeof value === "number")) {
                  const text = String(value).trim();
                  if (text) return text;
                }
                if (value && typeof value === "object") {
                  const nested = scan(value);
                  if (nested) return nested;
                }
              }
              return null;
            };

            return scan(payload);
          };

          const awbCode = readAwbFromKnownKeys(awbRes);
          if (awbCode) {
            order.shiprocketAwb = String(awbCode);
            order.trackingUrl =
              awbRes?.tracking_url ??
              awbRes?.tracking ??
              awbRes?.tracking_url_short ??
              `https://shiprocket.co/tracking/${encodeURIComponent(awbCode)}`;

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
          } else {
            awbError = {
              message: "Shiprocket did not return a valid AWB code for this shipment.",
              response: awbRes,
            };
            console.error("Shiprocket AWB missing in response:", awbRes);
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
