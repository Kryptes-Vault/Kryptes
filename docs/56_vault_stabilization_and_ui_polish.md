# Protocol 56 — Vault Stabilization and Premium UI Polish Specification

> **Status**: ACTIVE  
> **Author**: Kryptex Engineering  
> **Created**: 2026-05-31  
> **Affects**: `backend/routes/vault.ts`, `backend/services/redisService.js`, `src/App.tsx`, `src/components/kryptex/DocumentLocker.tsx`, `src/components/kryptex/FinanceView.tsx`, `src/pages/Dashboard.tsx`, `src/pages/VaultFinance.tsx`, `src/hooks/useVaultItems.ts`

---

## Problem Statement

As part of scaling the Kryptes Vault experience, we identified several structural bottlenecks and visual inconsistencies across the core interface:

1. **Indefinite Route Hangs (90% Upload Stuck)**: The backend `/commit` route (used to finalize document uploads) would invoke `deleteCachedVault(userId)`. When the target Redis instance was down or slow, the connection attempt would hang indefinitely because the `ioredis` layer aggressively blocked routing execution. This caused the frontend upload progress bar to get permanently stuck at 90%.
2. **Transition Jitter & Layout Shifts**: Switching between core dashboard views (Locker, Authenticator, Finance) produced visual snapping and cumulative layout shifts (CLS). Multiple nested sidebars inside individual pages competed with the global navigation container, making the UI feel unstable.
3. **Simulated Lag in UI Feedback**: The simulated progress bar in the Document Locker was sluggish (stepping every 180ms in tiny increments), reducing the perceived speed of the R2 upload cycle.
4. **Outdated Finance Mockups**: The Vault Finance page lacked modern visual premium styling, zero-knowledge insight cards, and high-contrast, interactively optimized financial signal graphs.

---

## 🛠️ Solutions & Architecture

```
                                  ┌───────────────────────────┐
                                  │   Upload File (R2 S3)     │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │   Route: /commit (Post)   │
                                  └─────────────┬─────────────┘
                                                │
                          ┌─────────────────────┴─────────────────────┐
                          ▼ [Success]                                 ▼ [Fail / Timeout]
              ┌────────────────────────┐                  ┌────────────────────────┐
              │ Safe Non-Blocking Redis│                  │ Safe Bypass Log Warning│
              │   Cache Invalidation   │                  │   No Thread Blocking   │
              └───────────┬────────────┘                  └───────────┬────────────┘
                          │                                           │
                          └─────────────────────┬─────────────────────┘
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │   Response 200: OK        │
                                  │   Document list renders   │
                                  └───────────────────────────┘
```

### 1. Fault-Tolerant, Non-Blocking Redis Caching (`redisService.js`)
Rather than blocking HTTP request threads during unstable Redis states, we isolated all cache writes, retrievers, and invalidations inside try-catch blocks:

```javascript
// backend/services/redisService.js
export async function deleteCachedVault(userId) {
  try {
    if (!redisClient.isOpen) {
      console.warn("Redis client not connected. Skipping cache delete.");
      return;
    }
    const key = `vault:${userId}`;
    await redisClient.del(key);
  } catch (error) {
    console.error("Redis delete cache error (bypassing):", error);
  }
}
```
This guarantees that `/commit` completes instantly and the client finishes the upload transition even during a complete Redis outage.

### 2. Mutation Protection with AbortController (`useVaultItems.ts`)
To prevent the frontend from hanging indefinitely if a remote API endpoint blocks or runs into serious network congestion, we integrated a strict **10-second request timeout limit** using `AbortController` in all mutation hooks:

```typescript
// src/hooks/useVaultItems.ts
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);

try {
  const res = await fetch(`${API_URL}/api/vault/commit`, {
    method: "POST",
    headers: { ... },
    body: JSON.stringify(payload),
    signal: controller.signal
  });
  clearTimeout(timeoutId);
  // ...
} catch (err) {
  clearTimeout(timeoutId);
  // Fail-safe handling
}
```

---

## 🎨 Layout and Transition Harmonization

### 1. Global Navigation & Sidebar Consolidation
We stripped the redundant internal sidebars from inside `DocumentLocker.tsx` and unified them into `Dashboard.tsx`. Now, the global sidebar handles section routing universally, freeing up high-density grid columns for the content.

### 2. Jitter-Free View Transitions via Absolute Bounding
To remove transition jitter, views are animated inside a Framer Motion `AnimatePresence` stack. By utilizing absolute containment bounds, outgoing and incoming modules slide over each other without modifying the height of the document tree:

```tsx
// src/pages/Dashboard.tsx
<div className="relative flex-1 overflow-hidden">
  <AnimatePresence mode="wait">
    <motion.div
      key={activeTab}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 overflow-y-auto px-6 py-8"
    >
      {renderActiveView()}
    </motion.div>
  </AnimatePresence>
</div>
```

---

## 📈 Premium Zero-Knowledge Finance Tracker

We designed `FinanceView.tsx` from scratch as a top-tier visual center. It incorporates premium design patterns tailored for zero-knowledge data:

### UI Layout
1. **Dynamic Dashboard Header**: Features Outfit typography, high-contrast black/orange branding, and a sub-bar highlighting vault status and signal verification labels.
2. **Interactive Statement Dropzone**: Supports seamless `.pdf` drag-and-drop parsing with active drag states (`border-dashed border-orange-500 bg-orange-50/10`) and loading feedback (`Sparkles` spinner).
3. **Recharts Cashflow & Category Gravity Systems**: Highly responsive spending area curves and monthly bar cashflows styled with neutral high-contrast accents, dynamic glassmorphic hover tooltips, and Outfit metadata labels.

---

## 🛠️ Verification Checklist

### 1. Cache Resiliency
- Stop the Redis container or block ports.
- Perform a document upload in the locker.
- **Expected Result**: File completes instantly, client displays success state, warning is logged in the server console, but no hang occurs.

### 2. Layout Transitions
- Switch rapidly between Locker, Authenticator, and Finance tabs.
- **Expected Result**: Views cross-fade smoothly without snapping, layout jumps, or screen scroll resets.
