export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type FetchOptions = {
    method?: Method;
    body?: unknown;
    token?: string;            // ใช้ในโหมด Bearer (ถ้ามี)
    useCredentials?: boolean;  // ใช้ถ้า Back ใช้ cookie HttpOnly
};

export async function apiFetch<T>(
    path: string,
    { method = "GET", body, token, useCredentials = false }: FetchOptions = {}
): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        credentials: useCredentials ? "include" : "omit",
    });

    const data = (await res.json().catch(() => ({}))) as any;

    if (!res.ok) {
        const message =
            data?.error || data?.message || `Request failed with ${res.status}`;
        throw new Error(message);
    }
    return data as T;
}

/* ---------- Auth contracts ---------- */
export interface UserDTO {
    id: string;
    username: string;
    email?: string;
}

export interface AuthResponse {
    user: UserDTO;
    accessToken?: string; // ถ้าใช้โหมด Bearer
}

export interface LoginPayload {
    username: string;
    password: string;
}

export function login(
    payload: LoginPayload,
    opts?: { useCredentials?: boolean }
) {
    return apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: payload,
        useCredentials: opts?.useCredentials,
    });
}

export interface RegisterPayload {
    email: string;
    username: string;
    password: string;
}

export function register(payload: RegisterPayload) {
    return apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: payload,
    });
}
