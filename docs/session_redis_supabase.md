# Session layer: Redis + Supabase (2026-04-06)

## Change

- **Removed**: Passport.js OAuth strategies (Google / X / Yahoo) from the Render API.
- **Added**: Supabase OAuth and email/password on the **Vite** app; **`POST /api/auth/supabase/sync`** establishes the Express session after validating the Supabase access token with **`SUPABASE_SERVICE_ROLE_KEY`**.
- **Unchanged**: `express-session` with **`connect-redis`** (`kryptex.sid` cookie), `sameSite: 'none'` + `secure` in production, CORS to `FRONTEND_URL` with `credentials: true`.

## Flow

1. User signs in with Supabase (OAuth or password).
2. SPA obtains a Supabase session (access token in memory / managed by Supabase client).
3. SPA calls `POST ${VITE_BACKEND_URL}/api/auth/supabase/sync` with `Authorization: Bearer <access_token>` and `credentials: 'include'`.
4. API calls `supabase.auth.getUser(access_token)`; on success, **`userShellStore.ensureShellUser`** writes/updates the Redis-backed shell record and sets **`req.session.kryptexUser`**.
5. Subsequent API calls send the session cookie; **`GET /api/auth/me`** reads `req.session.kryptexUser`.

## Environment variables

### Vercel (frontend)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase **anon** / **publishable** key (safe for browser) |
| `VITE_BACKEND_URL` | `https://kryptes.onrender.com` (no trailing slash) |

### Render (backend)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Same project URL as frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | **Service role** key — server only |
| `REDIS_URL` | Existing Redis / Upstash URL |
| `SESSION_SECRET` | Existing |
| `FRONTEND_URL` | `https://kryptes.vercel.app` |
| `API_BASE_URL` | `https://kryptes.onrender.com` |

Do not set service role keys in `VITE_*` variables.

## Related documentation (email branch)

- [Google OAuth via Supabase](./03_google_oauth_supabase.md)
- [Environment cleanup and security](./05_env_cleanup_and_security.md)
- [Send Email HTTPS hook](./06_email_auth_hook_integration.md)
- [Custom SMTP integration](./06_custom_smtp_integration.md)
- [Architecture update (Firebase to Supabase)](./architecture_update.md)
- [Environment variable template](./env_template.md)
