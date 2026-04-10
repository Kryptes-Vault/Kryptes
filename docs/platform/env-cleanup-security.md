# Environment cleanup and security (Supabase OAuth)

After configuring **Google** and **Twitter (X)** OAuth **only in the Supabase Dashboard** (client IDs and secrets stored there), Kryptex **no longer** carries those provider secrets in application environment variables on **Render** or **Vercel**.

## 1. Removed variables (provider OAuth secrets)

The following are **removed** from `.env` / host dashboards for the app (they belonged to the old **Passport.js on Render** model):

| Variable (removed) | Previous role |
|--------------------|---------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID on the Node API |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret on the Node API |
| `TWITTER_CLIENT_ID` | X / Twitter OAuth client ID on the Node API |
| `TWITTER_CLIENT_SECRET` | X / Twitter OAuth client secret on the Node API |

Any **callback URLs** in Google Cloud or X Developer consoles should now follow **Supabase’s** documented redirect (e.g. `https://<project-ref>.supabase.co/auth/v1/callback`), not Render routes.

## 2. Architectural reasoning (smaller leak surface on Render)

**Supabase** now performs the **direct OAuth handshake** with Google and X: authorization redirects, token exchange, and linkage to `auth.users` stay inside Supabase’s control plane.

- **Render** no longer needs provider secrets, so a compromise of backend env vars **does not** expose Google/X app secrets.
- **Vercel** never needed those secrets for OAuth redirects; the SPA only talks to Supabase with the **anon** key and receives Supabase-issued sessions/JWTs.

This **reduces credential surface area** on the API host and centralizes OAuth configuration in one place (Supabase).

## 3. Required environment variables (current)

Values must still come from the Supabase project and your infrastructure hosts—**never commit real keys.**

### Vercel (React / Vite frontend)

Vite only exposes variables prefixed with `VITE_`. Map the concepts as follows:

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL (`https://<ref>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Supabase **anon** / publishable key (browser-safe) |
| `VITE_BACKEND_URL` | Render API origin for `POST /api/auth/supabase/sync` (no trailing slash) |

So: **`SUPABASE_URL` / anon key** in product terms correspond to **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_ANON_KEY`** in the repo.

### Render (Node.js backend)

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Same project URL as the frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | **Service role** key — server-only; used with `auth.getUser(access_token)` to validate user JWTs |
| `REDIS_URL` | Session store for `express-session` (metadata / shell user after sync) |
| `SESSION_SECRET` | Secret for signing the session cookie |
| `FRONTEND_URL` | CORS origin (e.g. `https://kryptes.vercel.app`) |
| `API_BASE_URL` | Public API URL (e.g. `https://kryptes.onrender.com`) |

### JWT secret vs service role (important)

In the Supabase dashboard, **Settings → API** defines:

- **JWT Secret** — signing key for end-user JWTs (HS256). You may mirror this in env as `SUPABASE_JWT_SECRET` **only if** you implement **local** JWT verification in Node (e.g. `jose` / `jsonwebtoken`).

**Current Kryptex backend behavior:** the API does **not** read `SUPABASE_JWT_SECRET` for auth. It validates the browser’s **access token** by calling **`supabase.auth.getUser(access_token)`** using **`SUPABASE_URL`** + **`SUPABASE_SERVICE_ROLE_KEY`** (`backend/services/supabaseAdmin.js`). That delegates cryptographic JWT validation to Supabase while keeping the **service role** key confined to Render.

So: **trust for “is this JWT valid?”** ultimately comes from Supabase’s JWT signing (the dashboard **JWT Secret**); **our** backend authorizes Redis/session access **only after** that validation succeeds via `getUser()`.

## 4. Redis access and authorization

The **Render** service must **not** expose Redis to the public internet without auth. Session data is reached only **after**:

1. The client presents a **valid Supabase access token** to `POST /api/auth/supabase/sync`, and  
2. The API confirms the token via **`getUser()`**, then writes **session metadata** to Redis keyed by the express session.

Thus, **Redis-backed cache/session usage** is gated by **successful Supabase JWT validation** on the backend (service-role path today), not by trusting unauthenticated requests.

---

*See also: `docs/auth/google-oauth-supabase.md`, `docs/auth/session-redis-supabase.md`, `docs/platform/env-template.md`.*
