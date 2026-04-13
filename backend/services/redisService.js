const { createClient } = require("redis");

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redisClient = createClient({
  url: redisUrl,
});

let lastRedisErrorLine = "";
redisClient.on("error", (err) => {
  const fromMessage = err && typeof err.message === "string" ? err.message.trim() : "";
  const msg = fromMessage || (err != null ? String(err) : "Unknown error");
  const line = `[local] ⚠️ Redis: ${msg}`;
  if (line === lastRedisErrorLine) return;
  lastRedisErrorLine = line;
  console.warn(line);
});
redisClient.on("connect", () => console.log("[local] ✅ Redis: Connecting..."));
redisClient.on("ready", () => console.log("[local] ✅ Redis: Connected and ready!"));

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    const msg = err && typeof err.message === "string" ? err.message : String(err);
    console.warn(`[local] ⚠️ Redis: Connection failed: ${msg}`);
  }
};

/** Resolves after first `ready`, or after `ms` if Redis never becomes ready (startup continues). */
function whenRedisReadyOrTimeout(ms = 15000) {
  return new Promise((resolve) => {
    if (redisClient.isReady) {
      resolve(undefined);
      return;
    }
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(to);
      resolve(undefined);
    };
    const to = setTimeout(finish, ms);
    redisClient.once("ready", finish);
  });
}

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
    EX: 900,
  });
};

const deleteCachedVault = async (userId) => {
  await connectRedis();
  if (redisClient?.isOpen) {
    await Promise.all([
      redisClient.del(`vault:${userId}`),
      redisClient.del(`documents:${userId}`),
    ]);
  }
};

module.exports = { getCachedVault, setCachedVault, deleteCachedVault, whenRedisReadyOrTimeout, redisClient, connectRedis };
