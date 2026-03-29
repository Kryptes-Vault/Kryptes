const dotenv = require("dotenv") as any;
dotenv.config();

const express = require("express") as any;
const session = require("express-session") as any;
const { RedisStore } = require("connect-redis") as any;
const Redis = require("ioredis") as any;
const cors = require("cors") as any;
const multer = require("multer") as any;
const sharp = require("sharp") as any;
const { PDFDocument } = require("pdf-lib") as any;

const vaultRoutes = require("./routes/vault");
const webhookRoutes = require("./routes/webhooks");
const authRoutes = require("./routes/auth");
const { handleSendEmailHook } = require("./routes/authEmailHook");
const { corsOptions, getSessionCookieOptions } = require("./config/auth");

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

type SupportedImageFormat = "png" | "jpeg" | "webp";
type SupportedSourceFormat = SupportedImageFormat | "pdf";
type SupportedTargetFormat = SupportedImageFormat | "pdf";

type ConvertRequestBody = {
  sourceFormat?: string;
  targetFormat?: string;
};

type SessionUser = Record<string, unknown>;

type KryptexRequest = {
  session?: any;
  user?: SessionUser;
  file?: { buffer: Buffer };
  body: ConvertRequestBody;
  get(name: string): string | undefined;
  ip: string;
};

type ConvertResult = {
  buffer: Buffer;
  contentType: string;
  fileName: string;
};

type DocumentRecord = {
  id: string;
  storedName: string;
  name: string;
  folder: string;
  size: number;
  updatedAt: string;
  type: "pdf" | "png" | "jpeg" | "webp" | "docx";
  previewUrl: string;
};

const IMAGE_FORMATS = new Set<SupportedImageFormat>(["png", "jpeg", "webp"]);
const DOCUMENT_PREFIX = "kryptesdocs";
const SAFE_DOC_EXTENSIONS = new Set(["pdf", "png", "jpg", "jpeg", "webp", "docx"]);

let redisClient: any;
let redisStore: any;

try {
  if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times: number) => (times > 5 ? null : Math.min(times * 100, 3000)),
    });

    redisStore = new RedisStore({ client: redisClient, disableTouch: true });
  }
} catch {
  redisClient = undefined;
  redisStore = undefined;
}

function normalizeFormat(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return normalized === "jpg" ? "jpeg" : normalized;
}

function isSourceFormat(value: string | null): value is SupportedSourceFormat {
  return value === "pdf" || value === "png" || value === "jpeg" || value === "webp";
}

function isTargetFormat(value: string | null): value is SupportedTargetFormat {
  return value === "pdf" || value === "png" || value === "jpeg" || value === "webp";
}

function contentTypeFor(format: SupportedTargetFormat): string {
  switch (format) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
  }
}

function extensionFor(format: SupportedTargetFormat): string {
  return format === "jpeg" ? "jpg" : format;
}

function scrubBuffer(buffer: Buffer | null | undefined) {
  if (buffer) buffer.fill(0);
}

function normalizeDocExtension(name: string): "pdf" | "png" | "jpeg" | "webp" | "docx" | null {
  const raw = name.split(".").pop()?.toLowerCase();
  if (!raw) return null;
  const normalized = raw === "jpg" ? "jpeg" : raw;
  if (SAFE_DOC_EXTENSIONS.has(normalized)) return normalized as "pdf" | "png" | "jpeg" | "webp" | "docx";
  return null;
}

function toStoredName(folder: string, originalName: string) {
  return `${DOCUMENT_PREFIX}__${encodeURIComponent(folder)}__${Date.now()}__${encodeURIComponent(originalName)}`;
}

function parseStoredName(storedName: string) {
  const parts = storedName.split("__");
  if (parts.length < 4 || parts[0] !== DOCUMENT_PREFIX) return null;
  const folder = decodeURIComponent(parts[1]);
  const ts = Number.parseInt(parts[2], 10);
  const name = decodeURIComponent(parts.slice(3).join("__"));
  if (!folder || !name || Number.isNaN(ts)) return null;
  return { folder, name, ts };
}

function documentsVaultUserId(): string {
  return (process.env.GDRIVE_DOCUMENTS_USER_ID || "kryptes-documents").trim();
}

