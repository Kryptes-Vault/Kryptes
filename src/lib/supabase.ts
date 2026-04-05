/** Browser Supabase client — requires `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. */
import { createClient } from "@supabase/supabase-js";

const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when both URL and anon key are set (trimmed non-empty). */
export const isSupabaseConfigured = Boolean(envUrl?.trim() && envKey?.trim());

/**
 * Supabase JS throws if URL or key are empty. When env is missing (e.g. fresh clone),
 * we use placeholders so the app boots; API/auth calls fail until `.env` is filled.
 */
const url = isSupabaseConfigured ? envUrl!.trim() : "https://yhnonhusmdqeiefherbx.supabase.co";
const anonKey = isSupabaseConfigured ? envKey!.trim() : "sb-placeholder-anon-key-not-for-production";

if (!isSupabaseConfigured) {
  console.warn(
    "[Kryptex] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set. Add them to `.env` — using a placeholder Supabase client so the app can load."
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    flowType: "pkce",
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});
