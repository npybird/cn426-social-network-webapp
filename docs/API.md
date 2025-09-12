# CN426 Social-Network-Webapp (Backend) – API Docs (Phase-1)

> Backend: Node.js + Express + Prisma (SQLite)
> Realtime: **Hand-rolled WebSocket (RFC6455)** (no Socket.IO/Pusher)
> Auth: JWT (HS256), header `Authorization: Bearer <token>`

## Base URLs

- Local dev: `http://localhost:8080`
- Production: `https://<your-backend-host>`

---

## Auth

### POST `/auth/signup`

Create a new user.

**Request (JSON)**

```json
{
  "email": "a@a.com",
  "username": "alice",
  "password": "secret123"
}
```

**Responses**

- `201 Created`

  ```json
  { "id": "clxxx...", "email": "a@a.com", "username": "alice" }
  ```

- `400 Bad Request` – invalid fields (zod errors)
- `409 Conflict` – email/username taken

---

### POST `/auth/login`

Login and get a JWT.

**Request (JSON)**

```json
{
  "emailOrUsername": "alice",
  "password": "secret123"
}
```

**Response `200 OK`**

```json
{
  "token": "<JWT>",
  "user": { "id": "clxxx...", "email": "a@a.com", "username": "alice" }
}
```

**Errors**

- `400 Bad Request` – invalid payload
- `401 Unauthorized` – wrong credentials

---

### GET `/auth/me`

Get current user profile.
**Headers:** `Authorization: Bearer <JWT>`

**Response `200 OK`**

```json
{ "id": "clxxx...", "email": "a@a.com", "username": "alice" }
```

**Errors**

- `401 Unauthorized` – missing/invalid token
- `404 Not Found` – user not found

---

## Messages (history)

### GET `/messages`

Fetch recent messages for a room (default: `global`).

**Query params**

- `room` (string, optional, default `"global"`)
- `limit` (number, optional, default 50, max 100)
- `before` (ISO datetime, optional; fetch messages **createdAt < before**)

**Example**

```
GET /messages?room=global&limit=50
```

**Response `200 OK`**

```json
[
  {
    "id": "clmsg1...",
    "userId": "cluser1...",
    "room": "global",
    "content": "hello CN426",
    "createdAt": "2025-09-12T00:45:12.345Z",
    "user": { "id": "cluser1...", "username": "alice" }
  }
]
```

---

## WebSocket – Realtime Chat

**Endpoint**

```
ws://<HOST>/ws?token=<JWT>&room=<roomName>
```

- **`token`**: required (JWT from `/auth/login`)
- **`room`**: optional (default `"global"`). Any string → channel identifier.

**Handshake**

- Standard RFC6455: client sends `Upgrade: websocket`; server replies `101` with `Sec-WebSocket-Accept`.
- Server verifies JWT during upgrade; invalid token → `401 Unauthorized` (connection closed).

**Client → Server messages (JSON, text frames)**

```json
{ "type": "chat", "content": "hello world" }
```

**Server rules**

- `content` trimmed, **1–500 chars**; else ignored.
- Throttle: **≥ 200 ms** between sends per connection.
- On a valid chat:

  1. Persist to DB (`Message` row with `room`, `userId`, `content`, `createdAt`).
  2. Broadcast to all clients in the same `room`.

**Server → Client messages**

```json
{
  "kind": "chat",
  "payload": {
    "userId": "cluser1...",
    "content": "hello world",
    "ts": 1757650000000
  }
}
```

Optional initial info:

```json
{ "kind": "info", "payload": { "msg": "connected", "room": "global" } }
```

**Control frames**

- Server responds to **ping** with **pong**.
- Server sends periodic **ping** (\~30s) to keep the connection alive.
- Close frames are handled gracefully.

---

## Data Model (Prisma)

```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  username  String    @unique
  password  String
  createdAt DateTime  @default(now())
  messages  Message[]
}

model Message {
  id        String   @id @default(cuid())
  userId    String
  room      String
  content   String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  @@index([room, createdAt])
}
```

---

## Auth Details

- Algorithm: **HS256**
- Header: `Authorization: Bearer <token>`
- Claims used:

  - `sub`: user id
  - `exp`: expiration (e.g., 7 days)

- **Do not** rotate `JWT_SECRET` casually; changing it will invalidate all existing tokens.

---

## Error Codes

| Endpoint       | Code | Meaning                                          |
| -------------- | ---- | ------------------------------------------------ |
| `/auth/*`      | 400  | Invalid payload                                  |
| `/auth/*`      | 401  | Unauthorized / bad credentials                   |
| `/auth/signup` | 409  | Email/username already exists                    |
| `/messages`    | 200  | OK (empty array if none)                         |
| `WS /ws`       | 401  | Invalid/missing JWT (upgrade)                    |
| `WS /ws`       | 426  | (If you hit HTTP route) Upgrade Required (debug) |

---

## Quick Testing

### Postman – REST

- **Signup** `POST /auth/signup` (JSON body).
- **Login** `POST /auth/login` → copy `token`.
- **Me** `GET /auth/me` with `Authorization: Bearer <token>`.
- **History** `GET /messages?room=global&limit=20`.

### Postman – WebSocket

- New → **WebSocket Request**
  `ws://localhost:8080/ws?token=<JWT>&room=global`
- Send:

  ```json
  { "type": "chat", "content": "hello CN426" }
  ```

- Open a second WS tab with another user/token to verify broadcast.

---

## Frontend Contract (summary)

- **Login flow:** call `/auth/login` → store `{ token, user }`; send `Authorization` for `/auth/me`; pass `token` in WS URL.
- **History:** `GET /messages?room=<room>&limit=50` → render.
- **Realtime:** open WS and:

  - send `{type:"chat", content:string}`
  - handle `{kind:"chat", payload:{userId, content, ts}}`

---

## Security & Limits

- Passwords stored as bcrypt hashes.
- Message content capped to 500 chars; per-connection throttle 200 ms.
- CORS origin controlled via env (`CORS_ORIGIN`) for REST.
- For WS, consider checking `req.headers.origin` before accepting in production.

---

## Environment Variables

```
PORT=8080
DATABASE_URL="file:./dev.db"
JWT_SECRET="<strong-random-hex>"
CORS_ORIGIN="http://localhost:3000"
```

> Do not commit `.env`. Set these in your host’s dashboard for production.

---

## Changelog

- **Phase-1**: Auth + group chat (`room=global`) with history + hand-rolled WebSocket.
