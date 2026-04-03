import mongoose from "mongoose";

const commissionSchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ["REFERRAL", "ORDER", "BONUS", "PAYOUT"],
      required: true,
    },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ["PENDING", "CREDITED", "PAID_OUT"],
      default: "PENDING",
    },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    reference: { type: String, trim: true },
  },
  { timestamps: true }
);

const Commission = mongoose.model("Commission", commissionSchema);
export default Commission;
