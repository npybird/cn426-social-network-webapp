// controllers/messages.controller.ts
import { Request, Response } from "express";
import { prisma } from "../config/db";

export async function listMessages(req: Request, res: Response) {
  try {
    // roomId REQUIRED
    const roomId =
      typeof req.query.roomId === "string" ? req.query.roomId.trim() : "";

    if (!roomId) {
      return res.status(400).json({ error: "missing_roomId" });
    }

    // safe limit parsing
    const limitRaw = Number(req.query.limit ?? 50);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(1, limitRaw), 200)
      : 50;

    // optional before timestamp
    const before =
      typeof req.query.before === "string" && req.query.before.trim()
        ? new Date(req.query.before)
        : undefined;

    const whereClause: any = { roomId };
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
