 * Browser-side retrieval for virtual vault files (RLS enforces ownership).
 * Does not call Google Drive for listing — only Supabase.
 */
import { supabase } from "@/lib/supabase";
import type { VaultFileRow } from "@/types/vaultVirtualStorage";

/**
 * Returns all file metadata rows for the authenticated user in the given virtual folder.
 * Requires an active Supabase session; returns [] if not signed in (or on RLS deny).
 */
export async function getFilesInFolder(folderCode: string): Promise<VaultFileRow[]> {
  const trimmed = folderCode.trim();
  if (!trimmed) return [];

  const { data, error } = await supabase
    .from("vault_files")
    .select("id, user_id, file_name, mega_file_link, unique_file_code, linked_folder_code, created_at, updated_at")
    .eq("linked_folder_code", trimmed)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[vaultVirtualFilesClient] getFilesInFolder", error.message);
    throw error;
  }

  return (data ?? []) as VaultFileRow[];
}
