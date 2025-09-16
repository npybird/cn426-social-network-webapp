"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

export function LogoutButton() {
    const router = useRouter();

    const onLogout = async () => {
        try {
            // เรียก logout ที่ฝั่ง Back (ปรับ path ถ้าใช้ของคุณต่างกัน)
            await apiFetch<unknown>("/auth/logout", {
                method: "POST",
                useCredentials: true, // ใช้คุกกี้ HttpOnly
            });
        } catch (e) {
            // เงียบไว้ก็ได้ ไม่เป็นไร (บาง Back ไม่มี endpoint นี้)
            console.error(e);
        } finally {
            // ถ้าเคยใช้โหมด Bearer
            try {
                localStorage.removeItem("accessToken");
            } catch { }

            // กลับหน้า login
            router.replace("/login");
        }
    };

    return (
        <Button variant="outline" onClick={onLogout}>
            Logout
        </Button>
    );
}
