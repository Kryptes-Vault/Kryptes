# Kryptex Protocol — Production Auth & Debugging (502, Ports, Hooks)

This document records a production-class debugging pass for **Google OAuth login loops**, **502 Bad Gateway** on Render, **Supabase Auth Hooks** timing out, and **redirect URI** drift (including legacy `localhost:8080` references).

---

## 1. Incident report: 502 Bad Gateway & `X-Render-Routing: no-deploy`

### Symptoms

- Render dashboard or upstream logs show **502 Bad Gateway** when **Supabase** (Auth Hook HTTPS), **cron**, or **Google OAuth callbacks** hit the API.
- Response headers may include **`X-Render-Routing: no-deploy`**.
- Users see a **login loop**: OAuth completes in the browser, but session sync to the API fails or email never arrives.

### Root causes (typical)

| Cause | What happens |
|--------|----------------|
| **Wrong port binding** | The Node process listens on a fixed port (e.g. `4000`) while Render’s proxy forwards to **`process.env.PORT`** (dynamic). Nothing is listening on the assigned port → **502**. |
| **Binding only to `localhost`** | If the server bound to `127.0.0.1` only, the platform load balancer could not connect. **Bind to `0.0.0.0`** (all interfaces) so the edge can reach your app. |
| **Cold start + hook timeout** | Supabase **Send Email** hooks expect a response within **~3 seconds**. A **sleeping** Render **free** service can take **tens of seconds** to wake → hook caller times out → **502** / failed signup. |
| **Stale deploy / wrong URL** | **`no-deploy`** often indicates the request did not match a running service route (wrong hostname, typo, or service not deployed). Confirm the **exact** HTTPS URL in Supabase & Google Cloud Console. |

### Resolution implemented in-repo

- **`GET /health`** — liveness JSON.
- **`GET /health/deep`** — logs **`process.env.PORT`**, **`Host`**, **`X-Forwarded-For`**, **`X-Forwarded-Proto`**, **`X-Render-Routing`**, **`req.ip`**. Use this on Render to confirm how traffic reaches the process.
- **`server.js`** listens with **`app.listen(PORT, "0.0.0.0", …)`** and **`PORT` from `process.env.PORT`** (fallback `4000` for local dev only).

### Why hardcoding `4000` breaks Render

Render injects **`PORT`** (e.g. `10000`). The public URL still looks like `https://your-service.onrender.com`; the **reverse proxy** forwards to **`127.0.0.1:PORT`**. If your app listens on **4000** while Render assigned **10000**, the proxy hits **nothing** → **502**. Always use **`process.env.PORT`** in production.

---

## 2. Architecture update: “Hot path” hooks → Edge Functions

### Problem

- **Auth Hooks** (e.g. Send Email) are **latency-sensitive** (~3s).
- **Render free** instances **spin down**; first request pays a **cold start** (~30–60s+), far beyond the hook budget.

### Recommended pattern

| Layer | Role |
|--------|------|
| **Supabase Edge Function** | Receives the **HTTPS Auth Hook**, verifies **Standard Webhooks** signature, sends email via **Resend** (or similar) in **< 1s**. No dependency on Render wake-up. |
| **Render Node API** | Session sync, vault, webhooks that are **not** on the 3s hook path; acceptable to cold-start if users retry, or use **paid** Render / **always-on** worker. |

### In this repo

- **`supabase/functions/send-email-hook/index.ts`** — Deno Edge Function: verifies hook, sends signup mail via **Resend** (`RESEND_API_KEY`). Deploy with Supabase CLI; set hook URL in **Supabase Dashboard → Authentication → Hooks**.

### Alternatives (trade-offs)

- **Cron ping** every few minutes to keep Render warm — fragile, not guaranteed, still can race cold start.
- **Upgrade Render** to a plan that avoids sleep — simplest for keeping the **existing** Node hook at `POST /api/auth/send-email-hook`.
- **Queue** (e.g. external worker) — overkill unless you already operate one.

---

## 3. Redirect URI resolution (Google OAuth & Supabase)

### Application code

- **`src/lib/oauthRedirect.ts`** exports **`getOAuthRedirectUrl()`** → **`${window.location.origin}/auth/callback`**.
- **`Index.tsx`** uses this for **`signInWithOAuth({ redirectTo })`** and **`signUp({ emailRedirectTo })`**.
- **Do not** hardcode `http://localhost:8080` (legacy Vite/CRA ports). Use **Vite default `5173`** locally and add **`http://localhost:5173/**`** (wildcard) under **Supabase → Authentication → URL Configuration → Redirect URLs**.

### Dashboard configuration

- **Supabase**: Site URL + Redirect URLs must include **production** (`https://your-app.vercel.app/**`) and **local** dev origins you use.
- **Google Cloud Console**: OAuth **Authorized redirect URIs** must list Supabase’s callback, e.g. `https://<project-ref>.supabase.co/auth/v1/callback` — **not** your Vite port directly for the Google→Supabase leg.

If the browser still shows **8080**, you are likely opening the app on **8080** (wrong dev server) or an **old bookmark**; the code warns in dev when `port === "8080"`.

---

## 4. Environment variable audit

| Key | Vercel (Vite / browser) | Render (Node API) | Supabase Dashboard / Edge secrets |
|-----|-------------------------|-------------------|-------------------------------------|
| `VITE_SUPABASE_URL` | Yes | No | N/A |
| `VITE_SUPABASE_ANON_KEY` | Yes (public) | No | N/A |
| `VITE_BACKEND_URL` | Yes (`https://…onrender.com`) | No | N/A |
| `VITE_FIREBASE_*` | If using Firebase client | No | N/A |
| `SUPABASE_URL` | No | Yes (server) | Yes (Edge Function) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Never** | Yes | Only if Edge needs admin (usually no) |
| `SUPABASE_HOOK_SECRET` | No | Yes (Node hook) | Yes (Edge hook) |
| `RESEND_API_KEY` | No | Optional | Yes (recommended for Edge email) |
| `MAIL_FROM` | No | Yes | Yes (Edge) |
| `SESSION_SECRET` | No | Yes | No |
| `REDIS_URL` | No | Yes | No |
| `FRONTEND_URL` | No | Yes (CORS) | No |
| `API_BASE_URL` | No | Yes (optional; defaults) | No |
| `PORT` | N/A | **Set by Render** | N/A |
| `BIND_HOST` | No | Optional (`0.0.0.0` default in code) | N/A |
| Google OAuth (Gmail API, etc.) | No | Yes (secrets) | No |

**Rule:** Only **`VITE_*`** variables are exposed to the browser. **Service role**, **hook secrets**, and **Resend** keys stay server-side or Edge secrets.

---

## 5. Operational checklist

1. Deploy backend; open **`https://<render-host>/health/deep`** and confirm **`processEnvPort`** matches Render’s assigned port and **`host`** matches your service hostname.
2. Ensure **Start Command** is `npm run start` (or `node server.js`) from **`backend/`** if the service root is the monorepo — match **Root Directory** in Render to where `package.json` lives.
3. Point **Supabase Send Email** hook to **Edge Function URL** (preferred) or warm **paid** Render.
4. Align **Supabase** and **Google** redirect URIs with **`window.location.origin`** behavior above.

---

## 6. References

- Render: [Web services — port binding](https://render.com/docs/web-services#port-binding)
- Supabase: [Send Email Auth Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook)
- In-repo: `docs/env_template.md`, `backend/routes/authEmailHook.js`, `backend/server.js`
