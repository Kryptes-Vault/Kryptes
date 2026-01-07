import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

async function syncSessionCookie(accessToken: string) {
  const res = await fetch(`${backend}/api/auth/supabase/sync`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || "Session sync failed");
  }
}

/**
 * After Supabase OAuth redirect, exchange Supabase session for Redis-backed API session.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Completing sign-in…");

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        if (alive) {
          toast.error("Could not complete sign-in");
          navigate("/", { replace: true });
        }
        return;
      }
      try {
        await syncSessionCookie(session.access_token);
        if (alive) {
          toast.success("Welcome to Kryptex");
          navigate("/dashboard", { replace: true });
        }
      } catch (e) {
        console.error(e);
        if (alive) {
          setMsg("Could not sync with the API. Check VITE_BACKEND_URL and CORS.");
          toast.error("Session sync failed");
          navigate("/", { replace: true });
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <p className="text-sm font-medium">{msg}</p>
    </div>
  );
};

export default AuthCallback;
