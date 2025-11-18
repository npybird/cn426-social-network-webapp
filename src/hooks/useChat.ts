"use client";

import { useEffect, useRef, useState } from "react";
import { connectWS } from "@/lib/ws";
import { getMessages } from "@/lib/api";

export type ChatMsg = {
  userId: string;
  username: string;
  content: string;
  ts: number;
};

export function useChat(token: string | null, roomId: string) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token || !roomId) return;
    let closed = false;

    (async () => {
      // REST: load history from this roomId
      const history = await getMessages(roomId, 50);
      if (closed) return;
      setMessages(
        history.map((h) => ({
          userId: h.user.id,
          username: h.user.username,
          content: h.content,
          ts: Date.parse(h.createdAt),
        }))
      );

      // WS connect
      const ws = connectWS(token, roomId);
      wsRef.current = ws;

      ws.onmessage = (ev) => {
        try {
          const { kind, payload } = JSON.parse(ev.data);
          if (kind === "chat") {
            setMessages((m) => [
              ...m,
              {
                userId: payload.userId,
                username: payload.username,
                content: payload.content,
                ts: payload.ts,
              },
            ]);
          }
        } catch {}
      };
    })();

    return () => {
      closed = true;
      wsRef.current?.close();
    };
  }, [token, roomId]);

  const send = (content: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN && content.trim()) {
      ws.send(JSON.stringify({ type: "chat", content: content.trim() }));
    }
  };

  return { messages, send };
}
