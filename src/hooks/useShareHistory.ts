/** Realtime `vault_audit_log` for tracking vault actions. */
import { useCallback, useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type ShareHistoryRow = {
  id: string;
  user_id: string;
  vault_item_id: string;
  /** Action performed: "reveal" | "copy" | "create" | "delete" */
  action: string;
  metadata: any;
  created_at: string;
};

/** Timestamp for sorting/display (supports vault_audit_log naming). */
export function shareHistoryTime(r: ShareHistoryRow): string {
  return r.created_at ?? "";
}

export function useShareHistory(userId: string | null) {
  const [rows, setRows] = useState<ShareHistoryRow[]>([]);
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
    
    // Redirecting from non-existent "share_history" to "vault_audit_log"
    const { data, error: qErr } = await supabase
      .from("vault_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (qErr) {
      setError(qErr.message);
      setRows([]);
    } else {
      setRows((data as ShareHistoryRow[]) ?? []);
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

