import { useEffect, useRef } from "react";
import { SUPPORT_WS_URL } from "@/src/config";
import type { SupportMessage } from "@/src/api";

/**
 * Real-time support chat using native WebSocket (no socket.io-client).
 * Joins ticket room when ticketId and token are set; calls onMessage when a new message is received.
 */
export function useSupportWebSocket(
  ticketId: string | null,
  token: string | null,
  onMessage: (msg: SupportMessage) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!ticketId || !token) {
      if (wsRef.current) {
        try {
          wsRef.current.send(JSON.stringify({ type: "leave", ticketId }));
          wsRef.current.close();
        } catch {}
        wsRef.current = null;
      }
      return;
    }

    const url = `${SUPPORT_WS_URL}/support-ws?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join", ticketId }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type === "message" && msg.data && msg.data._id) {
          onMessageRef.current(msg.data as SupportMessage);
        }
      } catch {}
    };

    ws.onerror = () => {};
    ws.onclose = () => {
      wsRef.current = null;
    };

    return () => {
      try {
        ws.send(JSON.stringify({ type: "leave", ticketId }));
        ws.close();
      } catch {}
      wsRef.current = null;
    };
  }, [ticketId, token]);
}
