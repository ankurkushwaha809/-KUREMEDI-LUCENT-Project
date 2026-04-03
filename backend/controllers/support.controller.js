import SupportTicket from "../model/SupportTicket.js";
import SupportMessage from "../model/SupportMessage.js";
import SupportCall from "../model/SupportCall.js";
import User from "../model/User.js";
import { getNextTicketNo } from "../model/SupportTicketCounter.js";
import { broadcastSupportMessage } from "../supportWs.js";
import { sendSupportPushNotification } from "../utils/pushNotifications.js";

/**
 * Customer: Create a new support ticket (inbound)
 * POST /api/support/tickets
 * Body: name, phone, email, problemType (category), message, subject?, priority?, attachment? (URL)
 */
export const createTicket = async (req, res) => {
  try {
    const {
      subject,
      category,
      priority,
      contactPhone,
      contactName,
      contactEmail,
      message,
      problemType,
      attachment,
    } = req.body;
    const msg = (message && String(message).trim()) || "";
    if (!msg) {
      return res.status(400).json({ message: "Message is required" });
    }
    const user = await User.findById(req.user._id).select("name phone email");
    const ticketNo = await getNextTicketNo();
    const sub =
      (subject && String(subject).trim()) ||
      msg.slice(0, 60).trim() ||
      "Support query";
    const cat = category || problemType || "OTHER";
    const ticket = await SupportTicket.create({
      ticketNo,
      user: req.user._id,
      subject: sub,
      category: cat,
      priority: priority || "MEDIUM",
      status: "NEW",
      contactPhone: contactPhone || user?.phone || "",
      contactName: contactName || user?.name || "",
      contactEmail: contactEmail || user?.email || "",
      initialMessage: msg,
      direction: "INBOUND",
    });
    await SupportMessage.create({
      ticket: ticket._id,
      body: msg,
      isFromAdmin: false,
      sender: req.user._id,
      type: "message",
      ...(attachment && String(attachment).trim() && { attachment: String(attachment).trim() }),
    });
    const populated = await SupportTicket.findById(ticket._id).populate(
      "user",
      "name phone email",
    );
    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message || "Failed to create ticket" });
  }
};

/**
 * Customer: Get my tickets
 * GET /api/support/tickets
 */
export const getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id })
      .sort({ lastMessageAt: -1 })
      .lean();
    return res.json({ success: true, data: tickets });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message || "Failed to fetch tickets" });
  }
};

/**
 * Customer: Get single ticket with messages
 * GET /api/support/tickets/:id
 */
export const getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("user", "name phone");
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    const messages = await SupportMessage.find({ ticket: ticket._id })
      .sort({ createdAt: 1 })
      .lean();
    return res.json({ success: true, data: { ticket, messages } });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message || "Failed to fetch ticket" });
  }
};

/**
 * Customer: Add message to own ticket
 * POST /api/support/tickets/:id/messages
 */
export const addMessage = async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    if (ticket.status === "CLOSED")
      return res.status(400).json({ message: "Ticket is closed" });
    const { body, attachment } = req.body;
    if (!body || !body.trim())
      return res.status(400).json({ message: "Message body is required" });
    const msg = await SupportMessage.create({
      ticket: ticket._id,
      body: body.trim(),
      isFromAdmin: false,
      sender: req.user._id,
      type: "message",
      ...(attachment && { attachment: String(attachment).trim() }),
    });
    await SupportTicket.findByIdAndUpdate(ticket._id, {
      lastMessageAt: new Date(),
      ...(ticket.status === "RESOLVED" ? { status: "OPEN" } : {}),
    });
    const msgObj = msg.toObject ? msg.toObject() : { ...msg, _id: msg._id };
    broadcastSupportMessage(ticket._id.toString(), msgObj);
    return res.status(201).json({ success: true, data: msg });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message || "Failed to send message" });
  }
};

// --- Admin ---

/**
 * Admin: List all tickets (with optional filters)
 * GET /api/support/admin/tickets
 */
export const adminGetAllTickets = async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    const tickets = await SupportTicket.find(filter)
      .populate("user", "name phone email")
      .sort({ lastMessageAt: -1 })
      .lean();
    return res.json({ success: true, data: tickets });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message || "Failed to fetch tickets" });
  }
};

