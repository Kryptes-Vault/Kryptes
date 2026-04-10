# Ephemeral sharing (burn-on-read) — technical specification

This feature lets a Kryptex user share **one-time** encrypted content with **any recipient**, including people **without** a Kryptex account. Security does **not** rely on `auth.users` for the recipient; it relies on **proof of possession** of a **secret URL** (the random `id`) and **server-side destruction** after read (when `burn_after_read` is true).

## Architecture: zero-knowledge URL fragment (`#KEY`)

- The **symmetric key** (or key material) used to encrypt the share **must not** be sent to Supabase, Render, or any API.
- Typical pattern: put **only non-secret routing data** in the path/query (e.g. `id` or a pointer), and keep the **decryption key in the URL fragment** after `#`, e.g.  
  `https://kryptes.vercel.app/share/<id>#<KEY>`
- **Browsers do not send the fragment** to the server on navigation or `fetch` by default. That means **`#KEY` never appears in HTTP logs** for your static host or API as part of the request line (still protect against XSS and leaking URLs in analytics).
- The **ciphertext** stored in `shared_secrets.ciphertext` was produced **in the browser** before `INSERT`; the database only ever sees opaque bytes.

## Database objects

| Object | Role |
|--------|------|
| `public.shared_secrets` | Stores `id`, `ciphertext`, `expires_at` (default **7 days** from insert), `burn_after_read` (default **true**), timestamps. |
| RLS | **Insert**: `authenticated` creators may add rows. **Direct SELECT/UPDATE/DELETE on table**: denied to `anon` and `authenticated` so rows cannot be enumerated or mutated through PostgREST alone. |
| `public.get_and_burn_secret(uuid)` | **SECURITY DEFINER** RPC: fetches by `id`, enforces **not expired**, returns **ciphertext**, and **deletes** the row when `burn_after_read` is true (atomic with read under `FOR UPDATE`). Callable by **`anon`** and **`authenticated`** via `rpc()`. |

DDL: `supabase/migrations/003_shared_secrets.sql`.

### Why not “RLS: anon SELECT where id = ?”

PostgreSQL RLS **`USING`** is evaluated **per row**. A policy like `USING (true)` for `anon` would expose **all** rows to anyone who can issue `SELECT`. There is no standard way to bind “the id in the current query” inside RLS for untrusted clients. Therefore:

- **Direct table reads are denied** for `anon` / `authenticated`.
- **Proof of possession of the UUID** is enforced by allowing reads **only** through `get_and_burn_secret(secret_id)` (whoever knows the id can call RPC—same practical effect as “select by id” without row enumeration).

## Security handshake: `SECURITY DEFINER` and atomic burn

- The burn/read path is implemented **inside one Postgres function** running as a **definer** role that can bypass RLS for the controlled `DELETE`/`SELECT` sequence.
- **`FOR UPDATE`** locks the row for the transaction so two concurrent callers cannot both retrieve ciphertext before deletion.
- **Atomicity**: deletion and return are orchestrated in **one database transaction** (function body). If the client disconnects after the function returns, the row is **already gone** when `burn_after_read` is true—there is no separate “mark read” phase that could leave data behind.

**Note:** If the **network fails before the client receives** the RPC response, the row may already be deleted—this is acceptable for burn-on-read (the secret is consumed server-side).

## Automated cleanup

Expired rows (`expires_at < now()`) should be removed even if nobody opened the link. The migration file includes a commented **`pg_cron`** example:

- Enable **`pg_cron`** in Supabase (**Database → Extensions**).
- Schedule a periodic `DELETE FROM public.shared_secrets WHERE expires_at < now()`.

This complements **expiry checks inside `get_and_burn_secret`** (expired rows return `NULL` and are deleted on access attempt).

## Limitations (honest threat model)

| Risk | Mitigation |
|------|------------|
| **Server breach** | Attackers at rest only see **ciphertext** if clients encrypt properly; they do not see `#KEY` in HTTP logs from fragment usage. |
| **Digital trail** | Recipient can still **screenshot**, **copy/paste**, or **save** the decrypted content after opening—**no technology can prevent a motivated human from duplicating data**. |
| **Link forwarding** | Anyone with the full URL (including fragment) can decrypt—treat links like bearer tokens. |

---

*See also: `docs/encryption/vault-database-schema.md`, `docs/platform/supabase-migration-firebase.md`.*
