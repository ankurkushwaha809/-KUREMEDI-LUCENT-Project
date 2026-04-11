import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Product from "../model/Product.js";
import Category from "../model/Category.js";
import Brand from "../model/Brand.js";
import { normalizeGstMode, normalizePercent } from "../utils/pricing.js";
import {
  uploadImageUrlToCloudinary,
  uploadLocalPathToCloudinary,
  deleteCloudinaryAssetsByUrls,
  uploadImagesToCloudinary,
} from "../utils/cloudinaryUpload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const hasLegacyFilePath = (value) => {
  if (!value || typeof value !== "string") return false;
  const raw = value.trim();
  if (!raw || raw.startsWith("data:") || /^https?:\/\//i.test(raw)) return false;
  const normalized = raw.replace(/\\/g, "/").replace(/^\/+/, "");

  const candidates = [
    path.resolve(process.cwd(), normalized),
    path.resolve(process.cwd(), "backend", normalized),
    path.resolve(__dirname, "..", normalized),
  ];

  return candidates.some((abs) => fs.existsSync(abs));
};

const isKeepableImageValue = (value) => {
  if (!value || typeof value !== "string") return false;
  const raw = value.trim();
  if (!raw) return false;
  if (/^https?:\/\//i.test(raw)) return true;
  return hasLegacyFilePath(raw);
};

const parseProductBody = (body) => {
  const obj = { ...body };
  if (obj.mrp !== undefined) obj.mrp = Number(obj.mrp);
  if (obj.sellingPrice !== undefined) obj.sellingPrice = Number(obj.sellingPrice);
  if (obj.discountPercent !== undefined) obj.discountPercent = Number(obj.discountPercent);
  if (obj.gstPercent !== undefined) obj.gstPercent = Number(obj.gstPercent);
  if (obj.gstMode !== undefined) obj.gstMode = normalizeGstMode(obj.gstMode);
  if (obj.stockQuantity !== undefined) obj.stockQuantity = Number(obj.stockQuantity);
  if (obj.minStockLevel !== undefined) obj.minStockLevel = Number(obj.minStockLevel);
  if (obj.minOrderQty !== undefined) obj.minOrderQty = Number(obj.minOrderQty);
  if (obj.expiryDate !== undefined && obj.expiryDate)
    obj.expiryDate = new Date(obj.expiryDate);
  if (obj.isActive !== undefined)
    obj.isActive = obj.isActive === "true" || obj.isActive === true;
  if (obj.isPublished !== undefined)
    obj.isPublished = obj.isPublished === "true" || obj.isPublished === true;
  if (obj.prescriptionRequired !== undefined)
    obj.prescriptionRequired = obj.prescriptionRequired === "true" || obj.prescriptionRequired === true;
  if (obj.category === "" || obj.category === "null") obj.category = null;
  if (obj.brand === "" || obj.brand === "null") obj.brand = null;
  delete obj.productImages; // handled from files
  return obj;
};

const validatePricingFields = ({ mrp, sellingPrice, discountPercent, gstPercent }) => {
  if (sellingPrice == null || isNaN(sellingPrice) || sellingPrice < 0) {
    return "Valid selling price is required";
  }
  if (mrp == null || isNaN(mrp) || mrp < 0) {
    return "Valid MRP is required";
  }
  if (sellingPrice > mrp) {
    return "Selling price cannot be greater than MRP";
  }
  if (discountPercent != null && (isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100)) {
    return "Discount percent must be between 0 and 100";
  }
  if (gstPercent != null && (isNaN(gstPercent) || gstPercent < 0)) {
    return "GST percent cannot be negative";
  }
  return null;
};

const resolveGstMode = ({ rawMode, gstPercent, fallbackMode = "exclude" }) => {
  const hasRawMode = rawMode !== undefined && rawMode !== null && String(rawMode).trim() !== "";
  if (hasRawMode) return normalizeGstMode(rawMode);
  return Number(gstPercent) > 0 ? "include" : normalizeGstMode(fallbackMode);
};

const resolveProductErrorStatus = (error) => {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("cloudinary")) return 500;
  if (message.includes("econn") || message.includes("timeout")) return 502;
  return 400;
};

