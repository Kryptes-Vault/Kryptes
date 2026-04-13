import { Request } from "express";

/**
 * Centrally resolves the Supabase UUID (user_id) for the current requester.
 * Prioritizes the authenticated session and user object to prevent IDOR vulnerabilities.
 */
export function resolveUserId(req: Request): string | null {
  const session = (req as any).session;
  const user = (req as any).user;

  // 1. Session-based ID (Set during /api/auth/supabase/sync)
  if (session?.supabaseUserId) return session.supabaseUserId;

  // 2. Request User object (Set by middleware in server.ts)
  // In our app, providerId stores the original Supabase UUID in the shell user object.
  if (user?.providerId) return user.providerId;

  // 3. Fallback to payload (ONLY if session is missing - for legacy support if needed)
  const q = typeof req.query.userId === "string" ? req.query.userId.trim() : "";
  const body = typeof req.body?.userId === "string" ? req.body.userId.trim() : "";
  
  return q || body || user?.id || null;
}
