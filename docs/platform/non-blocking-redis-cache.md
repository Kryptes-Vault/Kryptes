# Non-blocking Redis Cache Integration

## Overview

The Kryptex backend utilizes Redis as a fast, high-performance cache layer to store decrypted or structural vault index schemas. While caching significantly accelerates read-heavy transactions, connection dropouts or latencies on the Redis cluster historically blocked core HTTP controllers.

To enforce zero-downtime availability, the Redis cache module has been refactored into a **non-blocking, fault-tolerant gateway**.

---

## Architecture & Failure Isolation

When the server attempts to access or invalidate cache indices, it routes requests through `backend/services/redisService.js`. If the Redis socket is closed, timed out, or returning handshake errors, the thread isolates the error and immediately falls back to direct database retrieval.

```
                           ┌──────────────────────────┐
                           │   Incoming API Request   │
                           └─────────────┬────────────┘
                                         │
                                         ▼
                            ┌────────────────────────┐
                            │ Try Cache Invalidation │
                            └────────────┬───────────┘
                                         │
                        ┌────────────────┴────────────────┐
                        ▼ [Client Online]                 ▼ [Client Offline]
            ┌──────────────────────┐           ┌──────────────────────┐
            │   Invalidate Cache   │           │   Log Warning in     │
            │   in Redis Cluster   │           │   Syslog (Safe Log)  │
            └───────────┬──────────┘           └───────────┬──────────┘
                        │                                  │
                        └────────────────┬─────────────────┘
                                         │
                                         ▼
                            ┌────────────────────────┐
                            │ Complete Controller &  │
                            │   Return Response      │
                            └────────────────────────┘
```

---

## Code Implementation Details

### Cache Invalidation Bypass (`backend/services/redisService.js`)

```javascript
export async function deleteCachedVault(userId) {
  try {
    if (!redisClient.isOpen) {
      console.warn(`[Redis Service] Client is closed. Skipping cache invalidation for user: ${userId}`);
      return;
    }
    const key = `vault:${userId}`;
    await redisClient.del(key);
    console.log(`[Redis Service] Evicted cache key: ${key}`);
  } catch (error) {
    console.error(`[Redis Service] Non-blocking cache eviction failure:`, error);
  }
}
```

### Direct Route Interception (`backend/routes/vault.ts`)

Inside the vault committing controller, cache eviction is executed without risk of halting the response stream:

```typescript
// backend/routes/vault.ts
try {
  // Save changes to database first...
  await db.saveVaultItem(payload);

  // Trigger non-blocking cache delete
  await deleteCachedVault(userId);

  return res.status(200).json({ success: true });
} catch (err) {
  return res.status(500).json({ error: "Failed to commit vault changes" });
}
```

---

## 🛠️ Verification and Smoke Testing

1. **Simulated Downtime**:
   * Terminate the local Redis service:
     ```bash
     docker stop redis-kryptes
     ```
   * Trigger a new file upload or credentials modification.
   * **Result**: The transaction completes successfully. The server outputs a warning console log but does not block the API response.

2. **Active State Verification**:
   * Start the Redis service:
     ```bash
     docker start redis-kryptes
     ```
   * Trigger vault modifications.
   * **Result**: Console outputs `[Redis Service] Evicted cache key: vault:<id>`, confirming caching is functioning correctly.
