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

export type HistoryItem = {
  id: string;
  userId: string;
  room: string;
  content: string;
  createdAt: string;
  user: { id: string; username: string };
};

export const getMessages = (room = "global", limit = 50) =>
  api
    .get<HistoryItem[]>("/messages", { params: { room, limit } })
    .then((r) => r.data);
