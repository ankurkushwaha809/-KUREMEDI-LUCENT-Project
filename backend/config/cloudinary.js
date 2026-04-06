import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

let configured = false;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureEnvLoaded = () => {
  if (process.env.CLOUDINARY_URL) return;
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    return;
  }

  dotenv.config({ path: path.join(__dirname, "..", ".env") });
};

const readEnv = (key) => {
  const value = process.env[key];
  return typeof value === "string" ? value.trim() : "";
};

const readFirst = (...keys) => {
  for (const key of keys) {
    const value = readEnv(key);
    if (value) return value;
  }
  return "";
};

export const ensureCloudinaryConfigured = () => {
  if (configured) return cloudinary;

  ensureEnvLoaded();

  const cloudinaryUrl = readEnv("CLOUDINARY_URL");
  if (cloudinaryUrl) {
    cloudinary.config({
      secure: true,
      url: cloudinaryUrl,
    });
    configured = true;
    return cloudinary;
  }

  const cloudName = readFirst("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_CLOUD", "CLOUD_NAME");
  const apiKey = readFirst("CLOUDINARY_API_KEY", "CLOUD_API_KEY", "API_KEY");
  const apiSecret = readFirst(
    "CLOUDINARY_API_SECRET",
    "CLOUD_API_SECRET",
    "API_SECRET"
  );

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (or CLOUDINARY_URL)"
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  configured = true;
  return cloudinary;
};

export default cloudinary;