import { WebSocket } from "ws";
import { cancelRoomExpiry, scheduleRoomExpiry } from "../events/store";

const rooms = new Map<string, Set<WebSocket>>();
const EXPIRY_TIME = 300; // 5 minutes in seconds

/**
 * Sends the current number of users in a room to everyone in that room
 */
export function broadcastUserCount(roomId: string) {
  const count = rooms.get(roomId)?.size || 0;
  broadcast(roomId, { type: "USER_COUNT", count });
}

/**
 * Handles a user joining a room
 */
export async function joinRoom(roomId: string, ws: WebSocket) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  
  rooms.get(roomId)!.add(ws);

  // 1. Cancel the Redis auto-delete timer because the room is active
  await cancelRoomExpiry(roomId);
  
  // 2. Tell everyone (including the new user) the updated count
  broadcastUserCount(roomId);
  
  console.log(`👤 User joined ${roomId}. Expiry cancelled. Total: ${rooms.get(roomId)?.size}`);
}

/**
 * Handles a user leaving a room
 */
export async function leaveRoom(roomId: string, ws: WebSocket) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.delete(ws);

  // 1. Update the user count for those remaining
  broadcastUserCount(roomId);

  // 2. If no one is left, start the 5-minute countdown to delete from Redis
  if (room.size === 0) {
    rooms.delete(roomId);
    await scheduleRoomExpiry(roomId, EXPIRY_TIME);
    console.log(`🧹 Room ${roomId} is empty. Deleting from Redis in ${EXPIRY_TIME}s`);
  }
}

/**
 * Sends data to all clients in a room
 */
export function broadcast(roomId: string, data: any, excludeWs?: WebSocket) {
  const clients = rooms.get(roomId);
  if (!clients) return;

  const payload = JSON.stringify(data);
  clients.forEach((client) => {
    // Only send if the connection is open and it's not the sender
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}