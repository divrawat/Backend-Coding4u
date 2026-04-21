// config/redis.js
import { createClient } from "redis";
import "dotenv/config.js";

const redisClient = createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
    },
});

redisClient.on("error", (err) => {
    console.log("Redis Error:", err);
});

await redisClient.connect();

export default redisClient;