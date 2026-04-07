import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNo: { type: String, unique: true, trim: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["ORDER", "PAYMENT", "PRODUCT", "WALLET", "KYC", "DELIVERY", "OTHER"],
      default: "OTHER",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
    status: {
      type: String,
      enum: ["NEW", "OPEN", "IN_PROGRESS", "CALLING", "RESOLVED", "CLOSED"],
      default: "NEW",
    },
    contactPhone: { type: String, trim: true },
    contactName: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    initialMessage: { type: String, required: true },
    lastMessageAt: { type: Date, default: Date.now },
    adminNotes: { type: String },
    assignedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    direction: {
      type: String,
      enum: ["INBOUND", "OUTBOUND"],
      default: "INBOUND",
    },
  },
  { timestamps: true }
);

supportTicketSchema.index({ user: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1 });

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);
export default SupportTicket;
