"use client";

import { useState, useEffect } from "react";
import { createGroup } from "@/lib/api";
import { api } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export function CreateGroupButton() {
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [groupName, setGroupName] = useState("");
    const [selected, setSelected] = useState<string[]>([]);

    // load all users
    useEffect(() => {
        async function load() {
            try {
                const res = await api.get("/users/all");
                setUsers(res.data);
            } catch (err) {
                console.error("Failed to load users", err);
            }
        }
        load();
    }, []);

    const toggle = (id: string) => {
        setSelected((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id]
        );
    };

    const create = async () => {
        if (!groupName.trim()) return alert("Please enter group name");
        if (selected.length === 0) return alert("Select at least 1 member");

        try {
            const data = await createGroup(groupName, selected);
            setOpen(false);
            router.push(`/chat/${data.roomId}`);
        } catch (err) {
            console.error("Failed to create group", err);
            alert("Error creating group");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Plus />
                    New Group
                </Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Group</DialogTitle>
                </DialogHeader>

                {/* group name */}
                <div className="space-y-2 mt-2">
                    <label className="text-sm font-medium">Group Name</label>
                    <Input
                        placeholder="Enter group name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                    />
                </div>

                {/* members */}
                <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Select Members</div>
                    <div className="max-h-60 overflow-y-auto border rounded p-3 space-y-2">
                        {users.map((u) => (
                            <label key={u.id} className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={selected.includes(u.id)}
                                    onChange={() => toggle(u.id)}
                                />
                                <span>{u.username}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={create}>Create</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
