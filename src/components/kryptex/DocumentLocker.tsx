import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { useVaultItems } from "@/hooks/useVaultItems";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArrowDownToLine,
  ChevronDown,
  CloudUpload,
  FileImage,
  FileText,
  FileType2,
  Image as ImageIcon,
  Loader2,
  Lock,
  ShieldCheck,
  FolderPlus,
  FolderOpen,
  X,
  Trash2,
  Download,
  Search,
  Grid,
  List,
} from "lucide-react";
import PhotoAlbum from "react-photo-album";
import type { Photo, RenderPhotoContext, RenderPhotoProps } from "react-photo-album";
import "react-photo-album/masonry.css";
import { DocumentFixedCard } from "./documentLocker/DocumentFixedCard";
import { encryptFile, decryptFile, generateFileEncryptionKey, validateFileType } from "@/lib/crypto/fileCrypto";
import { convertDecryptedFile, downloadBlob, type ExportFormat } from "@/lib/crypto/fileExporter";
import { Check } from "lucide-react";

export type DocumentFormat = "pdf" | "png" | "jpeg" | "webp" | "docx";

export type LockerDocument = {
  id: string;
  objectKey: string;
  name: string;
  size: number;
  type: DocumentFormat;
  folder: string;
  updatedAt: string;
  thumbnailSeed: string;
  source: "r2" | "upload";
};

type DocumentLockerProps = {
  activeFormat?: DocumentFormat | "all";
  /** Supabase `auth.users.id` — sent as `?userId=` so the API can authorize when the session cookie is missing (e.g. cross-origin `VITE_BACKEND_URL`). */
  userId?: string | null;
};

type UploadItem = {
  id: string;
  name: string;
  progress: number;
  type: DocumentFormat;
};

const ACCEPTED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "webp"] as const;

const DEFAULT_FOLDERS = ["Education", "Government", "Vehicle", "Certificates"];
const API_BASE = (import.meta.env.VITE_BACKEND_URL || "http://localhost:4000").replace(/\/$/, "");
const ZK_VAULT_DOCUMENTS_ENDPOINT = `${API_BASE}/api/vault/documents`;

const ZK_KEY_STORAGE = "kryptes_zk_file_key_v1";

async function getOrCreateFileKey(): Promise<string> {
  const stored = sessionStorage.getItem(ZK_KEY_STORAGE);
  if (stored) return stored;
  const key = await generateFileEncryptionKey();
  sessionStorage.setItem(ZK_KEY_STORAGE, key);
  return key;
}

function mimeForType(type: DocumentFormat): string {
  switch (type) {
    case "pdf": return "application/pdf";
    case "png": return "image/png";
    case "jpeg": return "image/jpeg";
    case "webp": return "image/webp";
    default: return "application/octet-stream";
  }
}

async function fetchR2DownloadUrl(objectKey: string): Promise<string> {
  const res = await fetch(
    `${ZK_VAULT_DOCUMENTS_ENDPOINT}/download-url?objectKey=${encodeURIComponent(objectKey)}`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error(`Failed to get download URL (${res.status})`);
  const data = (await res.json()) as { downloadUrl: string };
  return data.downloadUrl;
}

async function fetchEncryptedBlob(objectKey: string): Promise<Blob> {
  const url = await fetchR2DownloadUrl(objectKey);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`R2 download failed (${res.status})`);
  return res.blob();
}

function networkFetchToastMessage(e: unknown): string {
  if (e instanceof TypeError && /failed to fetch|load failed|networkerror/i.test(String(e.message))) {
    return `Cannot reach the API at ${API_BASE}. Start the backend (port 4000 by default) or set VITE_BACKEND_URL.`;
  }
  if (e instanceof Error) return e.message;
  return "Request failed.";
}

/** Read intrinsic size from a decrypted blob URL (required by react-photo-album). */
function probeImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || 1;
      const h = img.naturalHeight || 1;
      resolve({ width: w, height: h });
    };
    img.onerror = () => resolve({ width: 3, height: 2 });
    img.src = src;
  });
}

/** Photo row item: library shape + vault document for actions */
type VaultAlbumPhoto = Photo & {
  key: string;
  doc: LockerDocument;
};


