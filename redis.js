// config/redis.js
import { createClient } from "redis";

const redisClient = createClient({
    socket: {
        host: "divyanshu-cache-t3ku13.serverless.aps1.cache.amazonaws.com:6379",
        port: 6379,
    },
});

redisClient.on("error", (err) => {
    console.log("Redis Error:", err);
});

await redisClient.connect();

export default redisClient;