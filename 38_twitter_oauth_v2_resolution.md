# 38 Twitter OAuth v2 Resolution (Kryptex Protocol)

## Incident Log
- **Date**: 2026-04-07
- **Issue**: "Unsupported Provider" error when attempting to sign in with Twitter (X).
- **Cause**: The application was attempting to use the `twitter` provider string with legacy settings, or the mapping was misaligned with Supabase Auth v2 requirements for X (formerly Twitter).
- **Resolution**: Verified that `supabase-js` expects the `twitter` provider string, but requires **OAuth 2.0 (PKCE)** to be correctly toggled in the Supabase Dashboard and matched with the Twitter Developer Portal.

## Config Specs: Supabase Dashboard vs. Twitter
To prevent the "Unsupported Provider" error, ensure the following settings are synced:

| Feature | Supabase Dashboard Setting | Twitter Developer Portal (v2) |
|---------|---------------------------|-------------------------------|
| **Provider** | Twitter (OAuth 2.0) | OAuth 2.0 Settings |
| **API Keys** | Client ID / Client Secret (OAuth 2.0) | Client ID / Client Secret (under OAuth 2.0) |
| **Callback URL** | `https://yhnonhusmdqeiefherbx.supabase.co/auth/v1/callback` | Must match Supabase exactly |
| **Type** | Confidential Client | Type: Web App |

## Security Note (Kryptex Protocol)
The following OAuth scopes are requested to ensure proper user profile population:
- `tweet.read`: Required for authentication verification.
- `users.read`: Required to extract public profile data (username, avatar).
- `offline.access`: Required for persistent sessions (refresh tokens).

All external metadata is stored in `public.profiles` via the `handle_new_user()` trigger for branding and display purposes, while vault data remains zero-knowledge.