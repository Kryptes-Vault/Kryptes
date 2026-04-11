# Developer Access (Kryptes)

**Developer Access** is Kryptes’s name for the **consent-based, zero-knowledge path** that lets a user authorize a **time-limited, encrypted snapshot** of their vault so that support or engineering can troubleshoot issues **without** ever receiving the user’s master password.

We use the term **Developer Access** everywhere in product copy and engineering docs. Older internal names referred to this flow as “escrow”; the behavior is the same, but **Developer Access** better describes user intent (temporary help) and avoids confusion with legal/financial escrow.

---

## What the user sees

- In **Settings → Security & Access**, the **Developer Access** card explains that a sealed copy of vault data can be shared after email verification.
- The user unlocks their vault locally (master password stays in the browser), requests a **verification code** sent by email, then confirms with that code.
- Access is **bounded in time** (for example, rows in `support_grants` expire after 24 hours by default).

---

## What actually happens (high level)

1. **OTP by email** — The backend stores a hash of a 6-digit code and calls the Supabase Edge Function (`developer-otp`) to email the code. The master password is never sent to the server.
2. **Client-side crypto** — After decrypting vault items locally, the app builds a **Developer Access bundle**:
   - A random **session key** encrypts the vault snapshot (AES-GCM).
   - That session key is **wrapped** with a key derived from the OTP (PBKDF2), matching the Node support route.
3. **Storage** — The bundle is sent to `POST /api/support/request-developer-access` and stored in Supabase (`support_grants`). Only holders of the OTP (and approved admin tooling) can unwrap the snapshot within policy.

---

## Technical references

| Area | Location |
|------|----------|
| UI | `src/components/kryptex/DeveloperAccessCard.tsx`, `SettingsView.tsx` |
| Web crypto bundle | `src/hooks/useVaultCrypto.ts` — `generateDeveloperAccessBundle` |
| API | `backend/routes/support.ts` — `/initialize`, `/request-developer-access`, `/admin/decrypt` |
| Schema | `supabase/migrations/007_support_grants.sql` — columns `escrow_wrapped_key` / `escrow_iv` are **legacy names** for wrapped session-key material; product name remains **Developer Access** |
| Deep-dive design | [encryption/zero-knowledge-support-grant.md](./encryption/zero-knowledge-support-grant.md) |

### PBKDF2 salt string (interop)

Browser and Node must use the **same** PBKDF2 salt bytes for OTP-wrapped keys. The literal string is stored as `DEVELOPER_ACCESS_PBKDF2_SALT` / `ESCROW_SUPPORT_SALT` in code — **do not change** without a migration plan and client/server release together.

### API field names

Prefer JSON fields **`developerAccessWrappedKey`** and **`developerAccessIv`**. The backend still accepts legacy keys `escrowWrappedKey` and `escrowIv` for older clients.

---

## Related email / Edge

- Edge functions may live under different folder names in the repo; user-facing email subjects and bodies should say **Developer Access**, not “escrow.”
