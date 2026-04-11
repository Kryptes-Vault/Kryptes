/** Supabase Auth session for RLS-scoped vault and audit queries — backed by {@link AuthProvider}. */
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";

export function useSupabaseUser(): {
  user: User | null;
  /** @deprecated Use `isLoading` — same boolean */
  loading: boolean;
  isLoading: boolean;
} {
  const { user, isLoading } = useAuth();
  return { user, loading: isLoading, isLoading };
}
