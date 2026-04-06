import Brand from "../model/Brand.js";
import { uploadImageToCloudinary } from "../utils/cloudinaryUpload.js";

// CREATE BRAND
export const createBrand = async (req, res) => {
  try {
    const { name, description, isActive } = req.body || {};
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Brand name is required" });
    }

    const existing = await Brand.findOne({ name: String(name).trim() });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Brand already exists" });
    }

    const logo = req.file
      ? await uploadImageToCloudinary(req.file, { folder: "lucent/brands" })
      : undefined;

    const brand = await Brand.create({
      name: String(name).trim(),
      description: description ? String(description).trim() : undefined,
      logo,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: "Brand created successfully",
      brand,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET ALL BRANDS
export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ createdAt: -1 });
    res.json({ success: true, data: brands });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE BRAND
export const updateBrand = async (req, res) => {
  try {
    const { name, description, isActive } = req.body || {};

    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res
        .status(404)
        .json({ success: false, message: "Brand not found" });
    }

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) return res.status(400).json({ success: false, message: "Brand name is required" });
      brand.name = trimmed;
    }
    if (description !== undefined) brand.description = description;
    if (isActive !== undefined) brand.isActive = isActive;
    if (req.file) {
      brand.logo = await uploadImageToCloudinary(req.file, {
        folder: "lucent/brands",
      });
    }

    await brand.save();

    res.json({
      success: true,
      message: "Brand updated successfully",
      brand,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE BRAND
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res
        .status(404)
        .json({ success: false, message: "Brand not found" });
    }

    await brand.deleteOne();

    res.json({ success: true, message: "Brand deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

