# Kryptex documentation index

| Document | Purpose |
|----------|---------|
| [architecture_update.md](./architecture_update.md) | Firebase → Supabase migration, schema, RLS, redirect URLs |
| [session_redis_supabase.md](./session_redis_supabase.md) | Redis session + `/api/auth/supabase/sync` flow |
| [env_template.md](./env_template.md) | Environment variables (no secrets) |
| [03_google_oauth_supabase.md](./03_google_oauth_supabase.md) | Google OAuth via Supabase (vs Passport), redirects, JWT → Redis flow |
| [05_env_cleanup_and_security.md](./05_env_cleanup_and_security.md) | Remove provider secrets from hosts; required env vars; JWT validation model |
| [06_email_auth_hook_integration.md](./06_email_auth_hook_integration.md) | Send Email HTTPS hook, webhook verification, signup mail via nodemailer |
| [06_custom_smtp_integration.md](./06_custom_smtp_integration.md) | Supabase Custom SMTP (Gmail 465 SSL), App Password, dashboard templates |

## Checklists

| Document | Purpose |
|----------|---------|
| [checklists/supabase-dashboard.md](./checklists/supabase-dashboard.md) | Supabase project and auth URLs |
| [checklists/vercel-env.md](./checklists/vercel-env.md) | Vercel `VITE_*` variables |
| [checklists/render-env.md](./checklists/render-env.md) | Render API secrets |
| [checklists/post-deploy.md](./checklists/post-deploy.md) | Smoke tests after deploy |

**Convention:** When changing auth, database, or deployment wiring, add or update a doc in this folder.