function documentPreviewUrl(req: { get: (name: string) => string | undefined; protocol?: string }, fileId: string, docType: string): string {
  const host = req.get("x-forwarded-host") || req.get("host") || `127.0.0.1:${process.env.PORT || "4000"}`;
  const rawProto = req.get("x-forwarded-proto") || req.protocol || "http";
  const proto = rawProto.includes(",") ? rawProto.split(",")[0]!.trim() : rawProto.trim();
  return `${proto}://${host}/api/documents/download?id=${encodeURIComponent(fileId)}&targetFormat=${encodeURIComponent(docType)}`;
}

<<<<<<< HEAD
type GDriveModule = typeof import("./services/googleDriveStorage");

function sendDriveJsonError(res: any, gdrive: GDriveModule, error: unknown, fallback: string) {
  const d = gdrive.getDriveApiErrorDetails(error);
  const status = d.isQuotaOrSaStorage
    ? 507
    : d.httpStatus && d.httpStatus >= 400 && d.httpStatus <= 499
      ? d.httpStatus
      : 500;
  const body: { error: string; code?: string; hint?: string } = {
    error: d.message || fallback,
  };
  if (d.isQuotaOrSaStorage) {
    body.code = "DRIVE_STORAGE_QUOTA";
    body.hint = gdrive.DRIVE_QUOTA_HINT;
  }
  return res.status(status).json(body);
}

=======
>>>>>>> e8715624721645242fe7c831993979066bea9673
async function convertImageToImage(buffer: Buffer, targetFormat: SupportedImageFormat): Promise<Buffer> {
  const pipeline = sharp(buffer, { failOn: "none" });

  switch (targetFormat) {
    case "png":
      return pipeline.png({ compressionLevel: 9 }).toBuffer();
    case "jpeg":
      return pipeline.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
    case "webp":
      return pipeline.webp({ quality: 90 }).toBuffer();
  }
}

async function convertPdfToImage(buffer: Buffer, targetFormat: SupportedImageFormat): Promise<Buffer> {
  const pipeline = sharp(buffer, { density: 200 });

  switch (targetFormat) {
    case "png":
      return pipeline.png({ compressionLevel: 9 }).toBuffer();
    case "jpeg":
      return pipeline.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
    case "webp":
      return pipeline.webp({ quality: 90 }).toBuffer();
  }
}

async function convertImageToPdf(buffer: Buffer, sourceFormat: SupportedImageFormat): Promise<Buffer> {
  const imageBuffer = sourceFormat === "webp" ? await sharp(buffer).png().toBuffer() : Buffer.from(buffer);
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width ?? 1200;
  const height = metadata.height ?? 1200;

  const pdfDoc = await PDFDocument.create();
  const image = sourceFormat === "jpeg" ? await pdfDoc.embedJpg(imageBuffer) : await pdfDoc.embedPng(imageBuffer);
  const page = pdfDoc.addPage([width, height]);

  page.drawImage(image, { x: 0, y: 0, width, height });

  return Buffer.from(await pdfDoc.save());
}

async function convertBuffer(params: {
  buffer: Buffer;
  sourceFormat: SupportedSourceFormat;
  targetFormat: SupportedTargetFormat;
}): Promise<ConvertResult> {
  const { buffer, sourceFormat, targetFormat } = params;

  if (sourceFormat === targetFormat) {
    return {
      buffer,
      contentType: contentTypeFor(targetFormat),
      fileName: `converted.${extensionFor(targetFormat)}`,
    };
  }

  if (sourceFormat === "pdf" && IMAGE_FORMATS.has(targetFormat as SupportedImageFormat)) {
    const converted = await convertPdfToImage(buffer, targetFormat as SupportedImageFormat);
    return {
      buffer: converted,
      contentType: contentTypeFor(targetFormat),
      fileName: `converted.${extensionFor(targetFormat)}`,
    };
  }

  if (IMAGE_FORMATS.has(sourceFormat as SupportedImageFormat) && targetFormat === "pdf") {
    const converted = await convertImageToPdf(buffer, sourceFormat as SupportedImageFormat);
    return {
      buffer: converted,
      contentType: contentTypeFor(targetFormat),
      fileName: "converted.pdf",
    };
  }

  if (IMAGE_FORMATS.has(sourceFormat as SupportedImageFormat) && IMAGE_FORMATS.has(targetFormat as SupportedImageFormat)) {
    const converted = await convertImageToImage(buffer, targetFormat as SupportedImageFormat);
    return {
      buffer: converted,
      contentType: contentTypeFor(targetFormat),
      fileName: `converted.${extensionFor(targetFormat)}`,
    };
  }

  throw new Error(`Unsupported conversion: ${sourceFormat} -> ${targetFormat}`);
}

app.set("trust proxy", 1);
app.use(cors(corsOptions));

