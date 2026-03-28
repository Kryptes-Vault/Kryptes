import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArrowDownToLine,
  ChevronDown,
  CloudUpload,
  FileImage,
  FileText,
  FileType2,
  HardDriveDownload,
  Eye,
  Image,
  Loader2,
  Lock,
  ShieldCheck,
  FolderPlus,
  FolderOpen,
  X,
} from "lucide-react";

export type DocumentFormat = "pdf" | "png" | "jpeg" | "webp" | "docx";

export type LockerDocument = {
  id: string;
  name: string;
  size: number;
  type: DocumentFormat;
  folder: string;
  updatedAt: string;
  thumbnailSeed: string;
  source: "cache" | "fresh" | "upload";
};

type DocumentLockerProps = {
  activeFormat?: DocumentFormat | "all";
};

type UploadItem = {
  id: string;
  name: string;
  progress: number;
  type: DocumentFormat;
};

const ACCEPTED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "webp", "docx"] as const;

const CACHED_DOCUMENTS: LockerDocument[] = [
  {
    id: "doc-1",
    name: "Passport_Scan.pdf",
    size: 2_431_122,
    type: "pdf",
    folder: "Government",
    updatedAt: "2026-04-08T10:14:00Z",
    thumbnailSeed: "P",
    source: "cache",
  },
  {
    id: "doc-2",
    name: "Bank_Statement_Q1.docx",
    size: 614_200,
    type: "docx",
    folder: "Education",
    updatedAt: "2026-04-07T13:22:00Z",
    thumbnailSeed: "B",
    source: "cache",
  },
  {
    id: "doc-3",
    name: "Tax_Receipt_2025.png",
    size: 892_001,
    type: "png",
    folder: "Certificates",
    updatedAt: "2026-04-06T18:03:00Z",
    thumbnailSeed: "T",
    source: "cache",
  },
  {
    id: "doc-4",
    name: "KYC_Selfie.webp",
    size: 1_020_445,
    type: "webp",
    folder: "Government",
    updatedAt: "2026-04-05T09:58:00Z",
    thumbnailSeed: "K",
    source: "cache",
  },
  {
    id: "doc-5",
    name: "Insurance_Certificate.pdf",
    size: 3_118_941,
    type: "pdf",
    folder: "Vehicle",
    updatedAt: "2026-04-04T11:45:00Z",
    thumbnailSeed: "I",
    source: "cache",
  },
];

const FRESH_DOCUMENTS: LockerDocument[] = [
  ...CACHED_DOCUMENTS,
  {
    id: "doc-6",
    name: "Employment_Contract.pdf",
    size: 4_802_119,
    type: "pdf",
    folder: "Education",
    updatedAt: "2026-04-09T08:11:00Z",
    thumbnailSeed: "E",
    source: "fresh",
  },
  {
    id: "doc-7",
    name: "Travel_ID.webp",
    size: 1_304_554,
    type: "webp",
    folder: "Government",
    updatedAt: "2026-04-09T08:13:00Z",
    thumbnailSeed: "T",
    source: "fresh",
  },
];

const DEFAULT_FOLDERS = ["Education", "Government", "Vehicle", "Certificates"];

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
      return { icon: FileType2, accent: "text-blue-500", bg: "bg-blue-500/10" };
    case "png":
    case "jpeg":
    case "webp":
      return { icon: Image, accent: "text-emerald-500", bg: "bg-emerald-500/10" };
    default:
      return { icon: Archive, accent: "text-black/40", bg: "bg-black/5" };
  }
}

function getAllowedTargets(original: DocumentFormat): DocumentFormat[] {
  switch (original) {
    case "pdf":
      return ["pdf", "png", "jpeg"];
    case "png":
    case "jpeg":
    case "webp":
      return ["png", "jpeg", "webp", "pdf"];
    case "docx":
      return ["docx", "pdf", "png"];
    default:
      return [original];
  }
}

function normalizedExtension(name: string): DocumentFormat | null {
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  if (ext === "jpg") return "jpeg";
  if (ACCEPTED_EXTENSIONS.includes(ext as any)) return ext as DocumentFormat;
  return null;
}

function useCachedDocuments() {
  const [documents, setDocuments] = useState<LockerDocument[]>(CACHED_DOCUMENTS);
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    setDocuments(CACHED_DOCUMENTS);
    setSyncing(true);

    const timer = window.setTimeout(() => {
      setDocuments(FRESH_DOCUMENTS);
      setSyncing(false);
    }, 1600);

    return () => window.clearTimeout(timer);
  }, []);

  return { documents, setDocuments, syncing };
}

