import { prisma } from "../config/db";

async function main() {
  let global = await prisma.room.findFirst({
    where: { name: "global" },
  });

  if (!global) {
    global = await prisma.room.create({
      data: {
        name: "global",
        isGroup: true,
      },
    });
  }

  console.log("Created/Found Global Room:");
  console.log(global);
}

main().then(() => process.exit(0));
