# Environment variables (template)

**Do not commit real keys.** Copy values from the Supabase dashboard and your host settings.

## Vercel (Vite frontend)

| Name | Description |
|------|-------------|
| `VITE_SUPABASE_URL` | Project URL: `https://<ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase **anon** / publishable key (safe for browsers) |
| `VITE_BACKEND_URL` | API origin, e.g. `https://kryptes.onrender.com` (no trailing slash) |

## Render (Node API)

| Name | Description |
|------|-------------|
| `SUPABASE_URL` | Same as `VITE_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Service role** key — bypasses RLS; server only |
| `SUPABASE_HOOK_SECRET` | Send Email Auth Hook secret (`v1,whsec_…`) — Standard Webhooks verification |
| `REDIS_URL` | Session store |
| `MAIL_FROM` | Optional `"Name" <email@domain>` for outbound mail |
| `SESSION_SECRET` | Random string for `express-session` |
| `FRONTEND_URL` | `https://kryptes.vercel.app` (CORS) |
| `API_BASE_URL` | `https://kryptes.onrender.com` |

## Supabase Dashboard

Under **Authentication → URL Configuration**, set **Site URL** and **Redirect URLs** (see `architecture_update.md`).

If keys were ever pasted into chat or committed to git, **rotate** them in the dashboard.
