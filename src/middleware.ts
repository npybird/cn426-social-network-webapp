// src/middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** ชื่อคุกกี้สำหรับเช็คล็อกอิน (แก้ให้ตรงกับแบ็กเอนด์ได้) */
const AUTH_COOKIE =
    process.env.NEXT_PUBLIC_AUTH_COOKIE?.trim() || "accessToken";

/** เปิด/ปิดการ์ดได้ด้วย ENV (true = ปิดการ์ด เข้าทุกหน้าได้) */
const DISABLE_AUTH_GUARD =
    process.env.NEXT_PUBLIC_DISABLE_AUTH_GUARD === "true";

// เส้นทางที่ “ปกติ” ต้องล็อกอินก่อน
const PROTECTED_MATCHERS = ["/chat"];

// หน้า auth (ถ้าล็อกอินแล้วจะกันเข้า)
const AUTH_PAGES = ["/login", "/register"];

export function middleware(req: NextRequest) {
    // —— โหมดทดสอบ: ปิดการ์ดทั้งหมด ชั่วคราว ——
    if (DISABLE_AUTH_GUARD) {
        return NextResponse.next();
    }

    const { pathname } = req.nextUrl;

    // ตรวจว่ามีคุกกี้ auth ไหม
    const hasAuth =
        !!req.cookies.get(AUTH_COOKIE) ||
        !!req.cookies.get("session") ||
        !!req.cookies.get("sessionid") ||
        !!req.cookies.get("auth_session");

    // 1) กันหน้า protected
    if (PROTECTED_MATCHERS.some((p) => pathname.startsWith(p))) {
        if (!hasAuth) {
            const url = req.nextUrl.clone();
            url.pathname = "/login";
            url.searchParams.set("next", pathname);
            return NextResponse.redirect(url);
        }
    }

    // 2) กันเข้า /login /register ถ้าล็อกอินแล้ว
    if (AUTH_PAGES.includes(pathname) && hasAuth) {
        const url = req.nextUrl.clone();
        url.pathname = "/chat";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

// ระบุเส้นทางที่ middleware ทำงาน
export const config = {
    matcher: ["/login", "/register"],
};