app.post(
  "/api/auth/send-email-hook",
  express.raw({
    type: (req: any) => String(req.headers["content-type"] ?? "").includes("application/json"),
  }),
  handleSendEmailHook
);

app.use(express.json({ limit: "2mb" }));

const sessionConfig: any = {
  name: "kryptex.sid",
  secret: process.env.SESSION_SECRET || "kryptex_secret_82346",
  resave: false,
  saveUninitialized: false,
  cookie: getSessionCookieOptions(),
  store: redisStore || new session.MemoryStore(),
};

app.use(session(sessionConfig));

app.use((req: KryptexRequest, _res: any, next: any) => {
  if (req.session?.kryptexUser) {
    req.user = req.session.kryptexUser;
  }
  next();
});

app.get("/ping", (_req: any, res: any) => {
  res.status(200).setHeader("Cache-Control", "no-store").send("pong");
});

app.get("/health", (_req: any, res: any) => {
  res.json({
    status: "up",
    redis: redisClient && redisClient.status === "ready" ? "connected" : "fallback-memory",
  });
});

app.get("/health/deep", (req: any, res: any) => {
  res.json({
    ok: true,
    processEnvPort: process.env.PORT ?? null,
    bindHost: process.env.BIND_HOST || "0.0.0.0",
    host: req.get("host") ?? null,
    xForwardedFor: req.get("x-forwarded-for") ?? null,
    xForwardedProto: req.get("x-forwarded-proto") ?? null,
    xRenderRouting: req.get("x-render-routing") ?? null,
    expressReqIp: req.ip,
    nodeEnv: process.env.NODE_ENV ?? null,
  });
});

