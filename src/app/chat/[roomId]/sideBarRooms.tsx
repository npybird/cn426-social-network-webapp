"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMyRooms } from "@/lib/api";

type RoomItem = { roomId: string; name: string; isGroup: boolean };

export default function SidebarRooms({
  currentRoomId,
}: {
  currentRoomId: string;
}) {
  const [rooms, setRooms] = useState<RoomItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await getMyRooms();
        setRooms(r);
      } catch (err) {
        console.error("failed to load rooms", err);
      }
    })();
  }, []);

  return (
    <div className="space-y-2">
      {rooms.map((r) => {
        const active = r.roomId === currentRoomId;
        return (
          <Link
            key={r.roomId}
            href={`/chat/${r.roomId}`}
            className={`block px-3 py-2 rounded-lg ${active ? "bg-blue-500 text-white" : "hover:bg-gray-200"
              }`}
          >
            {r.isGroup ? r.name == "global" ? "🌏 " : "🫂 " : "💬 "}
            {r.name}
          </Link>
        );
      })}
    </div>
  );
}
