"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { getMessages } from "@/lib/api";       // REST: load history
import { useChat } from "@/hooks/useChat";    // WS hook
import { LogoutButton } from "@/components/auth/logout-button";

// shape used for rendering
type Msg = { userId: string; content: string; ts: number };

export default function ChatPage() {
    const [historyMsgs, setHistoryMsgs] = useState<Msg[]>([]);
    const [userMap, setUserMap] = useState<Record<string, string>>({}); // userId -> username
    const [text, setText] = useState("");
    const bottomRef = useRef<HTMLDivElement | null>(null);

    // current user (from localStorage set at login)
    const me = typeof window !== "undefined" ? safeGetUser() : null;
    const myId = me?.id ?? null;
    const myName = me?.username || (me?.email ? me.email.split("@")[0] : "You");

    // token for WS
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // WS live messages
    const { messages: liveMessages, send } = useChat(token, "global");

    // load history on mount and seed userMap for nice names
    useEffect(() => {
        (async () => {
            try {
                const history = await getMessages("global", 50);
                // Build map of userId -> username from history
                const map: Record<string, string> = {};
                const msgs: Msg[] = history.map((h) => {
                    if (h.user?.id) {
                        map[h.user.id] = h.user.username ?? map[h.user.id] ?? shortId(h.user.id);
                    }
                    return {
                        userId: h.user.id,
                        content: h.content,
                        ts: Date.parse(h.createdAt),
                    };
                });
                setUserMap((prev) => ({ ...prev, ...map }));
                setHistoryMsgs(msgs);
            } catch (e) {
                console.error("Failed to load history", e);
            }
        })();
    }, []);

    // merge + dedupe history and live
    const allMessages = useMemo(() => {
        const seen = new Set<string>();
        const merged: Msg[] = [];
        for (const m of [...historyMsgs, ...liveMessages]) {
            const k = key(m);
            if (seen.has(k)) continue;
            seen.add(k);
            merged.push(m);
        }
        merged.sort((a, b) => a.ts - b.ts);
        return merged;
    }, [historyMsgs, liveMessages]);

    // auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [allMessages]);

    const onSend = () => {
        const content = text.trim();
        if (!content) return;
        send(content); // let WS echo; we don't append optimistically
        setText("");
    };

    const displayNameFor = (userId: string) => {
        if (userId === myId) return myName || "You";
        return userMap[userId] || shortId(userId);
    };

    const renderBubble = (m: Msg, idx: number) => {
        const fromMe = myId === m.userId;
        const name = displayNameFor(m.userId);

        return (
            <div key={idx} className={`flex flex-row ${fromMe ? "justify-end" : "justify-start"}`}>
                <div className={`min-w-[40%] max-w-[80%] rounded-2xl px-4 py-3 ${fromMe ? "bg-[#7EB6FF] text-black" : "bg-[#EDF0F5]"}`}>
                    {/* sender name */}
                    <div className={`flex justify-start items-center gap-1 mb-1 ${fromMe ? "text-black/70" : "text-muted-foreground"}`}>
                        <Avatar className="h-8 w-8">
                            <AvatarImage src="" />
                            <AvatarFallback>{(name || "U").slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="text-[11px]">
                            {fromMe ? `${name} (you)` : name}
                        </div>
                    </div>
                    {/* message body */}
                    <div className="ml-2">{m.content}</div>
                    {/* timestamp */}
                    <div className="text-[10px] text-muted-foreground text-right mt-1">
                        {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-[360px_1fr] gap-6">
            {/* Sidebar */}
            <Card className="p-4 flex flex-col h-[calc(100vh-3rem)]">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Global Chat</h1>
                    <LogoutButton />
                </div>

                <div className="rounded-2xl bg-[#7EB6FF] p-4 mb-4">
                    <div className="flex items-center gap-2">
                        <Input placeholder="search disabled (single room)" className="bg-white" disabled />
                        <Button disabled>Find</Button>
                    </div>
                </div>

                <ScrollArea className="flex-1 pr-3">
                    <div className="text-sm text-muted-foreground px-1">
                        Everyone shares the same room in Phase 1
                    </div>
                </ScrollArea>

                {/* current user footer */}
                <div className="pt-3 mt-3 border-t">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src="" />
                            <AvatarFallback>{(myName || "U").slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="leading-tight">
                            <div className="font-medium">{myName || "You"}</div>
                            <div className="text-xs text-muted-foreground">{me?.email || shortId(myId || "user")}</div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Chat window */}
            <Card className="p-4 h-[calc(100vh-3rem)] flex flex-col">
                <div className="flex items-center gap-3 p-2">
                    <Avatar>
                        <AvatarImage src="" />
                        <AvatarFallback>G</AvatarFallback>
                    </Avatar>
                    <div className="font-semibold">Global Room</div>
                </div>
                <Separator className="my-2" />

                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-3">
                        {allMessages.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No messages yet</div>
                        ) : (
                            allMessages.map((m, idx) => renderBubble(m, idx))
                        )}
                        <div ref={bottomRef} />
                    </div>
                </ScrollArea>

                <div className="mt-3 flex items-center gap-2">
                    <Input
                        placeholder="Enter a message"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") onSend();
                        }}
                    />
                    <Button onClick={onSend}>Send</Button>
                </div>
            </Card>
        </div>
    );
}

/* helpers */
function safeGetUser(): { id: string; email?: string; username?: string } | null {
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
function key(m: Msg) {
    return `${m.userId}|${m.ts}|${m.content}`;
}
