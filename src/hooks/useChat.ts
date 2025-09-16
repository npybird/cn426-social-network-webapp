"use client";
import { useEffect, useRef, useState } from "react";
import { connectWS } from "@/lib/ws";
import { getMessages } from "@/lib/api";

export type ChatMsg = { userId: string; content: string; ts: number };

export function useChat(token: string | null, room = "global") {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token) return;
    let closed = false;

    (async () => {
      const history = await getMessages(room, 50);
      if (closed) return;
      setMessages(
        history.map((h) => ({
          userId: h.user.id,
          content: h.content,
          ts: Date.parse(h.createdAt),
        }))
      );

      const ws = connectWS(token, room);
      wsRef.current = ws;
      ws.onmessage = (ev) => {
        try {
          const { kind, payload } = JSON.parse(ev.data);
          if (kind === "chat") setMessages((m) => [...m, payload]);
        } catch {}
      };
    })();

    return () => {
      closed = true;
      wsRef.current?.close();
    };
  }, [token, room]);

  const send = (content: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN && content.trim()) {
      ws.send(JSON.stringify({ type: "chat", content: content.trim() }));
    }
  };

  return { messages, send };
}
