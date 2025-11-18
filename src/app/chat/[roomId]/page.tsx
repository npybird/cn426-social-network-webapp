// chat/[roomId]/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useChat } from "@/hooks/useChat";
import { getMyRooms } from "@/lib/api";
import SidebarRooms from "./sideBarRooms";
import { LogoutButton } from "@/components/auth/logout-button";
import type { ChatMsg } from "@/hooks/useChat";
import Link from "next/link";
import { CreateGroupButton } from "@/components/chat/create-group-button";

export default function ChatRoomPage() {
    const params = useParams();
    const roomId = String(params.roomId || "").trim();

    const [roomName, setRoomName] = useState("");

    // fetch room name
    useEffect(() => {
        (async () => {
            try {
                const rooms = await getMyRooms();
                const r = rooms.find((x) => x.roomId === roomId);
                if (r) setRoomName(r.name);
            } catch {
                console.log("Failed to load room name");
            }
        })();
    }, [roomId]);

    const [text, setText] = useState("");
    const bottomRef = useRef<HTMLDivElement | null>(null);

    // current user
    const me =
        typeof window !== "undefined" ? safeGetUser() : null;
    const myId = me?.id ?? null;
    const myName =
        me?.username || (me?.email ? me.email.split("@")[0] : "You");

    // token
    const token =
        typeof window !== "undefined"
            ? localStorage.getItem("token")
            : null;

    // loads message + connects WS
    const { messages, send } = useChat(token, roomId);

    // sorted messages
    const allMessages = useMemo(
        () => [...messages].sort((a, b) => a.ts - b.ts),
        [messages]
    );

    // auto scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [allMessages]);

    const onSend = () => {
        const content = text.trim();
        if (!content) return;
        send(content);
        setText("");
    };

    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-[360px_1fr] gap-6">
            {/* Sidebar */}
            <Card className="p-4 flex flex-col h-[calc(100vh-3rem)]">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Chats</h1>
                    <div className="flex items-center gap-2">
                        <CreateGroupButton />
                        <LogoutButton />
                    </div>
                </div>

                <ScrollArea className="flex-1 pr-3">
                    <SidebarRooms currentRoomId={roomId} />
                </ScrollArea>

                {/* User footer */}
                <div className="pt-3 mt-3 border-t">
                    <Link href={'/user/' + myId}>
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src="" />
                                <AvatarFallback>
                                    {(myName || "U")[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="leading-tight">
                                <div className="font-medium">
                                    {myName || "You"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {me?.email}
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </Card>

            {/* Chat window */}
            <Card className="p-4 h-[calc(100vh-3rem)] flex flex-col">
                <div className="flex items-center gap-3 p-2">
                    <Avatar>
                        <AvatarImage src="" />
                        <AvatarFallback>
                            {(roomName || "R")[0].toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="font-semibold text-lg">
                        {roomName || "Room"}
                    </div>
                </div>

                <Separator className="my-2" />

                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-3">
                        {allMessages.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No messages yet</div>
                        ) : (
                            allMessages.map((m, idx) => (
                                <MessageBubble key={idx} m={m} myId={myId} myName={myName} />
                            ))
                        )}

                        <div ref={bottomRef} />
                    </div>
                </ScrollArea>

                <div className="mt-3 flex items-center gap-2">
                    <Input
                        placeholder="Enter a message"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && onSend()}
                    />
                    <Button onClick={onSend}>Send</Button>
                </div>
            </Card>
        </div>
    );
}

function MessageBubble({ m, myId, myName }: { m: ChatMsg; myId: string | null; myName: string | null }) {
    const fromMe = myId === m.userId;
    const name = fromMe ? myName || "You" : m.username || shortId(m.userId);

    return (
        <div className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
            <div
                className={`min-w-[40%] max-w-[80%] rounded-2xl px-4 py-3 ${fromMe ? "bg-[#7EB6FF] text-black" : "bg-[#EDF0F5]"
                    }`}
            >
                <div className="flex items-center gap-1 mb-1 text-xs text-gray-600">
                    <Avatar className="h-6 w-6">
                        <AvatarFallback>{name[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        {fromMe ?
                            <Link
                                href={`/user/${m.userId}`}>
                                {`${name} (you)`}
                            </Link>
                            :
                            <Link
                                href={`/user/${m.userId}`}>
                                {name}
                            </Link>}
                    </div>
                </div>

                <div>{m.content}</div>

                <div className="text-[10px] text-right text-gray-500 mt-1">
                    {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
            </div>
        </div>
    );
}

function safeGetUser() {
    try {
        const raw = localStorage.getItem("user");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function shortId(id: string) {
    return id ? id.slice(0, 6) : "user";
}
