/**
 * Google Drive storage for pre-encrypted vault blobs.
 * Files are uploaded as opaque binary (`application/octet-stream`); Drive cannot preview content meaningfully.
 *
 * Prerequisites:
 * - Share `GDRIVE_MASTER_FOLDER_ID` with the service account email (Editor or Content manager).
 * - Credentials: set `GDRIVE_CLIENT_EMAIL` + `GDRIVE_PRIVATE_KEY`, or point to `kryptes-storage-bot.json`
 *   via `GDRIVE_CREDENTIALS_PATH` / auto-discovery (repo root or `backend/` parent).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { PassThrough, Readable } from "node:stream";
import { google } from "googleapis";
import type { JWT } from "google-auth-library";
import type { drive_v3 } from "googleapis";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

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

function getMasterFolderId(): string {
  const id = process.env.GDRIVE_MASTER_FOLDER_ID?.trim();
  if (!id) {
    throw new Error("GDRIVE_MASTER_FOLDER_ID is not set.");
  }
  return id;
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
}

/** Clears cached clients (e.g. after credential rotation in long-running tests). */
export function resetDriveClientCache(): void {
  jwtSingleton = null;
  driveSingleton = null;
}
