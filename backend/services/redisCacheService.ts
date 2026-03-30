import { Redis } from "ioredis";
import { encryptForCache, decryptFromCache } from "../utils/cryptoUtils";

// Initialize the Redis client. Adjust connection options as necessary.
// process.env.REDIS_URL must be defined in .env
const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const CACHE_TTL_SECONDS = 900; // 15 minutes

export const redisCacheService = {
  /**
   * Retrieves and decrypts vault items for a given user from Redis.
   * Returns parsed JSON array if successful, or null if not found.
   */
  async getCachedVaultItems(userId: string, itemType: string): Promise<any[] | null> {
    try {
      const cacheKey = `vault:${itemType}:${userId}`;
      const encryptedData = await redisClient.get(cacheKey);

      if (!encryptedData) {
        return null;
      }

      console.log(`[Cache Hit] Securely retrieving ${itemType} items for user: ${userId}`);
      const plaintextJSON = decryptFromCache(encryptedData);
      return JSON.parse(plaintextJSON);
    } catch (error: any) {
      console.error(`[RedisService] Failed to get or decrypt cached items for user ${userId}:`, error.message);
      // Fail open: Treat decryption errors or corrupt cache as a cache miss
      return null;
    }
  },

  /**
   * Encrypts and saves an array of vault items to Redis.
   * Ensures plaintext is never stored in memory/Redis directly.
   * Applies a 15-minute TTL.
   */
  async setCachedVaultItems(userId: string, itemType: string, items: any[]): Promise<void> {
    try {
      const cacheKey = `vault:${itemType}:${userId}`;
      const plaintextJSON = JSON.stringify(items);
      
      const encryptedData = encryptForCache(plaintextJSON);

      console.log(`[Cache Write] Securely caching ${itemType} items for user: ${userId} (TTL: ${CACHE_TTL_SECONDS}s)`);
      await redisClient.setex(cacheKey, CACHE_TTL_SECONDS, encryptedData);
    } catch (error: any) {
      console.error(`[RedisService] Failed to encrypt or set cached ${itemType} items for user ${userId}:`, error.message);
      // Non-fatal. Let the system function without caching if Redis/Crypto fails.
    }
  },

  /**
   * Invalidates (deletes) the specific cache key for a user and item type.
   * Call this after any write operation (Add/Edit/Delete) in the vault.
   */
  async invalidateVaultCache(userId: string, itemType: string): Promise<void> {
    try {
      const cacheKey = `vault:${itemType}:${userId}`;
      console.log(`[Cache Invalidate] Clearing ${itemType} cache for user: ${userId}`);
      await redisClient.del(cacheKey);
    } catch (error: any) {
      console.error(`[RedisService] Failed to invalidate cache for user ${userId}:`, error.message);
    }
  }
};
