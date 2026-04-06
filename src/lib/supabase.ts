import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    "[Kryptex] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set for auth."
  );
}

export const supabase = createClient(url ?? "", anonKey ?? "", {
  auth: {
    flowType: "pkce",
    detectSessionInUrl: true,
    persistSession: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});
