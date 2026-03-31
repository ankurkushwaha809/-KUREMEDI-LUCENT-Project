import express from "express";
import { protect } from "../middleware/protect.js";
import { authorizeRoles } from "../middleware/authorize.js";
import {
  createTicket,
  getMyTickets,
  getTicketById,
  addMessage,
  registerPushToken,
  adminGetAllTickets,
  adminGetTicketById,
  adminReply,
  adminUpdateStatus,
  adminAddCallNote,
  adminUpdateNotes,
  adminAssignSelf,
} from "../controllers/support.controller.js";
import {
  initiateCall,
  customerTwiml,
  connectAdmin,
  callStatusCallback,
} from "../controllers/supportVoice.controller.js";

const router = express.Router();

// --- Public (TwiML / Twilio webhooks - no auth) ---
router.get("/voice/customer-twiml", customerTwiml);
router.get("/voice/connect-admin", connectAdmin);
router.post("/voice/connect-admin", connectAdmin);
router.post("/voice/call-status", callStatusCallback);

// Customer routes (authenticated user / vendor / agent)
router.post("/tickets", protect, authorizeRoles("user", "vendor", "agent"), createTicket);
router.get("/tickets", protect, authorizeRoles("user", "vendor", "agent"), getMyTickets);
router.get("/tickets/:id", protect, authorizeRoles("user", "vendor", "agent"), getTicketById);
router.post(
  "/tickets/:id/messages",
  protect,
  authorizeRoles("user", "vendor", "agent"),
  addMessage
);
router.post("/push-token", protect, authorizeRoles("user", "vendor", "agent"), registerPushToken);

// Admin routes
router.get(
  "/admin/tickets",
  protect,
  authorizeRoles("admin"),
  adminGetAllTickets
);
router.get(
  "/admin/tickets/:id",
  protect,
  authorizeRoles("admin"),
  adminGetTicketById
);
router.post(
  "/admin/tickets/:id/reply",
  protect,
  authorizeRoles("admin"),
  adminReply
);
router.put(
  "/admin/tickets/:id/status",
  protect,
  authorizeRoles("admin"),
  adminUpdateStatus
);
router.post(
  "/admin/tickets/:id/call-note",
  protect,
  authorizeRoles("admin"),
  adminAddCallNote
);
router.put(
  "/admin/tickets/:id/notes",
  protect,
  authorizeRoles("admin"),
  adminUpdateNotes
);
router.put(
  "/admin/tickets/:id/assign",
  protect,
  authorizeRoles("admin"),
  adminAssignSelf
);
router.post(
  "/admin/tickets/:id/initiate-call",
  protect,
  authorizeRoles("admin"),
  initiateCall
);

export default router;
