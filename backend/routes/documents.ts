/**
 * Zero-Knowledge encrypted document vault routes — Cloudflare R2 backend.
 *
 * The backend NEVER touches plaintext file bytes. All uploads and downloads
 * flow directly between the browser and R2 via short-lived pre-signed URLs.
 *
 * GET  /upload-url          — mint a PUT pre-signed URL + objectKey
 * POST /commit              — after a successful PUT, persist metadata in Supabase
 * (download-url is on the app directly — see server.ts)
 * GET  /list                — list all ZK documents for a user
 * DELETE /:objectKey        — delete blob from R2 + metadata from Supabase
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

const { redisClient, connectRedis } = require("../services/redisService");

const router = express.Router();
const rateLimit = require("express-rate-limit");

const docLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: "Too many document vault requests from this IP",
});

function resolveUserId(req: Request): string | null {
  const q = typeof req.query.userId === "string" ? req.query.userId.trim() : "";
  const body = typeof req.body?.userId === "string" ? req.body.userId.trim() : "";
  return (
    q ||
    body ||
    (req as any).session?.supabaseUserId ||
    ((req as any).user && (req as any).user.id) ||
    null
  );
}

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
    return res.status(400).json({ error: "userId is required." });
  }

  try {
    // Keep object keys slash-free so standard `:objectKey` params work on Express 5.
    const objectKey = `${userId}__${crypto.randomUUID()}`;
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
  if (!userId) return res.status(400).json({ error: "userId is required." });

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
      if (redisClient?.isOpen) {
        await redisClient.del(`documents:${userId}`);
      }
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

/* download-url is registered directly on the Express app in server.ts
   to bypass Express 5 sub-router prefix matching issues. */

/**
 * GET /api/vault/documents/list
 *
 * Returns metadata for all ZK documents belonging to this user.
 * No file bytes are returned — only Supabase row metadata.
 * Cached in Redis for 1 hour to reduce DB load.
 */
router.get("/list", docLimiter, async (req: Request, res: Response) => {
  const userId = resolveUserId(req);
  if (!userId) return res.status(400).json({ error: "userId is required." });

  if (!(await checkProfileFlag(userId, "has_documents"))) {
    return res.status(200).json({ documents: [], source: "gatekeeper" });
  }

  const cacheKey = `documents:${userId}`;

  try {
    await connectRedis();
    if (redisClient?.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }
    }
  } catch (err) {
    console.warn("[R2-Vault] Redis cache get error:", err);
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

    const responseData = { documents, source: "db" };

    try {
      if (redisClient?.isOpen) {
        await redisClient.set(cacheKey, JSON.stringify({ ...responseData, source: "cache" }), {
          EX: 3600,
        });
      }
    } catch (err) {
      console.warn("[R2-Vault] Redis cache set error:", err);
    }

    return res.status(200).json(responseData);
  } catch (err: any) {
    console.error("[R2-Vault] List exception:", err);
    return res.status(500).json({ error: "Server error listing documents." });
  }
});

/**
 * DELETE /api/vault/documents/:objectKey
 *
 * Synchronous deletion: removes the encrypted blob from R2 AND the
 * metadata row from Supabase in a single request.
 */
router.delete("/:objectKey", docLimiter, async (req: Request, res: Response) => {
  const objectKey = req.params.objectKey;
  if (!objectKey) return res.status(400).json({ error: "objectKey is required." });

  const userId = resolveUserId(req);
  if (!userId) return res.status(400).json({ error: "userId is required." });

  try {
    await deleteObject(objectKey);
  } catch (error) {
    console.warn("[R2-Vault] R2 delete failed (may already be gone):", error);
  }

  try {
    const supabase = getSupabaseAdmin();
    await supabase
      .from("vault_items")
      .delete()
      .eq("user_id", userId)
      .eq("item_type", "zk_document")
      .contains("metadata", { objectKey });

    try {
      if (redisClient?.isOpen) {
        await redisClient.del(`documents:${userId}`);
      }
    } catch (err) {
      console.warn("[R2-Vault] Redis cache invalidation error:", err);
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[R2-Vault] Supabase delete error:", err);
    return res.status(500).json({ error: "Failed to delete document metadata." });
  }
});

module.exports = router;
