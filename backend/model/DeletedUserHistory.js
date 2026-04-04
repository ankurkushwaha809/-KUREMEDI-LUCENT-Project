import mongoose from "mongoose";

const deletedUserHistorySchema = new mongoose.Schema(
  {
    deletedUserId: { type: String, required: true, trim: true },
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    role: { type: String, trim: true },
    kyc: { type: String, trim: true },
    isBlocked: { type: Boolean, default: false },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    deletedByEmail: { type: String, trim: true, lowercase: true },
    deletedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const DeletedUserHistory = mongoose.model("DeletedUserHistory", deletedUserHistorySchema);
export default DeletedUserHistory;