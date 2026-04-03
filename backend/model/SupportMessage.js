import mongoose from "mongoose";

const supportMessageSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportTicket",
      required: true,
    },
    body: { type: String, required: true, trim: true },
    isFromAdmin: { type: Boolean, default: false },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: ["message", "call_note"],
      default: "message",
    },
    attachment: { type: String, trim: true },
  },
  { timestamps: true }
);

supportMessageSchema.index({ ticket: 1, createdAt: 1 });

const SupportMessage = mongoose.model("SupportMessage", supportMessageSchema);
export default SupportMessage;
