import mongoose from "mongoose";

const adminOtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    destination: { type: String, required: true, lowercase: true, trim: true, index: true },
    purpose: { type: String, required: true, trim: true, index: true },
    otpHash: { type: String, required: true, trim: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    meta: { type: Object, default: {} },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

adminOtpSchema.index({ email: 1, destination: 1, purpose: 1 }, { unique: true });

const AdminOtp = mongoose.model("AdminOtp", adminOtpSchema);
export default AdminOtp;
