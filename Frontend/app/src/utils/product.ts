/**
 * Normalizes backend Product schema to app format.
 * Backend: productName, sellingPrice, productImages[], packSize, etc.
 * App: name, price, image, unit + full detail fields
 */

import { API_UPLOAD_BASE } from "@/src/config";

const stripLeadingSlashes = (value: string): string => String(value || "").replace(/^\/+/, "");

export const getImageUrl = (path: string | undefined): string => {
  if (!path) return "";
  const raw = String(path).trim();
  if (!raw) return "";
  if (raw.startsWith("blob:") || raw.startsWith("data:")) return raw;

  const normalized = raw.replace(/\\/g, "/");

  try {
    const url = new URL(raw);
    const pathname = stripLeadingSlashes(url.pathname);
    if (pathname.includes("uploads/")) {
      const uploadPath = pathname.slice(pathname.indexOf("uploads/"));
      return `${API_UPLOAD_BASE}/${uploadPath}`;
    }
    return raw;
  } catch {
    const p = stripLeadingSlashes(normalized);
    return `${API_UPLOAD_BASE}/${p}`;
  }
};

export type AppProduct = {
  _id: string;
  name: string;
  price: number;
  image: string;
  images: string[];
  unit: string;
  description?: string;
  categoryName?: string;
  brandName?: string;
  minOrderQty?: number;
  stockQuantity?: number;
  packing?: string;
  createdAt?: string;
  discountPercent?: number;
};

/** Full product detail for product page - all backend fields */
export type ProductDetail = AppProduct & {
  composition?: string;
  manufacturer?: string;
  mrp?: number;
  discountPercent?: number;
  gstPercent?: number;
  gstMode?: "include" | "exclude";
  finalSellingPrice?: number;
  hsnCode?: string;
  batchNumber?: string;
  expiryDate?: string;
  stockQuantity?: number;
  minStockLevel?: number;
  minOrderQty?: number;
  prescriptionRequired?: boolean;
  brandLogo?: string;
  categoryDesc?: string;
};

export type BackendProduct = {
  _id: string;
  productName?: string;
  name?: string;
  sellingPrice?: number;
  price?: number;
  mrp?: number;
  discountPercent?: number;
  gstPercent?: number;
  gstMode?: "include" | "exclude";
  finalSellingPrice?: number;
  productImages?: string[];
  images?: string[];
  packSize?: string;
  packing?: string;
  composition?: string;
  manufacturer?: string;
  hsnCode?: string;
  batchNumber?: string;
  expiryDate?: string;
  stockQuantity?: number;
  minStockLevel?: number;
  minOrderQty?: number;
  prescriptionRequired?: boolean;
  category?: { _id: string; name?: string; description?: string } | string;
  brand?: { _id: string; name?: string; logo?: string } | string;
  createdAt?: string;
  updatedAt?: string;
};

export function normalizeProduct(p: BackendProduct | null | undefined): AppProduct | null {
  if (!p || !p._id) return null;
  const rawImages = p.productImages || p.images || p.image || [];
  const imgs = Array.isArray(rawImages) ? rawImages : [rawImages].filter(Boolean);
  const firstImg = imgs[0] || null;
  const categoryName = typeof p.category === "object" && p.category?.name ? p.category.name : undefined;
  const brandName = typeof p.brand === "object" && p.brand?.name ? p.brand.name : undefined;

  const images = imgs.map((x) => getImageUrl(x)).filter(Boolean);
  return {
    _id: p._id,
    name: p.productName || p.name || "",
    price: Number(p.finalSellingPrice ?? p.sellingPrice ?? p.price ?? 0),
    image: getImageUrl(firstImg || ""),
    images: images.length > 0 ? images : [getImageUrl(firstImg || "")].filter(Boolean),
    unit: p.packSize || p.packing || "1 unit",
    description: p.composition,
    categoryName,
    brandName,
    minOrderQty: p.minOrderQty != null ? Number(p.minOrderQty) : undefined,
    stockQuantity: p.stockQuantity != null ? Number(p.stockQuantity) : undefined,
    packing: p.packing,
    createdAt: p.createdAt ? String(p.createdAt) : undefined,
    discountPercent: p.discountPercent != null ? Number(p.discountPercent) : undefined,
  };
}

export function normalizeProductDetail(p: BackendProduct | null | undefined): ProductDetail | null {
  const base = normalizeProduct(p);
  if (!base || !p) return null;
  const category = typeof p.category === "object" ? p.category : null;
  const brand = typeof p.brand === "object" ? p.brand : null;
  const expiry = p.expiryDate ? new Date(p.expiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : undefined;
  return {
    ...base,
    composition: p.composition,
    manufacturer: p.manufacturer,
    mrp: p.mrp != null ? Number(p.mrp) : undefined,
    discountPercent: p.discountPercent != null ? Number(p.discountPercent) : undefined,
    gstPercent: p.gstPercent != null ? Number(p.gstPercent) : undefined,
    gstMode: p.gstMode,
    finalSellingPrice: p.finalSellingPrice != null ? Number(p.finalSellingPrice) : undefined,
    hsnCode: p.hsnCode,
    batchNumber: p.batchNumber,
    expiryDate: expiry,
    stockQuantity: p.stockQuantity != null ? Number(p.stockQuantity) : undefined,
    minStockLevel: p.minStockLevel != null ? Number(p.minStockLevel) : undefined,
    minOrderQty: p.minOrderQty != null ? Number(p.minOrderQty) : undefined,
    packing: p.packing,
    prescriptionRequired: p.prescriptionRequired,
    brandLogo: brand?.logo ? getImageUrl(brand.logo) : undefined,
    categoryDesc: category?.description,
  };
}

export function normalizeProducts(products: unknown): AppProduct[] {
  if (!Array.isArray(products)) return [];
  return products
    .map((p) => normalizeProduct(p as BackendProduct))
    .filter((x): x is AppProduct => x != null);
}
