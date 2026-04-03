import express from "express";
import {
  createBrand,
  getAllBrands,
  updateBrand,
  deleteBrand,
} from "../controllers/brand.controller.js";
import { brandUpload } from "../middleware/brandUpload.js";

const router = express.Router();

// CREATE (form-data or JSON; use brandUpload.single("logo") to parse form-data)
router.post("/", brandUpload.single("logo"), createBrand);

// READ
router.get("/", getAllBrands);

// UPDATE
router.put("/:id", brandUpload.single("logo"), updateBrand);

// DELETE
router.delete("/:id", deleteBrand);

export default router;

