import mongoose from "mongoose";

const rechargeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
  },
  { timestamps: true },
);

const Recharge = mongoose.model("Recharge", rechargeSchema);
export default Recharge;
