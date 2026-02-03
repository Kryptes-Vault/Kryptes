/**
 * Post-OAuth callback: exchanges the PKCE code for a Supabase session,
 * then optionally syncs with the Render backend.
 *
 * ── Why "Completing sign-in…" gets stuck ──
 * The old code called `supabase.auth.getSession()` immediately, but after
 * an OAuth redirect the PKCE code exchange hasn't completed yet. The tokens
 * are in the URL hash/query and Supabase needs to process them first.
 *
 * Fix: Listen to `onAuthStateChange` for the `SIGNED_IN` event, which fires
 * AFTER the PKCE exchange completes. Also add a timeout and make the backend
 * sync non-blocking (the dashboard can load with just the Supabase session).
 */
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

/** Timeout for the entire auth callback flow (ms) */
const AUTH_TIMEOUT_MS = 15_000;

/** Sync session cookie with Render backend (best-effort, non-blocking for UX) */
async function syncSessionCookie(accessToken: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    const res = await fetch(`${backend}/api/auth/supabase/sync`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.warn("[AuthCallback] Backend sync failed:", (body as { error?: string }).error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[AuthCallback] Backend sync error (non-fatal):", e);
    return false;
  }
}

const AuthCallback = () => {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Completing sign-in…");
  const handled = useRef(false);

  useEffect(() => {
    // Safety timeout — if nothing happens in 15s, redirect home
    const fallback = setTimeout(() => {
      if (!handled.current) {
        handled.current = true;
        console.error("[AuthCallback] Timeout waiting for auth state change");
        toast.error("Sign-in timed out. Please try again.");
        navigate("/", { replace: true });
      }
    }, AUTH_TIMEOUT_MS);

    // Listen for the SIGNED_IN event (fires after PKCE exchange)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (handled.current) return;

      if (event === "SIGNED_IN" && session) {
        handled.current = true;
        clearTimeout(fallback);

        setMsg("Setting up your vault…");

        // Best-effort backend sync — don't block the user
        const synced = await syncSessionCookie(session.access_token);
        if (!synced) {
          console.warn("[AuthCallback] Backend sync skipped — dashboard will use Supabase session directly");
        }

        toast.success("Welcome to Kryptex");
        navigate("/dashboard", { replace: true });
        return;
      }

      // Handle explicit sign-out or token refresh error during callback
      if (event === "TOKEN_REFRESHED" && session) {
        // Token was refreshed, session is valid
        return;
      }
    });

    // Also check if we already have a session (e.g. page reload on /auth/callback)
    (async () => {
      if (handled.current) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !handled.current) {
        handled.current = true;
        clearTimeout(fallback);
        setMsg("Setting up your vault…");
        const synced = await syncSessionCookie(session.access_token);
        if (!synced) {
          console.warn("[AuthCallback] Backend sync skipped on existing session");
        }
        toast.success("Welcome to Kryptex");
        navigate("/dashboard", { replace: true });
      }
    })();

    return () => {
      clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#111]">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-[#FF3B13]/10 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#FF3B13] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-[#FF3B13]">{msg}</p>
          <p className="text-xs text-black/40 mt-2 font-medium">This should only take a moment</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
