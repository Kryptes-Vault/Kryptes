import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

/**
 * Renders children only when auth has finished loading and a session exists.
 * Shows a full-screen loader while `isLoading` is true to avoid redirect races on refresh.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white text-[#111]">
        <Loader2 className="h-10 w-10 animate-spin text-[#FF3B13]" aria-hidden />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/40">Loading session…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
