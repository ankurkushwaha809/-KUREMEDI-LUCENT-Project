import Banner from "../model/Banner.js";
import { uploadImageToCloudinary } from "../utils/cloudinaryUpload.js";

const parseBool = (value, defaultValue) => {
  if (value === undefined || value === null || value === "") return defaultValue;
  if (typeof value === "boolean") return value;
  const str = String(value).toLowerCase().trim();
  return str === "true" || str === "1" || str === "yes";
};

const sanitizeRedirectUrl = (value) => {
  if (value === undefined || value === null) return undefined;
  const clean = String(value).trim();
  if (!clean) return "";
  // Allow internal app routes and full URLs.
  if (clean.startsWith("/") || /^https?:\/\//i.test(clean)) {
    return clean;
  }
  return `/${clean.replace(/^\/+/, "")}`;
};

const sanitizeCtaText = (value, fallback = "Shop now") => {
  if (value === undefined || value === null) return fallback;
  const clean = String(value).trim();
  return clean ? clean.slice(0, 40) : fallback;
};

const sanitizeShortText = (value, max, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  const clean = String(value).trim();
  return clean ? clean.slice(0, max) : fallback;
};

const sanitizeColor = (value, fallback) => {
  if (value === undefined || value === null) return fallback;
  const clean = String(value).trim();
  if (/^#[0-9a-fA-F]{6}$/.test(clean) || /^#[0-9a-fA-F]{3}$/.test(clean)) {
    return clean;
  }
  return fallback;
};

const resolveBannerErrorStatus = (error) => {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("cloudinary")) return 502;
  if (message.includes("timeout") || message.includes("econn")) return 504;
  return 500;
};

export const getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllBannersAdmin = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createBanner = async (req, res) => {
  try {
    const { name, isActive, redirectUrl, ctaText, title, subtitle, textColor, subtitleColor, buttonColor } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: "Banner name is required" });
    }
    if (!req.file?.path) {
      return res.status(400).json({ success: false, message: "Banner image is required" });
    }

    const image = await uploadImageToCloudinary(req.file, {
      folder: "lucent/banners",
    });

    const banner = await Banner.create({
      name: String(name).trim(),
      image,
      isActive: parseBool(isActive, true),
      redirectUrl: sanitizeRedirectUrl(redirectUrl) ?? "",
      ctaText: sanitizeCtaText(ctaText),
      title: sanitizeShortText(title, 80),
      subtitle: sanitizeShortText(subtitle, 140),
      textColor: sanitizeColor(textColor, "#ffffff"),
      subtitleColor: sanitizeColor(subtitleColor, "#e2e8f0"),
      buttonColor: sanitizeColor(buttonColor, "#0f172a"),
    });

    res.status(201).json({ success: true, message: "Banner created", banner });
  } catch (error) {
    console.error("Banner create error:", error);
    res.status(resolveBannerErrorStatus(error)).json({
      success: false,
      message: error?.message || "Failed to create banner",
    });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    const { name, isActive, redirectUrl, ctaText, title, subtitle, textColor, subtitleColor, buttonColor } = req.body || {};
    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ success: false, message: "Banner name is required" });
      }
      banner.name = String(name).trim();
    }
    if (isActive !== undefined) {
      banner.isActive = parseBool(isActive, banner.isActive);
    }
    if (redirectUrl !== undefined) {
      banner.redirectUrl = sanitizeRedirectUrl(redirectUrl) ?? banner.redirectUrl;
    }
    if (ctaText !== undefined) {
      banner.ctaText = sanitizeCtaText(ctaText, banner.ctaText || "Shop now");
    }
    if (title !== undefined) {
      banner.title = sanitizeShortText(title, 80, banner.title || "");
    }
    if (subtitle !== undefined) {
      banner.subtitle = sanitizeShortText(subtitle, 140, banner.subtitle || "");
    }
    if (textColor !== undefined) {
      banner.textColor = sanitizeColor(textColor, banner.textColor || "#ffffff");
    }
    if (subtitleColor !== undefined) {
      banner.subtitleColor = sanitizeColor(subtitleColor, banner.subtitleColor || "#e2e8f0");
    }
    if (buttonColor !== undefined) {
      banner.buttonColor = sanitizeColor(buttonColor, banner.buttonColor || "#0f172a");
    }
    if (req.file?.path) {
      banner.image = await uploadImageToCloudinary(req.file, {
        folder: "lucent/banners",
      });
    }

    await banner.save();
    res.json({ success: true, message: "Banner updated", banner });
  } catch (error) {
    console.error("Banner update error:", error);
    res.status(resolveBannerErrorStatus(error)).json({
      success: false,
      message: error?.message || "Failed to update banner",
    });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    await banner.deleteOne();
    res.json({ success: true, message: "Banner deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