export const createProduct = async (req, res) => {
  try {
    const data = parseProductBody(req.body);
    const name = (data.productName || "").toString().trim();
    if (!name) {
      return res.status(400).json({ success: false, message: "Product name is required" });
    }
    const sellingPrice = Number(data.sellingPrice);
    const mrp = Number(data.mrp);
    const discountPercent = Number(data.discountPercent ?? 0);
    const gstPercent = Number(data.gstPercent ?? 0);
    const pricingError = validatePricingFields({ mrp, sellingPrice, discountPercent, gstPercent });
    if (pricingError) {
      return res.status(400).json({ success: false, message: pricingError });
    }
    data.discountPercent = normalizePercent(discountPercent, 100);
    data.gstMode = resolveGstMode({ rawMode: req.body?.gstMode, gstPercent, fallbackMode: data.gstMode });
    data.gstPercent = data.gstMode === "include" ? normalizePercent(gstPercent) : 0;
    // New products are unpublished by default. Publishing is handled from a separate admin screen.
    data.isPublished = false;
    if (!data.category || !mongoose.Types.ObjectId.isValid(data.category)) {
      return res.status(400).json({ success: false, message: "Category is required" });
    }
    if (!data.brand || !mongoose.Types.ObjectId.isValid(data.brand)) {
      return res.status(400).json({ success: false, message: "Brand is required" });
    }
    if (req.files?.length) {
      try {
        data.productImages = await uploadImagesToCloudinary(req.files, {
          folder: "lucent/products",
        });
        if (!data.productImages || data.productImages.length === 0) {
          return res.status(500).json({ success: false, message: "Failed to upload images to cloud storage" });
        }
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        return res.status(500).json({ success: false, message: "Image upload failed: " + uploadError.message });
      }
    } else if (Array.isArray(req.body.productImages)) {
      data.productImages = req.body.productImages.filter(isKeepableImageValue);
    } else {
      data.productImages = [];
    }
    const product = await Product.create(data);
    await product.populate(["category", "brand"]);
    res.status(201).json(product);
  } catch (error) {
    console.error("Product creation error:", error);
    res.status(resolveProductErrorStatus(error)).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const previousImages = Array.isArray(product.productImages) ? [...product.productImages] : [];

    const data = parseProductBody(req.body || {});
    const name = (data.productName ?? product.productName ?? "").toString().trim();
    if (!name) {
      return res.status(400).json({ success: false, message: "Product name is required" });
    }
    const sellingPrice = Number(data.sellingPrice ?? product.sellingPrice);
    const mrp = Number(data.mrp ?? product.mrp);
    const discountPercent = Number(data.discountPercent ?? product.discountPercent ?? 0);
    const gstPercent = Number(data.gstPercent ?? product.gstPercent ?? 0);
    const pricingError = validatePricingFields({ mrp, sellingPrice, discountPercent, gstPercent });
    if (pricingError) {
      return res.status(400).json({ success: false, message: pricingError });
    }
    data.discountPercent = normalizePercent(discountPercent, 100);
    data.gstMode = resolveGstMode({
      rawMode: req.body?.gstMode,
      gstPercent,
      fallbackMode: data.gstMode ?? product.gstMode,
    });
    data.gstPercent = data.gstMode === "include" ? normalizePercent(gstPercent) : 0;
    const catId = data.category ?? product.category;
    const brandId = data.brand ?? product.brand;
    if (!catId || !mongoose.Types.ObjectId.isValid(catId)) {
      return res.status(400).json({ success: false, message: "Category is required" });
    }
    if (!brandId || !mongoose.Types.ObjectId.isValid(brandId)) {
      return res.status(400).json({ success: false, message: "Brand is required" });
    }

    // Handle images: base = existingProductImages (if sent) or current, then add new files
    let baseImages = product.productImages || [];
    if (req.body?.existingProductImages) {
      try {
        const parsed = typeof req.body.existingProductImages === "string"
          ? JSON.parse(req.body.existingProductImages)
          : req.body.existingProductImages;
        baseImages = Array.isArray(parsed) ? parsed : baseImages;
      } catch {
        baseImages = product.productImages || [];
      }
    }
    baseImages = baseImages.filter(isKeepableImageValue);

    if (req.files?.length) {
      try {
        const newPaths = await uploadImagesToCloudinary(req.files, {
          folder: "lucent/products",
        });
        if (!newPaths || newPaths.length === 0) {
          return res.status(500).json({ success: false, message: "Failed to upload images to cloud storage" });
        }
        data.productImages = [...newPaths, ...baseImages].slice(0, 6);
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        return res.status(500).json({ success: false, message: "Image upload failed: " + uploadError.message });
      }
    } else if (req.body?.existingProductImages !== undefined) {
      data.productImages = baseImages.slice(0, 6);
    }

    Object.assign(product, data);
    await product.save();
    if (data.productImages !== undefined) {
      const currentImages = Array.isArray(product.productImages) ? product.productImages : [];
      const removedImages = previousImages.filter((img) => !currentImages.includes(img));
      if (removedImages.length > 0) {
        await deleteCloudinaryAssetsByUrls(removedImages).catch(() => {});
      }
    }
    await product.populate(["category", "brand"]);
    res.json(product);
  } catch (error) {
    console.error("Product update error:", error);
    res.status(resolveProductErrorStatus(error)).json({ success: false, message: error.message });
  }
};

