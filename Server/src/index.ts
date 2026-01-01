import { WebSocketServer } from "ws";
import { handleWS } from "./ws/handler";

const PORT = 8080;

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws) => {
  console.log("🔌 Client connected");
  handleWS(ws);
});

console.log(`🚀 WebSocket server running on ws://localhost:${PORT}`);
