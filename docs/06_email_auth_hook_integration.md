# Email Auth Hook integration (Supabase → Render)

Kryptex bypasses **Supabase’s built-in SMTP** for auth mail and uses an **HTTPS Send Email Auth Hook** that POSTs to the Render API. The Node handler verifies the webhook, builds confirmation links, and sends mail through **nodemailer + Gmail OAuth2** (existing refresh-token path in `services/emailService.js`).

## 1. Why bypass native SMTP

| Approach | Behavior |
|----------|----------|
| **Supabase SMTP / default mail** | Supabase sends mail from its pipeline. |
| **Auth Hook (this setup)** | Supabase **does not** send the email itself; it **delegates** to `POST /api/auth/send-email-hook` on Render. You control templates, deliverability, and branding. |

Enable the hook in **Supabase Dashboard → Authentication → Hooks** and point the **Send Email** hook URL to:

`https://<your-render-service>/api/auth/send-email-hook`

## 2. Security handshake (`SUPABASE_HOOK_SECRET`)

Supabase signs outbound hook requests using the **Standard Webhooks** spec (same family as `v1,whsec_…` secrets in the dashboard).

- Render stores **`SUPABASE_HOOK_SECRET`** (full string including the `v1,whsec_` prefix).
- The handler uses the **`standardwebhooks`** package to **`verify`** the raw body against headers (`webhook-id`, `webhook-timestamp`, `webhook-signature`).
- Requests that fail verification return **401** so arbitrary callers cannot trigger email sends.

**Never commit** the hook secret. If it was ever exposed, **rotate** it in the Supabase dashboard and update Render env.

## 3. Payload: `user` + `email_data`

The verified payload matches [Supabase Send Email Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook) shape:

| Field | Usage |
|-------|--------|
| `user` | `user.email` (recipient), ids, metadata |
| `email_data.token` | OTP / code shown in the email |
| `email_data.token_hash` | Used in the **verify** query string (not the raw OTP alone) |
| `email_data.email_action_type` | e.g. `signup`, `recovery`, `magiclink`, … |
| `email_data.site_url` | Supabase **Site URL** context |
| `email_data.redirect_to` | Where Auth redirects after verification (e.g. Vercel app) |

### Verification URL (magic link)

The backend builds a Supabase Auth verify URL (same pattern as official docs):

```text
{SUPABASE_URL}/auth/v1/verify?token={token_hash}&type={email_action_type}&redirect_to={redirect_to}
```

`SUPABASE_URL` is `https://<project-ref>.supabase.co` (no trailing slash). After the user confirms, Supabase redirects toward your **`redirect_to`** (configure **Additional Redirect URLs** in Supabase). Point users at your SPA route such as **`/auth/callback`** or a dedicated **`/auth/confirm`** flow as you prefer.

### Signup-only sender (current code)

`routes/authEmailHook.js` **sends mail only when** `email_action_type === 'signup'`. Other action types return **200** with an empty JSON body so the hook succeeds, but **no email is sent** until you extend the handler (otherwise recovery / magic-link flows would not deliver mail).

## 4. Nodemailer + Google OAuth2 + Zero-Knowledge branding

- **Deliverability:** Reuses **`createTransporter()`** in `emailService.js` (Gmail OAuth2 + refresh token).
- **Branding:** HTML for signup confirmation lives in **`sendSignupConfirmationEmail`** — adjust copy and layout there; keep secrets out of templates.
- **Zero-knowledge:** The hook only sends **confirmation / OTP** content. It does **not** include vault ciphertext or master keys; those remain client-side per the Kryptex threat model.

## 5. Environment variable

| Name | Host |
|------|------|
| `SUPABASE_HOOK_SECRET` | Render (value from Auth Hooks in Supabase, format `v1,whsec_…`) |
| `SUPABASE_URL` | Render (used to build `/auth/v1/verify` links) |

---

*See also: `05_env_cleanup_and_security.md`, `env_template.md`.*
