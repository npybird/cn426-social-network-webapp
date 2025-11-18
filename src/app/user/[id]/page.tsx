"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/axios";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import { openDM } from "@/lib/api";

export default function UserProfilePage() {
    const { id } = useParams();
    const router = useRouter();

    const [user, setUser] = useState<any>(null);

    const me =
        typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("user") || "null")
            : null;

    const isMe = me?.id === id;

    useEffect(() => {
        async function load() {
            try {
                const res = await api.get(`/users/${id}`);
                setUser(res.data);
            } catch (err) {
                console.error("Failed to load user:", err);
            }
        }
        load();
    }, [id]);

    const startDM = async () => {
        try {
            const { roomId } = await openDM(id as string);
            router.push(`/chat/${roomId}`);
        } catch (err) {
            console.error("Failed to open DM", err);
        }
    };

    if (!user)
        return (
            <div className="flex justify-center items-center h-screen text-lg">
                Loading profile...
            </div>
        );

    return (
        <div className="flex justify-center p-6">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="flex flex-col items-center space-y-3">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src="" />
                        <AvatarFallback>
                            {user.username?.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <CardTitle className="text-2xl font-bold">
                        {user.username}
                    </CardTitle>
                </CardHeader>

                <Separator />

                <CardContent className="space-y-4 mt-4">
                    <div>
                        <p className="text-sm font-semibold text-gray-500">Email</p>
                        <p className="text-base">{user.email}</p>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-gray-500">User ID</p>
                        <p className="text-base break-all">{user.id}</p>
                    </div>

                    {!isMe && (
                        <Button
                            onClick={startDM}
                            className="bg-blue-600 hover:bg-blue-700 w-full mt-6"
                            variant="default"
                        >
                            Send Message
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
