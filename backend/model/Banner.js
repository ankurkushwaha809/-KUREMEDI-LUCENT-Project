import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    redirectUrl: {
      type: String,
      default: "",
      trim: true,
    },
    ctaText: {
      type: String,
      default: "Shop now",
      trim: true,
      maxlength: 40,
    },
    title: {
      type: String,
      default: "",
      trim: true,
      maxlength: 80,
    },
    subtitle: {
      type: String,
      default: "",
      trim: true,
      maxlength: 140,
    },
    textColor: {
      type: String,
      default: "#ffffff",
      trim: true,
    },
    subtitleColor: {
      type: String,
      default: "#e2e8f0",
      trim: true,
    },
    buttonColor: {
      type: String,
      default: "#0f172a",
      trim: true,
    },
  },
  { timestamps: true },
);

const Banner = mongoose.model("Banner", bannerSchema);

export default Banner;
