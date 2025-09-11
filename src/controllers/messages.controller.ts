import { Request, Response } from "express";
import { prisma } from "../config/db";

export async function listMessages(req: Request, res: Response) {
  const room = (req.query.room as string) || "global";
  const limit = Math.min(parseInt((req.query.limit as string) || "50"), 100);
  const before = req.query.before
    ? new Date(req.query.before as string)
    : new Date();

  const messages = await prisma.message.findMany({
    where: { room, createdAt: { lt: before } },
    include: { user: { select: { id: true, username: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  res.json(messages.reverse());
}
