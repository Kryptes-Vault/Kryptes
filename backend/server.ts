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
const zkDocumentRoutes = require("./routes/documents");
const webhookRoutes = require("./routes/webhooks");
const authRoutes = require("./routes/auth");
const { handleSendEmailHook } = require("./routes/authEmailHook");
const { corsOptions, getSessionCookieOptions } = require("./config/auth");
const { encryptVaultAtRest, decryptVaultAtRest } = require("./utils/cryptoUtils");
const supportRoutes = require("./routes/support");
const otpRoutes = require("./routes/otp");

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

const IMAGE_FORMATS = new Set<SupportedImageFormat>(["png", "jpeg", "webp"]);

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

/* Legacy /api/documents routes removed — migrated to Cloudflare R2 via /api/vault/documents */

app.use("/api/vault/documents", zkDocumentRoutes);
app.use("/api/vault", vaultRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/auth", authRoutes);
app.post("/api/auth/send-email-hook", express.json(), handleSendEmailHook);
app.use("/api/otp", otpRoutes);
app.use("/api/support", supportRoutes);

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

    // 3. Supabase Storage Status
    const { verifySupabaseConnection } = require("./services/supabaseAdmin");
    await verifySupabaseConnection();

    // 4. Cloudflare R2 Storage Status
    const r2 = require("./services/r2Storage") as typeof import("./services/r2Storage");
    try {
      if (!r2.isR2Configured()) {
        console.warn("[Storage] ⚠️ Cloudflare R2: R2_ENDPOINT_URL / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY not set.");
      } else {
        console.log("[Storage] Cloudflare R2: Verifying bucket reachability...");
        await r2.verifyR2Connection();
      }
    } catch (err: any) {
      console.error("❌ Storage: Cloudflare R2 verification failed:", err.message);
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

let isShuttingDown = false;

function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[Kryptex] Received ${signal}. Closing HTTP server…`);

  const forceExit = setTimeout(() => {
    console.error("[Kryptex] Forced exit after timeout.");
    process.exit(1);
  }, 5_000);
  forceExit.unref();

  server.close(() => {
    console.log("[Kryptex] HTTP server closed.");

    const teardown: Promise<void>[] = [];

    if (redisClient && redisClient.status !== "end") {
      teardown.push(
        redisClient
          .quit()
          .then(() => console.log("[Kryptex] Redis disconnected."))
          .catch(() => {})
      );
    }

    Promise.allSettled(teardown).then(() => {
      clearTimeout(forceExit);
      process.exit(0);
    });
  });
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export { app, server };
