import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * ตั้งชื่อคุกกี้ที่ใช้ยืนยันตัวตน (แก้ได้ตามแบ็กเอนด์ของคุณ)
 * - ถ้าใช้ JWT ในคุกกี้: ตั้งชื่อจริง เช่น "accessToken" หรือ "sessionid"
 * - สามารถตั้งผ่าน .env.local: NEXT_PUBLIC_AUTH_COOKIE=accessToken
 */
const AUTH_COOKIE =
    process.env.NEXT_PUBLIC_AUTH_COOKIE?.trim() || "accessToken";

// เส้นทางที่ต้องการป้องกัน (ต้องล็อกอินก่อน)
const PROTECTED_MATCHERS = ["/chat"];

// เส้นทางสำหรับ auth (ถ้าล็อกอินแล้ว จะไม่ให้เข้ามาอีก)
const AUTH_PAGES = ["/login", "/register"];

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // ตรวจว่ามีคุกกี้ auth ไหม
    const hasAuth =
        !!req.cookies.get(AUTH_COOKIE) ||
        !!req.cookies.get("session") ||
        !!req.cookies.get("sessionid") ||
        !!req.cookies.get("auth_session");

    // ป้องกันหน้า protected: ถ้าไม่มีคุกกี้จะเด้งไป /login
    if (PROTECTED_MATCHERS.some((p) => pathname.startsWith(p))) {
        if (!hasAuth) {
            const url = req.nextUrl.clone();
            url.pathname = "/login";
            // ใส่ next= กลับหน้าที่ถูกกันไว้ (optional)
            url.searchParams.set("next", pathname);
            return NextResponse.redirect(url);
        }
    }

    // กันเข้าหน้า /login /register ถ้าล็อกอินแล้วจะไป /chat
    if (AUTH_PAGES.includes(pathname)) {
        if (hasAuth) {
            const url = req.nextUrl.clone();
            url.pathname = "/chat";
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

/**
 * กำหนดเส้นทางที่ middleware ทำงาน
 * เพิ่ม/ลด matcher ได้ตามต้องการ
 */
export const config = {
    // matcher: ["/login", "/register", "/chat/:path*"],
    matcher: ["/login", "/register"],
};
