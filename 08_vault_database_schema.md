# Vault database schema (`vault_items`)

This document describes the **Kryptex** core table for vault data stored in **Supabase PostgreSQL**, aligned with a **zero-knowledge** threat model: the database holds **opaque ciphertext** only.

## Table: `public.vault_items`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | `uuid` | Primary key (`gen_random_uuid()`). |
| `user_id` | `uuid` | Foreign key to **`auth.users(id)`** with `ON DELETE CASCADE`. Scopes every row to exactly one Supabase Auth user. |
| `ciphertext` | `text` | **Encrypted** vault payload (e.g. base64). This is the sealed blob produced **before** any network send—**not** readable as plaintext by Supabase or operators without the user’s keys. |
| `iv` | `text` | **Nonce / IV** for your AEAD scheme (e.g. AES-GCM), stored so the client can decrypt. Still not plaintext user content. |
| `salt` | `text` (nullable) | Optional **salt** for KDF or per-item wrapping, if your crypto design requires it. Omit at insert if unused. |
| `encryption_version` | `text` | Non-secret **version tag** for algorithm/version rotation (default `'v1'`). Not a password or user note. |
| `created_at` | `timestamptz` | Row creation time. |
| `updated_at` | `timestamptz` | Last update; maintained by trigger on `UPDATE`. |

**Explicitly excluded:** There are **no** columns for plaintext passwords, recovery answers, or free-form “notes” in the clear. Anything human-readable stays **off** this table or stays **inside** the ciphertext after client-side encryption.

The canonical DDL lives in the repo: `supabase/migrations/002_vault_items.sql`.

## Row Level Security (RLS)

RLS is **enabled** on `vault_items`. Policies are **strict**:

| Operation | Rule |
|-----------|------|
| **SELECT** | Only rows where `user_id = auth.uid()`. |
| **INSERT** | Only if `user_id = auth.uid()` (`WITH CHECK`). |
| **UPDATE** | Only existing rows owned by `auth.uid()`, and the row must remain owned by them (`USING` + `WITH CHECK`). |
| **DELETE** | Only rows where `user_id = auth.uid()`. |

Policies are granted to the **`authenticated`** role so anonymous (`anon`) sessions cannot read or write vault rows. Combined with Supabase Auth, this enforces **per-user isolation** at the database layer.

## Zero-knowledge guarantee (Kryptex Protocol)

- **Supabase** (and anyone with database access) sees **only ciphertext** and non-secret metadata (IV, optional salt, version string).
- **Plaintext** vault data is **encrypted on the client** (e.g. the **Vercel**-hosted SPA) **before** `INSERT`/`UPDATE` requests. The **Render** backend, if used for non-vault APIs, likewise must **never** persist raw vault plaintext in Postgres—only what the client already encrypted.
- Therefore, **hosting the database on Supabase does not expose user secrets**, as long as keys and decryption happen **only on the user’s side** and the app never sends raw secrets into `vault_items`.

---

*See also: `architecture_update.md`, `supabase/migrations/001_profiles.sql`, `session_redis_supabase.md`.*
