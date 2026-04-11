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