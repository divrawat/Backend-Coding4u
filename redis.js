/*
import { createClient } from "redis";
import "dotenv/config.js";

const redisClient = createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: 6379,
        tls: true, // 🔥 REQUIRED for Valkey Serverless
    },
});

redisClient.on("error", (err) => console.log("Redis Error:", err));
redisClient.on("connect", () => console.log("Redis connected"));

await redisClient.connect();

export default redisClient;
*/