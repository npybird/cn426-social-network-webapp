// src/controllers/room.controller.ts
import { Request, Response } from "express";
import { prisma } from "../config/db";

export async function openDM(req: Request, res: Response) {
  const me = (req as any).userId as string;
  const otherUserId = req.body.otherUserId as string;

  if (!otherUserId || otherUserId.trim() === "") {
    return res.status(400).json({ error: "missing_other_user_id" });
  }
  if (otherUserId === me) {
    return res.status(400).json({ error: "cannot_dm_self" });
  }

  try {
    // 1) Check if DM between me ↔ other already exists
    const existing = await prisma.room.findFirst({
      where: {
        isGroup: false,
        members: {
          every: {
            userId: { in: [me, otherUserId] },
          },
        },
      },
      include: { members: true },
    });

    if (existing) {
      return res.json({
        roomId: existing.id,
        name: existing.name,
        isGroup: existing.isGroup,
      });
    }

    // 2) If not exists → create new DM room
    const dmRoom = await prisma.room.create({
      data: {
        name: "dm",
        isGroup: false,
        members: {
          create: [{ userId: me }, { userId: otherUserId }],
        },
      },
    });

    return res.json({
      roomId: dmRoom.id,
      name: "dm",
      isGroup: false,
    });
  } catch (err) {
    console.error("[openDM] error:", err);
    res.status(500).json({ error: "failed_to_open_dm" });
  }
}

export async function createGroup(req: Request, res: Response) {
  const userId = (req as any).userId;
  const { name, members } = req.body;

  if (!name) return res.status(400).json({ error: "missing_group_name" });

  if (!Array.isArray(members) || members.length === 0) {
    return res.status(400).json({ error: "missing_members" });
  }

  const uniqueMembers = [...new Set(members)];

  uniqueMembers.push(userId);

  try {
    const newRoom = await prisma.room.create({
      data: {
        name,
        isGroup: true,
        members: {
          create: uniqueMembers.map((uid) => ({ userId: uid })),
        },
      },
    });

    res.json({
      roomId: newRoom.id,
      name: newRoom.name,
      isGroup: newRoom.isGroup,
    });
  } catch (err) {
    console.error("createGroup error:", err);
    res.status(500).json({ error: "failed_to_create_group" });
  }
}
