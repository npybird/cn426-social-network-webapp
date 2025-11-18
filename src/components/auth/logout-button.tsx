"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
    const router = useRouter();

    const onLogout = async () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        router.push("/login");
    };

    return (
        <Button className="hover:bg-red-300" variant="outline" onClick={onLogout}>
            <LogOut />
            Logout
        </Button>
    );
}