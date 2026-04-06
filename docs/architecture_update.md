# Kryptex Protocol — Firebase → Supabase architecture update

This document describes the migration from Firebase to Supabase, the new data model, redirect URLs, and how zero-knowledge guarantees interact with Supabase Row Level Security (RLS).

## 1. Analysis summary (previous state)

| Firebase surface | Usage in Kryptex | Supabase equivalent |
|------------------|------------------|---------------------|
| Firebase Auth (`firebase/auth`) | Email/password sign-up and sign-in on the Vite SPA (`src/pages/Index.tsx`) | **Supabase Auth** (`auth.signUp`, `signInWithPassword`) |
| Firebase Analytics | Previously in `src/lib/firebase.ts` (removed) | Optional: **Supabase Analytics**, PostHog, or omit |
| Firebase Storage | Not referenced in application source | **Supabase Storage** buckets (add when needed) |
| Cloud Firestore | Not used in app logic (no `getFirestore` calls) | **PostgreSQL** tables with RLS |
| `firebase-admin` (backend) | Only imported in legacy `backend/index.js`, not used by `server.js` | **Supabase service role** via `@supabase/supabase-js` on the API for token validation |

Social login previously used **Passport.js** routes on Render (`/api/auth/google`, etc.). That flow is **replaced** by **Supabase OAuth** on the client (`signInWithOAuth`), followed by a **server session sync** that validates the JWT and stores **session metadata in Redis** (unchanged store).

## 2. Migration steps (implementation order)

1. **Supabase project**: Create a project; note **Project URL**, **anon key**, and **service role** key (server-only).
2. **Auth providers**: In Supabase Dashboard → Authentication → Providers, enable **Google**, **Twitter (X)**, **Azure** (Microsoft). Configure OAuth client IDs/secrets per provider.
3. **Redirect URLs**: Add the SPA callback URLs (see §4).
4. **Environment variables**: Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` on Vercel; set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, plus existing `REDIS_URL` and `SESSION_SECRET` on Render.
5. **Replace** `src/lib/firebase.ts` with `src/lib/supabase.ts` using `createClient` from `@supabase/supabase-js`.
6. **Frontend**: Landing auth uses Supabase for email/password and OAuth; after OAuth redirect, `/auth/callback` runs and calls **`POST /api/auth/supabase/sync`** with the Supabase access token so the Render API can attach a **Redis-backed express session**.
7. **Backend**: Remove Passport OAuth strategies; keep **express-session** + **connect-redis**; validate Supabase JWTs with the service-role client (`auth.getUser(access_token)`).
8. **Database**: Apply the SQL in §3 (or `supabase/migrations`) for `profiles` and RLS.
9. **Remove** npm packages: `firebase` (frontend), `firebase-admin` (backend if unused). **Rotate** any credentials that were ever committed or pasted in chat.

## 3. Supabase schema (PostgreSQL)

Vault ciphertext and master keys remain **out of band** (Bitwarden + optional Redis cache for encrypted blobs). PostgreSQL holds only **non-sensitive profile metadata** optional for dashboard features.

```sql
-- profiles: one row per auth user; RLS enforces ownership
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);
```

Optional: trigger to create `profiles` on `auth.users` insert (dashboard-only convenience).

## 4. Redirect URIs and site URL

Configure in **Supabase Dashboard → Authentication → URL Configuration**:

| Setting | Example value |
|---------|----------------|
| **Site URL** | `https://kryptes.vercel.app` |
| **Additional Redirect URLs** | `https://kryptes.vercel.app/auth/callback`, `http://localhost:5173/auth/callback` |

Provider-specific OAuth apps (Google Cloud, Azure, X Developer Portal) must list the **Supabase** redirect URL that each provider expects (shown in the Supabase provider setup UI), typically:

`https://<project-ref>.supabase.co/auth/v1/callback`

The **browser** returns to your SPA at `/auth/callback` after Supabase completes the exchange (PKCE).

## 5. Zero-knowledge flow and RLS

- **Zero-knowledge** here means the server and database never receive plaintext vault payloads: encrypted payloads are handled per existing vault routes (Bitwarden + Redis cache for ciphertext).
- **Supabase Auth** identifies the user (`auth.users.id`). The **anon key** is safe in the browser only because **RLS** prevents reading or writing other users’ rows.
- **Redis** continues to hold **express-session** data and fast-path metadata (e.g. shell user id keyed for session lookup). It is not the source of truth for encrypted vault data.
- **Service role key** is **only** on Render; it must never ship to Vercel. It is used to validate access tokens during `/api/auth/supabase/sync`.

## 6. Yahoo / Microsoft naming

- **Microsoft**: Supabase provider id is **`azure`** (`signInWithOAuth({ provider: 'azure', ... })`).
- **Yahoo**: Not a built-in Supabase social provider. Options: (1) add a **custom OAuth/OIDC** provider in Supabase if Yahoo supports standard OIDC, or (2) defer Yahoo until product priority is confirmed. The UI currently focuses on Google, Azure, and X.

## 7. Security notice — secrets

Do **not** store API keys, JWT secrets, or service-role keys in source control. Use host environment variables and rotate any key that has been exposed.

---

*Related doc: `docs/session_redis_supabase.md` (session sync and env vars for this migration).*
