import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 mins
  },
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL - auto delete expired

const Otp = mongoose.model("Otp", otpSchema);
export default Otp;
