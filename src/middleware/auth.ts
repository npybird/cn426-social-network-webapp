import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    (req as any).userId = decoded.sub as string;
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
}
