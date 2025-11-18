import http, { IncomingMessage } from "http";
import crypto from "crypto";
import url from "url";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { persistMessage } from "../services/messages";
import { prisma } from "../config/db";

type Client = {
  socket: any; // net.Socket
  userId: string;
  room: string;
  alive: boolean;
  lastSendTs: number;
};

const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const clients = new Set<Client>();

function encodeFrame(opcode: number, data: Buffer) {
  const fin = 0x80;
  const header: number[] = [fin | opcode];
  const len = data.length;

  if (len < 126) header.push(len);
  else if (len < 65536) header.push(126, (len >> 8) & 0xff, len & 0xff);
  else
    header.push(
      127,
      0,
      0,
      0,
      0,
      (len >>> 24) & 0xff,
      (len >>> 16) & 0xff,
      (len >>> 8) & 0xff,
      len & 0xff
    );

  return Buffer.concat([Buffer.from(header), data]);
}

function decodeFrames(buf: Buffer) {
  let i = 0;
  const frames: { opcode: number; data: Buffer }[] = [];
  while (i + 2 <= buf.length) {
    const b1 = buf[i++],
      b2 = buf[i++];
    const opcode = b1 & 0x0f;
    const masked = (b2 & 0x80) !== 0;
    let len = b2 & 0x7f;

    if (len === 126) {
      if (i + 2 > buf.length) break;
      len = (buf[i++] << 8) | buf[i++];
    } else if (len === 127) {
      if (i + 8 > buf.length) break;
      i += 4;
      len = (buf[i++] << 24) | (buf[i++] << 16) | (buf[i++] << 8) | buf[i++];
    }

    const mask = masked ? buf.slice(i, i + 4) : null;
    if (masked) i += 4;
    if (i + len > buf.length) break;

    let payload = buf.slice(i, i + len);
    i += len;
    if (masked && mask) {
      const out = Buffer.alloc(len);
      for (let j = 0; j < len; j++) out[j] = payload[j] ^ mask[j % 4];
      payload = out;
    }
    frames.push({ opcode, data: payload });
  }
  return frames;
}

function broadcast(room: string, msg: any) {
  const frame = encodeFrame(0x1, Buffer.from(JSON.stringify(msg)));
  for (const c of clients)
    if (c.room === room) {
      try {
        c.socket.write(frame);
      } catch {}
    }
}

export function attachWebSocket(server: http.Server) {
  server.on("upgrade", async (req: IncomingMessage, socket) => {
    console.log("[WS] upgrade hit:", req.url);
    if ((req.headers["upgrade"] || "").toLowerCase() !== "websocket")
      return socket.destroy();
    const key = req.headers["sec-websocket-key"];
    if (!key || Array.isArray(key)) return socket.destroy();
    if (req.headers["sec-websocket-version"] !== "13") return socket.destroy();

    const { query } = url.parse(req.url || "", true);
    const token = String(query?.token || "");

    // roomId "must" be provided (global will also have a roomId)
    const roomId = String(query?.roomId || "").trim();
    if (!roomId) {
      socket.write("HTTP/1.1 400 Bad Request\r\n\r\nMissing roomId");
      return socket.destroy();
    }

    let userId = "";
    try {
      const d = jwt.verify(token, env.JWT_SECRET) as any;
      userId = d.sub;
    } catch {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      return socket.destroy();
    }

    // Check membership
    const membership = await prisma.roomMember.findFirst({
      where: {
        roomId: roomId,
        userId: userId,
      },
    });

    if (!membership) {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\nNot a member of this room");
      return socket.destroy();
    }

    const accept = crypto
      .createHash("sha1")
      .update(String(key) + GUID)
      .digest("base64");
    socket.write(
      "HTTP/1.1 101 Switching Protocols\r\n" +
        "Upgrade: websocket\r\n" +
        "Connection: Upgrade\r\n" +
        `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
    );

    const client: Client = {
      socket,
      userId,
      room: roomId,
      alive: true,
      lastSendTs: 0,
    };
    clients.add(client);

    socket.on("data", async (chunk: Buffer) => {
      const frames = decodeFrames(chunk);
      for (const f of frames) {
        if (f.opcode === 0x8) {
          // close
          try {
            socket.end(encodeFrame(0x8, Buffer.alloc(0)));
          } catch {}
          clients.delete(client);
        } else if (f.opcode === 0x9) {
          // ping -> pong
          socket.write(encodeFrame(0xa, f.data));
        } else if (f.opcode === 0x1) {
          // text
          try {
            const msg = JSON.parse(f.data.toString());
            if (msg?.type === "chat" && typeof msg.content === "string") {
              const content = String(msg.content).trim();
              if (!content || content.length > 500) continue;

              const now = Date.now();
              if (now - client.lastSendTs < 200) continue; // throttle 200ms for anti-spamming messsages
              client.lastSendTs = now;

              const saved = await persistMessage({
                userId: client.userId,
                roomId: client.room,
                content,
                ts: now,
              });

              broadcast(client.room, {
                kind: "chat",
                payload: {
                  userId: saved.userId,
                  username: saved.user.username,
                  content: saved.content,
                  ts: saved.createdAt.getTime(),
                },
              });
            }
          } catch {
            /* ignore invalid JSON */
          }
        }
      }
    });

    socket.on("close", () => clients.delete(client));
    socket.on("error", () => clients.delete(client));

    const iv = setInterval(() => {
      if (socket.destroyed) return clearInterval(iv);
      try {
        socket.write(encodeFrame(0x9, Buffer.from("ping")));
      } catch {}
    }, 30000);
  });
}
