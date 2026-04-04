import Cart from "../model/Cart.js";
import Order from "../model/Order.js";
import Product from "../model/Product.js";
import User from "../model/User.js";
import { trackShipment } from "../config/shiprocket.js";
import { calculateLinePricing } from "../utils/pricing.js";

/**
 * PLACE ORDER
 * POST /api/orders
 */
export const placeOrder = async (req, res) => {
  try {
    const { shippingAddress, notes } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
    );

    if (!cart || cart.items.length === 0)
      return res.status(400).json({ message: "Cart is empty" });

    let totalAmount = 0;
    let totalGstAmount = 0;

    const orderItems = [];

    for (const item of cart.items) {
      const product = item.product;

      if (!product || !product.isActive)
        return res.status(400).json({
          message: `Product not available`,
        });

      if (product.stockQuantity < item.quantity)
        return res.status(400).json({
          message: `Insufficient stock for ${product.productName}`,
        });

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

    const payableAmount = Math.round((totalAmount + totalGstAmount) * 100) / 100;

    // retailer who is ordering
    const user = await User.findById(req.user._id);

    const order = await Order.create({
      user: req.user._id,
      createdBy: user.createdBy || null,
      items: orderItems,
      totalAmount,
      totalGstAmount,
      payableAmount,
      shippingAddress,
      notes,
    });

    // reduce stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stockQuantity: -item.quantity },
      });
    }

    // clear cart
    cart.items = [];
    await cart.save();

    res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * MY ORDERS (Retailer)
 * GET /api/orders/my
 */
export const getMyOrders = async (req, res) => {
  try {
    const toTrackingUrl = (awb, trackingUrl) => {
      if (!awb) return null;
      const safe = `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`;
      if (!trackingUrl) return safe;
      if (trackingUrl.includes("track.shiprocket.in")) return safe;
      if (trackingUrl.includes("shiprocket.in/shipment-tracking")) return safe;
      return trackingUrl;
    };

    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    const sanitized = orders.map((o) => {
      const awb = o.shiprocketAwb || null;
      const trackingUrl = toTrackingUrl(awb, o.trackingUrl);

      return {
        ...o,
        shiprocketAwb: awb,
        trackingUrl,
      };
    });
    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ALL ORDERS (Admin)
 * GET /api/orders/all
 */
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name phone role")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET ORDER TRACKING (My order – live status + Shiprocket scan history)
 * GET /api/orders/:orderId/tracking
 */
export const getOrderTracking = async (req, res) => {
  try {
    const toTrackingUrl = (awb, trackingUrl) => {
      if (!awb) return null;
      const safe = `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`;
      if (!trackingUrl) return safe;
      if (trackingUrl.includes("track.shiprocket.in")) return safe;
      if (trackingUrl.includes("shiprocket.in/shipment-tracking")) return safe;
      return trackingUrl;
    };

    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your order" });
    }

    let tracking = null;
    if (order.shiprocketAwb) {
      try {
        tracking = await trackShipment(order.shiprocketAwb);
      } catch (err) {
        console.error("Shiprocket track:", err.message);
      }
    }

    res.json({
      order: {
        _id: order._id,
        status: order.status,
        trackingUrl: toTrackingUrl(order.shiprocketAwb, order.trackingUrl),
        trackingNumber: order.shiprocketAwb || null,
        createdAt: order.createdAt,
        items: order.items,
        shippingAddress: order.shippingAddress,
        payableAmount: order.payableAmount,
      },
      tracking,
    });
  } catch (err) {
    console.error("getOrderTracking:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * UPDATE ORDER STATUS (Admin)
 * PUT /api/orders/:orderId/status
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    await order.save();

    res.json({
      message: "Order status updated",
      order,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
