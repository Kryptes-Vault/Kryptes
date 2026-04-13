/**
 * Google Drive storage for pre-encrypted vault blobs.
 * Files are uploaded as opaque binary (`application/octet-stream`); Drive cannot preview content meaningfully.
 *
 * Prerequisites:
 * - Share `GDRIVE_MASTER_FOLDER_ID` with the service account email (Editor or Content manager).
 * - Credentials: set `GDRIVE_CLIENT_EMAIL` + `GDRIVE_PRIVATE_KEY`, or point to `kryptes-storage-bot.json`
 *   via `GDRIVE_CREDENTIALS_PATH` / auto-discovery (repo root or `backend/` parent).
 *
 * Storage / quota: uploads into a personal “My Drive” folder often fail with “Service Accounts do not have
 * storage quota”. Use a **Shared drive** (Team Drive) folder and add the service account as a member, or use
 * a Google Workspace setup where the folder lives in storage the API can write to.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { PassThrough, Readable } from "node:stream";
import { google } from "googleapis";
import type { JWT } from "google-auth-library";
import type { drive_v3 } from "googleapis";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

/** Parsed from `googleapis` / Gaxios failures so API routes can return useful JSON (not generic 500). */
export type DriveApiErrorDetails = {
  message: string;
  httpStatus?: number;
  /** True when Drive rejects the write for quota / SA storage rules. */
  isQuotaOrSaStorage: boolean;
};

/**
 * Extract user-facing text and flags from a Drive client error (Gaxios wraps API JSON).
 */
export function getDriveApiErrorDetails(err: unknown): DriveApiErrorDetails {
  const g = err as {
    response?: { status?: number; data?: { error?: { message?: string; code?: number; errors?: Array<{ message?: string; reason?: string }> } } };
    message?: string;
  };
  const api = g.response?.data?.error;
  const nested = api?.errors?.map((e) => e.message).filter(Boolean).join("; ");
  const apiMsg = (typeof api?.message === "string" && api.message) || nested || "";
  const fallback = err instanceof Error ? err.message : String(err);
  const message = (apiMsg || fallback || "Google Drive request failed.").trim();
  const status = g.response?.status;
  const blob = `${message} ${fallback}`.toLowerCase();
  const isQuotaOrSaStorage =
    /storage\s*quota|does\s*not\s*have\s*storage|storagequotaexceeded|service\s*accounts?\s*do\s*not\s*have/i.test(blob);
  return { message, httpStatus: status, isQuotaOrSaStorage };
}
/** Folder MIME type in Drive */
const FOLDER_MIME = "application/vnd.google-apps.folder";
/** Opaque binary — avoids Drive “preview” semantics for ciphertext */
const BLOB_MIME = "application/octet-stream";

export type ServiceAccountCredentials = {
  clientEmail: string;
  privateKey: string;
};

let jwtSingleton: JWT | null = null;
let driveSingleton: drive_v3.Drive | null = null;

function normalizePrivateKey(key: string): string {
  return key.replace(/\\n/g, "\n").trim();
}

/**
 * Escape a string for use inside Drive API `q` single-quoted literals.
 * @see https://developers.google.com/drive/api/guides/search-files
 */
function escapeDriveQueryLiteral(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function readJsonCredentials(filePath: string): ServiceAccountCredentials {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw) as {
    client_email?: string;
    private_key?: string;
  };
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error(`Invalid service account JSON at ${filePath}: missing client_email or private_key.`);
  }
  return {
    clientEmail: parsed.client_email,
    privateKey: normalizePrivateKey(parsed.private_key),
  };
}

const CREDENTIALS_FILENAME = "kryptes-storage-bot.json";

