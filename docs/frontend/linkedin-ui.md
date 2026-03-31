# Kryptex Protocol: LinkedIn OIDC & Cyber-Noir Implementation

## 1. Overview
This document outlines the integration of LinkedIn as the fourth primary authentication provider for the Kryptex Zero-Knowledge Vault. This update also marks the transition to the **Cyber-Noir** design system (Pure Black / Emerald).

## 2. Authentication Logic (OIDC)
LinkedIn has been implemented using the **OpenID Connect (OIDC)** standard to ensure compatibility with 2026 security requirements.

- **Provider Identity**: `linkedin_oidc`
- **Scopes Requested**:
    - `openid`: Mandatory for OIDC identity.
    - `profile`: Access to name and profile picture.
    - `email`: Access to verified email address.
- **Redirect Mechanism**: Uses dynamic `window.location.origin` to support local (port 5173), preview, and production environments.

## 3. Identity Sync & Metadata
Upon successful handshake, the Kryptex backend and Supabase triggers extract the following metadata to the `profiles` table:
- **Display Name**: Derived from `full_name` or a concatenation of `given_name` and `family_name`.
- **Avatar URL**: Derived from the LinkedIn `picture` claim.

## 4. Security Audit: Identity vs. Decryption
It is critical to distinguish between **Authentication** and **Decryption** in the Kryptex Zero-Knowledge model.

| Layer | Responsibility | Mechanism |
| :--- | :--- | :--- |
| **Identity** | Verify "Who" you are. | LinkedIn OIDC / Supabase Auth. |
| **Vault Access** | Decrypt "What" you own. | Client-side AES-GCM (Master Password). |

> [!IMPORTANT]  
> LinkedIn only provides the identity token. The user's **Master Password** is never sent to LinkedIn, Supabase, or the Kryptex backend. Decryption keys are derived locally using PBKDF2 on the user's device.

## 5. Handshake Verification (Redirect Path)
The following callback URL must be whitelisted in the LinkedIn Developer Portal:
`https://yhnonhusmdqeiefherbx.supabase.co/auth/v1/callback`

---
*Created by: Lead Frontend Engineer & Security Architect*
*Status: DEPLOYED_V2.0*
