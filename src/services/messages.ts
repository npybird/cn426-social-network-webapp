import { prisma } from "../config/db";

export async function persistMessage(input: {
  userId: string;
  roomId: string;
  content: string;
  ts: number;
}) {
  const saved = await prisma.message.create({
    data: {
      userId: input.userId,
      roomId: input.roomId,
      content: input.content,
      createdAt: new Date(input.ts),
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  return saved;
}
