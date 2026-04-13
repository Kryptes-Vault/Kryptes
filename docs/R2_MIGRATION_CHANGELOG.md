# Cloudflare R2 Migration Changelog

## Summary

Migrated the Kryptes Vault encrypted document storage from **Google Drive Service Accounts** to **Cloudflare R2** (S3-compatible object storage). This change eliminates the storage quota limitations of Google Drive service accounts and introduces a true pre-signed URL architecture where encrypted file bytes never transit through the Express backend.

---

## Architectural Changes

### Before: Google Drive Service Account

```
Browser ──[multipart upload]──> Express ──[googleapis]──> Google Drive
Browser <──[proxy download]──── Express <──[googleapis]──── Google Drive
```

- **Problem 1:** Google Drive service accounts have zero personal storage quota. Files uploaded to "My Drive" folders fail with HTTP 507. Shared Drives require a paid Google Workspace subscription.
- **Problem 2:** All file bytes flowed through Express memory (`multer` buffer → `uploadToDriveVault`), creating back-pressure and OOM risk for large files.
- **Problem 3:** Download also proxied through Express (`downloadDriveFileBuffer`), doubling bandwidth.

### After: Cloudflare R2 with Pre-Signed URLs

```
Browser ──[PUT presigned URL]──> Cloudflare R2    (direct, Express not involved)
Browser <──[GET presigned URL]── Cloudflare R2    (direct, Express not involved)
Browser ──[POST /commit]──────> Express ──> Supabase   (metadata only)
```

- **R2** provides 10 GB free storage, no egress fees, and S3-compatible API.
- **Pre-signed URLs** expire in 300 seconds. Express only mints the URL — it never touches the file bytes.
- **Express memory usage** for document operations is near-zero.

---

## Zero-Knowledge Encryption Lifecycle

The encryption key **never** leaves the browser. The backend is architecturally incapable of decrypting vault files.

### Upload Flow

1. User selects a file in the DocumentLocker component.
2. `validateFileType()` rejects anything outside `[image/png, image/jpeg, image/webp, application/pdf]`.
3. `encryptFile(file, base64Key)` reads the `File` into an `ArrayBuffer`, generates a random 12-byte IV, encrypts with AES-256-GCM via `crypto.subtle.encrypt`, and prepends the IV to produce a single `Blob`.
4. Frontend requests `GET /api/vault/documents/upload-url?userId=...` — backend returns a pre-signed `PUT` URL and a UUID `objectKey`.
5. Frontend `PUT`s the encrypted blob **directly to R2** using the pre-signed URL. Express never receives the bytes.
6. Frontend calls `POST /api/vault/documents/commit` with `{ objectKey, fileName, folder, fileType, originalSize, userId }` — backend persists a row in `vault_items` with `item_type: "zk_document"` and `encryption_version: "zk_aes256_gcm_v1"`.

### Download / Preview Flow

1. Frontend requests `GET /api/vault/documents/download-url/:objectKey` — backend returns a pre-signed `GET` URL.
2. Frontend fetches the encrypted blob **directly from R2**.
3. `decryptFile(encryptedBlob, base64Key, mimeType)` extracts the 12-byte IV, decrypts the rest with AES-256-GCM, and returns a `blob:` URL for rendering in `<img>` or `<iframe>`.

### Wire Format

```
[ 12-byte IV | AES-GCM ciphertext (includes 16-byte authentication tag) ]
```

---

## Synchronous Deletion Logic

When a user deletes a document from the vault:

1. Frontend calls `DELETE /api/vault/documents/:objectKey?userId=...`.
2. Backend executes `DeleteObjectCommand` against R2 to permanently remove the encrypted blob.
3. Backend deletes the matching `vault_items` row from Supabase (matched by `user_id` + `metadata->objectKey`).
4. Both operations happen in a single HTTP request. If R2 deletion fails (e.g., object already gone), the Supabase row is still cleaned up.

---

## Client-Side File Conversion

Since the backend never sees plaintext, all format conversion happens in the browser using `src/lib/crypto/fileExporter.ts`:

| Conversion | Method |
|------------|--------|
| Image → Image (PNG/JPEG/WebP) | Off-screen HTML5 `<canvas>` with `canvas.toBlob()` |
| Image → PDF | `jsPDF` — image drawn onto a single PDF page sized to the image dimensions |

The "Export As..." modal in the preview dialog uses these client-side converters. No file bytes ever reach the server during conversion.

---

## New Dependencies

### Backend (`backend/package.json`)

| Package | Purpose |
|---------|---------|
| `@aws-sdk/client-s3` | S3-compatible client for R2 (PutObject, GetObject, DeleteObject, HeadBucket) |
| `@aws-sdk/s3-request-presigner` | Generates time-limited pre-signed URLs |

### Frontend (`package.json`)

| Package | Purpose |
|---------|---------|
| `jspdf` | Client-side PDF generation for image-to-PDF export |

---

## Environment Variables

Added to `backend/.env`:

```env
R2_ENDPOINT_URL=https://<CLOUDFLARE_ACCOUNT_ID>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<your_access_key>
R2_SECRET_ACCESS_KEY=<your_secret_key>
R2_BUCKET_NAME=kryptes-vault
```

The Google Drive variables (`GDRIVE_*`) are retained but `GDRIVE_STARTUP_VERIFY` and `GDRIVE_STARTUP_FAIL_FAST` are set to `false`. The legacy `/api/documents` inline routes in `server.ts` have been removed.

---

## Files Changed

| File | Change |
|------|--------|
| `backend/services/r2Storage.ts` | **New** — S3Client wrapper for R2 |
| `backend/routes/documents.ts` | **Rewritten** — pre-signed URL routes replacing Google Drive proxy |
| `backend/server.ts` | Startup verification replaced (Drive → R2); legacy inline document routes removed |
| `backend/.env` | R2 credentials added |
| `src/lib/crypto/fileCrypto.ts` | Added `validateFileType()` for MIME whitelist enforcement |
| `src/lib/crypto/fileExporter.ts` | **New** — client-side canvas/jsPDF conversion |
| `src/components/kryptex/DocumentLocker.tsx` | Upload, download, preview, delete rewired to R2 pre-signed URLs; client-side conversion integrated |