// --------------------
// BULK IMPORT
// --------------------
const COL_MAP = {
  "product name": "productName",
  "productname": "productName",
  "name": "productName",
  "mrp": "mrp",
  "selling price": "sellingPrice",
  "sellingprice": "sellingPrice",
  "price": "sellingPrice",
  "composition": "composition",
  "ingredients": "ingredients",
  "key uses": "keyUses",
  "keyuses": "keyUses",
  "safety information": "safetyInformation",
  "safetyinformation": "safetyInformation",
  "manufacturer": "manufacturer",
  "pack size": "packSize",
  "packsize": "packSize",
  "packing": "packing",
  "packing size": "packing",
  "packingsize": "packing",
  "package": "packing",
  "packaging": "packing",
  "category": "categoryName",
  "category name": "categoryName",
  "brand": "brandName",
  "brand name": "brandName",
  "discount": "discountPercent",
  "discount %": "discountPercent",
  "discountpercent": "discountPercent",
  "gst": "gstPercent",
  "gst %": "gstPercent",
  "gstpercent": "gstPercent",
  "gst mode": "gstMode",
  "gstmode": "gstMode",
  "hsn code": "hsnCode",
  "hsncode": "hsnCode",
  "batch number": "batchNumber",
  "batchnumber": "batchNumber",
  "expiry date": "expiryDate",
  "expirydate": "expiryDate",
  "stock": "stockQuantity",
  "stock qty": "stockQuantity",
  "stockquantity": "stockQuantity",
  "min stock": "minStockLevel",
  "minstocklevel": "minStockLevel",
  "min order": "minOrderQty",
  "minorderqty": "minOrderQty",
  "active": "isActive",
  "isactive": "isActive",
  "published": "isPublished",
  "ispublished": "isPublished",
  "product published": "isPublished",
  "productpublished": "isPublished",
  "image": "imageRefs",
  "images": "imageRefs",
  "image urls/paths": "imageRefs",
  "image urls / paths": "imageRefs",
  "image url": "imageRefs",
  "image urls": "imageRefs",
  "image path": "imageRefs",
  "image paths": "imageRefs",
  "product image": "imageRefs",
  "product images": "imageRefs",
  "photo": "imageRefs",
  "photo url": "imageRefs",
  "photo urls": "imageRefs",
  "photo path": "imageRefs",
  "photo paths": "imageRefs",
  "prescription required": "prescriptionRequired",
  "prescriptionrequired": "prescriptionRequired",
  "description text color": "descriptionTextColor",
  "descriptiontextcolor": "descriptionTextColor",
  "description bg color": "descriptionBgColor",
  "descriptionbgcolor": "descriptionBgColor",
  "ingredients text color": "ingredientsTextColor",
  "ingredientstextcolor": "ingredientsTextColor",
  "ingredients bg color": "ingredientsBgColor",
  "ingredientsbgcolor": "ingredientsBgColor",
  "key uses text color": "keyUsesTextColor",
  "keyusestextcolor": "keyUsesTextColor",
  "key uses bg color": "keyUsesBgColor",
  "keyusesbgcolor": "keyUsesBgColor",
  "safety text color": "safetyTextColor",
  "safetytextcolor": "safetyTextColor",
  "safety bg color": "safetyBgColor",
  "safetybgcolor": "safetyBgColor",
};

const toNum = (v) => {
  if (v === "" || v == null) return undefined;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? undefined : n;
};

const toBool = (v) => {
  if (v === "" || v == null) return undefined;
  const s = String(v).toLowerCase().trim();
  if (["true", "1", "yes", "y"].includes(s)) return true;
  if (["false", "0", "no", "n"].includes(s)) return false;
  return undefined;
};

