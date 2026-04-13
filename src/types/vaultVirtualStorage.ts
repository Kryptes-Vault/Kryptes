/**
 * Virtual vault document model — mirrors `public.vault_files` / `public.vault_folders`.
 * Binary payloads live in Google Drive; Postgres holds structure and links only.
 */

export type VaultFolderRow = {
  id: string;
  user_id: string;
  folder_name: string;
  unique_folder_code: string;
  created_at: string;
  updated_at: string;
};

export type VaultFileRow = {
  id: string;
  user_id: string;
  file_name: string;
  mega_file_link: string;
  unique_file_code: string;
  linked_folder_code: string;
  created_at: string;
  updated_at: string;
};
