import http from "http";
import { app } from "./app";
import { env } from "./config/env";
import { attachWebSocket } from "./ws";

const server = http.createServer();
server.on("request", app);
attachWebSocket(server);

server.listen(env.PORT, () => {
  console.log(`HTTP+WS listening on :${env.PORT}`);
});