/**
 * Admin: Get single ticket with messages (for reply / call details)
 * GET /api/support/admin/tickets/:id
 */
export const adminGetTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id).populate(
      "user",
      "name phone email",
    );
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    const messages = await SupportMessage.find({ ticket: ticket._id })
      .sort({ createdAt: 1 })
      .lean();
    return res.json({ success: true, data: { ticket, messages } });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message || "Failed to fetch ticket" });
  }
};

/**
 * Admin: Reply to ticket (chat)
 * POST /api/support/admin/tickets/:id/reply
 */
export const adminReply = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    const { body, attachment } = req.body;
    if (!body || !body.trim())
      return res.status(400).json({ message: "Reply body is required" });
    const msg = await SupportMessage.create({
      ticket: ticket._id,
      body: body.trim(),
      isFromAdmin: true,
      sender: req.user._id,
      type: "message",
      ...(attachment && { attachment: String(attachment).trim() }),
    });
    await SupportTicket.findByIdAndUpdate(ticket._id, {
      lastMessageAt: new Date(),
      status: "IN_PROGRESS",
    });
    const msgObj = msg.toObject ? msg.toObject() : { ...msg, _id: msg._id };
    broadcastSupportMessage(ticket._id.toString(), msgObj);
    sendSupportPushNotification(ticket.user, ticket.subject, body.trim()).catch(() => {});
    return res.status(201).json({ success: true, data: msg });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message || "Failed to send reply" });
  }
};

/**
 * Admin: Update ticket status
 * PUT /api/support/admin/tickets/:id/status
 */
export const adminUpdateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["NEW", "OPEN", "IN_PROGRESS", "CALLING", "RESOLVED", "CLOSED"];
    if (!allowed.includes(status))
      return res.status(400).json({ message: "Invalid status" });
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    ).populate("user", "name phone email");
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    return res.json({ success: true, data: ticket });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message || "Failed to update status" });
  }
};

/**
 * Admin: Add call note (outbound call log)
 * POST /api/support/admin/tickets/:id/call-note
 */
export const adminAddCallNote = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    const { note } = req.body;
    const body = note && note.trim() ? note.trim() : "Outbound call made.";
    const msg = await SupportMessage.create({
      ticket: ticket._id,
      body,
      isFromAdmin: true,
      sender: req.user._id,
      type: "call_note",
    });
    await SupportTicket.findByIdAndUpdate(ticket._id, {
      lastMessageAt: new Date(),
      direction: "OUTBOUND",
      status: "IN_PROGRESS",
    });
    const msgObj = msg.toObject ? msg.toObject() : { ...msg, _id: msg._id };
    broadcastSupportMessage(ticket._id.toString(), msgObj);
    sendSupportPushNotification(ticket.user, ticket.subject, body).catch(() => {});
    return res.status(201).json({ success: true, data: msg });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message || "Failed to add call note" });
  }
};

/**
 * Customer: Register Expo push token for support notifications
 * POST /api/support/push-token
 */
export const registerPushToken = async (req, res) => {
  try {
    const { token } = req.body;
    const t = token && String(token).trim();
    if (!t) return res.status(400).json({ message: "Token is required" });
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { expoPushTokens: t },
    });
    return res.json({ success: true, message: "Token registered" });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to register token" });
  }
};

/**
 * Admin: Update admin notes (internal)
 * PUT /api/support/admin/tickets/:id/notes
 */
export const adminUpdateNotes = async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { adminNotes: adminNotes != null ? String(adminNotes) : "" },
      { new: true },
    );
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    return res.json({ success: true, data: ticket });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message || "Failed to update notes" });
  }
};

/**
 * Admin: Assign self to ticket (optional, used when opening)
 * PUT /api/support/admin/tickets/:id/assign
 */
export const adminAssignSelf = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      {
        assignedAdmin: req.user._id,
        ...(req.body.status && { status: req.body.status }),
      },
      { new: true },
    )
      .populate("user", "name phone email")
      .populate("assignedAdmin", "name");
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    return res.json({ success: true, data: ticket });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message || "Failed to assign" });
  }
};