app.post("/api/convert", upload.single("file"), async (req: KryptexRequest, res: any) => {
  const file = req.file;
  const sourceFormat = normalizeFormat(req.body.sourceFormat);
  const targetFormat = normalizeFormat(req.body.targetFormat);

  if (!file) {
    return res.status(400).json({ error: "File is required." });
  }

  if (!isSourceFormat(sourceFormat) || !isTargetFormat(targetFormat)) {
    scrubBuffer(file.buffer);
    return res.status(400).json({
      error: "Unsupported sourceFormat or targetFormat.",
      supported: { source: ["pdf", "png", "jpeg", "webp"], target: ["pdf", "png", "jpeg", "webp"] },
    });
  }

  const sourceBuffer = Buffer.from(file.buffer);
  scrubBuffer(file.buffer);
  let outputBuffer: Buffer | null = null;

  try {
    const result = await convertBuffer({ buffer: sourceBuffer, sourceFormat, targetFormat });
    outputBuffer = result.buffer;

    res.on("finish", () => {
      scrubBuffer(sourceBuffer);
      scrubBuffer(outputBuffer);
    });

    return res
      .status(200)
      .setHeader("Content-Type", result.contentType)
      .setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`)
      .setHeader("Cache-Control", "no-store")
      .setHeader("X-Content-Type-Options", "nosniff")
      .send(outputBuffer);
  } catch (error) {
    scrubBuffer(sourceBuffer);
    scrubBuffer(outputBuffer);
    return res.status(error instanceof Error && error.message.startsWith("Unsupported conversion") ? 400 : 500).json({
      error: error instanceof Error ? error.message : "Conversion failed.",
    });
  }
});

app.get("/api/documents", async (req: any, res: any) => {
  const gdrive = require("./services/googleDriveStorage") as typeof import("./services/googleDriveStorage");
  if (!gdrive.isDriveDocumentVaultConfigured()) {
    return res.status(503).json({ error: "Document vault not configured (Google Drive: set GDRIVE_* and GDRIVE_MASTER_FOLDER_ID)." });
  }
  try {
    const rows = await gdrive.listUserFolderBinaryFiles(documentsVaultUserId(), `${DOCUMENT_PREFIX}__`);
    const docs: DocumentRecord[] = [];
    for (const row of rows) {
      const storedName = row.name;
      const parsed = parseStoredName(storedName);
      if (!parsed) continue;
      const type = normalizeDocExtension(parsed.name);
      if (!type) continue;
      docs.push({
        id: row.id,
        storedName,
        name: parsed.name,
        folder: parsed.folder,
        size: row.size,
        updatedAt: row.modifiedTime ? new Date(row.modifiedTime).toISOString() : new Date(parsed.ts).toISOString(),
        type,
        previewUrl: documentPreviewUrl(req, row.id, type),
      });
    }

    return res.status(200).json({ documents: docs.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)) });
  } catch (error) {
<<<<<<< HEAD
    return sendDriveJsonError(res, gdrive, error, "Failed to list documents.");
=======
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to list documents." });
>>>>>>> e8715624721645242fe7c831993979066bea9673
  }
});

app.post("/api/documents/upload", upload.single("file"), async (req: any, res: any) => {
  const file = req.file;
  const folder = typeof req.body?.folder === "string" && req.body.folder.trim() ? req.body.folder.trim() : "General";

  if (!file) return res.status(400).json({ error: "File is required." });
  const type = normalizeDocExtension(file.originalname);
  if (!type) return res.status(400).json({ error: "Unsupported file type." });

  const sourceBuffer = Buffer.from(file.buffer);
  scrubBuffer(file.buffer);

  const gdrive = require("./services/googleDriveStorage") as typeof import("./services/googleDriveStorage");
  if (!gdrive.isDriveDocumentVaultConfigured()) {
    scrubBuffer(sourceBuffer);
    return res.status(503).json({ error: "Document vault not configured (Google Drive: set GDRIVE_* and GDRIVE_MASTER_FOLDER_ID)." });
  }

  try {
    const storedName = toStoredName(folder, file.originalname);
    const fileId = await gdrive.uploadToDriveVault(documentsVaultUserId(), sourceBuffer, storedName);
    scrubBuffer(sourceBuffer);

    return res.status(201).json({
      document: {
        id: fileId,
        storedName,
        name: file.originalname,
        folder,
        size: Number(file.size || 0),
        updatedAt: new Date().toISOString(),
        type,
        previewUrl: documentPreviewUrl(req, fileId, type),
      },
    });
  } catch (error) {
    scrubBuffer(sourceBuffer);
<<<<<<< HEAD
    return sendDriveJsonError(res, gdrive, error, "Upload failed.");
=======
    return res.status(500).json({ error: error instanceof Error ? error.message : "Upload failed." });
>>>>>>> e8715624721645242fe7c831993979066bea9673
  }
});

app.get("/api/documents/download", async (req: any, res: any) => {
  const fileId = typeof req.query?.id === "string" ? req.query.id : "";
  const targetRaw = normalizeFormat(req.query?.targetFormat);
  if (!fileId) return res.status(400).json({ error: "Document id is required." });

  const gdrive = require("./services/googleDriveStorage") as typeof import("./services/googleDriveStorage");
  if (!gdrive.isDriveDocumentVaultConfigured()) {
    return res.status(503).json({ error: "Document vault not configured." });
  }

  try {
    const meta = await gdrive.getDriveFileMetadata(fileId);
    const fileName = meta.name || "";
    const parsed = parseStoredName(fileName);
    if (!parsed) return res.status(404).json({ error: "Document metadata not found." });
    const sourceFormat = normalizeDocExtension(parsed.name);
    if (!sourceFormat) return res.status(400).json({ error: "Unsupported source document type." });

    const sourceBuffer = await gdrive.downloadDriveFileBuffer(fileId);

    const requestedTarget = targetRaw ?? sourceFormat;
    if (!isTargetFormat(requestedTarget)) {
      scrubBuffer(sourceBuffer);
      return res.status(400).json({ error: "Unsupported target format." });
    }

    if (sourceFormat === "docx") {
      if (requestedTarget !== "pdf") {
        return res
          .status(200)
          .setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
          .setHeader("Content-Disposition", `attachment; filename="${parsed.name}"`)
          .setHeader("Cache-Control", "no-store")
          .send(sourceBuffer);
      }
      scrubBuffer(sourceBuffer);
      return res.status(400).json({ error: "DOCX conversion is limited to original download currently." });
    }

    let outputBuffer: Buffer | null = null;
    try {
      const result = await convertBuffer({
        buffer: sourceBuffer,
        sourceFormat,
        targetFormat: requestedTarget,
      });
      outputBuffer = result.buffer;
      const baseName = parsed.name.replace(/\.[^.]+$/, "");
      const fileName = `${baseName}.${extensionFor(requestedTarget)}`;
      res.on("finish", () => {
        scrubBuffer(sourceBuffer);
        scrubBuffer(outputBuffer);
      });
      return res
        .status(200)
        .setHeader("Content-Type", contentTypeFor(requestedTarget))
        .setHeader("Content-Disposition", `attachment; filename="${fileName}"`)
        .setHeader("Cache-Control", "no-store")
        .send(outputBuffer);
    } catch {
      scrubBuffer(sourceBuffer);
      scrubBuffer(outputBuffer);
      return res.status(400).json({ error: "Requested conversion is not supported for this file type." });
    }
  } catch (error) {
<<<<<<< HEAD
    return sendDriveJsonError(res, gdrive, error, "Download failed.");
=======
    return res.status(500).json({ error: error instanceof Error ? error.message : "Download failed." });
>>>>>>> e8715624721645242fe7c831993979066bea9673
  }
});

app.delete("/api/documents", async (req: any, res: any) => {
  const fileId = typeof req.query?.id === "string" ? req.query.id : "";
  if (!fileId) return res.status(400).json({ error: "Document id is required." });

  const gdrive = require("./services/googleDriveStorage") as typeof import("./services/googleDriveStorage");
  if (!gdrive.isDriveDocumentVaultConfigured()) {
    return res.status(503).json({ error: "Document vault not configured." });
  }

  try {
    await gdrive.deleteDriveFile(fileId);
    return res.status(200).json({ ok: true });
  } catch (error) {
<<<<<<< HEAD
    return sendDriveJsonError(res, gdrive, error, "Delete failed.");
=======
    return res.status(500).json({ error: error instanceof Error ? error.message : "Delete failed." });
>>>>>>> e8715624721645242fe7c831993979066bea9673
  }
});

app.use("/api/vault", vaultRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/auth", authRoutes);

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});

const PORT = Number.parseInt(process.env.PORT || "4000", 10);
const BIND_HOST = process.env.BIND_HOST || "0.0.0.0";

const server = app.listen(PORT, BIND_HOST, () => {
  console.log(`[Kryptex Backend] Listening on http://${BIND_HOST}:${PORT} (NODE_ENV=${process.env.NODE_ENV || "undefined"})`);

  void (async () => {
    const redisSvc = require("./services/redisService") as {
      whenRedisReadyOrTimeout: (ms?: number) => Promise<void>;
    };
    await redisSvc.whenRedisReadyOrTimeout(15000);

    const { logBitwardenStartupStatus } = require("./services/bitwardenService") as {
      logBitwardenStartupStatus: () => Promise<void>;
    };
    await logBitwardenStartupStatus();

    if (process.env.GDRIVE_STARTUP_VERIFY === "false") {
      console.log("[Storage] Google Drive: startup verify skipped (GDRIVE_STARTUP_VERIFY=false)");
      return;
    }

    const gdrive = require("./services/googleDriveStorage") as typeof import("./services/googleDriveStorage");
    if (!gdrive.isGoogleDriveConfigured()) {
      console.log(
        "[Storage] Google Drive: not configured — set GDRIVE_CLIENT_EMAIL + GDRIVE_PRIVATE_KEY (or GDRIVE_CREDENTIALS_PATH / JSON file).",
      );
      return;
    }
    console.log("[Storage] Google Drive: verifying service account and API reachability...");
    try {
      const drive = gdrive.getDriveClient();
      const auth = gdrive.getDriveAuthClient();
      await gdrive.verifyDriveConnection(drive, auth);
<<<<<<< HEAD
      const masterFolderIdRaw = process.env.GDRIVE_MASTER_FOLDER_ID?.trim();
      if (masterFolderIdRaw) {
        const masterId = gdrive.parseDriveFolderId(masterFolderIdRaw);
        await gdrive.verifyDrivePermissions(drive, masterId);
      } else {
=======
      if (!process.env.GDRIVE_MASTER_FOLDER_ID?.trim()) {
>>>>>>> e8715624721645242fe7c831993979066bea9673
        console.warn("[Storage] Google Drive: GDRIVE_MASTER_FOLDER_ID is empty — document vault uploads will fail until set.");
      }
    } catch (e) {
      console.error("[Storage] Google Drive: startup verify error:", e instanceof Error ? e.message : e);
      if (process.env.GDRIVE_STARTUP_FAIL_FAST !== "false") {
        process.exit(1);
      }
    }
  })();
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`[Kryptex Backend] Port ${PORT} is already in use. Stop the other process or set PORT to a free port.`);
  } else {
    console.error("[Kryptex Backend] Server error:", err.message || err);
  }
});

function gracefulShutdown(signal: string) {
  console.log(`[Kryptex] Received ${signal}. Closing HTTP server...`);
  server.close(() => {
    if (redisClient && redisClient.status !== "end") {
      redisClient.quit().finally(() => process.exit(0));
    } else {
      process.exit(0);
    }
  });

  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export { app, server };
