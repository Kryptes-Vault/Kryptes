import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type AuthContextValue = {
  user: User | null;
  /** True until Supabase has finished its initial session resolution (storage + listener). */
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Single source of truth for Supabase auth. Mount once at the app root.
 * `isLoading` stays true until `INITIAL_SESSION` fires (or a safety fallback runs).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialSessionSettledRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const finishInitialLoad = () => {
      if (!mounted || initialSessionSettledRef.current) return;
      initialSessionSettledRef.current = true;
      setIsLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      // Authoritative “initial load complete” — avoids racing getSession() vs persisted session
      if (event === "INITIAL_SESSION") {
        finishInitialLoad();
      }
    });

    // Seed user from memory/storage; do not flip isLoading here — wait for INITIAL_SESSION (or safety)
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
    });

    // Safety net: rare edge cases where INITIAL_SESSION might not fire as expected
    const safety = window.setTimeout(() => {
      if (!mounted) return;
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
        finishInitialLoad();
      });
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(safety);
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ user, isLoading }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
