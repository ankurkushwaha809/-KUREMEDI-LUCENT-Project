import express from "express";
import {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

// import { protect } from "../middlewares/protect.js";
// import { authorizeRoles } from "../middleware/authorize.js";
import { categoryUpload } from "../middleware/categoryUpload.js";

const router = express.Router();

// CREATE
router.post(
  "/",
  
  
  categoryUpload.single("image"),
  createCategory,
);

// READ
router.get("/",  getAllCategories);

// UPDATE
router.put(
  "/:id",
  
  
  categoryUpload.single("image"),
  updateCategory,
);

// DELETE
router.delete("/:id",  deleteCategory);

export default router;
