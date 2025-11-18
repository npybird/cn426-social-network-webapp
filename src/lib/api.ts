// lib/api.ts
import { api } from "./axios";

export type User = { id: string; email: string; username: string };
export type LoginResp = { token: string; user: User };

export const signup = (p: {
  email: string;
  username: string;
  password: string;
}) => api.post<User>("/auth/signup", p).then((r) => r.data);

export const login = (p: { emailOrUsername: string; password: string }) =>
  api.post<LoginResp>("/auth/login", p).then((r) => r.data);

export const me = () => api.get<User>("/auth/me").then((r) => r.data);

// Updated type
export type HistoryItem = {
  id: string;
  userId: string;
  roomId: string;
  content: string;
  createdAt: string;
  user: { id: string; username: string };
};

// Updated API: use roomId
export const getMessages = (roomId: string, limit = 50) =>
  api
    .get<HistoryItem[]>("/messages", {
      params: { roomId, limit },
    })
    .then((r) => r.data);

export const getMyRooms = () =>
  api
    .get<{ roomId: string; name: string; isGroup: boolean }[]>("/rooms/my")
    .then((r) => r.data);

export const openDM = (otherUserId: string) =>
  api
    .post<{ roomId: string; name: string; isGroup: boolean }>(
      "/rooms/open-dm",
      { otherUserId }
    )
    .then((r) => r.data);

export const createGroup = (name: string, members: string[]) =>
  api.post("/rooms/create-group", { name, members }).then((r) => r.data);
