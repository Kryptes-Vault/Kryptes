const { createClient } = require("redis");

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
console.log(`[Status] Redis Service: Initializing with ${redisUrl.includes('@') ? 'remote URL' : 'local/standard URL'}`);

const redisClient = createClient({
  url: redisUrl
});

redisClient.on("error", (err) => console.error("❌ Redis Client Error", err));
redisClient.on("connect", () => console.log("✅ Redis: Connecting..."));
redisClient.on("ready", () => console.log("✅ Redis: Connected and ready!"));

const connectRedis = async () => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
    } catch (err) {
        console.error("❌ Redis Connection Failed:", err.message);
    }
};

// Auto-connect on module load to verify connection
connectRedis();

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
