# Google OAuth with Supabase (Kryptex)

This note describes how **Google sign-in** works after moving from **Passport.js on Render** to **Supabase Auth**, and how that fits the **Zero-Knowledge Vault** and **Redis** session layer.

## 1. Native Supabase Google OAuth (replacing Passport)

Google OAuth for Kryptex is now handled **natively by Supabase Auth**, not by the Node/Express **Passport** strategies that previously lived on the Render API.

- **Before:** The browser hit Render routes such as `/api/auth/google` and Passport completed the OAuth dance with Google, then set an app session.
- **After:** The **Vite** app calls `supabase.auth.signInWithOAuth({ provider: 'google', ... })`. Google redirects through Supabase’s OAuth endpoints; Supabase becomes the **identity broker** and issues **JWTs** for your project.

Passport’s Google strategy on Render is **removed** from the active architecture; identity for Google users is established in **Supabase**, consistent with other providers configured there.

## 2. Security toggles (strict identity for the vault)

The following Supabase Auth settings align with **strict identity verification** for a **Zero-Knowledge Vault** product (the server must not guess who the user is, and account recovery flows should not silently weaken identity):

| Toggle / policy | Role |
|-----------------|------|
| **Nonce checks** (enabled) | Mitigates certain **authorization code / replay** style attacks in the OAuth/OIDC flow by binding the response to a fresh, one-time value. Keeps the Google login path closer to **OIDC best practices**. |
| **Block users without email** (enabled) | Ensures Supabase only creates sessions for identities that include a **verified email** channel from Google (where applicable). Reduces anonymous or incomplete profiles that would complicate **auditability** and **account linking** for vault access. |

Together, these do **not** by themselves implement cryptographic zero-knowledge (that remains client-side and in your vault design), but they **tighten who is allowed to obtain a Supabase JWT** before your app ever talks to Render or Redis.

## 3. Redirect URI architecture (Google Cloud → Supabase, not Render)

**Important change:** In the **Google Cloud Console** (OAuth 2.0 Client), the **Authorized redirect URI** for this integration must **not** point at your Render hostname for the primary Supabase flow.

- It should match what **Supabase** shows for the Google provider setup—typically the Supabase **`/auth/v1/callback`** URL for your project (e.g. `https://<project-ref>.supabase.co/auth/v1/callback`).
- Render’s URL remains the **API + Redis session** origin; it does **not** serve as Google’s OAuth redirect endpoint in this model.

This keeps **OAuth redirects** on Supabase’s controlled callback, while **your SPA** (`https://kryptes.vercel.app` or local dev) uses **`redirectTo`** (e.g. `/auth/callback`) after Supabase finishes the exchange.

## 4. End-to-end flow: JWT → Vercel → Render → Redis

After a successful Google login:

1. **Supabase** establishes a session and issues **JWTs** (access token, refresh handled per Supabase client settings).
2. The **Vercel** frontend uses the Supabase client (PKCE, session in browser storage as configured).
3. The SPA calls **`POST /api/auth/supabase/sync`** on **Render** with `Authorization: Bearer <access_token>` and **`credentials: 'include'`** so the API can set the **HTTP-only session cookie** (`kryptex.sid`).
4. The Render API validates the token with **`auth.getUser(access_token)`** (service role on the server) and maps the user into the **Redis-backed** shell/session metadata used for fast session lookup and API authorization.

So: **Google → Supabase → JWT**; **Vercel** holds the Supabase session and forwards the access token once to **Render** to **bootstrap** the cookie session; **Redis** remains the store for **session metadata** and cache paths tied to that session, not a replacement for Supabase’s JWT issuance.

---

*See also: `architecture_update.md`, `session_redis_supabase.md`, and `env_template.md`.*
