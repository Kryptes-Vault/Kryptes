/** Realtime `share_history` for audit UI (shared_at / legacy created_at). */
import { useCallback, useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type ShareHistoryRow = {
  id: string;
  user_id: string;
  vault_item_id: string;
  /** When the share link was generated (preferred; migration renames legacy `created_at`). */
  shared_at?: string;
  created_at?: string;
  share_type: string;
};

/** Timestamp for sorting/display (supports pre-migration `created_at`). */
export function shareHistoryTime(r: ShareHistoryRow): string {
  return r.shared_at ?? r.created_at ?? "";
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
    let res = await supabase
      .from("share_history")
      .select("*")
      .order("shared_at", { ascending: false })
      .limit(200);
    if (res.error?.message?.includes("shared_at") || res.error?.code === "42703") {
      res = await supabase
        .from("share_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
    }
    const { data, error: qErr } = res;
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
      .channel(`share_history:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "share_history",
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
