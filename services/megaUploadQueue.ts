/**
 * Serial MEGA upload queue with randomized jitter delay, browser spoofing, and EBLOCKED handling.
 * Prevents concurrent megajs uploads from tripping MEGA bot-protection / rate limits.
 */

import type { MutableFile, Storage as MegaStorage } from "megajs";

const { Storage: MegaStorageCtor } = require("megajs") as typeof import("megajs");

/** Realistic browser user agent to avoid automation detection. */
const BROWSER_SPOOF_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

/** 
 * Generates a randomized "Human Jitter" delay.
 * Returns a value between 3000ms (3s) and 6000ms (6s).
 */
const getJitterDelay = () => Math.floor(Math.random() * (6000 - 3000 + 1) + 3000);

const RATE_LIMIT_LOG =
  "🚨 MEGA RATE LIMIT TRIGGERED: Account Blocked (EBLOCKED). Halting queue.";

export class MegaUploadBlockedError extends Error {
  readonly name = "MegaUploadBlockedError";
  /** 429 = Too Many Requests — appropriate when MEGA signals block / rate limit. */
  readonly httpStatus = 429 as const;
  readonly megaCode = -16 as const;

  constructor(message = "MEGA temporarily blocked this session (rate limit or account restriction). Try again later.") {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isMegaUploadBlockedError(err: unknown): err is MegaUploadBlockedError {
  return err instanceof MegaUploadBlockedError;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/** Detect MEGA EBLOCKED / -16 from megajs or stringified API errors. */
export function isEblockedError(err: unknown): boolean {
  if (err == null) return false;
  const rec = err as { code?: number; message?: unknown };
  if (rec.code === -16) return true;
  const msg = typeof rec.message === "string" ? rec.message : getErrorMessage(err);
  return /EBLOCKED|User blocked|\(-16\)/i.test(msg);
}

let storageSingleton: Promise<MegaStorage> | null = null;

/** 
 * Strict Singleton MEGA Storage Connection.
 * Uses persistent authentication and browser spoofing to prevent session thrashing.
 */
export async function getMegaStorage(): Promise<MegaStorage> {
  if (storageSingleton) return storageSingleton;

  storageSingleton = new Promise<MegaStorage>((resolve, reject) => {
    const email = process.env.MEGA_EMAIL?.trim();
    const password = process.env.MEGA_PASSWORD;

    if (!email || !password) {
      reject(new Error("MEGA_EMAIL and MEGA_PASSWORD must be set for secure uploads."));
      return;
    }

    console.log(`[MEGA] Initializing Stealth Connection (UA Spoofing)...`);
    const instance = new MegaStorageCtor(
      { 
        email, 
        password, 
        userAgent: BROWSER_SPOOF_UA,
        keepalive: true,
      },
      (error: Error | null) => {
        if (error) {
          storageSingleton = null; // Allow retry on fatal initialization error
          reject(error);
        } else {
          console.log("✅ [MEGA] Authenticated & Ready.");
          resolve(instance);
        }
      }
    );
  });

  return storageSingleton;
}

type QueueJob = {
  fileBuffer: Buffer;
  fileName: string;
  resolve: (link: string) => void;
  reject: (err: Error) => void;
};

const queue: QueueJob[] = [];

let workerRunning = false;
let queueHalted = false;

function drainQueueWithError(err: Error): void {
  while (queue.length > 0) {
    const j = queue.shift();
    if (j) j.reject(err);
  }
}

async function uploadBufferOnce(storage: MegaStorage, fileBuffer: Buffer, fileName: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    // megajs typings: (opts, buffer?, cb?) — callback must be 3rd arg when streaming via .end(buffer).
    const stream = storage.upload(
      { name: fileName, size: fileBuffer.length },
      undefined,
      (err: unknown, file: MutableFile) => {
        if (err) {
          reject(err);
          return;
        }
        void file.link(true, (linkErr: unknown, link?: string) => {
          if (linkErr || !link) reject(linkErr ?? new Error("Failed to create MEGA link."));
          else resolve(link);
        });
      }
    );
    stream.end(fileBuffer);
  });
}

async function runWorker(): Promise<void> {
  if (workerRunning || queueHalted) return;
  workerRunning = true;

  try {
    while (queue.length > 0 && !queueHalted) {
      const job = queue.shift();
      if (!job) break;

      try {
        const storage = await getMegaStorage();
        const link = await uploadBufferOnce(storage, job.fileBuffer, job.fileName);
        job.resolve(link);

        if (!queueHalted && queue.length > 0) {
          const waitTime = getJitterDelay();
          console.log(`[MEGA Queue] Upload success. Jitter pause: ${waitTime}ms...`);
          await delay(waitTime);
        }
      } catch (err) {
        if (isEblockedError(err)) {
          console.error(RATE_LIMIT_LOG);
          queueHalted = true;
          const blocked = new MegaUploadBlockedError(getErrorMessage(err));
          job.reject(blocked);
          drainQueueWithError(blocked);
          break;
        }
        job.reject(err instanceof Error ? err : new Error(getErrorMessage(err)));
      }
    }
  } finally {
    workerRunning = false;
    if (!queueHalted && queue.length > 0) {
      void runWorker();
    }
  }
}

/**
 * Enqueue a single-file upload. Resolves with the public MEGA link when complete.
 * Concurrency is strictly 1; a delay is applied after each successful upload.
 */
export function queueMegaUpload(fileBuffer: Buffer, fileName: string): Promise<string> {
  if (queueHalted) {
    return Promise.reject(new MegaUploadBlockedError());
  }

  return new Promise<string>((resolve, reject) => {
    queue.push({
      fileBuffer,
      fileName,
      resolve,
      reject,
    });
    void runWorker();
  });
}

/** Whether EBLOCKED halted the queue; new `queueMegaUpload` calls reject until reset. */
export function isMegaUploadQueueHalted(): boolean {
  return queueHalted;
}

/**
 * Clears the halted flag so new uploads may be attempted.
 * Does not verify MEGA account status — call after cooldown or manual account fix.
 */
export function resetMegaUploadQueue(): void {
  queueHalted = false;
}

/** Drops cached Storage session (e.g. after long idle). Next upload reconnects. */
export function clearMegaStorageCache(): void {
  storageSingleton = null;
}
