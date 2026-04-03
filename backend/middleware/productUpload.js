import multer from "multer";
import fs from "fs";

const uploadDir = "uploads/products";
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads", { recursive: true });
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = (file.originalname || "").split(".").pop() || "jpg";
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + "." + ext);
  },
});

export const productUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/i;
    const ext = (file.mimetype || "").split("/")[1];
    if (allowed.test(ext || file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (jpeg, jpg, png, webp, gif) allowed"));
    }
  },
});
