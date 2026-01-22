# Vercel environment sync architecture (Supabase integration)

This note describes how **Supabase’s Vercel integration** fits the **Kryptex** split stack: **Vercel** (React/Vite), **Supabase** (Auth + Postgres), and **Render** (Node API + Redis).

## Infrastructure automation

- Supabase can be **connected directly to a Vercel project** (GitHub deployment) via the **Supabase Dashboard → Integrations → Vercel**.
- For supported flows, Supabase **injects or syncs** the **public** Supabase credentials into the Vercel project so they track **your Supabase project** without hand-copying keys on every rotation.
- **Database credentials** in the product sense are still **managed in Supabase**; the integration reduces drift between “what Supabase issued” and “what Vercel builds with.”

You still maintain **non-Supabase** Vercel variables yourself (e.g. **`VITE_BACKEND_URL`** for the Render API origin).

## Vite security prefix (`VITE_`)

- The integration is configured to use the **`VITE_` public prefix** so only **intended** variables are embedded in the browser bundle.
- **Vite exposes only variables prefixed with `VITE_`** at build time. The integration aligns with that rule so **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_ANON_KEY`** are safe for client-side `createClient` usage.
- Do **not** prefix secrets (service role, JWT signing secret, webhook signing secret) with `VITE_`—they must never ship to the SPA.

### Current project URL (reference)

```env
VITE_SUPABASE_URL=https://yhnonhusmdqeiefherbx.supabase.co
```

The **anon** key remains in Supabase **Project Settings → API**; when using the Vercel integration, confirm it appears as **`VITE_SUPABASE_ANON_KEY`** (or equivalent) in Vercel and matches the dashboard.

## Environment separation of concerns

| Layer | What gets configured | Trust model |
|--------|----------------------|-------------|
| **Vercel** | Public, **`VITE_`-prefixed** vars (Supabase URL + anon key via integration; `VITE_BACKEND_URL` manual) | Safe to expose to browsers; still protect against accidental bundling of wrong keys. |
| **Supabase** | Auth providers, OAuth secrets, DB, RLS, SMTP or hooks | Source of truth for identity and data plane. |
| **Render** | **Manual** injection of **server-only** secrets: service role, hook secret, Redis, session secret, CORS URLs | Never exposed to Vercel; not synced by the Supabase→Vercel integration. |

**Render** does **not** receive automatic sync from the Supabase Vercel integration. Operational secrets for the Node API stay **only** on Render.

## Render: manual secrets (required)

Add or keep these in the **Render** dashboard (names must match your `server.js` / `supabaseAdmin.js` / `authEmailHook.js`):

| Variable | Role |
|----------|------|
| `SUPABASE_URL` | Same project URL as the frontend (e.g. `https://yhnonhusmdqeiefherbx.supabase.co`). |
| `SUPABASE_SERVICE_ROLE_KEY` | **Required** for `supabase.auth.getUser(access_token)` on **`POST /api/auth/supabase/sync`**. |
| `SUPABASE_HOOK_SECRET` | **If** you use the **HTTPS Send Email** hook (`/api/auth/send-email-hook`): full `v1,whsec_…` secret from Supabase Auth Hooks. |
| `REDIS_URL` | Session store for `express-session`. |
| `SESSION_SECRET` | Cookie signing. |
| `FRONTEND_URL` | CORS origin (e.g. `https://kryptes.vercel.app`). |
| `API_BASE_URL` | Public API URL for redirects/docs. |

### About `SUPABASE_JWT_SECRET` (dashboard JWT signing secret)

- The **JWT Secret** in **Supabase → Project Settings → API** is the **signing key for end-user JWTs**.
- The **current Kryptex Node code** validates tokens via **`SUPABASE_SERVICE_ROLE_KEY`** + **`auth.getUser()`**, not by storing the JWT secret on Render.
- You only need a **`SUPABASE_JWT_SECRET`** (or similar) env on Render if you implement **local** HS256 verification (e.g. with `jose`). Otherwise, **do not duplicate** it on Render “just in case.”

## Deprecation list (reduce security overhead)

The following should be treated as **obsolete for Kryptex auth** and **removed** from **Vercel** and **root `.env`** when no longer needed:

| Variable | Reason |
|----------|--------|
| `VITE_FIREBASE_*` (all) | Firebase removed; Supabase client replaces `firebase.ts`. |
| Any non-`VITE_` Supabase keys in the frontend repo | Browser must not receive service role or JWT secret. |

**Remove from Render** (only if you are fully off Passport OAuth for user login):

| Variable | Reason |
|----------|--------|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | Old **Passport Google** OAuth on Render (replaced by Supabase OAuth). |
| `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` | Old Passport X OAuth. |
| `YAHOO_*` | Old Passport Yahoo flow. |
| `MICROSOFT_*` | If unused for Passport. |

**Do not delete from Render** while **Gmail nodemailer** (`emailService.js`) still uses them:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` (and related) **may still be required** for **sending mail**, separate from Supabase OAuth.

**Vercel / local:** If the Supabase integration **already injects** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, you may **delete duplicate manual copies** of the same keys in the Vercel UI **only after** confirming builds and runtime read the integration-managed values. For **`npm run dev`**, keep a **local** `.env` with `VITE_*` or use `vercel env pull`.

---

*See also: `05_env_cleanup_and_security.md`, `env_template.md`, `session_redis_supabase.md`, `architecture_update.md`.*
