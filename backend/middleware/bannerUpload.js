import multer from "multer";
import fs from "fs";

const uploadDir = "uploads/banners";
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads", { recursive: true });
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = (file.originalname || "").split(".").pop() || "jpg";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`);
  },
});

export const bannerUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});
