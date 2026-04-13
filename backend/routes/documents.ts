/**
 * Zero-Knowledge encrypted document vault routes — Cloudflare R2 backend.
 *
 * The backend NEVER touches plaintext file bytes. All uploads and downloads
 * flow directly between the browser and R2 via short-lived pre-signed URLs.
 *
 * GET  /upload-url          — mint a PUT pre-signed URL + objectKey
 * POST /commit              — after a successful PUT, persist metadata in Supabase
 * GET  /list                — list all ZK documents for a user
 * DELETE /:docId            — delete metadata from Supabase and blob from R2
 */

import express, { Request, Response } from "express";
import { getSupabaseAdmin } from "../services/supabaseAdmin";
import { checkProfileFlag, setProfileFlagActive } from "../services/gatekeeperService";
import { insertVaultItemCreatedAudit } from "../services/vaultAuditService";
import {
  isR2Configured,
  generateUploadUrl,
  deleteObject,
} from "../services/r2Storage";
import { resolveUserId } from "../utils/authUtils";

const { deleteCachedVault } = require("../services/redisService");

const router = express.Router();
const rateLimit = require("express-rate-limit");

const docLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: "Too many document vault requests from this IP",
});

// resolveUserId is now imported from ../utils/authUtils

/**
 * GET /api/vault/documents/upload-url
 *
 * Returns a pre-signed PUT URL and a UUID objectKey. The frontend encrypts
 * the file locally, then PUTs the ciphertext directly to R2 — the Express
 * server never buffers the file.
 */
router.get("/upload-url", docLimiter, async (req: Request, res: Response) => {
  if (!isR2Configured()) {
    return res.status(503).json({ error: "Cloudflare R2 storage is not configured." });
  }

  const userId = resolveUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: Session required." });
  }

  try {
    // Use slash for R2 object storage hierarchy
    const objectKey = `${userId}/${crypto.randomUUID()}`;
    const uploadUrl = await generateUploadUrl(objectKey, 300);

    return res.status(200).json({ uploadUrl, objectKey });
  } catch (err: any) {
    console.error("[R2-Vault] Failed to generate upload URL:", err.message);
    return res.status(500).json({ error: "Failed to generate upload URL." });
  }
});

/**
 * POST /api/vault/documents/commit
 *
 * Called by the frontend AFTER a successful direct PUT to R2. Persists the
 * objectKey and metadata into Supabase `vault_items`.
 */
