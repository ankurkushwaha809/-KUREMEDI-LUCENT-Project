import mongoose from "mongoose";

const schema = new mongoose.Schema(
  { _id: { type: String, required: true }, seq: { type: Number, default: 0 } },
  { _id: false }
);

const SupportTicketCounter = mongoose.model("SupportTicketCounter", schema);

export const getNextTicketNo = async () => {
  const doc = await SupportTicketCounter.findOneAndUpdate(
    { _id: "supportTicket" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `TCK-${String(doc.seq).padStart(4, "0")}`;
};

export default SupportTicketCounter;
