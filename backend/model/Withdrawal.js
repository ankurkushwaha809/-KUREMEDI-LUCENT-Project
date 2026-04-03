import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    note: { type: String, trim: true },
    adminNote: { type: String, trim: true },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema);
export default Withdrawal;
