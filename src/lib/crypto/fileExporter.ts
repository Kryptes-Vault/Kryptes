/**
 * Client-side file conversion for the Zero-Knowledge vault.
 *
 * Because the backend never sees plaintext, all format conversion must happen
 * in the browser. Uses HTML5 Canvas for image-to-image and jsPDF for image-to-PDF.
 */

import { jsPDF } from "jspdf";

export type ExportFormat = "png" | "jpeg" | "webp" | "pdf";

/**
 * Load an image `Blob` into an `HTMLImageElement` on an off-screen canvas.
 * Resolves when the image is fully decoded.
 */
function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to decode image for conversion."));
    };
    img.src = url;
  });
}

/**
 * Convert a decrypted image `Blob` (PNG, JPEG, WebP) into another image format
 * using an off-screen `<canvas>`.
 */
export async function convertImageToImage(
  sourceBlob: Blob,
  targetFormat: "png" | "jpeg" | "webp",
  quality = 0.92
): Promise<Blob> {
  const img = await loadImage(sourceBlob);

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable.");
  ctx.drawImage(img, 0, 0);

  const mimeMap: Record<string, string> = {
    png: "image/png",
    jpeg: "image/jpeg",
    webp: "image/webp",
  };

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error(`Canvas export failed for ${targetFormat}.`));
        resolve(blob);
      },
      mimeMap[targetFormat],
      quality
    );
  });
}

/**
 * Convert a decrypted image `Blob` into a PDF using jsPDF.
 * The image is placed on a single page sized to the image dimensions.
 */
export async function convertImageToPdf(sourceBlob: Blob): Promise<Blob> {
  const img = await loadImage(sourceBlob);
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  const PX_TO_MM = 25.4 / 96;
  const pdfW = w * PX_TO_MM;
  const pdfH = h * PX_TO_MM;

  const orientation = pdfW > pdfH ? "landscape" : "portrait";
  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: [pdfW, pdfH],
  });

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

  doc.addImage(dataUrl, "JPEG", 0, 0, pdfW, pdfH);

  return doc.output("blob");
}

/**
 * High-level conversion dispatcher. Takes a decrypted Blob and a target format,
 * returns a new Blob in the requested format.
 */
export async function convertDecryptedFile(
  sourceBlob: Blob,
  sourceType: string,
  targetFormat: ExportFormat
): Promise<Blob> {
  const isImage = ["image/png", "image/jpeg", "image/webp"].includes(sourceType);

  if (!isImage) {
    throw new Error(`Client-side conversion from ${sourceType} is not supported.`);
  }

  if (targetFormat === "pdf") {
    return convertImageToPdf(sourceBlob);
  }

  return convertImageToImage(sourceBlob, targetFormat);
}

/** Trigger a browser download for a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
