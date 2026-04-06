import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import connectDB from "../config/db.js";
import Product from "../model/Product.js";
import Category from "../model/Category.js";
import Brand from "../model/Brand.js";
import Banner from "../model/Banner.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(backendRoot, ".env") });

const mimeByExt = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

const isDataUrl = (value) => typeof value === "string" && value.startsWith("data:");
const isHttpUrl = (value) => typeof value === "string" && /^https?:\/\//i.test(value);

const resolveImagePath = (value) => {
  if (!value || typeof value !== "string") return null;
  const normalized = value.replace(/\\/g, "/").trim();
  if (!normalized || isDataUrl(normalized) || isHttpUrl(normalized)) return null;

  if (path.isAbsolute(value)) return value;
  if (normalized.startsWith("uploads/")) return path.join(backendRoot, normalized);
  return path.join(backendRoot, normalized.replace(/^\.\//, ""));
};

const filePathToDataUrl = async (value) => {
  const absPath = resolveImagePath(value);
  if (!absPath) return null;
  try {
    const buffer = await fs.readFile(absPath);
    const ext = path.extname(absPath).toLowerCase();
    const mime = mimeByExt[ext] || "application/octet-stream";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
};

const migrateSingleField = async (Model, fieldName) => {
  const docs = await Model.find({ [fieldName]: { $type: "string", $ne: "" } }).select(`_id ${fieldName}`);
  let updated = 0;
  for (const doc of docs) {
    const current = doc[fieldName];
    if (!current || isDataUrl(current) || isHttpUrl(current)) continue;
    const dataUrl = await filePathToDataUrl(current);
    if (!dataUrl) continue;
    doc[fieldName] = dataUrl;
    await doc.save();
    updated += 1;
  }
  return updated;
};

const migrateProductImages = async () => {
  const docs = await Product.find({ productImages: { $exists: true, $ne: [] } }).select("_id productImages");
  let updated = 0;

  for (const doc of docs) {
    const list = Array.isArray(doc.productImages) ? doc.productImages : [];
    if (!list.length) continue;

    let changed = false;
    const nextList = [];

    for (const item of list) {
      if (!item || typeof item !== "string") continue;
      if (isDataUrl(item) || isHttpUrl(item)) {
        nextList.push(item);
        continue;
      }

      const dataUrl = await filePathToDataUrl(item);
      if (dataUrl) {
        nextList.push(dataUrl);
        changed = true;
      } else {
        nextList.push(item);
      }
    }

    if (changed) {
      doc.productImages = nextList;
      await doc.save();
      updated += 1;
    }
  }

  return updated;
};

const run = async () => {
  await connectDB();

  const categoryUpdated = await migrateSingleField(Category, "image");
  const brandUpdated = await migrateSingleField(Brand, "logo");
  const bannerUpdated = await migrateSingleField(Banner, "image");
  const productUpdated = await migrateProductImages();

  console.log("Migration complete:");
  console.log(`- Categories updated: ${categoryUpdated}`);
  console.log(`- Brands updated: ${brandUpdated}`);
  console.log(`- Banners updated: ${bannerUpdated}`);
  console.log(`- Products updated: ${productUpdated}`);

  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error("Image migration failed:", error);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
