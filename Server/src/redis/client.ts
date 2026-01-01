import { Redis } from "ioredis";

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
 // maxRetriesPerRequest: null
};

export const redis = new Redis(REDIS_CONFIG);

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error", err));