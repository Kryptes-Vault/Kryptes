# Kryptex Protocol: Password Vault Implementation

## 1. Overview

The Password Vault extends the Kryptex Zero-Knowledge Vault with dedicated credential management.
Users can store, categorize, reveal, and copy passwords for any online service—all while
maintaining the strict Zero-Knowledge architecture where **sensitive fields are encrypted locally
and only ciphertext is stored in Supabase**.

## 2. Security Architecture — AES-GCM 256-bit Flow

```
USER DEVICE (Browser)                       SUPABASE (yhnonhusmdqeiefherbx)
┌──────────────────────┐                    ┌──────────────────────────┐
│  Master Password     │                    │  vault_items table       │
│  ────────────────    │                    │  ──────────────────────  │
│  │ PBKDF2-SHA-256   │    INSERT ──────►  │  title        (plain)   │
│  │ 100,000 iter.    │                    │  website_url  (plain)   │
│  │ 16-byte salt     │                    │  category     (plain)   │
│  ▼                  │                    │  ciphertext   (opaque)  │
│  AES-GCM-256 Key    │                    │  iv           (opaque)  │
│  ────────────────   │                    │  salt         (opaque)  │
│  │ encrypt( JSON )  │                    │  ─────────────────────  │
│  │ { username,      │                    │  SELECT ◄──── app query │
│  │   password }     │                    │  (returns ciphertext)   │
│  ▼                  │                    └──────────────────────────┘
│  ciphertext + iv    │
│  ────────────────   │
│  REVEAL action:     │
│  decrypt(ct, iv,    │    NO PLAINTEXT
│    derivedKey)      │    EVER LEAVES
│  ▼                  │    THE BROWSER
│  plaintext shown    │
│  in-browser only    │
└──────────────────────┘
```

### What Is Encrypted (Client-Side Only)

| Field       | Storage          | Searchable? | Notes                                    |
|-------------|------------------|-------------|------------------------------------------|
| `username`  | AES-GCM cipher   | No          | Part of JSON blob `{ username, password }` |
| `password`  | AES-GCM cipher   | No          | Part of JSON blob `{ username, password }` |

### What Is Stored as Plaintext Metadata

| Field         | Storage     | Searchable? | Notes                                      |
|---------------|-------------|-------------|---------------------------------------------|
| `title`       | Plaintext   | Yes         | Account name (e.g., "Gmail")               |
| `website_url` | Plaintext   | Yes         | Used for favicon resolution + search       |
| `category`    | Plaintext   | Yes         | social / work / shopping / finance / other |
| `item_type`   | Plaintext   | Yes         | "password" vs "secret"                     |

## 3. Provider Logo Resolver — Zero Bundle Strategy

Instead of bundling icon libraries (simple-icons = 2MB+), Kryptex uses a **CDN-based favicon resolver**:

```
Primary:   https://www.google.com/s2/favicons?domain={domain}&sz=64
Fallback:  Globe icon (lucide-react)
```

**Advantages:**
- **Zero bundle impact** — no npm dependency, no tree-shaking overhead
- **100+ providers** covered automatically — any domain with a favicon works
- **Always current** — Google's crawler updates favicons continuously
- **Graceful fallback** — `onError` swaps to a generic Globe icon

The `getFaviconUrl()` helper in `passwordVaultService.ts` extracts the hostname from the
stored `website_url` and constructs the Google Favicons API URL.

## 4. Audit Trail

Every `reveal` and `copy` action triggers an insert into `vault_audit_log`:

```sql
vault_audit_log (
  id          uuid PK,
  user_id     uuid FK → auth.users,
  vault_item_id uuid FK → vault_items,
  action      text,       -- 'reveal', 'copy', 'create', 'delete'
  metadata    jsonb,      -- { title, category, ... }
  created_at  timestamptz
)
```

- **Immutable**: RLS denies UPDATE and DELETE on audit rows
- **Non-blocking**: Audit failures are caught and logged to console, never break the user flow

## 5. Zero-Knowledge Proof Statement

> **Even if the `yhnonhusmdqeiefherbx` Supabase database is fully accessed by a third party,
> all account passwords remain unreadable.**
>
> The `ciphertext` column contains AES-GCM-256 encrypted data. The decryption key is derived
> from the user's **Master Password** via PBKDF2 with 100,000 iterations and a unique 16-byte
> salt. The Master Password is **never transmitted** to any server — not to Supabase, not to
> the Kryptex backend, not to any OAuth provider. Without the Master Password, the ciphertext
> is computationally infeasible to decrypt.
>
> An attacker with full database access would see:
> - `title`: "Gmail" (plaintext metadata, by design)
> - `website_url`: "https://accounts.google.com" (plaintext, by design)
> - `ciphertext`: `a3J5cHRleC12YXVsdC1lbmNyeXB0ZWQ=...` (opaque, unusable)
>
> The credentials (`username`, `password`) exist only inside the AES-GCM cipher blob and can
> only be recovered by the user who holds the Master Password.

## 6. Password Generator

The built-in generator uses `crypto.getRandomValues()` (Web Crypto API) for **cryptographically
secure** random password generation:

- **Length**: Configurable 8–64 characters
- **Character classes**: Uppercase, lowercase, numbers, symbols (togglable)
- **Entropy display**: Shows estimated bits of entropy and a Weak/Good/Strong indicator
- **No external API**: Generation is entirely local; no network request involved

---
*Created by: Lead Frontend Engineer & Security Architect*
*Protocol: KRYPTEX_VAULT_V2.1*
