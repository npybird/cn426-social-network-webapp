import { prisma } from "../config/db";

export async function persistMessage(input: {
  userId: string;
  room: string;
  content: string;
  ts: number;
}) {
  await prisma.message.create({
    data: {
      userId: input.userId,
      room: input.room,
      content: input.content,
      createdAt: new Date(input.ts),
    },
  });
}
