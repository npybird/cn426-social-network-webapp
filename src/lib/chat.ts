import { apiFetch, type AuthResponse } from "@/lib/api";

export interface ChatThread {
    id: string;
    name: string;          // ชื่อเพื่อน/ห้อง
    avatar?: string;
    lastMessage?: string;
    updatedAt: string;     // ISO string
}

export interface ChatMessage {
    id: string;
    threadId: string;
    senderId: string;
    text: string;
    createdAt: string;     // ISO string
}

export interface SendMessagePayload {
    threadId: string;
    text: string;
}

/** ดึง user ปัจจุบัน (ไว้เทียบว่า message ไหนเป็นของฉัน) */
export function getMe(opts?: { useCredentials?: boolean; token?: string }) {
    return apiFetch<AuthResponse>("/auth/me", {
        method: "GET",
        useCredentials: opts?.useCredentials,
        ...(opts?.token ? { token: opts.token } : {}),
    });
}

/** รายการห้อง/เพื่อน */
export function listThreads(opts?: { useCredentials?: boolean; token?: string }) {
    return apiFetch<ChatThread[]>("/chat/threads", {
        method: "GET",
        useCredentials: opts?.useCredentials,
        ...(opts?.token ? { token: opts.token } : {}),
    });
}

/** ข้อความในห้อง */
export function getMessages(
    threadId: string,
    opts?: { useCredentials?: boolean; token?: string }
) {
    // ถ้าแบ็กเอนด์ใช้ query string ให้ปรับ path ตามจริง เช่น /chat/messages?threadId=...
    return apiFetch<ChatMessage[]>(`/chat/threads/${threadId}/messages`, {
        method: "GET",
        useCredentials: opts?.useCredentials,
        ...(opts?.token ? { token: opts.token } : {}),
    });
}

/** ส่งข้อความ */
export function sendMessage(
    payload: SendMessagePayload,
    opts?: { useCredentials?: boolean; token?: string }
) {
    return apiFetch<ChatMessage>("/chat/messages", {
        method: "POST",
        body: payload,
        useCredentials: opts?.useCredentials,
        ...(opts?.token ? { token: opts.token } : {}),
    });
}
