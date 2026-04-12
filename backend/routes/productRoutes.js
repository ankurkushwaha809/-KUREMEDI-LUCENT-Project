import express from "express";
import Product from "../model/Product.js";
import Order from "../model/Order.js";
import { productUpload } from "../middleware/productUpload.js";
import { createProduct, updateProduct, bulkImportProducts } from "../controllers/product.controller.js";
import { calculateUnitPricing } from "../utils/pricing.js";
import { deleteCloudinaryAssetsByUrls } from "../utils/cloudinaryUpload.js";

const router = express.Router();

const parseBooleanQuery = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const normalized = String(value).toLowerCase().trim();
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  return undefined;
};

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
    const { category, categoryId, brand, brandId, search, published, page, limit, sortBy } = req.query;
    const filter = {};
    const publishedFilter = parseBooleanQuery(published);

    if (publishedFilter !== undefined) {
      filter.isPublished = publishedFilter;
    }

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

    const sortMap = {
      newest: { createdAt: -1 },
      "name-asc": { productName: 1 },
      "name-desc": { productName: -1 },
      "price-low": { sellingPrice: 1 },
      "price-high": { sellingPrice: -1 },
    };
    const sortOption = sortMap[String(sortBy || "newest")] || sortMap.newest;

    const parsedPage = Number.parseInt(page, 10);
    const parsedLimit = Number.parseInt(limit, 10);
    const hasPagination = Number.isFinite(parsedPage) || Number.isFinite(parsedLimit);

    if (!hasPagination) {
      const products = await Product.find(filter)
        .sort(sortOption)
        .populate("category", "name description image")
        .populate("brand", "name logo")
        .lean();

      return res.json(products.map((p) => attachPricing(p)));
    }

    const pageNo = Math.max(Number.isFinite(parsedPage) ? parsedPage : 1, 1);
    const limitNo = Math.min(Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 20, 1), 100);
    const skip = (pageNo - 1) * limitNo;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNo)
        .populate("category", "name description image")
        .populate("brand", "name logo")
        .lean(),
      Product.countDocuments(filter),
    ]);

    return res.json({
      items: products.map((p) => attachPricing(p)),
      total,
      page: pageNo,
      limit: limitNo,
      totalPages: Math.max(Math.ceil(total / limitNo), 1),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 📈 READ Best-selling Products (ranked by ordered quantity)
router.get("/best-sellers", async (req, res) => {
  try {
    const parsedLimit = Number(req.query.limit);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(Math.trunc(parsedLimit), 1), 100)
      : 20;

    const sales = await Order.aggregate([
      {
        $match: {
          status: { $nin: ["PENDING", "CANCELLED"] },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          orderedQty: { $sum: { $ifNull: ["$items.quantity", 0] } },
        },
      },
      { $sort: { orderedQty: -1 } },
      { $limit: limit },
    ]);

    const idsInOrder = sales.map((s) => s._id).filter(Boolean);
    if (!idsInOrder.length) {
      return res.json([]);
    }

    const qtyById = new Map(sales.map((s) => [String(s._id), Number(s.orderedQty) || 0]));
    const rankById = new Map(idsInOrder.map((id, idx) => [String(id), idx]));

    const products = await Product.find({
      _id: { $in: idsInOrder },
      isPublished: true,
    })
      .populate("category", "name description image")
      .populate("brand", "name logo");

    const ranked = products
      .map((product) => {
        const priced = attachPricing(product);
        return {
          ...priced,
          orderedQty: qtyById.get(String(product._id)) || 0,
        };
      })
      .sort((a, b) => (rankById.get(String(a._id)) ?? Number.MAX_SAFE_INTEGER) - (rankById.get(String(b._id)) ?? Number.MAX_SAFE_INTEGER));

    res.json(ranked);
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
    const includeUnpublished = parseBooleanQuery(req.query.includeUnpublished) === true;
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
    if (!includeUnpublished && product.isPublished !== true) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(attachPricing(product));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/publish", async (req, res) => {
  try {
    const { isPublished } = req.body || {};
    if (typeof isPublished !== "boolean") {
      return res.status(400).json({ success: false, message: "isPublished must be a boolean" });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isPublished },
      { new: true }
    )
      .populate("category", "name description image")
      .populate("brand", "name logo");

    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    res.json({
      success: true,
      message: isPublished ? "Product published" : "Product unpublished",
      product: attachPricing(product),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    const product = await Product.findById(req.params.id);

    if (!product)
      return res.status(404).json({ message: "Product not found" });

    const imagesToDelete = Array.isArray(product.productImages)
      ? [...product.productImages]
      : [];

    await product.deleteOne();

    if (imagesToDelete.length > 0) {
      await deleteCloudinaryAssetsByUrls(imagesToDelete).catch(() => {});
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
