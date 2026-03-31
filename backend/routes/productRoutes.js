import express from "express";
import Product from "../model/Product.js";
import { productUpload } from "../middleware/productUpload.js";
import { createProduct, updateProduct, bulkImportProducts } from "../controllers/product.controller.js";
import { calculateUnitPricing } from "../utils/pricing.js";

const router = express.Router();

const attachPricing = (productDoc) => {
  const product = productDoc?.toObject ? productDoc.toObject() : productDoc;
  if (!product) return product;

  const pricing = calculateUnitPricing({
    sellingPrice: product.sellingPrice,
    discountPercent: product.discountPercent,
    gstPercent: product.gstPercent,
    gstMode: product.gstMode,
  });

  return {
    ...product,
    price: pricing.finalSellingPrice,
    finalSellingPrice: pricing.finalSellingPrice,
    discountedSellingPrice: pricing.discountedSellingPrice,
    gstAmount: pricing.gstAmount,
    gstMode: pricing.gstMode,
    pricing,
  };
};

// ➕ CREATE Product (with optional multiple images via form-data)
router.post(
  "/",
  productUpload.array("productImages", 6),
  createProduct
);

// 📤 BULK IMPORT Products (JSON body: { products: [...] })
router.post("/bulk", bulkImportProducts);

// 📖 READ All Products (populate category & brand). Query: ?category=name|?categoryId=id|?brand=name|?brandId=id
router.get("/", async (req, res) => {
  try {
    const { category, categoryId, brand, brandId, search } = req.query;
    const filter = {};

    if (search && typeof search === "string" && search.trim()) {
      filter.productName = { $regex: search.trim(), $options: "i" };
    }

    if (categoryId) {
      filter.category = categoryId;
    } else if (category && typeof category === "string") {
      const Category = (await import("../model/Category.js")).default;
      const cat = await Category.findOne({ name: { $regex: new RegExp(`^${category.trim()}$`, "i") } });
      if (cat) filter.category = cat._id;
    }

    if (brandId) {
      filter.brand = brandId;
    } else if (brand && typeof brand === "string") {
      const Brand = (await import("../model/Brand.js")).default;
      const b = await Brand.findOne({ name: { $regex: new RegExp(`^${brand.trim()}$`, "i") } });
      if (b) filter.brand = b._id;
    }

    const products = await Product.find(filter)
      .populate("category", "name description image")
      .populate("brand", "name logo");
    res.json(products.map((p) => attachPricing(p)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/** Slugify for URL lookup - must match frontend slugify */
function slugify(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";
}

// 📖 READ Single Product by id OR slug (populate category & brand)
router.get("/:id", async (req, res) => {
  try {
    const param = req.params.id;
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(param);
    let product;

    if (isObjectId) {
      product = await Product.findById(param)
        .populate("category", "name description image")
        .populate("brand", "name logo");
    } else {
      const all = await Product.find()
        .populate("category", "name description image")
        .populate("brand", "name logo");
      product = all.find((p) => slugify(p.productName) === param) || null;
    }

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json(attachPricing(product));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✏️ UPDATE Product (with optional multiple images via form-data)
router.put(
  "/:id",
  productUpload.array("productImages", 6),
  updateProduct
);

// ❌ DELETE Product
router.delete("/:id", async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct)
      return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
