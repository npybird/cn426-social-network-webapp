export function connectWS(token: string, room = "global") {
  const base = process.env.NEXT_PUBLIC_API_URL!;
  const proto = base.startsWith("https") ? "wss" : "ws";
  return new WebSocket(
    `${base.replace(/^http/, proto)}/ws?token=${encodeURIComponent(
      token
    )}&room=${encodeURIComponent(room)}`
  );
}
