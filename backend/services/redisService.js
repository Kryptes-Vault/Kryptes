const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379"
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

const connectRedis = async () => {
    if (!redisClient.isOpen) await redisClient.connect();
};

const getCachedVault = async (userId) => {
    await connectRedis();
    return await redisClient.get(`vault:${userId}`);
};

const setCachedVault = async (userId, encryptedString) => {
    await connectRedis();
    // 15-minute TTL (900 seconds)
    await redisClient.set(`vault:${userId}`, encryptedString, {
        EX: 900
    });
};

module.exports = { getCachedVault, setCachedVault };
