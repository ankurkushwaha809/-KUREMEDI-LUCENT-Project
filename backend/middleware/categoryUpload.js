import multer from "multer";
import fs from "fs";

const uploadDir = "uploads/categories";
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads", { recursive: true });
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, unique + "-" + file.originalname);
  },
});


export const categoryUpload = multer({
  storage,
});

