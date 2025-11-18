import { Router } from "express";
import { prisma } from "../config/db";
import { requireAuth } from "../middleware/auth";

export const userRouter = Router();

// Get All Users (excluding self)
userRouter.get("/all", requireAuth, async (req, res) => {
  try {
    const myId = (req as any).userId as string;

    const users = await prisma.user.findMany({
      where: { id: { not: myId } },
      select: { id: true, username: true, email: true },
    });

    res.json(users);
  } catch (err) {
    console.error("GET /users/all error:", err);
    res.status(500).json({ error: "failed_to_list_users" });
  }
});

// Get User by ID
userRouter.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("GET /users/:id error", err);
    res.status(500).json({ error: "failed_to_fetch_user" });
  }
});
