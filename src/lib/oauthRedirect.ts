/**
 * Kryptex OAuth / email confirmation return URL.
 * Always derived from the browser’s current origin so dev (e.g. :5173), preview URLs, and Vercel
 * prod never drift to a stale port (legacy docs sometimes mention :8080 — do not hardcode).
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
