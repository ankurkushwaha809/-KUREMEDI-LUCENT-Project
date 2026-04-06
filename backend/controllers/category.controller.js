import Category from "../model/Category.js";
import { uploadImageToCloudinary } from "../utils/cloudinaryUpload.js";

// --------------------
// CREATE CATEGORY
// --------------------
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Category name is required" });
    }

    const exists = await Category.findOne({ name: name.trim() });
    if (exists) {
      return res
        .status(400)
        .json({ success: false, message: "Category already exists" });
    }

    const image = req.file
      ? await uploadImageToCloudinary(req.file, { folder: "lucent/categories" })
      : null;

    const category = await Category.create({
      name: name.trim(),
      description,
      image,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};

// --------------------
// GET ALL CATEGORIES
// --------------------
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

// --------------------
// UPDATE CATEGORY
// --------------------
export const updateCategory = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) return res.status(400).json({ success: false, message: "Category name is required" });
      category.name = trimmed;
    }
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;

    // ✅ new image uploaded
    if (req.file) {
      category.image = await uploadImageToCloudinary(req.file, {
        folder: "lucent/categories",
      });
    }

    await category.save();

    res.json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};

// --------------------
// DELETE CATEGORY
// --------------------
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    await category.deleteOne();

    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};
