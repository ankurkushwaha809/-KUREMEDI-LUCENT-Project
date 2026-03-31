/**
 * WebSocket server for real-time support chat (app uses native WebSocket, no socket.io-client).
 * Rooms: support:ticketId. Broadcast when a new message is created.
 */
import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import User from "./model/User.js";
import SupportTicket from "./model/SupportTicket.js";

const rooms = new Map(); // ticketId -> Set<WebSocket>

function getRoom(ticketId) {
  const id = String(ticketId);
  if (!rooms.has(id)) rooms.set(id, new Set());
  return rooms.get(id);
}

function removeFromAllRooms(ws) {
  for (const room of rooms.values()) {
    room.delete(ws);
  }
}

export function attachSupportWs(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url || "", `http://${request.headers.host}`);
    if (url.pathname !== "/support-ws") {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request, url);
    });
  });

  wss.on("connection", async (ws, request, url) => {
    const token = url.searchParams.get("token");
    if (!token) {
      ws.close(4001, "Missing token");
      return;
    }
    let userId;
    let isAdmin = false;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id role").lean();
      if (!user) {
        ws.close(4002, "User not found");
        return;
      }
      userId = user._id.toString();
      isAdmin = user.role === "admin";
    } catch (err) {
      ws.close(4003, "Invalid token");
      return;
    }

    ws.userId = userId;
    ws.isAdmin = isAdmin;
    ws.ticketIds = new Set();

    ws.on("message", async (data) => {
      try {
        const msg = JSON.parse(String(data));
        if (msg.type === "join" && msg.ticketId) {
          const ticketId = String(msg.ticketId);
          const ticket = await SupportTicket.findById(ticketId).select("user").lean();
          if (!ticket) return;
          const isOwner = ticket.user?.toString() === userId;
          if (!isAdmin && !isOwner) return;
          ws.ticketIds.add(ticketId);
          getRoom(ticketId).add(ws);
        } else if (msg.type === "leave" && msg.ticketId) {
          const id = String(msg.ticketId);
          ws.ticketIds.delete(id);
          const room = rooms.get(id);
          if (room) room.delete(ws);
        }
      } catch (e) {
        // ignore parse error
      }
    });

    ws.on("close", () => {
      removeFromAllRooms(ws);
    });

    ws.on("error", () => {
      removeFromAllRooms(ws);
    });
  });

  return wss;
}

/** Call this when a new support message is created (customer or admin). */
export function broadcastSupportMessage(ticketId, message) {
  const room = rooms.get(String(ticketId));
  if (!room) return;
  const payload = JSON.stringify({
    type: "message",
    data: message && typeof message.toObject === "function" ? message.toObject() : message,
  });
  for (const ws of room) {
    if (ws.readyState === 1) ws.send(payload);
  }
}
