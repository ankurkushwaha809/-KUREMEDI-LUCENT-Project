import mongoose from "mongoose";

const supportCallSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportTicket",
      required: true,
    },
    callSid: { type: String, trim: true },
    duration: { type: Number, default: 0 },
    recordingUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: ["initiating", "ringing", "in-progress", "completed", "failed", "busy", "no-answer"],
      default: "initiating",
    },
  },
  { timestamps: true }
);

supportCallSchema.index({ ticket: 1, createdAt: -1 });

const SupportCall = mongoose.model("SupportCall", supportCallSchema);
export default SupportCall;