/** Walk up from `startDir` (max `maxDepth`) looking for `filename`. */
function findFileUpwards(startDir: string, filename: string, maxDepth = 8): string | null {
  let dir = startDir;
  for (let i = 0; i < maxDepth; i++) {
    const candidate = path.join(dir, filename);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/**
 * Resolve path to `kryptes-storage-bot.json` (or any SA JSON) when env vars are not set.
 */
function resolveCredentialsPath(): string | null {
  if (process.env.GDRIVE_CREDENTIALS_PATH) {
    return path.resolve(process.env.GDRIVE_CREDENTIALS_PATH);
  }
  const candidates = [
    path.join(process.cwd(), CREDENTIALS_FILENAME),
    path.join(process.cwd(), "..", CREDENTIALS_FILENAME),
    findFileUpwards(__dirname, CREDENTIALS_FILENAME),
    findFileUpwards(process.cwd(), CREDENTIALS_FILENAME),
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Load credentials from `GDRIVE_CLIENT_EMAIL` + `GDRIVE_PRIVATE_KEY`, or from JSON
 * (`GDRIVE_CREDENTIALS_PATH` or discovered `kryptes-storage-bot.json`).
 */
export function loadServiceAccountCredentials(): ServiceAccountCredentials {
  const envEmail = process.env.GDRIVE_CLIENT_EMAIL?.trim();
  const envKey = process.env.GDRIVE_PRIVATE_KEY;
  if (envEmail && envKey) {
    return { clientEmail: envEmail, privateKey: normalizePrivateKey(envKey) };
  }

  const jsonPath = resolveCredentialsPath();
  if (!jsonPath) {
    throw new Error(
      "Google Drive credentials missing: set GDRIVE_CLIENT_EMAIL and GDRIVE_PRIVATE_KEY, or place kryptes-storage-bot.json " +
        "in the project root / backend parent, or set GDRIVE_CREDENTIALS_PATH."
    );
  }
  return readJsonCredentials(jsonPath);
}

/**
 * Drive v3 expects a bare file/folder id. Users often paste a full browser URL instead.
 */
export function parseDriveFolderId(raw: string): string {
  const t = raw.trim();
  if (!t) return t;

  // 1. Handle folders/FOLDER_ID style URLs
  const fromFolders = t.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (fromFolders?.[1]) return fromFolders[1];

  // 2. Handle ?id=FOLDER_ID style URLs
  const fromIdParam = t.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (fromIdParam?.[1]) return fromIdParam[1];

  // 3. Handle bare ID (only if it matches the expected pattern and is not a full URL)
  if (/^[a-zA-Z0-9_-]+$/.test(t) && t.length >= 10 && !t.includes("://")) return t;

  // 4. Fallback: if it looks like a URL but we failed to parse a specific ID part, 
  // try to extract the last path segment that looks like an ID
  if (t.includes("://")) {
    const parts = t.split("?")[0].split("/");
    const last = parts[parts.length - 1];
    if (last && /^[a-zA-Z0-9_-]+$/.test(last) && last.length >= 10) return last;
  }

  throw new Error(
    "GDRIVE_MASTER_FOLDER_ID must be a valid Google Drive folder ID or URL. " +
    "Check your .env and ensure it's not a root Move/Team drive link without a folder segment."
  );
}

function getMasterFolderId(): string {
  const raw = process.env.GDRIVE_MASTER_FOLDER_ID?.trim();
  if (!raw) {
    throw new Error("GDRIVE_MASTER_FOLDER_ID is not set.");
  }
  return parseDriveFolderId(raw);
}

function getJwtClient(): JWT {
  if (jwtSingleton) return jwtSingleton;

  const { clientEmail, privateKey } = loadServiceAccountCredentials();

  jwtSingleton = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [DRIVE_SCOPE],
  });

  return jwtSingleton;
}

/** Same JWT used by `getDriveClient()` — pass to `verifyDriveConnection`. */
export function getDriveAuthClient(): JWT {
  return getJwtClient();
}

/** True when env or discovered JSON provides service-account credentials. */
export function isGoogleDriveConfigured(): boolean {
  if (process.env.GDRIVE_CLIENT_EMAIL?.trim() && process.env.GDRIVE_PRIVATE_KEY) return true;
  if (process.env.GDRIVE_CREDENTIALS_PATH?.trim()) return true;
  return resolveCredentialsPath() !== null;
}

/** Credentials + master folder — required for document vault list/upload. */
export function isDriveDocumentVaultConfigured(): boolean {
  return isGoogleDriveConfigured() && Boolean(process.env.GDRIVE_MASTER_FOLDER_ID?.trim());
}

/**
 * Verifies JWT auth and a lightweight Drive API round-trip at startup.
 * On failure, logs the critical error and exits the process unless `GDRIVE_STARTUP_FAIL_FAST=false`.
 */
export async function verifyDriveConnection(driveClient: drive_v3.Drive, authClient: JWT): Promise<void> {
  try {
    await authClient.authorize();
    await driveClient.about.get({ fields: "user" });
    console.log("[Storage] ✅ Google Drive API: Connected and Authorized!");
  } catch (error) {
    console.error("[Storage] ❌ CRITICAL: Failed to connect to Google Drive API.", error);
    if (process.env.GDRIVE_STARTUP_FAIL_FAST !== "false") {
      process.exit(1);
    }
  }
}

/**
 * Verifies that the bot has explicit access and permissions for the Master Folder.
 * Attempts to fetch metadata with minimal fields; exits on 404/403.
 */
export async function verifyDrivePermissions(driveClient: drive_v3.Drive, masterFolderId: string): Promise<void> {
  try {
    await driveClient.files.get({
      fileId: masterFolderId,
      fields: "id, capabilities",
      supportsAllDrives: true,
    });
    console.log("✅ Google Drive Storage: Bot Authenticated and Master Folder Linked!");
  } catch (err: any) {
    const status = err.response?.status;
    if (status === 404 || status === 403) {
      console.error(
        "❌ CRITICAL: The bot cannot see the Master Folder. Ensure you shared the folder with the new Service Account email as an Editor.",
      );
      process.exit(1);
    }
    throw err;
  }
}
/** Lazily constructs `google.drive({ version: 'v3', auth })` with service-account JWT. */
export function getDriveClient(): drive_v3.Drive {
  if (driveSingleton) return driveSingleton;

  const auth = getJwtClient();
  driveSingleton = google.drive({ version: "v3", auth });
  return driveSingleton;
}

/**
 * Returns the Drive folder ID for `userId` under the master app folder, creating it if needed.
 */
export async function getOrCreateUserFolder(userId: string): Promise<string> {
  if (!userId.trim()) {
    throw new Error("userId is required.");
  }

  const drive = getDriveClient();
  const masterId = getMasterFolderId();
  const safe = escapeDriveQueryLiteral(userId);

  try {
    const listRes = await drive.files.list({
      q: `'${masterId}' in parents and name = '${safe}' and mimeType = '${FOLDER_MIME}' and trashed = false`,
      fields: "files(id, name)",
      pageSize: 5,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const existing = listRes.data.files?.[0]?.id;
    if (existing) return existing;

    const createRes = await drive.files.create({
      requestBody: {
        name: userId,
        mimeType: FOLDER_MIME,
        parents: [masterId],
      },
      fields: "id",
      supportsAllDrives: true,
    });

    const id = createRes.data.id;
    if (!id) {
      throw new Error("Drive did not return a folder id after create.");
    }
    return id;
  } catch (err: any) {
    const status = err.response?.status;
    if (status === 404) {
      throw new Error(`Master folder (${masterId}) was not found. Please verify GDRIVE_MASTER_FOLDER_ID.`);
    }
    if (status === 403) {
      throw new Error(`Permission denied for master folder (${masterId}). Ensure the service account email is an Editor.`);
    }
    throw err;
  }
}

/**
 * Buffer → Drive upload body. `Readable.from` is preferred on Node 16+; `PassThrough` is an equivalent fallback.
 */
function bufferToUploadBody(buf: Buffer): Readable {
  if (typeof Readable.from === "function") {
    return Readable.from(buf);
  }
  const pt = new PassThrough();
  pt.end(buf);
  return pt;
}

/**
 * Uploads an encrypted blob to the user’s isolated folder. Returns the Drive `file.id` for DB storage.
 */
/** List opaque blobs in a user folder (by filename prefix, e.g. `kryptesdocs`). */
export async function listUserFolderBinaryFiles(
  userId: string,
  namePrefix: string
): Promise<Array<{ id: string; name: string; size: number; modifiedTime?: string | null }>> {
  const drive = getDriveClient();
  const parentId = await getOrCreateUserFolder(userId);
  const res = await drive.files.list({
    q: `'${parentId}' in parents and trashed = false and mimeType = '${BLOB_MIME}'`,
    fields: "files(id, name, size, modifiedTime)",
    pageSize: 200,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  const files = res.data.files ?? [];
  return files
    .filter((f): f is { id: string; name: string; size?: string | null; modifiedTime?: string | null } =>
      Boolean(f.id && typeof f.name === "string" && f.name.startsWith(namePrefix))
    )
    .map((f) => ({
      id: f.id,
      name: f.name,
      size: Number(f.size ?? 0),
      modifiedTime: f.modifiedTime,
    }));
}

export async function getDriveFileMetadata(fileId: string): Promise<{ name?: string | null; size?: string | null }> {
  const drive = getDriveClient();
  const res = await drive.files.get({
    fileId,
    fields: "name,size",
    supportsAllDrives: true,
  });
  return { name: res.data.name, size: res.data.size };
}

/** Download file bytes (service account must have access). */
export async function downloadDriveFileBuffer(fileId: string): Promise<Buffer> {
  const drive = getDriveClient();
  const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" });
  return Buffer.from(res.data as ArrayBuffer);
}

export async function deleteDriveFile(fileId: string): Promise<void> {
  const drive = getDriveClient();
  await drive.files.delete({ fileId, supportsAllDrives: true });
}

export async function uploadToDriveVault(
  userId: string,
  fileBuffer: Buffer,
  uniqueFileCode: string
): Promise<string> {
  if (!uniqueFileCode.trim()) {
    throw new Error("uniqueFileCode is required.");
  }

  const drive = getDriveClient();
  const parentId = await getOrCreateUserFolder(userId);
  const body = bufferToUploadBody(fileBuffer);

  try {
    const created = await drive.files.create({
      requestBody: {
        name: uniqueFileCode,
        parents: [parentId],
        mimeType: BLOB_MIME,
      },
      media: {
        mimeType: BLOB_MIME,
        body,
      },
      fields: "id",
      supportsAllDrives: true,
    });

    const fileId = created.data.id;
    if (!fileId) {
      throw new Error("Drive did not return a file id after upload.");
    }
    return fileId;
  } catch (err: any) {
    const status = err.response?.status;
    if (status === 507 || status === 403) {
      console.error("❌ Google Drive Error: Storage Full or Missing Permissions for the Master Folder.");
    }
    throw err;
  }
}

/** Hint for clients when `isQuotaOrSaStorage` is true. */
export const DRIVE_QUOTA_HINT =
  "Google blocked this upload: service accounts have no personal Drive quota. Put GDRIVE_MASTER_FOLDER_ID inside a Shared drive (Team Drive) and add your service account as Content manager (or Manager), then try again.";
/** Clears cached clients (e.g. after credential rotation in long-running tests). */
export function resetDriveClientCache(): void {
  jwtSingleton = null;
  driveSingleton = null;
}
