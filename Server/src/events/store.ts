import { redis } from "../redis/client";

export const saveEvent = async (roomId: string, event: any) => {
  const key = `room:${roomId}:events`;
  await redis.rpush(key, JSON.stringify(event));
};

export const getEvents = async (roomId: string) => {
  const key = `room:${roomId}:events`;
  const data = await redis.lrange(key, 0, -1);
  return data.map((item) => JSON.parse(item));
};

export const deleteRoomData = async (roomId: string, seconds: number) => {
  await redis.expire(`room:${roomId}:events`, seconds);
};

export const keepRoomData = async (roomId: string) => {
  await redis.persist(`room:${roomId}:events`);
};

export async function scheduleRoomExpiry(roomId: string, seconds: number) {
  const key = `room:${roomId}:events`;
  await redis.expire(key, seconds);
}

export async function cancelRoomExpiry(roomId: string) {
  const key = `room:${roomId}:events`;
  await redis.persist(key); // This removes the timer and keeps the data
}