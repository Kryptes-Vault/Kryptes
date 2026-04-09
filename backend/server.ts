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
const {
  queueMegaUpload,
  isMegaUploadBlockedError,
  getMegaStorage,
} = require("./services/megaUploadQueue") as typeof import("./services/megaUploadQueue");

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

type MegaNode = {
  name?: string;
  size?: number;
  timestamp?: number;
  directory?: boolean;
  children?: MegaNode[];
  upload?: (...args: any[]) => any;
  link?: (cb: (err: any, link?: string) => void) => void;
  delete?: (permanent: boolean, cb: (err?: any) => void) => void;
};

type MegaStorage = {
  root: MegaNode;
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

function megaErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/EBLOCKED|User blocked/i.test(msg)) {
    return "MEGA rejected this session (account blocked or restricted). Check your MEGA account status and credentials.";
  }
  return msg;
}

/** Uses the same singleton as `megaUploadQueue` (one MEGA session for list + uploads + download). */
function initMegaStorage(): Promise<MegaStorage> {
  return getMegaStorage().then(
    (s) => s as unknown as MegaStorage,
    (e: unknown) => Promise.reject(new Error(megaErrorMessage(e)))
  );
}

async function makeNodePublicLink(node: MegaNode): Promise<string> {
  return new Promise((resolve, reject) => {
    node.link?.((err: any, link?: string) => {
      if (err || !link) return reject(err || new Error("Failed to create MEGA link."));
      resolve(link);
    });
  });
}

function rootFiles(storage: MegaStorage): MegaNode[] {
  return Array.isArray(storage.root.children) ? storage.root.children.filter((n) => !n.directory && typeof n.name === "string") : [];
}

function findNodeByStoredName(storage: MegaStorage, storedName: string): MegaNode | null {
  return rootFiles(storage).find((node) => node.name === storedName) || null;
}

async function deleteNode(node: MegaNode) {
  return new Promise<void>((resolve, reject) => {
    node.delete?.(true, (err?: any) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

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

app.get("/api/documents", async (_req: any, res: any) => {
  try {
    const storage = await initMegaStorage();
    const files = rootFiles(storage).filter((node) => node.name?.startsWith(`${DOCUMENT_PREFIX}__`));

    const docs: DocumentRecord[] = [];
    for (const file of files) {
      const storedName = file.name as string;
      const parsed = parseStoredName(storedName);
      if (!parsed) continue;
      const type = normalizeDocExtension(parsed.name);
      if (!type) continue;
      const previewUrl = await makeNodePublicLink(file);
      docs.push({
        id: storedName,
        storedName,
        name: parsed.name,
        folder: parsed.folder,
        size: Number(file.size || 0),
        updatedAt: new Date(parsed.ts).toISOString(),
        type,
        previewUrl,
      });
    }

    return res.status(200).json({ documents: docs.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)) });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to list documents." });
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

  try {
    const storedName = toStoredName(folder, file.originalname);
    const previewUrl = await queueMegaUpload(sourceBuffer, storedName);
    scrubBuffer(sourceBuffer);

    return res.status(201).json({
      document: {
        id: storedName,
        storedName,
        name: file.originalname,
        folder,
        size: Number(file.size || 0),
        updatedAt: new Date().toISOString(),
        type,
        previewUrl,
      },
    });
  } catch (error) {
    scrubBuffer(sourceBuffer);
    if (isMegaUploadBlockedError(error)) {
      return res.status(error.httpStatus).json({
        error: error.message,
        code: "MEGA_EBLOCKED",
      });
    }
    return res.status(500).json({ error: error instanceof Error ? error.message : "Upload failed." });
  }
});

app.get("/api/documents/download", async (req: any, res: any) => {
  const storedName = typeof req.query?.id === "string" ? req.query.id : "";
  const targetRaw = normalizeFormat(req.query?.targetFormat);
  if (!storedName) return res.status(400).json({ error: "Document id is required." });

  try {
    const storage = await initMegaStorage();
    const node = findNodeByStoredName(storage, storedName);
    if (!node || !node.name) return res.status(404).json({ error: "Document not found." });

    const parsed = parseStoredName(node.name);
    if (!parsed) return res.status(404).json({ error: "Document metadata not found." });
    const sourceFormat = normalizeDocExtension(parsed.name);
    if (!sourceFormat) return res.status(400).json({ error: "Unsupported source document type." });

    const megaLink = await makeNodePublicLink(node);
    const response = await fetch(megaLink);
    if (!response.ok) return res.status(502).json({ error: "Failed to fetch file from MEGA." });
    const sourceBuffer = Buffer.from(await response.arrayBuffer());

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
    return res.status(500).json({ error: error instanceof Error ? error.message : "Download failed." });
  }
});

app.delete("/api/documents", async (req: any, res: any) => {
  const storedName = typeof req.query?.id === "string" ? req.query.id : "";
  if (!storedName) return res.status(400).json({ error: "Document id is required." });

  try {
    const storage = await initMegaStorage();
    const node = findNodeByStoredName(storage, storedName);
    if (!node) return res.status(404).json({ error: "Document not found." });
    await deleteNode(node);
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Delete failed." });
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

  if (process.env.MEGA_EMAIL?.trim() && process.env.MEGA_PASSWORD) {
    void (async () => {
      try {
        const { initMega } = require("./megaService.js") as { initMega: () => Promise<unknown> };
        await initMega();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[Status] MEGA: startup connection error:", msg);
      }
    })();
  } else {
    console.log("[Status] MEGA: skipped (MEGA_EMAIL / MEGA_PASSWORD not set)");
  }

  if (process.env.GDRIVE_STARTUP_VERIFY === "false") {
    console.log("[Status] Google Drive: startup verify skipped (GDRIVE_STARTUP_VERIFY=false)");
  } else {
    void (async () => {
      const gdrive = require("./services/googleDriveStorage") as typeof import("./services/googleDriveStorage");
      if (!gdrive.isGoogleDriveConfigured()) {
        console.log("[Status] Google Drive: skipped (no service account in env or JSON path)");
        return;
      }
      try {
        const drive = gdrive.getDriveClient();
        const auth = gdrive.getDriveAuthClient();
        await gdrive.verifyDriveConnection(drive, auth);
      } catch (e) {
        console.error("[Status] Google Drive: startup verify error:", e instanceof Error ? e.message : e);
        if (process.env.GDRIVE_STARTUP_FAIL_FAST !== "false") {
          process.exit(1);
        }
      }
    })();
  }
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use.`);
  } else {
    console.error("Server error:", err);
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
