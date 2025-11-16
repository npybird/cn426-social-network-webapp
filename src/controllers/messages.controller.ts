// controllers/messages.controller.ts
import { Request, Response } from "express";
import { prisma } from "../config/db";

export async function listMessages(req: Request, res: Response) {
  try {
    // 1) sanitize room
    const roomRaw =
      typeof req.query.room === "string" ? req.query.room.trim() : "";
    const room = roomRaw.length > 0 ? roomRaw : "global";

    // 2) safe limit parsing
    const limitRaw = Number(req.query.limit ?? 50);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(1, limitRaw), 200)
      : 50;

    // 3) before timestamp (optional)
    const before =
      typeof req.query.before === "string" && req.query.before.trim().length > 0
        ? new Date(req.query.before)
        : undefined;

    const whereClause: any = { room };
    if (before) {
      whereClause.createdAt = { lt: before };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: { user: { select: { id: true, username: true } } },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    res.json(messages);
  } catch (err) {
    console.error("[GET /messages] error:", err);
    res.status(500).json({ error: "failed_to_list_messages" });
  }
}
