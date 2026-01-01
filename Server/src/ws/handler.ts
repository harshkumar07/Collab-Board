import { WebSocket } from "ws";
import { redis } from "../redis/client";
import { joinRoom, leaveRoom, broadcast } from "./rooms";
import { saveEvent, getEvents } from "../events/store";

export function handleWS(ws: WebSocket) {
    let currentRoom: string | null = null;

    ws.on("message", async (message) => {
        let data: any;
        try {
            data = JSON.parse(message.toString().trim());
        } catch (err) {
            ws.send(JSON.stringify({ type: "ERROR", message: "invalid JSON" }));
            return;
        }

        try {
            switch (data?.type) {
                case "JOIN_ROOM": {
                    const newRoom = data.roomId.toLowerCase();
                    if (!newRoom) {
                        ws.send(JSON.stringify({ type: "ERROR", message: "missing roomId" }));
                        break;
                    }

                    // If switching rooms, leave the old one first
                    if (currentRoom && currentRoom !== newRoom) {
                        await leaveRoom(currentRoom, ws);
                    }

                    currentRoom = newRoom;
                    await joinRoom(currentRoom as string, ws);

                    // Sync existing history to the new user
                    const events = await getEvents(currentRoom as string);
                    ws.send(JSON.stringify({ type: "SYNC_EVENTS", events }));
                    break;
                }

                case "EVENT": {
                    // Guard clause: Fixes "string | null" TypeScript error
                    if (!currentRoom) {
                        ws.send(JSON.stringify({ type: "ERROR", message: "not joined to a room" }));
                        break;
                    }

                    if (!data.event) {
                        ws.send(JSON.stringify({ type: "ERROR", message: "missing event data" }));
                        break;
                    }

                    // Save to Redis and broadcast to others
                    await saveEvent(currentRoom, data.event);
                    broadcast(currentRoom, data, ws);
                    break;
                }
                case "CLEAR_CANVAS": {
                    if (!currentRoom) break;

                    // Use the EXACT same key format as your saveEvent function
                    const key = `room:${currentRoom}:events`;

                    // Perform the deletion
                    const deleteCount = await redis.del(key);

                    console.log(`🧹 Redis Key ${key} deleted: ${deleteCount > 0}`);

                    // Tell everyone to wipe their screen
                    broadcast(currentRoom, { type: "CLEAR_CANVAS" });
                    break;
                }
                default:
                    ws.send(JSON.stringify({ type: "ERROR", message: "unknown message type" }));
            }
        } catch (err) {
            console.error("WS handler error:", err);
            try {
                ws.send(JSON.stringify({ type: "ERROR", message: "internal server error" }));
            } catch (e) { }
        }
    });

    ws.on("close", async () => {
        if (currentRoom) {
            await leaveRoom(currentRoom, ws);
            currentRoom = null;
        }
    });
}