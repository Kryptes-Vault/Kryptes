# Kryptes documentation

Documentation is grouped by **topic**. Paths are from the repository root (e.g. `docs/encryption/...`).

---

## Encryption & vault

| Document | Description |
|----------|-------------|
| [encryption/vault-crypto-and-redirects.md](./encryption/vault-crypto-and-redirects.md) | Client AES-GCM, PBKDF2, OAuth redirect rules |
| [encryption/vault-database-schema.md](./encryption/vault-database-schema.md) | `vault_items` ciphertext, RLS |
| [encryption/ephemeral-sharing.md](./encryption/ephemeral-sharing.md) | Burn-on-read `shared_secrets`, URL fragment |
| [encryption/password-vault.md](./encryption/password-vault.md) | Password vault feature |
| [encryption/granular-gatekeeper.md](./encryption/granular-gatekeeper.md) | Granular gatekeeper / profile flags |
| [developer-access.md](./developer-access.md) | **Developer Access** — consent-based support snapshot (product) |
| [encryption/zero-knowledge-support-grant.md](./encryption/zero-knowledge-support-grant.md) | ZK + OTP developer access / support grant (detailed design) |

---

## Frontend & UI

| Document | Description |
|----------|-------------|
| [frontend/settings-dashboard.md](./frontend/settings-dashboard.md) | Settings dashboard spec |
| [frontend/linkedin-ui.md](./frontend/linkedin-ui.md) | LinkedIn UI |
| [frontend/animation-orchestration.md](./frontend/animation-orchestration.md) | Animation orchestration |
| [frontend/add-node-component.md](./frontend/add-node-component.md) | Add-node component spec |
| [frontend/branding-handshake.md](./frontend/branding-handshake.md) | Branding & OAuth handshake |

---

## Auth, email & sessions

| Document | Description |
|----------|-------------|
| [auth/google-oauth-supabase.md](./auth/google-oauth-supabase.md) | Google OAuth via Supabase |
| [auth/session-redis-supabase.md](./auth/session-redis-supabase.md) | Redis session + `/api/auth/supabase/sync` |
| [auth/email-auth-hook.md](./auth/email-auth-hook.md) | Send Email HTTPS hook, webhooks |
| [auth/custom-smtp.md](./auth/custom-smtp.md) | Supabase Custom SMTP (Gmail, etc.) |
| [auth/production-auth-debugging.md](./auth/production-auth-debugging.md) | Production auth debugging |
| [auth/twitter-oauth-integration.md](./auth/twitter-oauth-integration.md) | Twitter / X OAuth integration |
| [auth/twitter-oauth-v2-resolution.md](./auth/twitter-oauth-v2-resolution.md) | Twitter OAuth v2 resolution |

---

## Platform, deployment & API

| Document | Description |
|----------|-------------|
| [platform/supabase-migration-firebase.md](./platform/supabase-migration-firebase.md) | Firebase → Supabase migration, RLS, redirects |
| [platform/env-cleanup-security.md](./platform/env-cleanup-security.md) | Env cleanup, JWT validation, secrets |
| [platform/vercel-env-sync.md](./platform/vercel-env-sync.md) | Vercel / Supabase env sync |
| [platform/env-template.md](./platform/env-template.md) | Environment variable template |
| [platform/api-configuration.md](./platform/api-configuration.md) | Final API configuration |
| [R2_MIGRATION_CHANGELOG.md](./R2_MIGRATION_CHANGELOG.md) | Google Drive → Cloudflare R2 migration, pre-signed URL architecture, ZK lifecycle |

---

## Operations checklists

| Document | Description |
|----------|-------------|
| [operations/checklists/supabase-dashboard.md](./operations/checklists/supabase-dashboard.md) | Supabase project & auth URLs |
| [operations/checklists/vercel-env.md](./operations/checklists/vercel-env.md) | Vercel `VITE_*` variables |
| [operations/checklists/render-env.md](./operations/checklists/render-env.md) | Render API secrets |
| [operations/checklists/post-deploy.md](./operations/checklists/post-deploy.md) | Post-deploy smoke tests |

---

## Legal

| Document | Description |
|----------|-------------|
| [legal/PRIVACY_POLICY.md](./legal/PRIVACY_POLICY.md) | Privacy policy |
| [legal/TERMS_OF_SERVICE.md](./legal/TERMS_OF_SERVICE.md) | Terms of service |

---

**Convention:** When changing auth, database, encryption, or deployment wiring, add or update a doc in the matching folder and link it from this index.
