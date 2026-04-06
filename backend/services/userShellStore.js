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
async function ensureShellUser({ provider, providerId, email, displayName }) {
  const id = opaqueUserId(provider, providerId);
  const record = {
    id,
    provider,
    providerId: String(providerId),
    email: email || null,
    displayName: displayName || null,
    updatedAt: new Date().toISOString(),
  };

  const key = shellKey(provider, providerId);
  const client = getRedis();

  let merged;
  if (client) {
    const existing = await client.get(key);
    if (!existing) {
      record.createdAt = record.updatedAt;
      merged = record;
      await client.set(key, JSON.stringify(merged));
    } else {
      const prev = JSON.parse(existing);
      merged = { ...prev, ...record, createdAt: prev.createdAt || record.updatedAt };
      await client.set(key, JSON.stringify(merged));
    }
    await client.set(idIndexKey(merged.id), JSON.stringify(merged));
  } else {
    if (!memory.has(key)) {
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

  return merged;
}

async function findById(id) {
  const client = getRedis();
  if (!client) {
    return memory.get(idIndexKey(id)) || null;
  }
  const raw = await client.get(idIndexKey(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

module.exports = {
  ensureShellUser,
  findById,
};
