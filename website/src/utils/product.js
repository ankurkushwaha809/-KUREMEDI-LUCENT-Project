/**
 * Product utils - matches app product utils. Normalizes backend to app format.
 */
import { API_UPLOAD_BASE } from "../config";

export function getImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const p = String(path).replace(/\\/g, "/").replace(/^\//, "");
  return `${API_UPLOAD_BASE}/${p}`;
}

export function normalizeProduct(p) {
  if (!p || !p._id) return null;
  const imgs = p.productImages || p.images || [];
  const firstImg = Array.isArray(imgs) ? imgs[0] : null;
  const categoryName = typeof p.category === "object" && p.category?.name ? p.category.name : undefined;
  const brandName = typeof p.brand === "object" && p.brand?.name ? p.brand.name : undefined;
  const images = Array.isArray(imgs) ? imgs.map((x) => getImageUrl(x)).filter(Boolean) : [];
  return {
    _id: p._id,
    name: p.productName || p.name || "",
    price: Number(p.sellingPrice ?? p.price ?? 0),
    image: getImageUrl(firstImg || ""),
    images: images.length > 0 ? images : [getImageUrl(firstImg || "")].filter(Boolean),
    unit: p.packSize || p.packing || "1 unit",
    description: p.composition,
    categoryName,
    brandName,
    brand: brandName,
    minOrderQty: p.minOrderQty != null ? Number(p.minOrderQty) : undefined,
    stockQuantity: p.stockQuantity != null ? Number(p.stockQuantity) : undefined,
    packing: p.packing,
  };
}

export function normalizeProducts(products) {
  if (!Array.isArray(products)) return [];
  return products.map((p) => normalizeProduct(p)).filter(Boolean);
}

/** Slugify product name for SEO-friendly URL */
export function slugify(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";
}

/** Build SEO URL: /products/{slug}-{id} - slugified name + id for unique dynamic routing */
export function getProductSlug(product) {
  const name = product?.productName || product?.name || "product";
  const s = slugify(name) || "product";
  const id = product?._id;
  return id ? `${s}-${id}` : s;
}

/** Parse product URL param: extracts Mongo ID if present (slug-id format) */
export function parseProductSlugOrId(slugOrId) {
  if (!slugOrId || typeof slugOrId !== "string") return { slug: "", id: null };
  const m = slugOrId.match(/-([a-f0-9]{24})$/i);
  if (m) return { slug: slugOrId.slice(0, -25), id: m[1] };
  return { slug: slugOrId, id: null };
}

/** Build category URL: /categories/{categoryName} */
export function getCategorySlug(category) {
  const name = typeof category === "object" ? category?.name : category;
  return slugify(name || "") || "category";
}

/** Build brand URL: /brands/{brandName} */
export function getBrandSlug(brand) {
  const name = typeof brand === "object" ? brand?.name : brand;
  return slugify(name || "") || "brand";
}
