# Custom SMTP integration (Supabase native)

This document describes the **finalized** email delivery model for Kryptex: **Supabase Auth’s Custom SMTP**, with **no dependency on the Render Node.js backend** for sending transactional mail.

## Architecture update

- **Supabase Custom SMTP** is enabled so that **all authentication-related email** (verification, recovery, magic links, etc.) is sent **directly from Supabase** using your SMTP credentials.
- The **Render** API is **not** in the path for outbound auth email: no webhook handler, no nodemailer path, and no email HTML maintained in the Node codebase for these flows.
- This keeps email infrastructure **centralized in Supabase**, aligned with where Auth and redirect URLs are already configured.

> **Note:** If you previously used an **HTTPS Send Email Hook** to Render (`/api/auth/send-email-hook`), that path is **orthogonal** to Custom SMTP. With Custom SMTP enabled and the hook disabled, Supabase sends mail itself—see `docs/auth/email-auth-hook.md` only if you still operate a hook-based flow.

## Connection details

| Setting | Value |
|--------|--------|
| **Host** | `smtp.gmail.com` |
| **Port** | **465** |
| **Encryption** | **SSL/TLS** (implicit TLS on 465—secure connection end-to-end) |

Configure these in **Supabase Dashboard → Project Settings → Authentication** (or **Auth → SMTP Settings**, depending on dashboard version) under **Custom SMTP**.

## Authentication strategy

- The integration uses a **Google Account “App Password”** (generated for the developer mailbox in Google Account security settings), **not** an OAuth 2.0 refresh token and **not** a broad Google Cloud OAuth client for Gmail API access.
- **Why this matters:** App Passwords are **scoped to SMTP/IMAP mail access** for that Google account and are **separate** from OAuth clients, service accounts, and other Google Cloud console credentials. That **isolates** “ability to send mail” from **broader** API and cloud permissions used elsewhere in the project.

Store the App Password only in **Supabase** (encrypted at rest per Supabase practices)—never in the frontend or in public repos.

## Template management

- **Transactional templates**—including **Confirm signup**, **Reset password**, **Magic link**, and related Auth emails—are **configured and styled in the Supabase Dashboard**, under the Auth email / template sections (e.g. **Authentication → Sign In / Providers → Email**, plus **Email Templates** where available).
- **Benefit:** The **Vercel** frontend and **Render** backend **do not** need to embed or maintain HTML email strings for these flows, which keeps repositories smaller and avoids duplicate template drift between code and product.

For product-specific copy or localization, update templates in Supabase rather than shipping new deploys for wording changes.

---

*See also: `docs/platform/env-template.md`, `docs/platform/supabase-migration-firebase.md`.*