export async function handleFormatConversion(fileId: string, targetFormat: DocumentFormat) {
  // Simulates a backend Edge Function that decrypts, converts, and returns the file.
  await new Promise((resolve) => window.setTimeout(resolve, 1100));

  const payload = `Kryptes secure conversion stub\nFile ID: ${fileId}\nTarget Format: ${targetFormat.toUpperCase()}\nGenerated At: ${new Date().toISOString()}`;
  const mimeMap: Record<DocumentFormat, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpeg: "image/jpeg",
    webp: "image/webp",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };

  const blob = new Blob([payload], { type: mimeMap[targetFormat] });
  return {
    blob,
    fileName: `${fileId}.${targetFormat}`,
    mimeType: mimeMap[targetFormat],
  };
}

export default function DocumentLocker({ activeFormat = "all" }: DocumentLockerProps) {
  const { documents, setDocuments, syncing } = useCachedDocuments();
  const [dragActive, setDragActive] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>("all");
  const [folderName, setFolderName] = useState("");
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [previewDoc, setPreviewDoc] = useState<LockerDocument | null>(null);
  const [conversionDoc, setConversionDoc] = useState<LockerDocument | null>(null);
  const [targetFormat, setTargetFormat] = useState<DocumentFormat>("pdf");
  const [converting, setConverting] = useState(false);
  const [busyDocId, setBusyDocId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

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
    () => (activeFolder === "all" ? filteredByFormat : filteredByFormat.filter((doc) => doc.folder === activeFolder)),
    [filteredByFormat, activeFolder]
  );

  const sortedDocuments = useMemo(
    () => [...filteredDocuments].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    [filteredDocuments]
  );

  const hasUploads = uploads.length > 0;
  const uploadSummary = hasUploads
    ? uploads.every((u) => u.progress >= 100)
      ? "Processing files..."
      : `${uploads.length} file${uploads.length > 1 ? "s" : ""} uploading`
    : "";

  function createFolder() {
    const trimmed = folderName.trim();
    if (!trimmed) return;
    const exists = folderOptions.some((folder) => folder.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setActiveFolder(folderOptions.find((folder) => folder.toLowerCase() === trimmed.toLowerCase()) || "all");
      setFolderName("");
      return;
    }

    setCustomFolders((prev) => [...prev, trimmed]);
    setActiveFolder(trimmed);
    setFolderName("");
  }

  function syncDocument(document: LockerDocument) {
    setDocuments((prev) => [document, ...prev.filter((doc) => doc.id !== document.id)]);
  }

  function startSimulatedUpload(file: File) {
    const extension = normalizedExtension(file.name);
    if (!extension) return;

    const tempId = `upload-${crypto.randomUUID()}`;
    setUploads((prev) => [
      ...prev,
      { id: tempId, name: file.name, progress: 0, type: extension },
    ]);

    let progress = 0;
    const interval = window.setInterval(() => {
      progress += Math.random() * 22;
      if (progress >= 100) {
        progress = 100;
        window.clearInterval(interval);

        const uploadedDoc: LockerDocument = {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: extension,
          folder: activeFolder === "all" ? "Unsorted" : activeFolder,
          updatedAt: new Date().toISOString(),
          thumbnailSeed: file.name.slice(0, 1).toUpperCase() || "D",
          source: "upload",
        };

        syncDocument(uploadedDoc);
        setUploads((prev) => prev.filter((item) => item.id !== tempId));
        return;
      }

      setUploads((prev) =>
        prev.map((item) => (item.id === tempId ? { ...item, progress: Math.round(progress) } : item))
      );
    }, 160);
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    Array.from(files).forEach((file) => {
      const extension = normalizedExtension(file.name);
      if (!extension) return;
      startSimulatedUpload(file);
    });
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }

  async function runConversion() {
    if (!conversionDoc) return;
    setConverting(true);
    setBusyDocId(conversionDoc.id);
    try {
      const result = await handleFormatConversion(conversionDoc.id, targetFormat);
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${conversionDoc.name.replace(/\.[^.]+$/, "")}.${targetFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      setConversionDoc(null);
    } finally {
      setConverting(false);
      setBusyDocId(null);
    }
  }

  const fileCount = sortedDocuments.length;

  return (
    <div className="min-h-screen bg-white text-black dark:bg-[#090909] dark:text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-black/30 dark:text-white/25">
              Kryptes Standard
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Document Locker
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-black/45 dark:text-white/40">
              Zero-knowledge storage with fast Redis-backed cache hydration and background Supabase sync.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 text-right">
            <AnimatePresence>
              {syncing && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-black/[0.03] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-black/45 dark:border-white/10 dark:bg-white/5 dark:text-white/50"
                >
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF3300]" />
                  Syncing securely...
                </motion.div>
              )}
            </AnimatePresence>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/25 dark:text-white/25">
              {fileCount} documents
            </p>
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`mb-8 rounded-3xl border-2 border-dashed px-5 py-6 transition-all sm:px-6 ${
            dragActive
              ? "border-[#FF3300] bg-[#FF3300]/5"
              : "border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]"
          }`}
        >
          <div className="mb-5 rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/35 dark:text-white/30">
                  Document Folders
                </p>
                <p className="mt-1 text-xs text-black/40 dark:text-white/35">
                  Create your own folders (Education, Government, Vehicle, Certificates, or custom).
                </p>
              </div>

              <div className="flex w-full gap-2 lg:w-auto">
                <input
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      createFolder();
                    }
                  }}
                  className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-xs outline-none transition focus:border-[#FF3300]/30 lg:w-56"
                />
                <button
                  type="button"
                  onClick={createFolder}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-black px-4 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-[#FF3300]"
                >
                  <FolderPlus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveFolder("all")}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] transition ${
                  activeFolder === "all"
                    ? "border-[#FF3300] bg-[#FF3300] text-white"
                    : "border-black/10 bg-black/[0.02] text-black/45 hover:border-[#FF3300]/30 hover:text-[#FF3300]"
                }`}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                All Folders
              </button>

              {folderOptions.map((folder) => (
                <button
                  key={folder}
                  type="button"
                  onClick={() => setActiveFolder(folder)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] transition ${
                    activeFolder === folder
                      ? "border-[#FF3300] bg-[#FF3300] text-white"
                      : "border-black/10 bg-black/[0.02] text-black/45 hover:border-[#FF3300]/30 hover:text-[#FF3300]"
                  }`}
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  {folder}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-white/5">
                <CloudUpload className="h-6 w-6 text-[#FF3300]" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-black/70 dark:text-white/80">
                  Upload Zone
                </h2>
                <p className="mt-1 text-xs text-black/40 dark:text-white/35">
                  PDF, PNG, JPEG, WEBP, DOCX — drop files or browse securely.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#FF3300] px-4 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:scale-[1.01]"
              >
                <HardDriveDownload className="h-4 w-4" />
                Browse Files
              </button>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp,.docx"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="rounded-2xl border border-black/5 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.03]"
              >
                <div className="mb-2 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-black/75 dark:text-white/80">{upload.name}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-black/30 dark:text-white/25">
                      {fileTypeLabel(upload.type)}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35 dark:text-white/35">
                    {upload.progress}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#FF3300] transition-all duration-150"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              </div>
            ))}

            {!hasUploads && (
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black/25 dark:text-white/20">
                <ShieldCheck className="h-4 w-4 text-[#FF3300]" />
                Zero-knowledge upload handling
              </div>
            )}
          </div>
        </div>

        <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
          {sortedDocuments.map((doc) => {
            const thumb = thumbnailForType(doc.type);
            const ThumbIcon = thumb.icon;

            return (
              <div
                key={doc.id}
                className="group mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.03]"
              >
                <div className={`relative flex min-h-[180px] items-center justify-center ${thumb.bg}`}>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/[0.12] opacity-0 transition-opacity group-hover:opacity-100 dark:to-black/30" />
                  <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/85 shadow-sm backdrop-blur dark:bg-black/40">
                      <ThumbIcon className={`h-8 w-8 ${thumb.accent}`} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/35 dark:text-white/35">
                        {fileTypeLabel(doc.type)}
                      </p>
                      <p className="mt-1 text-[11px] font-mono text-black/50 dark:text-white/45">
                        {doc.thumbnailSeed}
                      </p>
                    </div>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 backdrop-blur-[1px] transition-all duration-200 group-hover:bg-black/35 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white/20"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConversionDoc(doc);
                        setTargetFormat(doc.type);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#FF3300] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:brightness-110"
                    >
                      <ArrowDownToLine className="h-4 w-4" />
                      Download
                    </button>
                  </div>
                </div>

                <div className="space-y-2 px-4 py-4">
                  <div>
                    <h3 className="truncate text-sm font-bold text-black dark:text-white">{doc.name}</h3>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-black/30 dark:text-white/25">
                      {formatBytes(doc.size)} · {formatDate(doc.updatedAt)}
                    </p>
                    <p className="mt-2 inline-flex items-center rounded-full bg-black/[0.04] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-black/45 dark:bg-white/[0.06] dark:text-white/40">
                      {doc.folder}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-black/5 pt-3 dark:border-white/10">
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-black/35 dark:text-white/30">
                      <Lock className="h-3.5 w-3.5 text-[#FF3300]" />
                      Encrypted
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.03] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-black/40 dark:bg-white/5 dark:text-white/35">
                      {doc.source}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {previewDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
            onClick={() => setPreviewDoc(null)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 16 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className="w-full max-w-xl rounded-3xl border border-white/10 bg-white p-6 shadow-2xl dark:bg-[#0d0d0d]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/35 dark:text-white/30">
                    Preview
                  </p>
                  <h3 className="mt-1 text-xl font-bold">{previewDoc.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-full p-2 text-black/40 transition hover:bg-black/5 hover:text-black dark:text-white/35 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="rounded-3xl border border-black/5 bg-black/[0.02] p-6 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm dark:bg-white/5">
                    {(() => {
                      const Thumb = thumbnailForType(previewDoc.type).icon;
                      return <Thumb className={`h-10 w-10 ${thumbnailForType(previewDoc.type).accent}`} />;
                    })()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#FF3300]">{fileTypeLabel(previewDoc.type)}</p>
                    <p className="truncate text-xs text-black/45 dark:text-white/40">{previewDoc.name}</p>
                    <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-black/30 dark:text-white/25">
                      {formatBytes(previewDoc.size)} · {formatDate(previewDoc.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-xl border border-black/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-black/50 transition hover:border-[#FF3300]/20 hover:text-[#FF3300] dark:border-white/10 dark:text-white/45"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {conversionDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-md"
            onClick={() => !converting && setConversionDoc(null)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 16 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white p-6 shadow-2xl dark:bg-[#0d0d0d]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/35 dark:text-white/30">
                    Conversion Modal
                  </p>
                  <h3 className="mt-1 text-2xl font-bold tracking-tight">Decrypt & Download</h3>
                  <p className="mt-2 text-sm text-black/45 dark:text-white/40">
                    Choose the target format before decrypting and downloading the secure file.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !converting && setConversionDoc(null)}
                  className="rounded-full p-2 text-black/40 transition hover:bg-black/5 hover:text-black dark:text-white/35 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-black/5 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/30 dark:text-white/30">
                    Original Format
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-white/5">
                      <FileImage className="h-6 w-6 text-[#FF3300]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{fileTypeLabel(conversionDoc.type)}</p>
                      <p className="text-xs text-black/40 dark:text-white/35">{conversionDoc.name}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/5 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/30 dark:text-white/30">
                    Target Format
                  </p>
                  <div className="relative mt-2">
                    <select
                      value={targetFormat}
                      onChange={(e) => setTargetFormat(e.target.value as DocumentFormat)}
                      className="w-full appearance-none rounded-xl border border-black/5 bg-white px-4 py-3 pr-10 text-sm outline-none transition focus:border-[#FF3300]/30 dark:border-white/10 dark:bg-[#111]"
                    >
                      {getAllowedTargets(conversionDoc.type).map((format) => (
                        <option key={format} value={format}>
                          {format.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/25 dark:text-white/30" />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-black/5 bg-black/[0.02] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black/35 dark:text-white/35">
                  <ShieldCheck className="h-4 w-4 text-[#FF3300]" />
                  Conversion happens in a secure Edge Function stub
                </div>
                <p className="text-[10px] font-mono text-black/35 dark:text-white/35">
                  {busyDocId === conversionDoc.id ? "Preparing file..." : "Ready"}
                </p>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => !converting && setConversionDoc(null)}
                  className="rounded-xl border border-black/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-black/50 transition hover:border-black/15 hover:text-black dark:border-white/10 dark:text-white/40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void runConversion()}
                  disabled={converting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF3300] px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {converting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
                  Decrypt & Download
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
