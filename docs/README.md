# Kryptex documentation index

| Document | Purpose |
|----------|---------|
| [architecture_update.md](./architecture_update.md) | Firebase → Supabase migration, schema, RLS, redirect URLs |
| [session_redis_supabase.md](./session_redis_supabase.md) | Redis session + `/api/auth/supabase/sync` flow |
| [env_template.md](./env_template.md) | Environment variables (no secrets) |

## Checklists

| Document | Purpose |
|----------|---------|
| [checklists/supabase-dashboard.md](./checklists/supabase-dashboard.md) | Supabase project and auth URLs |
| [checklists/vercel-env.md](./checklists/vercel-env.md) | Vercel `VITE_*` variables |
| [checklists/render-env.md](./checklists/render-env.md) | Render API secrets |
| [checklists/post-deploy.md](./checklists/post-deploy.md) | Smoke tests after deploy |

**Convention:** When changing auth, database, or deployment wiring, add or update a doc in this folder.
