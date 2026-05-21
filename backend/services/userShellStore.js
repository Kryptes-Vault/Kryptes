const crypto = require("crypto");
const Redis = require("ioredis");

let redis;
const memory = new Map();

function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: false,
      connectTimeout: 2000,
      retryStrategy: () => null, // Do not retry; fail fast and fallback to memory
    });
    // Add simple error listener to prevent unhandled rejection/error event process crashes
    redis.on("error", (err) => {
      console.warn("⚠️ [userShellStore] ioredis client connection error:", err.message);
    });
  }
  return redis;
}

function shellKey(provider, providerId) {
  const safeProvider = String(provider).toLowerCase();
  const safeId = String(providerId);
  return `kryptex:shell:${safeProvider}:${safeId}`;
}

function opaqueUserId(provider, providerId) {
  return crypto
    .createHash("sha256")
    .update(`${provider}:${providerId}`)
    .digest("hex");
}

function idIndexKey(id) {
  return `kryptex:userbyid:${id}`;
}

/**
 * Minimal persisted user record ("shell") for zero-knowledge onboarding.
 * Stores provider identity + non-secret profile fields only.
 */
async function ensureShellUser({ provider, providerId, email, displayName, avatarUrl }) {
  const id = opaqueUserId(provider, providerId);
  const record = {
    id,
    provider,
    providerId: String(providerId),
    email: email || null,
    displayName: displayName || null,
    avatarUrl: avatarUrl || null,
    updatedAt: new Date().toISOString(),
  };

  const key = shellKey(provider, providerId);
  const client = getRedis();

  let merged;
  let isNew = false;
  let redisSuccess = false;

  if (client) {
    try {
      const existing = await client.get(key);
      if (!existing) {
        isNew = true;
        record.createdAt = record.updatedAt;
        merged = record;
        await client.set(key, JSON.stringify(merged));
      } else {
        const prev = JSON.parse(existing);
        merged = { ...prev, ...record, createdAt: prev.createdAt || record.updatedAt };
        await client.set(key, JSON.stringify(merged));
      }
      await client.set(idIndexKey(merged.id), JSON.stringify(merged));
      redisSuccess = true;
    } catch (redisErr) {
      console.warn("⚠️ [userShellStore] Redis operation failed, falling back to memory store:", redisErr.message);
    }
  }

  if (!redisSuccess) {
    if (!memory.has(key)) {
      isNew = true;
      record.createdAt = record.updatedAt;
      merged = record;
      memory.set(key, merged);
    } else {
      const prev = memory.get(key);
      merged = { ...prev, ...record };
      memory.set(key, merged);
    }
    memory.set(idIndexKey(merged.id), merged);
  }

  return { user: merged, isNew };
}

async function findById(id) {
  const client = getRedis();
  if (client) {
    try {
      const raw = await client.get(idIndexKey(id));
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (redisErr) {
      console.warn("⚠️ [userShellStore] Redis findById failed, falling back to memory store:", redisErr.message);
    }
  }
  return memory.get(idIndexKey(id)) || null;
}

module.exports = {
  ensureShellUser,
  findById,
};
