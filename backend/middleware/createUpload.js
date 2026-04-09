import multer from "multer";
import fs from "fs";

export const createUploadMiddleware = (uploadDir, fileSize = 5 * 1024 * 1024, fileFilter = null) => {
  if (!fs.existsSync("uploads")) fs.mkdirSync("uploads", { recursive: true });
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = (file.originalname || "").split(".").pop() || "jpg";
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`);
    },
  });

  const config = { storage, limits: { fileSize } };
  if (fileFilter) config.fileFilter = fileFilter;

  return multer(config);
};

export const productUpload = createUploadMiddleware(
  "uploads/products",
  5 * 1024 * 1024,
  (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/i;
    const ext = (file.mimetype || "").split("/")[1];
    if (allowed.test(ext || file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (jpeg, jpg, png, webp, gif) allowed"));
    }
  }
);

export const brandUpload = createUploadMiddleware("uploads/brands", 2 * 1024 * 1024);
export const categoryUpload = createUploadMiddleware("uploads/categories", 5 * 1024 * 1024);
export const bannerUpload = createUploadMiddleware("uploads/banners", 5 * 1024 * 1024);
