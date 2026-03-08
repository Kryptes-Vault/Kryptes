/**
 * Server-only: upload bytes to Google Drive (user-scoped folder) and persist metadata in Supabase.
 * Uses the service role so inserts are trusted after you verify `userId` (session/JWT).
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, plus Google Drive vars (see googleDriveStorage.ts).
 */
import { randomBytes } from "node:crypto";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { uploadToDriveVault } from "./googleDriveStorage";

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function randomSegment(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  }
  return out;
}

/** e.g. F-8X9P2M4K — matches DB check `^F-[A-Z0-9]{6,14}$` */
export function generateUniqueFolderCode(): string {
  return `F-${randomSegment(8)}`;
}

type FileKindPrefix = "IMG" | "DOC" | "FILE";

function inferFileKindPrefix(fileName: string): FileKindPrefix {
  const ext = path.extname(fileName).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".svg", ".heic"].includes(ext)) return "IMG";
  if ([".pdf", ".doc", ".docx", ".txt", ".md", ".rtf"].includes(ext)) return "DOC";
  return "FILE";
}

/** e.g. IMG-3B9V1Z7Q — matches DB check `^(IMG|DOC|FILE)-[A-Z0-9]{6,14}$` */
export function generateUniqueFileCode(fileName: string): string {
  const prefix = inferFileKindPrefix(fileName);
  return `${prefix}-${randomSegment(8)}`;
}

function getServiceSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.trim() || !key?.trim()) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for vault uploads.");
  }
  return createClient(url.trim(), key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type UploadAndLinkResult = {
  id: string;
  uniqueFileCode: string;
  megaFileLink: string;
};

function driveViewerUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

/**
 * Streams `fileBuffer` to Google Drive with an opaque filename derived from `unique_file_code`,
 * then inserts a row into `vault_files` linked to `targetFolderCode` (column `mega_file_link` stores a Drive viewer URL).
 *
 * Security: call only after authenticating the user and confirming `userId` matches that session.
 */
export async function uploadAndLinkFile(
  userId: string,
  fileBuffer: Buffer,
  fileName: string,
  targetFolderCode: string
): Promise<UploadAndLinkResult> {
  if (!userId?.trim()) throw new Error("userId is required.");
  if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) throw new Error("fileBuffer must be a non-empty Buffer.");
  if (!fileName?.trim()) throw new Error("fileName is required.");
  if (!targetFolderCode?.trim()) throw new Error("targetFolderCode is required.");

  const supabase = getServiceSupabase();

  const { data: folder, error: folderError } = await supabase
    .from("vault_folders")
    .select("unique_folder_code, user_id")
    .eq("unique_folder_code", targetFolderCode.trim())
    .eq("user_id", userId.trim())
    .maybeSingle();

  if (folderError) throw folderError;
  if (!folder) throw new Error("Folder not found or does not belong to this user.");

  const ext = path.extname(fileName);
  const maxAttempts = 8;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const uniqueFileCode = generateUniqueFileCode(fileName);
    const megaStorageName = `${uniqueFileCode}${ext}`;

    const driveFileId = await uploadToDriveVault(userId.trim(), fileBuffer, megaStorageName);
    const megaFileLink = driveViewerUrl(driveFileId);

    const { data: inserted, error: insertError } = await supabase
      .from("vault_files")
      .insert({
        user_id: userId.trim(),
        file_name: path.basename(fileName),
        mega_file_link: megaFileLink,
        unique_file_code: uniqueFileCode,
        linked_folder_code: targetFolderCode.trim(),
      })
      .select("id")
      .single();

    if (!insertError && inserted?.id) {
      return {
        id: inserted.id as string,
        uniqueFileCode,
        megaFileLink,
      };
    }

    lastError = insertError;

    const code = (insertError as { code?: string })?.code;
    if (code === "23505") {
      // unique_file_code collision — retry with a new code; orphan blob may remain on Drive (garbage-collect separately if needed)
      continue;
    }

    throw insertError ?? new Error("Insert failed.");
  }

  throw lastError instanceof Error ? lastError : new Error("Could not allocate a unique file code.");
}