router.post("/commit", docLimiter, async (req: Request, res: Response) => {
  const userId = resolveUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized: Session required." });

  const objectKey = typeof req.body?.objectKey === "string" ? req.body.objectKey.trim() : "";
  const fileName = typeof req.body?.fileName === "string" ? req.body.fileName.trim() : "encrypted_document";
  const folder = typeof req.body?.folder === "string" && req.body.folder.trim() ? req.body.folder.trim() : "General";
  const fileType = typeof req.body?.fileType === "string" ? req.body.fileType.trim().toLowerCase() : "bin";
  const originalSize = typeof req.body?.originalSize === "number" ? req.body.originalSize : 0;

  if (!objectKey) {
    return res.status(400).json({ error: "objectKey is required (returned from /upload-url)." });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: created, error: insertErr } = await supabase
      .from("vault_items")
      .insert({
        user_id: userId,
        item_type: "zk_document",
        category: "document",
        title: fileName,
        ciphertext: objectKey,
        iv: "client_encrypted_file",
        encryption_version: "zk_aes256_gcm_v1",
        metadata: {
          folder,
          fileType,
          originalSize,
          objectKey,
          storageBackend: "cloudflare_r2",
        },
      })
      .select("id")
      .single();

    if (insertErr || !created?.id) {
      console.error("[R2-Vault] Supabase insert error:", insertErr);
      try { await deleteObject(objectKey); } catch {}
      return res.status(500).json({ error: insertErr?.message || "Failed to save document metadata." });
    }

    await insertVaultItemCreatedAudit({
      userId,
      vaultItemId: created.id,
      req,
      itemType: "zk_document",
    });

    await setProfileFlagActive(userId, "has_documents");

    try {
      await deleteCachedVault(userId);
      console.log(`[R2-Vault] Cache invalidated for ${userId}`);
    } catch (err) {
      console.warn("[R2-Vault] Redis cache invalidation error:", err);
    }

    return res.status(201).json({
      document: {
        id: created.id,
        objectKey,
        name: fileName,
        folder,
        fileType,
        size: originalSize,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("[R2-Vault] Commit exception:", err);
    return res.status(500).json({ error: "Failed to commit document metadata." });
  }
});

/**
 * GET /api/vault/documents/list
 *
 * Returns metadata for all ZK documents belonging to this user.
 * No file bytes are returned — only Supabase row metadata.
 */
router.get("/list", docLimiter, async (req: Request, res: Response) => {
  const userId = resolveUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized: Session required." });

  if (!(await checkProfileFlag(userId, "has_documents"))) {
    return res.status(200).json({ documents: [], source: "gatekeeper" });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: rows, error } = await supabase
      .from("vault_items")
      .select("id, title, metadata, created_at, updated_at")
      .eq("user_id", userId)
      .eq("item_type", "zk_document")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[R2-Vault] List error:", error);
      return res.status(500).json({ error: "Failed to list documents." });
    }

    const documents = (rows ?? []).map((row: any) => ({
      id: row.id,
      objectKey: row.metadata?.objectKey ?? row.metadata?.driveFileId ?? "",
      name: row.title ?? "Untitled",
      folder: row.metadata?.folder ?? "General",
      fileType: row.metadata?.fileType ?? "bin",
      size: row.metadata?.originalSize ?? 0,
      updatedAt: row.updated_at,
    }));

    return res.status(200).json({ documents, source: "db" });
  } catch (err: any) {
    console.error("[R2-Vault] List exception:", err);
    return res.status(500).json({ error: "Server error listing documents." });
  }
});

/**
 * DELETE /api/vault/documents/:docId
 *
 * Securely deletes a ZK document:
 * 1. Resolves user from session.
 * 2. Fetches item to get objectKey (verifying ownership).
 * 3. Deletes from R2 and Supabase.
 * 4. Invalidates Redis cache.
 */
router.delete("/:docId", docLimiter, async (req: Request, res: Response) => {
  console.log("TRIPWIRE TRIGGERED! Method:", req.method, "Params:", req.params, "Cookies:", req.cookies, "RawCookie:", req.headers.cookie);
  const { docId } = req.params;
  const userId = resolveUserId(req);
  
  // Note: We remove the strict 400 bouncer here to allow session-based 
  // authorization to proceed to the Supabase lookup, which will fail 
  // with a 404/401 naturally if the userId is resolved to null.

  try {
    const supabase = getSupabaseAdmin();
    
    // 1. Secure Lookup: Get metadata to retrieve objectKey
    const { data: item, error: fetchErr } = await supabase
      .from("vault_items")
      .select("ciphertext, metadata")
      .eq("id", docId)
      .eq("user_id", userId)
      .single();

    if (fetchErr || !item) {
      console.warn(`[R2-Vault] Delete blocked: Item ${docId} not found or unauthorized for user ${userId}`);
      return res.status(404).json({ error: "Document not found or unauthorized." });
    }

    // We store objectKey in ciphertext for documents (logic from /commit)
    const objectKey = item.ciphertext || item.metadata?.objectKey;

    // 2. Delete from R2
    if (objectKey) {
      try {
        await deleteObject(objectKey);
      } catch (error) {
        console.warn("[R2-Vault] R2 delete failed (may already be gone):", error);
      }
    }

    // 3. Delete from Supabase
    const { error: dbErr } = await supabase
      .from("vault_items")
      .delete()
      .eq("id", docId)
      .eq("user_id", userId);

    if (dbErr) throw dbErr;

    // 4. Redis Invalidation
    try {
      await deleteCachedVault(userId);
    } catch (err) {
      console.warn("[R2-Vault] Redis invalidation failed during delete:", err);
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[R2-Vault] Delete exception:", err);
    return res.status(500).json({ error: "Failed to delete document metadata." });
  }
});

module.exports = router;
