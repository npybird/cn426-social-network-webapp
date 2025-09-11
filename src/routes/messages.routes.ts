import { Router } from "express";
import { listMessages } from "../controllers/messages.controller";

export const messagesRouter = Router();
messagesRouter.get("/", listMessages);
