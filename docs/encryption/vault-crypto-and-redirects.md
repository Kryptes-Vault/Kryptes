# Kryptex protocol — vault cryptography, OAuth, and audit

## Redirect resolution

Supabase OAuth and email confirmation flows must return to the **same origin** that started the request. Hardcoding **`http://localhost:8080`** (or any fixed port) breaks when the Vite dev server runs on another port or when the app is deployed (e.g. Vercel).

**Implementation:** `getOAuthRedirectUrl()` in `src/pages/Index.tsx` returns **`${window.location.origin}/auth/callback`**. It is used for **Google (and other) OAuth** (`signInWithOAuth` → `redirectTo`) and for **email sign-up** (`emailRedirectTo`), so local dev uses whatever origin the browser has (e.g. **`http://localhost:5173`**) and production uses the deployed host.

**Vite:** The dev server is set to port **5173** in `vite.config.ts`. Add **`http://localhost:5173/**`** to **Supabase → Authentication → URL Configuration → Redirect URLs** alongside your production URL.

---

## Security architecture

| Layer | Behavior |
|-------|----------|
| **AES-GCM 256-bit** | Vault secret bodies are encrypted in the browser with a random IV per operation; only **ciphertext** and **IV** (and KDF **salt** metadata) are stored remotely. |
| **PBKDF2** | **SHA-256**, **100,000 iterations**, **unique salt** (16 random bytes, base64-stored) derives the AES key from the **Master Password**. |
| **Zero-knowledge rule** | The **server never sees plaintext secrets** or the **Master Password**. Supabase and the Render API receive **opaque ciphertext** (and optional non-secret fields such as a plaintext **title** for list UX). Decryption keys exist only on the client after the user enters the password. |

---

## Audit trail (`share_count`)

Each time the user generates a **sharing link** (e.g. burn-on-read), a row is inserted into **`share_history`**. A database **trigger** increments **`vault_items.share_count`** for that item.

The **Share Counter** on each vault card reads **`share_count`** from the vault row, giving transparency into **how many times** the user initiated sharing for that item, without exposing recipient-side behavior after the link leaves the system.

---

## Environment configuration (frontend)

| Variable | Purpose |
|----------|---------|
| **`VITE_SUPABASE_URL`** | HTTPS Supabase project URL (`https://<ref>.supabase.co`). |
| **`VITE_SUPABASE_ANON_KEY`** | Publishable anon key for `createClient` in `src/lib/supabase.ts` (browser-safe under RLS). |

Optional: **`VITE_BACKEND_URL`** for API session sync after OAuth.

---

## Implementation entrypoints

- **Vault API:** `src/lib/kryptexVaultService.ts` (re-exports crypto + `addSecretWithMasterPassword`, etc.)
- **Crypto primitives:** `src/lib/crypto/vaultCrypto.ts`

---

*Kryptex protocol documentation — vault, OAuth redirect, and audit.*
