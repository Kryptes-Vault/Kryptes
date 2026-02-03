/**
 * Supabase Edge Function — Auth Session Hook (Custom Access Token)
 *
 * Hot-path hook that runs during token generation. Supabase calls this on
 * every token refresh / sign-in to allow custom claims injection.
 *
 * This function runs at the edge (~50ms), completely bypassing the Render
 * backend cold-start problem. It validates the incoming hook payload and
 * enriches the JWT claims with Kryptex-specific metadata.
 *
 * ── Why this exists ──
 * Supabase Auth Hooks have a strict ~3-second timeout. The Render Free Tier
 * can sleep for 15+ minutes, causing cold starts of 30–60s. By moving
 * latency-sensitive hooks to Edge Functions, we stay well within budget.
 *
 * Configure in Supabase Dashboard:
 *   Authentication → Hooks → Customize Access Token → HTTPS
 *   URL: (this function's deployed URL)
 *   Secret: Same SUPABASE_HOOK_SECRET used by send-email-hook
 *
 * Required secrets (Functions → auth-session-hook → Secrets):
 *   SUPABASE_HOOK_SECRET  (v1,whsec_…)
 *
 * @see docs/24_branding_and_handshake_architecture.md
 */
import { Webhook } from "npm:standardwebhooks@1.0.0";

// ── Helpers ────────────────────────────────────────────────────────────────

function headersToRecord(h: Headers): Record<string, string> {
  const o: Record<string, string> = {};
  h.forEach((v, k) => {
    o[k] = v;
  });
  return o;
}

// ── Types ──────────────────────────────────────────────────────────────────

interface CustomAccessTokenPayload {
  /** The original Supabase claims (sub, email, role, etc.) */
  claims: Record<string, unknown>;
  /** User ID from auth.users */
  user_id: string;
  /** Authentication method used (e.g. "oauth", "email") */
  authentication_method: string;
}

interface CustomAccessTokenResponse {
  claims: Record<string, unknown>;
}

// ── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const start = performance.now();

  // Health check for monitoring
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ status: "ok", function: "auth-session-hook" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const hookSecret = Deno.env.get("SUPABASE_HOOK_SECRET");
  if (!hookSecret) {
    console.error("[auth-session-hook] Missing SUPABASE_HOOK_SECRET");
    return new Response(
      JSON.stringify({ error: "Hook secret not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const rawBody = await req.text();

  // ── Verify Standard Webhooks signature ───────────────────────────────
  let payload: CustomAccessTokenPayload;
  try {
    const secret = hookSecret.replace(/^v1,whsec_/, "");
    const wh = new Webhook(secret);
    payload = wh.verify(
      rawBody,
      headersToRecord(req.headers),
    ) as CustomAccessTokenPayload;
  } catch (e) {
    console.error("[auth-session-hook] Signature verification failed:", e);
    return new Response(
      JSON.stringify({ error: "Invalid webhook signature" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── Enrich claims ────────────────────────────────────────────────────
  const { claims, user_id, authentication_method } = payload;

  // Add Kryptex-specific custom claims to the JWT
  const enrichedClaims: Record<string, unknown> = {
    ...claims,
    // Mark that this token was processed by the Kryptex hook
    "x-kryptex-verified": true,
    // Propagate authentication method for downstream route guards
    "x-auth-method": authentication_method,
    // Timestamp of hook processing (useful for debugging token freshness)
    "x-hook-processed-at": new Date().toISOString(),
  };

  const elapsed = (performance.now() - start).toFixed(0);
  console.log(
    `[auth-session-hook] ✓ Claims enriched for user=${user_id} method=${authentication_method} (${elapsed}ms)`,
  );

  const response: CustomAccessTokenResponse = {
    claims: enrichedClaims,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
