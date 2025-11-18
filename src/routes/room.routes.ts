// src/routes/room.routes.ts
import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../config/db";
import { createGroup, openDM } from "../controllers/room.controller";

export const roomsRouter = Router();

roomsRouter.get("/my", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as string;

    const rooms = await prisma.roomMember.findMany({
      where: { userId },
      include: {
        room: {
          include: {
            members: {
              include: { user: true },
            },
          },
        },
      },
    });

    res.json(
      rooms.map((r) => {
        const isGroup = r.room.isGroup;

        let otherUserName = null;

        if (!isGroup) {
          otherUserName =
            r.room.members
              .filter((m) => m.userId !== userId)
              .map((m) => m.user.username)[0] || null;
        }

        return {
          roomId: r.roomId,
          isGroup,
          name: isGroup ? r.room.name : otherUserName,
        };
      })
    );
  } catch (err) {
    console.error("[GET /rooms/my] error:", err);
    res.status(500).json({ error: "failed_to_list_rooms" });
  }
});

roomsRouter.post("/open-dm", requireAuth, openDM);

roomsRouter.post("/create-group", requireAuth, createGroup);
