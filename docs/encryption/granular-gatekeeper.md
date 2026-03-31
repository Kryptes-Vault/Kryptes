# 🛡️ Granular Gatekeeper Logic

**Status:** Implemented  
**Date:** 2026-04-10  
**Scope:** Backend API (Bitwarden, Google Drive, Supabase)

## Overview

The **Granular Gatekeeper** is an architectural pattern implemented in the Kryptes backend to optimize API performance and prevent unnecessary "500 Internal Server Errors" for new or inactive users. 

Instead of querying external storage providers (Bitwarden, Google Drive) or secondary database tables (Supabase OTP) directly, the system first checks a set of boolean flags in the `public.profiles` table.

## Identity State Flags

Stored in the **`public.profiles`** table in Supabase:

| Flag | Category | Storage Provider |
|------|----------|------------------|
| `has_passwords` | Credentials & Notes | Bitwarden SDK |
| `has_cards` | Banking & Cards | Bitwarden SDK |
| `has_documents` | Binary Files | Google Drive API |
| `has_otp` | 2FA Secrets | Supabase (`user_otp_secrets`) |

---

## Technical Implementation

### 1. The Gateway Service (`gatekeeperService.ts`)

A centralized helper service manages flag verification and activation to ensure code consistency across routes.

```typescript
// backend/services/gatekeeperService.ts

/**
 * Returns false if the profile check fails or the flag is false.
 * Ensures the API returns a clean [] instead of a 500.
 */
export async function checkProfileFlag(userId: string, flag: string): Promise<boolean>;

/**
 * Sets a flag to true after the first successful upload/save.
 */
export async function setProfileFlagActive(userId: string, flag: string): Promise<void>;
```

### 2. The Read Loop (GET Requests)

All data-fetching routes now follow this gated execution order:

1. **Gatekeeper Check**: Query Supabase Profiles for the corresponding flag.
2. **Short-Circuit**: If flag is `false` (or the query fails), return `HTTP 200` with an empty array `[]` immediately.
3. **Provider Fetch**: If flag is `true`, proceed to check Redis Cache or perform a heavy fetch from the storage provider.

**Why?** This prevents Bitwarden SDK timeouts or Google Drive 404s/Auth errors from breaking the user's dashboard experience when they have no data.

### 3. The Write Loop (POST Requests)

When a user adds their first item in any category:

1. **Persist**: The data is encrypted and saved to the provider (Bitwarden, Drive, or DB).
2. **Activate**: After a successful save, `setProfileFlagActive` is called asynchronously to flip the flag to `true`.
3. **Cache**: The cache is populated for future gated reads.

---

## Specific Data Flows

### A. Bitwarden (Passwords & Cards)
The `vault.ts` router manages these flows. The `has_passwords` flag guards the general vault, while `has_cards` guards the banking module specifically.

### B. Google Drive (Documents)
Implemented in `server.ts`. The check verifies `has_documents` before attempting to list files from the Google Cloud Service Account.

### C. Supabase (OTP)
Managed in `otp.ts`. The `has_otp` flag prevents unnecessary queries to the `user_otp_secrets` table.

---

## Error Handling & Resilience

> [!IMPORTANT]
> **Primary Rule**: Every database flag check must be wrapped in a `try/catch`. 
> 
> If the profiles table is unreachable, the system defaults to assuming the user has no data (`false`). This ensures that a temporary Supabase hiccup doesn't crash the entire dashboard; it simply displays an empty vault until connectivity is restored.

---

## Related Files
- [`backend/services/gatekeeperService.ts`](file:///c:/VS/Kryptes/backend/services/gatekeeperService.ts)  
- [`backend/routes/vault.ts`](file:///c:/VS/Kryptes/backend/routes/vault.ts)  
- [`backend/routes/otp.ts`](file:///c:/VS/Kryptes/backend/routes/otp.ts)  
- [`backend/server.ts`](file:///c:/VS/Kryptes/backend/server.ts)
