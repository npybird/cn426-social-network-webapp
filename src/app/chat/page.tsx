"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import type { UserDTO } from "@/lib/api";
import {
    getMe,
    listThreads,
    getMessages,
    sendMessage,
    type ChatThread,
    type ChatMessage,
} from "@/lib/chat";
import { LogoutButton } from "@/components/auth/logout-button";

export default function ChatPage() {
    const [me, setMe] = useState<UserDTO | null>(null);
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [selected, setSelected] = useState<ChatThread | null>(null);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [text, setText] = useState("");
    const [loadingThreads, setLoadingThreads] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);

    const bottomRef = useRef<HTMLDivElement | null>(null);

    // โหลดข้อมูล user ปัจจุบัน (ไว้เช็คว่าใครคือฉัน)
    useEffect(() => {
        (async () => {
            try {
                const res = await getMe({ useCredentials: true });
                setMe(res.user);
            } catch {
                // ถ้าดึง me ไม่ได้ ก็ยังให้แสดง UI ได้
            }
        })();
    }, []);

    // โหลดรายการห้อง/เพื่อน
    useEffect(() => {
        (async () => {
            setLoadingThreads(true);
            try {
                const t = await listThreads({ useCredentials: true });
                setThreads(t);
                if (!selected && t.length > 0) setSelected(t[0]);
            } catch (e) {
                console.error("Failed to load threads", e);
            } finally {
                setLoadingThreads(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // โหลดข้อความของห้องที่เลือก + polling ทุก 3 วิ
    useEffect(() => {
        if (!selected) {
            setMessages([]);
            return;
        }
        let mounted = true;

        const load = async () => {
            setLoadingMessages(true);
            try {
                const list = await getMessages(selected.id, { useCredentials: true });
                if (mounted) setMessages(list);
            } catch (e) {
                console.error("Failed to load messages", e);
            } finally {
                if (mounted) setLoadingMessages(false);
            }
        };

        load();
        const t = setInterval(load, 3000);
        return () => {
            mounted = false;
            clearInterval(t);
        };
    }, [selected]);

    // scroll ลงล่างเมื่อข้อความเปลี่ยน
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages]);

    // ส่งข้อความ
    const onSend = async () => {
        const content = text.trim();
        if (!content || !selected) return;

        setText("");

        try {
            const saved = await sendMessage(
                { threadId: selected.id, text: content },
                { useCredentials: true }
            );
            setMessages((prev) => [...prev, saved]);
        } catch (e) {
            console.error("Send failed", e);
            setText(content); // ใส่คืนให้ผู้ใช้แก้/ลองส่งซ้ำ
        }
    };

    const renderBubble = (m: ChatMessage) => {
        const fromMe = me ? m.senderId === me.id : false;
        return (
            <div
                key={m.id}
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${fromMe ? "ml-auto bg-[#7EB6FF] text-black" : "bg-white"
                    }`}
            >
                <div>{m.text}</div>
                <div className="text-[10px] text-muted-foreground text-right mt-1">
                    {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </div>
            </div>
        );
    };

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-[360px_1fr] gap-6">
            {/* Sidebar */}
            <Card className="p-4">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Chat Room</h1>
                    <LogoutButton />
                </div>

                <div className="rounded-2xl bg-[#7EB6FF] p-4 mb-4">
                    <div className="flex items-center gap-2">
                        <Input placeholder="search friends / rooms" className="bg-white" />
                        <Button>Find</Button>
                    </div>
                </div>

                <ScrollArea className="h-[70vh] pr-3">
                    {loadingThreads ? (
                        <div className="text-sm text-muted-foreground px-1">Loading...</div>
                    ) : threads.length === 0 ? (
                        <div className="text-sm text-muted-foreground px-1">
                            No conversations yet
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {threads.map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setSelected(f)}
                                    className={`rounded-2xl p-3 text-left transition ${selected?.id === f.id
                                        ? "bg-[#d6e7ff]"
                                        : "bg-[#EDF0F5] hover:bg-[#e6eaf1]"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={f.avatar} />
                                            <AvatarFallback>{f.name?.[0] ?? "U"}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="font-semibold truncate">{f.name}</div>
                                            <div className="text-sm text-muted-foreground truncate">
                                                {f.lastMessage ?? " "}
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground whitespace-nowrap pl-2">
                                            {f.updatedAt ? formatTime(f.updatedAt) : ""}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </Card>

            {/* Chat window */}
            <Card className="p-4 min-h-[75vh] flex flex-col">
                {!selected ? (
                    <div className="flex-1 grid place-items-center text-2xl text-muted-foreground">
                        Start a conversation!
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 p-2">
                            <Avatar>
                                <AvatarImage src={selected.avatar} />
                                <AvatarFallback>{selected.name?.[0] ?? "U"}</AvatarFallback>
                            </Avatar>
                            <div className="font-semibold">{selected.name}</div>
                        </div>
                        <Separator className="my-2" />

                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-3">
                                {loadingMessages ? (
                                    <div className="text-sm text-muted-foreground">Loading...</div>
                                ) : messages.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">
                                        No messages yet
                                    </div>
                                ) : (
                                    messages.map(renderBubble)
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
                    </>
                )}
            </Card>
        </div>
    );
}
