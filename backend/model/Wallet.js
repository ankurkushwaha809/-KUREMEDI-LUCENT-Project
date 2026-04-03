import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      // positive = credit, negative = debit
    },
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    reference: {
      type: String,
      trim: true,
      // e.g. "REF123" for referral credit
    },
    balanceAfter: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, _id: true },
);

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    transactions: [walletTransactionSchema],
  },
  { timestamps: true },
);

const Wallet = mongoose.model("Wallet", walletSchema);
export default Wallet;
