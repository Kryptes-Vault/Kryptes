/**
 * Kryptex OAuth / email confirmation return URL.
 *
 * Always derived from the browser's current origin so dev (e.g. :5173),
 * preview URLs, and Vercel prod never drift to a stale port.
 *
 * ── Multi-Provider OAuth Architecture ──
 *
 * Supabase acts as the OAuth broker for ALL providers. The frontend never
 * talks to Google/Twitter/Azure directly — it calls `signInWithOAuth()`
 * which redirects through Supabase's auth endpoint.
 *
 * Flow for ANY provider:
 *   1. User clicks provider button on Kryptex frontend
 *   2. Supabase JS redirects browser → Supabase Auth → Provider consent
 *   3. Provider → Supabase callback (`<project>.supabase.co/auth/v1/callback`)
 *   4. Supabase → `redirectTo` (your frontend `/auth/callback`)
 *   5. Frontend exchanges PKCE code and syncs session with Render API
 *
 * ── "Unsupported provider" / "Provider not enabled" Fix ──
 *
 * This error means the provider is NOT toggled ON in the Supabase Dashboard.
 * For Twitter (X), you must:
 *
 *   1. Twitter Developer Portal (developer.x.com):
 *      • Create a project + app (or use existing)
 *      • Enable OAuth 2.0 (User Authentication Settings)
 *      • Set Type: "Web App"
 *      • Callback URL: https://<project-ref>.supabase.co/auth/v1/callback
 *      • Website URL: https://kryptes.vercel.app
 *      • Copy Client ID + Client Secret
 *
 *   2. Supabase Dashboard:
 *      • Authentication → Providers → Twitter
 *      • Toggle ON
 *      • Paste Client ID and Client Secret from Twitter
 *      • Save
 *
 *   3. Supabase Dashboard → URL Configuration:
 *      • Site URL: https://kryptes.vercel.app
 *      • Redirect URLs: add both:
 *        - https://kryptes.vercel.app/**
 *        - http://localhost:5173/**
 *
 * @see docs/34_twitter_oauth_integration.md
 */
export function getOAuthRedirectUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }
  const { origin, port } = window.location;
  if (
    import.meta.env.DEV &&
    (port === "8080" || origin.includes(":8080"))
  ) {
    console.warn(
      "[Kryptex] OAuth redirect uses port 8080. Prefer Vite default http://localhost:5173 and add it under Supabase → Authentication → Redirect URLs.",
    );
  }
  return `${origin}/auth/callback`;
}

// ── Per-Provider OAuth Options ─────────────────────────────────────────────

type OAuthProvider = "google" | "x" | "azure" | "linkedin_oidc";

interface ProviderOAuthOptions {
  queryParams?: Record<string, string>;
  scopes?: string;
}

/**
 * Provider-specific OAuth configuration. Returns the correct query params
 * and scopes for each supported provider.
 *
 * - **Google**: `access_type=offline` for refresh tokens, `prompt=consent`
 * - **X (fka Twitter)**: `tweet.read` + `users.read` scopes (OAuth 2.0 PKCE)
 * - **Azure**: default Supabase handling (no extra params needed)
 */
export function getProviderOptions(provider: OAuthProvider): ProviderOAuthOptions {
  switch (provider) {
    case "google":
      return {
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      };
    case "x":
      // X (Twitter) OAuth 2.0 requires PKCE which Supabase handles.
      // Scopes: "tweet.read users.read" (standard for user info/profile)
      // Note: provider string is "x" in Supabase for OAuth 2.0, 
      // but must be configured with the OAuth 2.0 Client/Secret in the Dashboard.
      return {
        scopes: "tweet.read users.read offline.access",
      };
    case "azure":
      return {};
    case "linkedin_oidc":
      // LinkedIn OIDC (2026 Standard)
      // Scopes: openid (identity), profile (name/picture), email
      return {
        scopes: "openid profile email",
      };
    default:
      return {};
  }
}

// Re-export for backward compatibility
export const googleOAuthQueryParams: Record<string, string> = {
  access_type: "offline",
  prompt: "consent",
};
