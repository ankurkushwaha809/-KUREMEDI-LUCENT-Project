import express from "express";
import { protect } from "../middleware/protect.js";
import { authorizeRoles } from "../middleware/authorize.js";
import {
  createBanner,
  deleteBanner,
  getActiveBanners,
  getAllBannersAdmin,
  updateBanner,
} from "../controllers/banner.controller.js";
import { bannerUpload } from "../middleware/bannerUpload.js";

const router = express.Router();

// Public: website app fetches active banners.
router.get("/banners", getActiveBanners);

// Admin only: manage all banners from marketing tool.
router.get("/admin/banners", protect, authorizeRoles("admin"), getAllBannersAdmin);
router.post("/banners", protect, authorizeRoles("admin"), bannerUpload.single("image"), createBanner);
router.put("/banners/:id", protect, authorizeRoles("admin"), bannerUpload.single("image"), updateBanner);
router.delete("/banners/:id", protect, authorizeRoles("admin"), deleteBanner);

export default router;
