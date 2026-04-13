/** 
 * useVaultItems - TanStack React Query Migration
 * Handles loading vault items with automated caching, loading states, 
 * and mutation-based invalidation to ensure UI synchronization.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type VaultItemRow = {
  id: string;
  user_id: string;
  title: string | null;
  ciphertext: string;
  iv: string;
  salt: string | null;
  encryption_version: string;
  share_count: number;
  created_at: string;
  updated_at: string;
  item_type: string;
  metadata?: any;
};

const VAULT_ITEMS_KEY = ["vaultItems"];

export function useVaultItems(userId: string | null) {
  const queryClient = useQueryClient();

  // 1. Fetcher function
  const fetchVaultItems = async (): Promise<VaultItemRow[]> => {
    if (!userId) return [];
    const resp = await fetch(`/api/vault/items?userId=${userId}`, { credentials: "include" });
    if (!resp.ok) {
      const errorData = await resp.json();
      throw new Error(errorData.error || "Failed to fetch vault items");
    }
    const data = await resp.json();
    return data.items || [];
  };

  // 2. Query Hook
  const { data: items = [], isLoading: loading, error } = useQuery({
    queryKey: [...VAULT_ITEMS_KEY, userId],
    queryFn: fetchVaultItems,
    enabled: !!userId,
    // Keep data fresh but allow background re-fetches
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // 3. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      const resp = await fetch(`/api/vault/documents/${docId}?userId=${userId}`, { 
        method: "DELETE",
        credentials: "include"
      });
      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || "Delete failed");
      }
      return resp.json();
    },
    onSuccess: () => {
      // CRITICAL: Invalidate cache immediately on success
      queryClient.invalidateQueries({ queryKey: VAULT_ITEMS_KEY });
    },
  });

  // 4. Commit Mutation (for uploads)
  const commitMutation = useMutation({
    mutationFn: async (payload: any) => {
      const resp = await fetch("/api/vault/documents/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error("Commit failed");
      return resp.json();
    },
    onSuccess: () => {
      // CRITICAL: Invalidate cache immediately on success
      queryClient.invalidateQueries({ queryKey: VAULT_ITEMS_KEY });
    },
  });

  // 5. Supabase Realtime (Optional but helpful for cross-device sync)
  useEffect(() => {
    if (!userId) return;
    const channelId = `vault_sync:${userId}:${Math.random().toString(36).slice(2, 9)}`;
    const ch = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vault_items", filter: `user_id=eq.${userId}` },
        () => {
          // Trigger a background re-fetch via invalidation
          queryClient.invalidateQueries({ queryKey: [...VAULT_ITEMS_KEY, userId] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [userId, queryClient]);

  return {
    items,
    loading,
    error: error instanceof Error ? error.message : null,
    // Mutation helpers
    deleteItem: deleteMutation.mutateAsync,
    commitDocument: commitMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    isCommitting: commitMutation.isPending,
    // Compatibility export
    reload: () => queryClient.invalidateQueries({ queryKey: VAULT_ITEMS_KEY }),
  };
}
