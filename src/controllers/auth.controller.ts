import { Request, Response } from "express";
import { prisma } from "../config/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env";

// Sign Up
const signupSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  password: z.string().min(6).max(72),
});

export async function signup(req: Request, res: Response) {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { email, username, password } = parsed.data;

  const hash = await bcrypt.hash(password, 10);
  try {
    // 1) Create user
    const user = await prisma.user.create({
      data: { email, username, password: hash },
      select: { id: true, email: true, username: true },
    });

    // 2) Automatically join global room
    const globalRoom = await prisma.room.findFirst({
      where: { name: "global" },
    });

    if (globalRoom) {
      await prisma.roomMember.create({
        data: {
          userId: user.id,
          roomId: globalRoom.id,
        },
      });
    }

    // 3) Return user
    res.status(201).json(user);
  } catch {
    res.status(409).json({ message: "Email/Username is already taken" });
  }
}

// Log In
const loginSchema = z.object({
  emailOrUsername: z.string(),
  password: z.string(),
});

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { emailOrUsername, password } = parsed.data;
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: emailOrUsername }, { username: emailOrUsername }] },
  });
  if (!user) return res.status(401).json({ message: "Invalid Credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid Credentials" });

  const token = jwt.sign({}, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: "7d",
  });
  res.json({
    token,
    user: { id: user.id, email: user.email, username: user.username },
  });
}

// Current User
export async function me(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true },
  });
  if (!user) return res.status(404).end();
  res.json(user);
}
