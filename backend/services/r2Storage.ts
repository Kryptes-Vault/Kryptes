/**
 * Cloudflare R2 (S3-compatible) storage service for Zero-Knowledge encrypted vault blobs.
 *
 * All files stored in R2 are opaque ciphertext — the backend never possesses
 * the decryption key. Uploads and downloads use short-lived pre-signed URLs
 * so file bytes never transit through Express memory.
 *
 * Required env vars:
 *   R2_ENDPOINT_URL      – e.g. https://<ACCOUNT_ID>.r2.cloudflarestorage.com
 *   R2_ACCESS_KEY_ID     – R2 API token access key
 *   R2_SECRET_ACCESS_KEY – R2 API token secret key
 *   R2_BUCKET_NAME       – bucket name (default: "kryptes-vault")
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let clientSingleton: S3Client | null = null;

function getR2Client(): S3Client {
  if (clientSingleton) return clientSingleton;

  const endpoint = process.env.R2_ENDPOINT_URL?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Cloudflare R2 credentials missing: set R2_ENDPOINT_URL, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY."
    );
  }

  clientSingleton = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  return clientSingleton;
}

function getBucketName(): string {
  return (process.env.R2_BUCKET_NAME || "kryptes-vault").trim();
}

/** True when all three R2 env vars are present. */
export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ENDPOINT_URL?.trim() &&
    process.env.R2_ACCESS_KEY_ID?.trim() &&
    process.env.R2_SECRET_ACCESS_KEY?.trim()
  );
}

/**
 * Startup health check — verifies the S3 client can reach the bucket.
 * Throws on failure so the caller can decide whether to exit or warn.
 */
export async function verifyR2Connection(): Promise<void> {
  const client = getR2Client();
  const bucket = getBucketName();
  await client.send(new HeadBucketCommand({ Bucket: bucket }));
  console.log(`[Storage] ✅ Cloudflare R2: Connected to bucket "${bucket}"`);
}

/** Pre-signed PUT URL — the frontend uploads the encrypted blob directly to R2. */
export async function generateUploadUrl(
  objectKey: string,
  expiresInSeconds = 300
): Promise<string> {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: objectKey,
    ContentType: "application/octet-stream",
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/** Pre-signed GET URL — the frontend downloads the encrypted blob directly from R2. */
export async function generateDownloadUrl(
  objectKey: string,
  expiresInSeconds = 300
): Promise<string> {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: objectKey,
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/** Permanently deletes an encrypted blob from R2. */
export async function deleteObject(objectKey: string): Promise<void> {
  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: objectKey,
    })
  );
}

/** Clears cached client (for credential rotation or tests). */
export function resetR2ClientCache(): void {
  clientSingleton = null;
}
