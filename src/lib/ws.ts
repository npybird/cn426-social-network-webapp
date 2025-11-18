// lib/ws.ts
export function connectWS(token: string, roomId: string) {
  const base = process.env.NEXT_PUBLIC_API_URL!;
  const proto = base.startsWith("https") ? "wss" : "ws";

  return new WebSocket(
    `${base.replace(/^http/, proto)}/ws?token=${encodeURIComponent(
      token
    )}&roomId=${encodeURIComponent(roomId)}`
  );
}