function isImageDoc(doc: LockerDocument) {
  return doc.type === "png" || doc.type === "jpeg" || doc.type === "webp";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function formatDate(input: string) {
  return new Date(input).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fileTypeLabel(type: DocumentFormat) {
  return type.toUpperCase();
}

function thumbnailForType(type: DocumentFormat) {
  switch (type) {
    case "pdf":
      return { icon: FileText, accent: "text-[#FF3300]", bg: "bg-[#FF3300]/10" };
    case "docx":
      return { icon: FileType2, accent: "text-[#FF3B13]", bg: "bg-[#FF3B13]/10" };
    case "png":
    case "jpeg":
    case "webp":
      return { icon: ImageIcon, accent: "text-emerald-500", bg: "bg-emerald-500/10" };
    default:
      return { icon: Archive, accent: "text-black/40", bg: "bg-black/5" };
  }
}

function getAllowedTargets(original: DocumentFormat): DocumentFormat[] {
  switch (original) {
    case "pdf":
      return ["pdf"];
    case "png":
    case "jpeg":
    case "webp":
      return ["png", "jpeg", "webp", "pdf", "docx"];
    default:
      return [original];
  }
}

function normalizedExtension(name: string): DocumentFormat | null {
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  if (ext === "jpg") return "jpeg";
  if ((ACCEPTED_EXTENSIONS as readonly string[]).includes(ext)) return ext as DocumentFormat;
  return null;
}

function documentsListUrl(userId?: string | null) {
  const path = `${ZK_VAULT_DOCUMENTS_ENDPOINT}/list`;
  if (userId) {
    const params = new URLSearchParams({ userId });
    return `${path}?${params.toString()}`;
  }
  return path;
}

export default function DocumentLocker({ activeFormat = "all", userId = null }: DocumentLockerProps) {
  const { items, loading: syncing, reload: reloadVault, deleteItem, commitDocument } = useVaultItems(userId);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string>(DEFAULT_FOLDERS[0]);
  const [folderName, setFolderName] = useState("");
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [previewDoc, setPreviewDoc] = useState<LockerDocument | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [conversionDoc, setConversionDoc] = useState<LockerDocument | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<Set<ExportFormat>>(new Set(["pdf"]));
  const [converting, setConverting] = useState(false);
  const [busyDocId, setBusyDocId] = useState<string | null>(null);
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [optimisticDeletedIds, setOptimisticDeletedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [viewLayout, setViewLayout] = useState<"grid" | "list">("grid");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [thumbById, setThumbById] = useState<Record<string, string>>({});
  const [thumbLoadingId, setThumbLoadingId] = useState<string | null>(null);
  /** naturalWidth/height per doc id for react-photo-album (probed from blob URLs). */
  const [photoDims, setPhotoDims] = useState<Record<string, { width: number; height: number }>>({});
  /** Avoid duplicate dimension probes when `photoDims` updates incrementally. */
  const imageProbeKeyRef = useRef<Record<string, string>>({});
  const [hoveredGalleryId, setHoveredGalleryId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Derive documents directly from global vault items - ONE SOURCE OF TRUTH
  const documents = useMemo(() => {
    if (!items) return [];
    return items
      .filter((i) => i.item_type === "zk_document" && !optimisticDeletedIds.has(i.id))
      .map((row) => {
        const metadata = (row as any).decrypted_data || (row as any).metadata || {};
        const ext = String(metadata.fileType || "bin").toLowerCase();
        return {
          id: String(row.id),
          objectKey: String(metadata.objectKey || ""),
          name: String(row.title || ""),
          size: Number(metadata.originalSize || 0),
          type: (ext === "jpg" ? "jpeg" : ext) as DocumentFormat,
          folder: String(metadata.folder || "General"),
          updatedAt: String(row.updated_at),
          thumbnailSeed: String(row.title || "").slice(0, 1).toUpperCase() || "D",
          source: "r2" as const,
        };
      });
  }, [items, optimisticDeletedIds]);

  const folderOptions = useMemo(() => {
    const seen = new Set<string>([...DEFAULT_FOLDERS, ...customFolders]);
    documents.forEach((doc) => seen.add(doc.folder));
    return Array.from(seen);
  }, [documents, customFolders]);

  const filteredByFormat = useMemo(
    () => (activeFormat === "all" ? documents : documents.filter((doc) => doc.type === activeFormat)),
    [documents, activeFormat]
  );

  const filteredDocuments = useMemo(
    () =>
      filteredByFormat.filter((doc) => {
        const matchesFolder = doc.folder === activeFolder;
        const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFolder && matchesSearch;
      }),
    [filteredByFormat, activeFolder, searchQuery]
  );

  const sortedDocuments = useMemo(
    () => [...filteredDocuments].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    [filteredDocuments]
  );

  const imageDocuments = useMemo(() => sortedDocuments.filter(isImageDoc), [sortedDocuments]);
  const fileDocuments = useMemo(() => sortedDocuments.filter((d) => !isImageDoc(d)), [sortedDocuments]);

  const hasUploads = uploads.length > 0;


  const thumbFetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const doc of imageDocuments) {
      if (thumbFetchedRef.current.has(doc.id)) continue;
      if (!doc.objectKey) continue;
      thumbFetchedRef.current.add(doc.id);
      const { id: docId, objectKey, type: docType } = doc;
      setThumbLoadingId(docId);
      void (async () => {
        try {
          const key = await getOrCreateFileKey();
          const encryptedBlob = await fetchEncryptedBlob(objectKey);
          const url = await decryptFile(encryptedBlob, key, mimeForType(docType));
          setThumbById((prev) => (prev[docId] ? prev : { ...prev, [docId]: url }));
        } catch (err) {
          console.warn("[ZK-Vault] Thumbnail decrypt failed for", docId, err);
        } finally {
          setThumbLoadingId((cur) => (cur === docId ? null : cur));
        }
      })();
    }
  }, [imageDocuments]);

  useEffect(() => {
    return () => {
      setThumbById((prev) => {
        Object.values(prev).forEach((u) => URL.revokeObjectURL(u));
        return {};
      });
    };
  }, []);

  useEffect(() => {
    const allowed = new Set(imageDocuments.map((d) => d.id));
    setPhotoDims((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const k of Object.keys(next)) {
        if (!allowed.has(k)) {
          delete next[k];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    imageProbeKeyRef.current = Object.fromEntries(
      Object.entries(imageProbeKeyRef.current).filter(([k]) => allowed.has(k))
    );
  }, [imageDocuments]);

  useEffect(() => {
    let cancelled = false;
    for (const doc of imageDocuments) {
      const src = thumbById[doc.id];
      if (!src) continue;
      if (imageProbeKeyRef.current[doc.id] === src) continue;
      imageProbeKeyRef.current[doc.id] = src;
      void probeImageDimensions(src).then((dims) => {
        if (cancelled) return;
        setPhotoDims((prev) => ({ ...prev, [doc.id]: dims }));
      });
    }
    return () => {
      cancelled = true;
    };
  }, [imageDocuments, thumbById]);

  const albumPhotos: VaultAlbumPhoto[] = useMemo(() => {
    const mapped = imageDocuments
      .map((doc) => {
        const src = thumbById[doc.id];
        const dims = photoDims[doc.id];
        if (!src || !dims) return null;
        return {
          src,
          width: dims.width,
          height: dims.height,
          key: doc.id,
          doc,
        } satisfies VaultAlbumPhoto;
      })
      .filter((p): p is VaultAlbumPhoto => p !== null);

    // Ignore upload order: group similar shapes for a balanced masonry (after intrinsic size is known).
    return [...mapped].sort((a, b) => {
      const aspectA = a.width / a.height;
      const aspectB = b.width / b.height;
      const d = aspectA - aspectB;
      if (d !== 0) return d;
      const areaA = a.width * a.height;
      const areaB = b.width * b.height;
      return areaB - areaA;
    });
  }, [imageDocuments, thumbById, photoDims]);

  const albumLayoutPending = useMemo(() => {
    if (imageDocuments.length === 0) return false;
    const decryptBusy =
      thumbLoadingId !== null && imageDocuments.some((d) => d.id === thumbLoadingId);
    const dimsPending = imageDocuments.some((d) => {
      const src = thumbById[d.id];
      return Boolean(src) && !photoDims[d.id];
    });
    return decryptBusy || dimsPending;
  }, [imageDocuments, thumbById, photoDims, thumbLoadingId]);

  const downloadDocument = useCallback(async (doc: LockerDocument) => {
    if (!doc.objectKey) return;
    try {
      const key = await getOrCreateFileKey();
      const encryptedBlob = await fetchEncryptedBlob(doc.objectKey);
      const decryptedUrl = await decryptFile(encryptedBlob, key, mimeForType(doc.type));
      const a = document.createElement("a");
      a.href = decryptedUrl;
      a.download = doc.name;
      a.click();
      URL.revokeObjectURL(decryptedUrl);
    } catch (err) {
      toast.error("Failed to decrypt document for download.");
      console.error("[ZK-Vault] Download decrypt error:", err);
    }
  }, []);

  useEffect(() => {
    if (!previewDoc) {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
      setPreviewLoading(false);
      return;
    }

    if (!["pdf", "png", "jpeg", "webp"].includes(previewDoc.type)) {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;
    const loadPreview = async () => {
      if (!previewDoc.objectKey) return;
      setPreviewLoading(true);
      try {
        const key = await getOrCreateFileKey();
        const encryptedBlob = await fetchEncryptedBlob(previewDoc.objectKey);
        if (cancelled) return;
        const decryptedUrl = await decryptFile(encryptedBlob, key, mimeForType(previewDoc.type));
        if (cancelled) {
          URL.revokeObjectURL(decryptedUrl);
          return;
        }
        if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl(decryptedUrl);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };

    void loadPreview();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- preview blob is reset when previewDoc changes; avoids reload loops
  }, [previewDoc]);

  function createFolder() {
    const trimmed = folderName.trim();
    if (!trimmed) return;
    const exists = folderOptions.some((folder) => folder.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setActiveFolder(folderOptions.find((folder) => folder.toLowerCase() === trimmed.toLowerCase()) || DEFAULT_FOLDERS[0]);
      setFolderName("");
      return;
    }

    setCustomFolders((prev) => [...prev, trimmed]);
    setActiveFolder(trimmed);
    setFolderName("");
  }

  function syncDocument(document: LockerDocument) {
    // Rely on useVaultItems and Supabase Realtime for synchronization
    void reloadVault();
  }

  async function startSimulatedUpload(file: File) {
    const extension = normalizedExtension(file.name);
    if (!extension) return;

    try {
      validateFileType(file);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unsupported file type.");
      return;
    }

    const tempId = `upload-${crypto.randomUUID()}`;
    setUploads((prev) => [...prev, { id: tempId, name: file.name, progress: 0, type: extension }]);
    setIsUploading(true);

    let progress = 0;
    const interval = window.setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 90) {
        progress = 90;
        window.clearInterval(interval);
      }
      setUploads((prev) => prev.map((item) => (item.id === tempId ? { ...item, progress: Math.round(progress) } : item)));
    }, 180);

    try {
      // 1. Encrypt client-side
      const key = await getOrCreateFileKey();
      const encryptedBlob = await encryptFile(file, key);
      setUploads((prev) => prev.map((item) => (item.id === tempId ? { ...item, progress: 30 } : item)));

      // 2. Get pre-signed upload URL from backend
      const qs = userId ? `?userId=${encodeURIComponent(userId)}` : "";
      const urlRes = await fetch(`${ZK_VAULT_DOCUMENTS_ENDPOINT}/upload-url${qs}`, { credentials: "include" });
      if (!urlRes.ok) throw new Error(`Failed to get upload URL (${urlRes.status})`);
      const { uploadUrl, objectKey } = (await urlRes.json()) as { uploadUrl: string; objectKey: string };
      setUploads((prev) => prev.map((item) => (item.id === tempId ? { ...item, progress: 45 } : item)));

      // 3. PUT encrypted blob directly to R2 (zero backend memory)
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: encryptedBlob,
        headers: { "Content-Type": "application/octet-stream" },
      });
      if (!putRes.ok) throw new Error(`R2 upload failed (${putRes.status})`);
      setUploads((prev) => prev.map((item) => (item.id === tempId ? { ...item, progress: 80 } : item)));

      // 4. Commit metadata to Supabase via backend (Using React Query Mutation)
      await commitDocument({
        objectKey,
        fileName: file.name,
        folder: activeFolder,
        fileType: extension,
        originalSize: file.size,
        userId,
      });
      toast.success("Document uploaded successfully.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      window.clearInterval(interval);
      setUploads((prev) => {
        const next = prev.filter((item) => item.id !== tempId);
        if (next.length === 0) setIsUploading(false);
        return next;
      });
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    Array.from(files).forEach((file) => {
      const extension = normalizedExtension(file.name);
      if (!extension) return;
      startSimulatedUpload(file);
    });

    // Reset the input value so the same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!dragActive) setDragActive(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
  }

  async function runConversion() {
    if (!conversionDoc || !conversionDoc.objectKey || selectedFormats.size === 0) return;
    setConverting(true);
    setBusyDocId(conversionDoc.id);
    try {
      const key = await getOrCreateFileKey();
      const encryptedBlob = await fetchEncryptedBlob(conversionDoc.objectKey);
      
      const formats = Array.from(selectedFormats);
      for (const format of formats) {
        const decryptedUrl = await decryptFile(encryptedBlob, key, mimeForType(conversionDoc.type));

        // If target format matches source, just download the decrypted original
        if (format === conversionDoc.type) {
          const a = document.createElement("a");
          a.href = decryptedUrl;
          a.download = conversionDoc.name;
          a.click();
          URL.revokeObjectURL(decryptedUrl);
          continue;
        }

        // Client-side conversion
        const decRes = await fetch(decryptedUrl);
        const decBlob = await decRes.blob();
        URL.revokeObjectURL(decryptedUrl);

        const converted = await convertDecryptedFile(decBlob, mimeForType(conversionDoc.type), format as ExportFormat);
        const baseName = conversionDoc.name.replace(/\.[^.]+$/, "");
        const ext = format === "jpeg" ? "jpg" : format;
        downloadBlob(converted, `${baseName}.${ext}`);
      }
      
      setConversionDoc(null);
    } catch (err) {
      toast.error("Failed to convert document.");
      console.error("[ZK-Vault] Conversion error:", err);
    } finally {
      setConverting(false);
      setBusyDocId(null);
    }
  }

  async function handleDownload(doc: LockerDocument) {
    if (isImageDoc(doc)) {
      setConversionDoc(doc);
      return;
    }

    // Direct download for non-image files (PDF, docx, etc.)
    if (!doc.objectKey) return;
    setBusyDocId(doc.id);
    try {
      const key = await getOrCreateFileKey();
      const encryptedBlob = await fetchEncryptedBlob(doc.objectKey);
      const url = await decryptFile(encryptedBlob, key, mimeForType(doc.type));
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Failed to download document.");
      console.error("[ZK-Vault] Download error:", err);
    } finally {
      setBusyDocId(null);
    }
  }

  async function deleteDocument(doc: LockerDocument) {
    if (!doc.objectKey) return;
    
    // Safety confirmation as requested by user
    const confirmed = window.confirm(`Are you sure you want to permanently delete "${doc.name}"? This will remove it from the vault and the cloud storage.`);
    if (!confirmed) return;

    // OPTIMISTIC UI: Hide the item immediately
    setOptimisticDeletedIds(prev => new Set(prev).add(doc.id));
    
    setDeletePendingId(doc.id);
    try {
      // Use the React Query mutation
      await deleteItem(doc.id);

      if (previewDoc?.id === doc.id) setPreviewDoc(null);
      if (conversionDoc?.id === doc.id) setConversionDoc(null);
      
      toast.success("Document deleted successfully.");
    } catch (err) {
      // ROLLBACK on failure
      setOptimisticDeletedIds(prev => {
        const next = new Set(prev);
        next.delete(doc.id);
        return next;
      });
      toast.error("Failed to delete document.");
      console.error("[ZK-Vault] Delete error:", err);
    } finally {
      setDeletePendingId(null);
    }
  }

  return (
    <>
    <div className="bg-white text-black h-full overflow-hidden">
      <div className="w-full h-full flex flex-col md:flex-row divide-x divide-black/5">
        {/* Left Sidebar for Folders - Matches Main Sidebar Geometry */}
        <aside
          className={`w-full md:w-64 flex flex-col pt-8 px-6 rounded-tr-[2.5rem] h-full overflow-y-auto transition-colors ${
            dragActive ? "bg-[#FF3B13]/10" : "bg-[#f7f7f7]"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="px-4 mb-6">
            <button onClick={createFolder} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#FF3B13] hover:opacity-80 transition-opacity">
              <FolderPlus className="h-4 w-4" /> Add Folder
            </button>
          </div>

          <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-black/30 mb-4"></p>
          <nav className="flex flex-col gap-1">
            {folderOptions.map((folder) => (
              <button
                key={folder}
                type="button"
                onClick={() => setActiveFolder(folder)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  activeFolder === folder 
                    ? "bg-white text-[#FF3B13] shadow-sm font-bold" 
                    : "text-black/40 hover:bg-[#FF3B13]/5 hover:text-[#FF3B13]"
                }`}
              >
                <FolderOpen className="h-4 w-4 shrink-0" />
                <span className="text-[13px] font-medium">{folder}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col h-full overflow-y-auto pt-8 pb-16 px-4 transition-colors ${dragActive ? "bg-[#FF3B13]/5" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Header Controls */}
          <div className="mb-8 w-full">
            <div className="flex w-full items-center bg-[#f7f7f7] rounded-xl border border-black/5 overflow-hidden group focus-within:bg-white focus-within:border-[#FF3B13]/30 focus-within:ring-4 focus-within:ring-[#FF3B13]/5 transition-all">
              <div className="pl-5 pr-2 flex items-center justify-center text-black/20 group-focus-within:text-[#FF3B13]/40 transition-colors">
                <Search className="h-5 w-5" />
              </div>
              
              <input
                type="text"
                placeholder="Search your encrypted vault..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 flex-1 bg-transparent text-[14px] outline-none px-2"
              />

              <div className="flex items-center gap-2 pr-1.5">
                {isUploading && (
                  <div className="flex items-center gap-2 px-2 py-1 bg-black/5 rounded-lg animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin text-[#FF3B13]" />
                    <span className="text-[9px] font-bold uppercase tracking-tighter text-black/40">Syncing</span>
                  </div>
                )}
                
                <button 
                  onClick={() => inputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 h-9 px-5 bg-[#FF3B13] text-white rounded-lg text-[12px] font-bold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                >
                  <CloudUpload className="h-4 w-4" />
                  <span>Upload</span>
                </button>
              </div>
            </div>
            <input 
              ref={inputRef} 
              type="file" 
              multiple 
              accept=".pdf,.png,.jpg,.jpeg,.webp" 
              className="hidden" 
              onChange={(e) => handleFiles(e.target.files)} 
            />
          </div>

          {/* Gallery (justified flex) or list */}
          {syncing ? (
            <div className="mx-auto flex min-h-[220px] w-full max-w-3xl items-center justify-center rounded-3xl border border-black/5 bg-[#f7f7f7]">
              <p className="text-xs font-bold uppercase tracking-widest text-black/40">Syncing encrypted documents...</p>
            </div>
          ) : sortedDocuments.length > 0 ? (
            viewLayout === "list" ? (
              <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
                {sortedDocuments.map((doc) => {
                  const thumb = thumbnailForType(doc.type);
                  const Icon = thumb.icon;
                  return (
                    <div
                      key={doc.id}
                      className="flex flex-wrap items-center gap-4 border-b border-black/5 px-4 py-3 last:border-b-0 sm:flex-nowrap"
                    >
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${thumb.bg}`}>
                        <Icon className={`h-5 w-5 ${thumb.accent}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-[#111]">{doc.name}</p>
                        <p className="text-[11px] text-black/40">
                          {formatBytes(doc.size)} ┬╖ {formatDate(doc.updatedAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleDownload(doc)}
                          className="rounded-lg border border-black/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-black/60 hover:border-[#FF3B13]/30 hover:text-[#FF3B13]"
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="rounded-lg bg-black px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white"
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteDocument(doc)}
                          disabled={deletePendingId === doc.id}
                          className="p-2 text-black/25 hover:text-[#FF3300] disabled:opacity-40"
                        >
                          {deletePendingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
                <div>
                  {imageDocuments.length > 0 && (
                    <section className="mb-10">
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">Media</p>
                      {albumLayoutPending ? (
                        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-black/5 bg-[#f7f7f7] dark:border-white/10 dark:bg-white/5">
                          <Loader2 className="h-8 w-8 animate-spin text-[#FF3B13]" />
                          <p className="text-sm text-black/50 dark:text-white/50">Preparing gallery layout…</p>
                        </div>
                      ) : albumPhotos.length > 0 ? (
                        <PhotoAlbum
                          layout="masonry"
                          photos={albumPhotos}
                          columns={(containerWidth) => {
                            if (containerWidth < 640) return 2;
                            if (containerWidth < 1024) return 3;
                            return 4;
                          }}
                          spacing={12}
                          render={{
                            photo: (_props: RenderPhotoProps, context: RenderPhotoContext<VaultAlbumPhoto>) => {
                              const p = context.photo;
                              const doc = p.doc;
                              const { width, height } = context;
                              const active = hoveredGalleryId === doc.id;
                              return (
                                <div
                                  key={p.key ?? context.index}
                                  className="group relative overflow-hidden rounded-xl border border-black/5 bg-[#f0f0f0] shadow-sm dark:border-white/10 dark:bg-gray-900"
                                  style={{ width, height }}
                                  onMouseEnter={() => setHoveredGalleryId(doc.id)}
                                  onMouseLeave={() => setHoveredGalleryId(null)}
                                  onFocus={() => setHoveredGalleryId(doc.id)}
                                  onBlur={() => setHoveredGalleryId(null)}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void deleteDocument(doc);
                                    }}
                                    disabled={deletePendingId === doc.id}
                                    className="absolute right-2 top-2 z-20 rounded-full bg-white/90 p-1.5 text-black/35 shadow-sm backdrop-blur-sm transition hover:text-[#FF3300] disabled:opacity-40 dark:bg-gray-800/90 dark:text-white/50"
                                    aria-label="Remove"
                                  >
                                    {deletePendingId === doc.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                  </button>

                                  <div
                                    role="button"
                                    tabIndex={0}
                                    className="relative flex h-full w-full cursor-pointer flex-col outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/30"
                                    onClick={() => setPreviewDoc(doc)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setPreviewDoc(doc);
                                      }
                                    }}
                                  >
                                    <img
                                      src={p.src}
                                      alt=""
                                      className="h-full w-full object-contain"
                                      loading="lazy"
                                      decoding="async"
                                      draggable={false}
                                    />
                                  </div>

                                  <div
                                    className={`pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/35 to-transparent transition-opacity ${
                                      active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                    }`}
                                  />
                                  <div
                                    className={`absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 p-3 transition-opacity ${
                                      active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                    }`}
                                  >
                                    <div className="pointer-events-none min-w-0">
                                      <p className="truncate text-[12px] font-bold text-white drop-shadow-sm">{doc.name}</p>
                                      <p className="text-[10px] font-medium text-white/75">{formatBytes(doc.size)}</p>
                                    </div>
                                    <button
                                      type="button"
                                      aria-label={`Download ${doc.name}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        void handleDownload(doc);
                                      }}
                                      className="pointer-events-auto inline-flex items-center justify-center gap-2 self-start rounded-xl bg-white py-2 pl-3 pr-4 text-[10px] font-bold uppercase tracking-widest text-black shadow-md transition hover:bg-white/95 dark:bg-gray-100"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                      Download
                                    </button>
                                  </div>
                                </div>
                              );
                            },
                          }}
                        />
                      ) : (
                        <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-black/10 bg-[#fafafa] px-4 py-8 text-center text-sm text-black/45 dark:border-white/15 dark:bg-white/5 dark:text-white/45">
                          Preview unavailable. Check your connection and try refreshing the vault.
                        </div>
                      )}
                    </section>
                  )}

                  {/* Documents Section - Now Second */}
                  {fileDocuments.length > 0 ? (
                    <section>
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">Documents</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {fileDocuments.map((doc) => {
                          const thumb = thumbnailForType(doc.type);
                          return (
                            <DocumentFixedCard
                              key={doc.id}
                              doc={{ id: doc.id, name: doc.name, sizeLabel: formatBytes(doc.size) }}
                              icon={thumb.icon}
                              accent={thumb.accent}
                              bg={thumb.bg}
                              typeLabel={fileTypeLabel(doc.type)}
                              updatedLabel={formatDate(doc.updatedAt)}
                              onDelete={() => void deleteDocument(doc)}
                              onDownload={() => void handleDownload(doc)}
                              onPreview={() => setPreviewDoc(doc)}
                              deletePending={deletePendingId === doc.id}
                              hoveredId={hoveredGalleryId}
                              onHoverChange={setHoveredGalleryId}
                            />
                          );
                        })}
                      </div>
                    </section>
                  ) : null}
            </div>
            )
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={`mx-auto flex min-h-[320px] w-full max-w-3xl flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition-all ${
                dragActive
                  ? "border-[#FF3B13] bg-[#FF3B13]/5"
                  : "border-black/10 bg-[#f7f7f7] hover:border-[#FF3B13]/50"
              }`}
            >
              <CloudUpload className="h-10 w-10 text-[#FF3B13]" />
              <p className="mt-4 text-sm font-bold text-black">This folder is empty</p>
              <p className="mt-2 text-xs text-black/45">Drag and drop files here, or click to upload into this folder.</p>
            </button>
          )}

        {/* Empty state or upload progress */}
        {uploads.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploads.map((upload) => (
              <div key={upload.id} className="bg-white border border-black/5 rounded-2xl p-4 flex items-center gap-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#FF3B13]/5 text-[#FF3B13]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-black truncate">{upload.name}</p>
                  <div className="mt-1.5 h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF3B13] transition-all duration-300" style={{ width: `${upload.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
</div>

      <AnimatePresence>
        {previewDoc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 px-4 py-6 backdrop-blur-sm" onClick={() => setPreviewDoc(null)}>
              <div className="relative w-full h-full flex items-center justify-center">
                {previewLoading ? (
                  <div className="flex h-[480px] w-full items-center justify-center rounded-3xl bg-black/5">
                    <Loader2 className="h-8 w-8 animate-spin text-white/40" />
                  </div>
                ) : previewBlobUrl && (previewDoc.type === "pdf" || previewDoc.type === "png" || previewDoc.type === "jpeg" || previewDoc.type === "webp") ? (
                  <div className="overflow-hidden rounded-xl shadow-2xl">
                    {previewDoc.type === "pdf" ? (
                      <iframe src={previewBlobUrl} title={previewDoc.name} className="h-[85vh] w-[80vw]" />
                    ) : (
                      <img src={previewBlobUrl} alt={previewDoc.name} className="max-h-[90vh] max-w-[95vw] object-contain" />
                    )}
                  </div>
                ) : (
                  <div className="rounded-3xl bg-black/40 p-12 text-center text-sm text-white/60 backdrop-blur-md">
                    Direct preview is not available for this file type.
                  </div>
                )}
              </div>
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {conversionDoc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-xl" onClick={() => !converting && setConversionDoc(null)}>
            <motion.div 
              initial={{ scale: 0.9, y: 30, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.9, y: 30, opacity: 0 }} 
              transition={{ type: "spring", stiffness: 280, damping: 28 }} 
              className="w-full max-w-3xl overflow-hidden rounded-[2.5rem] border border-white/20 bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)]" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative border-b border-black/5 px-10 py-8">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FF3B13]/10">
                        <ArrowDownToLine className="h-5 w-5 text-[#FF3B13]" />
                      </div>
                      <h3 className="text-3xl font-black tracking-tighter text-black">Export Asset</h3>
                    </div>
                    <p className="mt-2 text-sm font-medium text-black/40">Select one or more formats to decrypt and export.</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => !converting && setConversionDoc(null)} 
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/5 text-black/40 transition hover:bg-black/10 hover:text-black"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-10">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_2fr]">
                  {/* Left: Original Info */}
                  <div className="flex flex-col">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/30">Source Asset</p>
                    <div className="group mt-4 flex flex-col items-center rounded-3xl border border-black/5 bg-[#fbfbfb] p-8 text-center transition-all hover:bg-white hover:shadow-xl">
                      <div className="relative mb-6">
                        <div className="relative z-10 flex h-24 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/10">
                          {thumbById[conversionDoc.id] ? (
                            <img src={thumbById[conversionDoc.id]} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <FileImage className="h-10 w-10 text-[#FF3B13]" />
                          )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 z-20 flex h-8 w-8 items-center justify-center rounded-xl bg-[#FF3B13] text-white shadow-lg">
                          <Lock className="h-4 w-4" />
                        </div>
                      </div>
                      <p className="max-w-[140px] truncate text-sm font-black text-black">{conversionDoc.name}</p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-black/40">{fileTypeLabel(conversionDoc.type)} • {formatBytes(conversionDoc.size)}</p>
                    </div>
                  </div>

                  {/* Right: Format Grid */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/30">Target Formats</p>
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {getAllowedTargets(conversionDoc.type).map((format) => {
                        const isSelected = selectedFormats.has(format as ExportFormat);
                        const colors: Record<string, string> = {
                          pdf: "bg-[#F43F5E]", // Rose-500 (Red)
                          jpeg: "bg-[#F59E0B]", // Amber-500 (Orange)
                          png: "bg-[#3B82F6]", // Blue-500
                          webp: "bg-[#10B981]", // Emerald-500
                          docx: "bg-[#2563EB]", // Indigo-600 (Word Blue)
                        };
                        const colorClass = colors[format] || "bg-black/40";

                        return (
                          <motion.button
                            key={format}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const next = new Set(selectedFormats);
                              if (isSelected) next.delete(format as ExportFormat);
                              else next.add(format as ExportFormat);
                              setSelectedFormats(next);
                            }}
                            className={`group relative flex flex-col items-center justify-center overflow-hidden rounded-3xl p-6 transition-all ring-inset ${
                              isSelected 
                                ? "bg-white shadow-[0_12px_24px_-8px_rgba(0,0,0,0.1)] ring-2 ring-[#FF3B13]" 
                                : "bg-[#fbfbfb] ring-1 ring-black/5 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                            }`}
                          >
                            {/* Document Shape */}
                            <div className="relative flex flex-col items-center">
                              <svg width="60" height="74" viewBox="0 0 60 74" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
                                <path d="M4 0C1.79086 0 0 1.79086 0 4V70C0 72.2091 1.79086 74 4 74H56C58.2091 74 60 72.2091 60 70V18L42 0H4Z" fill="white" fillOpacity="0.8" />
                                <path d="M42 0V14C42 16.2091 43.7909 18 46 18H60L42 0Z" fill="black" fillOpacity="0.05" />
                                <path d="M4 0.5C2.067 0.5 0.5 2.067 0.5 4V70C0.5 71.933 2.067 73.5 4 73.5H56C57.933 73.5 59.5 71.933 59.5 70V18.2071L41.7929 0.5H4Z" stroke="black" strokeOpacity="0.08" />
                              </svg>

                              {/* Label Pill */}
                              <div className={`absolute left-1/2 top-1/2 h-7 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-center shadow-lg transition-transform ${colorClass} ${isSelected ? "scale-110" : "scale-100"}`}>
                                <span className="text-[10px] font-black tracking-widest text-white">{format.toUpperCase()}</span>
                              </div>
                            </div>

                            {/* Selection Indicatpr */}
                            {isSelected && (
                              <motion.div 
                                initial={{ scale: 0 }} 
                                animate={{ scale: 1 }} 
                                className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF3B13] p-1 text-white shadow-md shadow-[#FF3B13]/20"
                              >
                                <Check className="h-2.5 w-2.5 stroke-[4]" />
                              </motion.div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-[#f7f7f7] px-10 py-8">
                <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-xs font-bold text-black/30">{selectedFormats.size} format(s) selected</span>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => !converting && setConversionDoc(null)} 
                      className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-black/50 transition hover:text-black"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      onClick={() => void runConversion()} 
                      disabled={converting || selectedFormats.size === 0} 
                      className="group flex flex-1 items-center justify-center gap-3 rounded-[1.5rem] bg-[#FF3B13] px-10 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-[0_12px_24px_-8px_rgba(255,59,19,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:opacity-50 sm:flex-none"
                    >
                      {converting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Decrypting Assets...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          <span>Decrypt & Export</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