const normalizeLookupKey = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const normalizeColumnHeader = (value) =>
  String(value || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const splitImageRefs = (value) => {
  if (value === undefined || value === null) return [];
  return String(value)
    .split(/[\n,|;]/g)
    .map((x) => x.trim())
    .filter(Boolean);
};

const isHttpImageUrl = (value) => /^https?:\/\//i.test(String(value || "").trim());

const resolveLegacyFilePath = (value) => {
  const raw = String(value || "").trim();
  if (!raw || isHttpImageUrl(raw) || raw.startsWith("data:")) return null;

  const normalized = raw.replace(/\\/g, "/").replace(/^\/+/, "");
  const candidates = [
    path.resolve(process.cwd(), normalized),
    path.resolve(process.cwd(), "backend", normalized),
    path.resolve(__dirname, "..", normalized),
    path.isAbsolute(raw) ? raw : null,
  ].filter(Boolean);

  return candidates.find((abs) => fs.existsSync(abs)) || null;
};

const uploadImageRefsToCloudinary = async (value, rowNumber) => {
  const refs = splitImageRefs(value).slice(0, 6);
  if (refs.length === 0) return [];

  const uploaded = [];

  for (const ref of refs) {
    if (isHttpImageUrl(ref)) {
      const url = await uploadImageUrlToCloudinary(ref, { folder: "lucent/products" });
      if (url) uploaded.push(url);
      continue;
    }

    const localPath = resolveLegacyFilePath(ref);
    if (!localPath) {
      throw new Error(
        `Image reference not accessible for row ${rowNumber}. Use a public image URL or a server-accessible file path.`
      );
    }

    const url = await uploadLocalPathToCloudinary(localPath, { folder: "lucent/products" });
    if (url) uploaded.push(url);
  }

  return uploaded;
};

const parseDateFromBulk = (value) => {
  if (value === undefined || value === null || value === "") return undefined;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    // Excel serial date (days since 1899-12-30)
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const millis = Math.round(value * 24 * 60 * 60 * 1000);
    const parsed = new Date(excelEpoch.getTime() + millis);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const raw = String(value).trim();
  if (!raw) return undefined;

  // Accept YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const parsed = new Date(`${raw}T00:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  // Accept DD-MM-YYYY or DD/MM/YYYY
  const match = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    const parsed = new Date(`${iso}T00:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

export const bulkImportProducts = async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No products to import. Send { products: [...] }",
      });
    }

    const categories = await Category.find({}, { _id: 1, name: 1 });
    const brands = await Brand.find({}, { _id: 1, name: 1 });
    const catByName = Object.fromEntries(categories.map((c) => [normalizeLookupKey(c.name), c._id]));
    const brandByName = Object.fromEntries(brands.map((b) => [normalizeLookupKey(b.name), b._id]));
    const validCategoryIds = new Set(categories.map((c) => String(c._id)));
    const validBrandIds = new Set(brands.map((b) => String(b._id)));

    const created = [];
    const errors = [];

    for (let i = 0; i < products.length; i++) {
      const row = products[i];
      try {
        const obj = {};
        for (const [key, val] of Object.entries(row)) {
          const normalizedKey = normalizeColumnHeader(key);
          const keyNoSpace = normalizedKey.replace(/\s+/g, "");
          const k = COL_MAP[normalizedKey] || COL_MAP[keyNoSpace] || key;
          obj[k] = val;
        }

        const productName = (obj.productName || obj.name || "").toString().trim();
        if (!productName) {
          errors.push({ row: i + 1, message: "Product name is required" });
          continue;
        }

        const mrp = toNum(obj.mrp);
        const sellingPrice = toNum(obj.sellingPrice) ?? toNum(obj.price);
        if (mrp == null || mrp < 0) {
          errors.push({ row: i + 1, message: "Valid MRP is required" });
          continue;
        }
        if (sellingPrice == null || sellingPrice < 0) {
          errors.push({ row: i + 1, message: "Valid Selling Price is required" });
          continue;
        }
        if (sellingPrice > mrp) {
          errors.push({ row: i + 1, message: "Selling Price cannot be greater than MRP" });
          continue;
        }

        const discountPercent = normalizePercent(toNum(obj.discountPercent) ?? 0, 100);
        const gstMode = resolveGstMode({ rawMode: obj.gstMode, gstPercent: toNum(obj.gstPercent) ?? 0 });
        const gstPercent = normalizePercent(toNum(obj.gstPercent) ?? 0);

        let categoryId = obj.category || obj.categoryId;
        if (!categoryId && obj.categoryName) {
          categoryId = catByName[normalizeLookupKey(obj.categoryName)] || null;
        }
        if (!categoryId && obj.category) {
          categoryId = catByName[normalizeLookupKey(obj.category)] || null;
        }
        if (typeof categoryId === "string" && mongoose.Types.ObjectId.isValid(categoryId)) {
          categoryId = validCategoryIds.has(categoryId) ? categoryId : null;
        }
        if (!categoryId) {
          errors.push({
            row: i + 1,
            message: "Invalid Category. Use an existing category name from master list.",
          });
          continue;
        }

        let brandId = obj.brand || obj.brandId;
        if (!brandId && obj.brandName) {
          brandId = brandByName[normalizeLookupKey(obj.brandName)] || null;
        }
        if (!brandId && obj.brand) {
          brandId = brandByName[normalizeLookupKey(obj.brand)] || null;
        }
        if (typeof brandId === "string" && mongoose.Types.ObjectId.isValid(brandId)) {
          brandId = validBrandIds.has(brandId) ? brandId : null;
        }
        if (!brandId) {
          errors.push({
            row: i + 1,
            message: "Invalid Brand. Use an existing brand name from master list.",
          });
          continue;
        }

        const parsedExpiryDate = parseDateFromBulk(obj.expiryDate);
        if (obj.expiryDate && !parsedExpiryDate) {
          errors.push({
            row: i + 1,
            message: "Invalid Expiry Date. Use YYYY-MM-DD or DD-MM-YYYY format",
          });
          continue;
        }

        const finalProductImages = await uploadImageRefsToCloudinary(obj.imageRefs, i + 1);

        const product = await Product.create({
          productName,
          mrp,
          sellingPrice,
          composition: (obj.composition || "").toString().trim() || undefined,
          ingredients: (obj.ingredients || "").toString().trim() || undefined,
          keyUses: (obj.keyUses || "").toString().trim() || undefined,
          safetyInformation: (obj.safetyInformation || "").toString().trim() || undefined,
          descriptionTextColor: (obj.descriptionTextColor || "").toString().trim() || undefined,
          descriptionBgColor: (obj.descriptionBgColor || "").toString().trim() || undefined,
          ingredientsTextColor: (obj.ingredientsTextColor || "").toString().trim() || undefined,
          ingredientsBgColor: (obj.ingredientsBgColor || "").toString().trim() || undefined,
          keyUsesTextColor: (obj.keyUsesTextColor || "").toString().trim() || undefined,
          keyUsesBgColor: (obj.keyUsesBgColor || "").toString().trim() || undefined,
          safetyTextColor: (obj.safetyTextColor || "").toString().trim() || undefined,
          safetyBgColor: (obj.safetyBgColor || "").toString().trim() || undefined,
          manufacturer: (obj.manufacturer || "").toString().trim() || undefined,
          packSize: (obj.packing || obj.packSize || "").toString().trim() || undefined,
          packing: (obj.packing || obj.packSize || "").toString().trim() || undefined,
          category: categoryId || undefined,
          brand: brandId || undefined,
          discountPercent,
          gstPercent,
          gstMode,
          hsnCode: (obj.hsnCode || "").toString().trim() || undefined,
          batchNumber: (obj.batchNumber || "").toString().trim() || undefined,
          expiryDate: parsedExpiryDate,
          stockQuantity: toNum(obj.stockQuantity) ?? 0,
          minStockLevel: toNum(obj.minStockLevel) ?? 0,
          minOrderQty: toNum(obj.minOrderQty) ?? 1,
          isActive: toBool(obj.isActive) ?? true,
          isPublished: false,
          prescriptionRequired: toBool(obj.prescriptionRequired) ?? false,
          productImages: finalProductImages,
        });

        created.push(product);
      } catch (err) {
        errors.push({ row: i + 1, message: err.message || "Failed to create product" });
      }
    }

    res.json({
      success: true,
      created: created.length,
      failed: errors.length,
      total: products.length,
      validCategories: categories.map((c) => c.name),
      validBrands: brands.map((b) => b.name),
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Bulk import failed",
    });
  }
};
