"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
    const router = useRouter();

    const onLogout = async () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        router.push("/login");
    };

    return (
        <Button variant="outline" onClick={onLogout}>
            Logout
        </Button>
    );
}