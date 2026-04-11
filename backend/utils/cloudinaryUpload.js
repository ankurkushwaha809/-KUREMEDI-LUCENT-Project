import fs from "fs/promises";
import { ensureCloudinaryConfigured } from "../config/cloudinary.js";

const cleanupLocalFile = async (filePath) => {
  if (!filePath) return;
  await fs.unlink(filePath).catch(() => {});
};

export const uploadImageToCloudinary = async (file, options = {}) => {
  if (!file?.path) return null;

  const cloudinary = ensureCloudinaryConfigured();

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "image",
      folder: options.folder || "lucent/uploads",
    });
    return result?.secure_url || null;
  } finally {
    await cleanupLocalFile(file.path);
  }
};

export const uploadImagesToCloudinary = async (files = [], options = {}) => {
  const list = Array.isArray(files) ? files : [];
  const values = await Promise.all(
    list.map((item) => uploadImageToCloudinary(item, options))
  );
  return values.filter(Boolean);
};

export const uploadImageUrlToCloudinary = async (url, options = {}) => {
  const raw = String(url || "").trim();
  if (!raw) return null;

  const cloudinary = ensureCloudinaryConfigured();
  const result = await cloudinary.uploader.upload(raw, {
    resource_type: "image",
    folder: options.folder || "lucent/uploads",
  });

  return result?.secure_url || null;
};

export const uploadLocalPathToCloudinary = async (filePath, options = {}) => {
  const raw = String(filePath || "").trim();
  if (!raw) return null;

  const cloudinary = ensureCloudinaryConfigured();
  const result = await cloudinary.uploader.upload(raw, {
    resource_type: "image",
    folder: options.folder || "lucent/uploads",
  });

  return result?.secure_url || null;
};

export const uploadImageUrlsToCloudinary = async (urls = [], options = {}) => {
  const list = Array.isArray(urls) ? urls : [];
  const values = await Promise.all(
    list.map((item) => uploadImageUrlToCloudinary(item, options).catch(() => null))
  );
  return values.filter(Boolean);
};

const parseCloudinaryAssetFromUrl = (value) => {
  if (!value || typeof value !== "string") return null;

  let url;
  try {
    url = new URL(String(value).trim());
  } catch {
    return null;
  }

  if (!url.hostname.includes("cloudinary.com")) return null;

  const pathname = String(url.pathname || "");
  const uploadMarker = "/upload/";
  const uploadIndex = pathname.indexOf(uploadMarker);
  if (uploadIndex < 0) return null;

  const beforeUpload = pathname.slice(0, uploadIndex);
  const afterUpload = pathname.slice(uploadIndex + uploadMarker.length);
  const resourceType = beforeUpload.includes("/video/")
    ? "video"
    : beforeUpload.includes("/raw/")
      ? "raw"
      : "image";

  const parts = afterUpload.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  const versionIndex = parts.findIndex((part) => /^v\d+$/.test(part));
  const publicIdParts = versionIndex >= 0 ? parts.slice(versionIndex + 1) : parts;
  if (publicIdParts.length === 0) return null;

  const publicIdWithExt = publicIdParts.join("/");
  const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "");
  if (!publicId) return null;

  return { resourceType, publicId };
};

export const deleteCloudinaryAssetByUrl = async (value) => {
  const parsed = parseCloudinaryAssetFromUrl(value);
  if (!parsed) return { skipped: true, reason: "not_cloudinary_url" };

  const cloudinary = ensureCloudinaryConfigured();
  const result = await cloudinary.uploader.destroy(parsed.publicId, {
    resource_type: parsed.resourceType,
    invalidate: true,
  });
  return { skipped: false, ...parsed, result };
};

export const deleteCloudinaryAssetsByUrls = async (values = []) => {
  const list = Array.isArray(values) ? values : [];
  const settled = await Promise.allSettled(list.map((value) => deleteCloudinaryAssetByUrl(value)));
  return settled;
};