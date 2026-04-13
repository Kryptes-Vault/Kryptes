/** Loads `vault_items` including `share_count` for the Share Counter badge. */
import { useCallback, useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type VaultItemRow = {
  id: string;
  user_id: string;
  /** Optional plaintext label (v2); v1 may omit and keep label inside ciphertext. */
  title: string | null;
  ciphertext: string;
  iv: string;
  salt: string | null;
  encryption_version: string;
  share_count: number;
  created_at: string;
  updated_at: string;
};

export function useVaultItems(userId: string | null) {
  const [items, setItems] = useState<VaultItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/vault/items?userId=${userId}`, { credentials: "include" });
      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || "Failed to fetch vault items");
      }
      const data = await resp.json();
      setItems(data.items || []);
    } catch (err: any) {
      console.error("[useVaultItems] Error:", err);
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!userId) return;

    // Use a unique channel name per-mount to avoid "cannot add callbacks after subscribe" error
    // which happens in Strict Mode or on fast re-renders if a channel with the same name exists.
    const channelId = `vault_items:${userId}:${Math.random().toString(36).slice(2, 11)}`;
    const ch: RealtimeChannel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vault_items",
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

  return { items, loading, error, reload: load };
}
