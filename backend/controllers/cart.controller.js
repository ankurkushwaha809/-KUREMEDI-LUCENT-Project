import Cart from "../model/Cart.js";
import Product from "../model/Product.js";

/**
 * ADD TO CART
 * POST /api/cart/add
 * Body: { productId: string, quantity?: number }
 */
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body || {};

    if (!productId)
      return res.status(400).json({ success: false, message: "productId is required" });

    const qty = quantity || 1;

    const product = await Product.findById(productId);
    if (!product || !product.isActive)
      return res.status(404).json({ success: false, message: "Product not found" });

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [{ product: productId, quantity: qty }],
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (i) => i.product.toString() === productId,
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += qty;
      } else {
        cart.items.push({ product: productId, quantity: qty });
      }

      await cart.save();
    }

    const cartPopulated = await Cart.findById(cart._id).populate("items.product");
    res.json({ success: true, message: "Added to cart", cart: cartPopulated || cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET MY CART
 * GET /api/cart
 */
export const getMyCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "productName name mrp sellingPrice stockQuantity minOrderQty productImages isActive"
    );

    if (!cart) return res.json({ success: true, items: [] });

    res.json({ success: true, ...cart.toObject() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * UPDATE QUANTITY
 * PUT /api/cart/update
 */
export const updateCartQty = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity)
      return res.status(400).json({ message: "productId & quantity required" });

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find((i) => i.product.toString() === productId);

    if (!item)
      return res.status(404).json({ message: "Item not found in cart" });

    item.quantity = quantity;

    await cart.save();

    res.json({ message: "Quantity updated", cart });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * REMOVE ITEM
 * DELETE /api/cart/remove/:productId
 */
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId)
      return res.status(400).json({ success: false, message: "productId is required" });

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = cart.items.filter((i) => i.product.toString() !== productId);

    await cart.save();

    const cartPopulated = await Cart.findById(cart._id).populate("items.product");
    res.json({ success: true, message: "Removed from cart", cart: cartPopulated || cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * CLEAR CART
 * DELETE /api/cart/clear
 */
export const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    res.json({ success: true, message: "Cart cleared" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
