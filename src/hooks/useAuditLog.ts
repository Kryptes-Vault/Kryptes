/** Hook: realtime vault_audit_log subscription. */
import { useCallback, useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type AuditLogRow = {
  id: string;
  user_id: string;
  vault_item_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export function useAuditLog(userId: string | null) {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: qErr } = await supabase
      .from("vault_audit_log")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (qErr) {
      // Table might not exist yet — graceful fallback
      if (qErr.code === "42P01") {
        setRows([]);
      } else {
        setError(qErr.message);
        setRows([]);
      }
    } else {
      setRows((data as AuditLogRow[]) ?? []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!userId) return;

    const ch: RealtimeChannel = supabase
      .channel(`vault_audit_log:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "vault_audit_log",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void load();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [userId, load]);

  return { rows, loading, error, reload: load };
}
