import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  Archive,
  ArrowDownToLine,
  ChevronDown,
  CloudUpload,
  FileImage,
  FileText,
  FileType2,
  Image,
  Loader2,
  Lock,
  ShieldCheck,
  FolderPlus,
  FolderOpen,
  X,
  Search,
  Grid,
  List,
} from "lucide-react";
import { buildJustifiedRows, clampAspect, type AspectItem } from "./documentLocker/justifiedLayout";
import { DocumentMediaCard } from "./documentLocker/DocumentMediaCard";
import { DocumentFixedCard } from "./documentLocker/DocumentFixedCard";

export type DocumentFormat = "pdf" | "png" | "jpeg" | "webp" | "docx";

export type LockerDocument = {
  id: string;
  name: string;
  size: number;
  type: DocumentFormat;
  folder: string;
  updatedAt: string;
  thumbnailSeed: string;
  source: "drive" | "upload";
  previewUrl?: string;
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

const DEFAULT_FOLDERS = ["Education", "Government", "Vehicle", "Certificates"];
const API_BASE = (import.meta.env.VITE_BACKEND_URL || "http://localhost:4000").replace(/\/$/, "");

function networkFetchToastMessage(e: unknown): string {
  if (e instanceof TypeError && /failed to fetch|load failed|networkerror/i.test(String(e.message))) {
    return `Cannot reach the API at ${API_BASE}. Start the backend (port 4000 by default) or set VITE_BACKEND_URL.`;
  }
  if (e instanceof Error) return e.message;
  return "Request failed.";
}

/** Gallery row height (Tailwind h-56 = 14rem) — keeps rows even. */
const GALLERY_ROW_HEIGHT = 224;
const GALLERY_GAP_PX = 16;

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
      return ["docx"];
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

export default function DocumentLocker({ activeFormat = "all" }: DocumentLockerProps) {
  const [documents, setDocuments] = useState<LockerDocument[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>(DEFAULT_FOLDERS[0]);
  const [folderName, setFolderName] = useState("");
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [previewDoc, setPreviewDoc] = useState<LockerDocument | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [conversionDoc, setConversionDoc] = useState<LockerDocument | null>(null);
  const [targetFormat, setTargetFormat] = useState<DocumentFormat>("pdf");
  const [converting, setConverting] = useState(false);
  const [busyDocId, setBusyDocId] = useState<string | null>(null);
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewLayout, setViewLayout] = useState<"grid" | "list">("grid");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [aspectById, setAspectById] = useState<Record<string, number>>({});
  const [thumbById, setThumbById] = useState<Record<string, string>>({});
  const [thumbLoadingId, setThumbLoadingId] = useState<string | null>(null);
  const [hoveredGalleryId, setHoveredGalleryId] = useState<string | null>(null);

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

  const aspectItems: AspectItem[] = useMemo(
    () =>
      imageDocuments.map((d) => ({
        id: d.id,
        aspect: aspectById[d.id] ?? 1,
      })),
    [imageDocuments, aspectById]
  );

  const justifiedRows = useMemo(
    () =>
      viewLayout === "grid" && imageDocuments.length > 0
        ? buildJustifiedRows(aspectItems, Math.max(320, containerWidth), GALLERY_ROW_HEIGHT, GALLERY_GAP_PX)
        : [],
    [aspectItems, containerWidth, imageDocuments.length, viewLayout]
  );

  const otherFolders = useMemo(() => folderOptions.filter((f) => f !== activeFolder), [folderOptions, activeFolder]);

  const docById = useMemo(() => {
    const m = new Map<string, LockerDocument>();
    sortedDocuments.forEach((d) => m.set(d.id, d));
    return m;
  }, [sortedDocuments]);

  const hasUploads = uploads.length > 0;

  useLayoutEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setContainerWidth(w);
    });
    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, [viewLayout, sortedDocuments.length]);

  const thumbFetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const doc of imageDocuments) {
      if (doc.previewUrl) continue;
      if (thumbFetchedRef.current.has(doc.id)) continue;
      thumbFetchedRef.current.add(doc.id);
      const docId = doc.id;
      setThumbLoadingId(docId);
      const fmt = doc.type === "jpeg" ? "jpeg" : doc.type === "webp" ? "webp" : "png";
      void (async () => {
        try {
          const response = await fetch(
            `${API_BASE}/api/documents/download?id=${encodeURIComponent(docId)}&targetFormat=${fmt}`,
            { credentials: "include" }
          );
          if (!response.ok) return;
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setThumbById((prev) => (prev[docId] ? prev : { ...prev, [docId]: url }));
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

  const downloadDocument = useCallback(async (doc: LockerDocument) => {
    const targetFormat = doc.type;
    const url = `${API_BASE}/api/documents/download?id=${encodeURIComponent(doc.id)}&targetFormat=${encodeURIComponent(targetFormat)}`;
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) return;
    const blob = await response.blob();
    const dl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = dl;
    a.download = doc.name;
    a.click();
    URL.revokeObjectURL(dl);
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
      setPreviewLoading(true);
      try {
        const response = await fetch(
          `${API_BASE}/api/documents/download?id=${encodeURIComponent(previewDoc.id)}&targetFormat=${encodeURIComponent(previewDoc.type)}`,
          { credentials: "include" }
        );
        if (!response.ok) throw new Error("Preview fetch failed");
        const blob = await response.blob();
        if (cancelled) return;
        if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl(URL.createObjectURL(blob));
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

  useEffect(() => {
    const loadDocuments = async () => {
      setSyncing(true);
      try {
        const response = await fetch(`${API_BASE}/api/documents`, { credentials: "include" });
        let data: { documents?: unknown; error?: string };
        try {
          data = (await response.json()) as { documents?: unknown; error?: string };
        } catch {
          if (!response.ok) toast.error(`Could not load documents (${response.status}).`);
          return;
        }
        if (!response.ok) {
          toast.error(typeof data.error === "string" ? data.error : `Could not load documents (${response.status}).`);
          return;
        }
        const raw = Array.isArray(data?.documents) ? data.documents : [];
        setDocuments(
          raw.map((row) => {
            const doc = row as Record<string, unknown>;
            return {
              id: String(doc.id ?? ""),
              name: String(doc.name ?? ""),
              size: Number(doc.size ?? 0),
              type: doc.type as DocumentFormat,
              folder: String(doc.folder ?? ""),
              updatedAt: String(doc.updatedAt ?? ""),
              thumbnailSeed: String(doc.name || "").slice(0, 1).toUpperCase() || "D",
              source: "drive" as const,
              previewUrl: typeof doc.previewUrl === "string" ? doc.previewUrl : undefined,
            };
          })
        );
      } catch (e) {
        toast.error(networkFetchToastMessage(e));
      } finally {
        setSyncing(false);
      }
    };
    void loadDocuments();
  }, []);

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
    setDocuments((prev) => [document, ...prev.filter((doc) => doc.id !== document.id)]);
  }

  async function startSimulatedUpload(file: File) {
    const extension = normalizedExtension(file.name);
    if (!extension) return;

    const tempId = `upload-${crypto.randomUUID()}`;
    setUploads((prev) => [...prev, { id: tempId, name: file.name, progress: 0, type: extension }]);

    let progress = 0;
    const interval = window.setInterval(() => {
      progress += Math.random() * 22;
      if (progress >= 100) {
        progress = 100;
        window.clearInterval(interval);
      }

      setUploads((prev) => prev.map((item) => (item.id === tempId ? { ...item, progress: Math.round(progress) } : item)));
    }, 160);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", activeFolder);
      const response = await fetch(`${API_BASE}/api/documents/upload`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      let data: { document?: unknown; error?: string };
      try {
        data = (await response.json()) as { document?: unknown; error?: string };
      } catch {
        toast.error(`Upload failed (${response.status}).`);
        return;
      }
      if (!response.ok || !data?.document) {
        toast.error(typeof data?.error === "string" ? data.error : `Upload failed (${response.status}).`);
        return;
      }
      const uploadedDoc: LockerDocument = {
        id: data.document.id,
        name: data.document.name,
        size: data.document.size,
        type: data.document.type,
        folder: data.document.folder,
        updatedAt: data.document.updatedAt,
        thumbnailSeed: data.document.name.slice(0, 1).toUpperCase() || "D",
        source: "upload",
        previewUrl: data.document.previewUrl,
      };
      syncDocument(uploadedDoc);
    } catch (e) {
      toast.error(networkFetchToastMessage(e));
    } finally {
      window.clearInterval(interval);
      setUploads((prev) => prev.filter((item) => item.id !== tempId));
    }
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

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!dragActive) setDragActive(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
  }

  async function runConversion() {
    if (!conversionDoc) return;
    setConverting(true);
    setBusyDocId(conversionDoc.id);
    try {
      const url = `${API_BASE}/api/documents/download?id=${encodeURIComponent(conversionDoc.id)}&targetFormat=${encodeURIComponent(targetFormat)}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${conversionDoc.name.replace(/\.[^.]+$/, "")}.${targetFormat}`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
      setConversionDoc(null);
    } finally {
      setConverting(false);
      setBusyDocId(null);
    }
  }

  async function deleteDocument(doc: LockerDocument) {
    setDeletePendingId(doc.id);
    try {
      const response = await fetch(`${API_BASE}/api/documents?id=${encodeURIComponent(doc.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Delete failed");
      setDocuments((prev) => prev.filter((item) => item.id !== doc.id));
      if (previewDoc?.id === doc.id) setPreviewDoc(null);
      if (conversionDoc?.id === doc.id) setConversionDoc(null);
    } finally {
      setDeletePendingId(null);
    }
  }

  return (
    <>
    <div className="bg-white text-black min-h-full">
      <div className="w-full flex flex-col md:flex-row">
        {/* Left Sidebar for Folders - Matches Main Sidebar Geometry */}
        <aside
          className={`w-full md:w-64 flex flex-col pt-8 px-6 rounded-tr-[2.5rem] min-h-screen transition-colors ${
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
          className={`flex-1 py-8 px-4 rounded-3xl transition-colors ${dragActive ? "bg-[#FF3B13]/5" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Header Controls */}
          <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black/20" />
                <input
                  type="text"
                  placeholder="Search here"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 w-full pl-12 pr-4 rounded-xl border border-black/5 bg-[#f7f7f7] text-[13px] outline-none shadow-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center border border-black/5 rounded-xl bg-white overflow-hidden shadow-sm h-12">
                <button 
                  onClick={() => setViewLayout("list")}
                  className={`flex h-12 w-12 items-center justify-center transition-colors ${viewLayout === "list" ? "bg-[#FF3B13]/5 text-[#FF3B13]" : "text-black/30 hover:bg-black/[0.02]"}`}
                >
                  <List className="h-4 w-4" />
                </button>
                <div className="w-[1px] h-6 bg-black/5" />
                <button 
                  onClick={() => setViewLayout("grid")}
                  className={`flex h-12 w-12 items-center justify-center transition-colors ${viewLayout === "grid" ? "bg-[#FF3B13]/5 text-[#FF3B13]" : "text-black/30 hover:bg-black/[0.02]"}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
              </div>

              <button 
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-2 h-12 px-6 bg-[#FF3B13] text-white rounded-xl text-[13px] font-bold shadow-lg shadow-[#FF3B13]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <CloudUpload className="h-4 w-4" /> Upload button
              </button>
              <input ref={inputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.docx" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            </div>
          </div>

          {/* Gallery (justified flex) or list */}
          {syncing ? (
            <div className="mx-auto flex min-h-[220px] w-full max-w-3xl items-center justify-center rounded-3xl border border-black/5 bg-[#f7f7f7]">
              <p className="text-xs font-bold uppercase tracking-widest text-black/40">Syncing documents from MEGA...</p>
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
                          onClick={() => void downloadDocument(doc)}
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
              <LayoutGroup>
                <div ref={galleryRef} className="space-y-8">
                  {otherFolders.length > 0 ? (
                    <section>
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">Folders</p>
                      <div className="flex flex-wrap gap-4">
                        {otherFolders.map((folder) => (
                          <button
                            key={folder}
                            type="button"
                            onClick={() => setActiveFolder(folder)}
                            className="flex h-56 w-48 shrink-0 flex-col items-center justify-center rounded-2xl border border-black/5 bg-[#fafafa] px-3 text-center shadow-sm transition hover:border-[#FF3B13]/35 hover:bg-white hover:shadow-md"
                          >
                            <FolderOpen className="h-10 w-10 text-[#FF3B13]/80" />
                            <span className="mt-3 line-clamp-2 text-[13px] font-semibold text-black/85">{folder}</span>
                            <span className="mt-1 text-[9px] font-bold uppercase tracking-widest text-black/30">Open</span>
                          </button>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {fileDocuments.length > 0 ? (
                    <section>
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">Documents</p>
                      <div className="flex flex-wrap gap-4">
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
                              onDownload={() => void downloadDocument(doc)}
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

                  {imageDocuments.length > 0 ? (
                    <section>
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">Media</p>
                      <div className="flex flex-col gap-4">
                        {justifiedRows.map((row, rowIdx) => (
                          <div
                            key={`row-${rowIdx}`}
                            className={`flex w-full flex-wrap gap-4 ${row.isLast ? "justify-start" : "justify-start"}`}
                            style={{ gap: GALLERY_GAP_PX }}
                          >
                            {row.items.map((item) => {
                              const doc = docById.get(item.id);
                              if (!doc) return null;
                              const src = doc.previewUrl || thumbById[doc.id];
                              return (
                                <DocumentMediaCard
                                  key={doc.id}
                                  doc={{ id: doc.id, name: doc.name, sizeLabel: formatBytes(doc.size) }}
                                  width={item.width}
                                  height={item.height}
                                  thumbUrl={src}
                                  isThumbLoading={thumbLoadingId === doc.id && !src}
                                  onImageLoad={(e) => {
                                    const el = e.currentTarget;
                                    if (el.naturalWidth > 0 && el.naturalHeight > 0) {
                                      const ar = el.naturalWidth / el.naturalHeight;
                                      setAspectById((m) => ({ ...m, [doc.id]: clampAspect(ar) }));
                                    }
                                  }}
                                  onDelete={() => void deleteDocument(doc)}
                                  onDownload={() => void downloadDocument(doc)}
                                  onPreview={() => setPreviewDoc(doc)}
                                  deletePending={deletePendingId === doc.id}
                                  hoveredId={hoveredGalleryId}
                                  onHoverChange={setHoveredGalleryId}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>
              </LayoutGroup>
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
            <motion.div initial={{ scale: 0.96, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 16 }} transition={{ type: "spring", stiffness: 220, damping: 22 }} className="w-full max-w-xl rounded-[2.5rem] border border-black/5 bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 flex items-center justify-center rounded-xl ${thumbnailForType(previewDoc.type).bg}`}>
                    {(() => {
                      const Thumb = thumbnailForType(previewDoc.type).icon;
                      return <Thumb className={`h-6 w-6 ${thumbnailForType(previewDoc.type).accent}`} />;
                    })()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#111]">{previewDoc.name}</h3>
                    <p className="text-sm font-medium text-black/40">{formatBytes(previewDoc.size)} ┬╖ {formatDate(previewDoc.updatedAt)}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setPreviewDoc(null)} className="h-10 w-10 flex items-center justify-center rounded-full bg-black/5 text-black/40 transition hover:bg-black/10 hover:text-black">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {previewLoading ? (
                <div className="mb-6 flex h-[360px] items-center justify-center rounded-2xl border border-black/5 bg-black/[0.02]">
                  <Loader2 className="h-6 w-6 animate-spin text-black/40" />
                </div>
              ) : previewBlobUrl && (previewDoc.type === "pdf" || previewDoc.type === "png" || previewDoc.type === "jpeg" || previewDoc.type === "webp") ? (
                <div className="mb-6 overflow-hidden rounded-2xl border border-black/5 bg-black/[0.02]">
                  {previewDoc.type === "pdf" ? (
                    <iframe src={previewBlobUrl} title={previewDoc.name} className="h-[360px] w-full" />
                  ) : (
                    <img src={previewBlobUrl} alt={previewDoc.name} className="h-[360px] w-full object-contain bg-white" />
                  )}
                </div>
              ) : (
                <div className="mb-6 rounded-2xl border border-black/5 bg-black/[0.02] p-6 text-center text-xs text-black/50">
                  Direct preview is not available for this file type.
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    setConversionDoc(previewDoc);
                  }}
                  className="w-full h-14 bg-black text-white rounded-2xl font-bold uppercase tracking-widest text-[12px] shadow-lg shadow-black/10 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3"
                >
                  <ArrowDownToLine className="h-5 w-5" /> Choose Download Format
                </button>
                <button
                  onClick={() => void deleteDocument(previewDoc)}
                  disabled={deletePendingId === previewDoc.id}
                  className="w-full h-12 rounded-2xl border border-[#FF3300]/20 text-[#FF3300] text-[11px] font-bold uppercase tracking-widest"
                >
                  {deletePendingId === previewDoc.id ? "Deleting..." : "Delete Document"}
                </button>
                <div className="flex items-center justify-center gap-4 text-[11px] font-bold uppercase tracking-widest text-black/30 mt-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" /> AES-256 Encrypted
                  <Lock className="h-4 w-4 text-[#FF3B13]" /> Zero-Knowledge
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {conversionDoc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-md" onClick={() => !converting && setConversionDoc(null)}>
            <motion.div initial={{ scale: 0.96, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 16 }} transition={{ type: "spring", stiffness: 220, damping: 22 }} className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/35">Conversion Modal</p>
                  <h3 className="mt-1 text-2xl font-bold tracking-tight">Decrypt & Download</h3>
                </div>
                <button type="button" onClick={() => !converting && setConversionDoc(null)} className="rounded-full p-2 text-black/40 transition hover:bg-black/5 hover:text-black">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-black/5 bg-black/[0.02] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/30">Original Format</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white">
                      <FileImage className="h-6 w-6 text-[#FF3300]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{fileTypeLabel(conversionDoc.type)}</p>
                      <p className="text-xs text-black/40">{conversionDoc.name}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-black/5 bg-black/[0.02] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/30">Target Format</p>
                  <div className="relative mt-2">
                    <select value={targetFormat} onChange={(e) => setTargetFormat(e.target.value as DocumentFormat)} className="w-full appearance-none rounded-xl border border-black/5 bg-white px-4 py-3 pr-10 text-sm outline-none transition focus:border-[#FF3300]/30">
                      {getAllowedTargets(conversionDoc.type).map((format) => (
                        <option key={format} value={format}>{format.toUpperCase()}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/25" />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => !converting && setConversionDoc(null)} className="rounded-xl border border-black/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-black/50">Cancel</button>
                <button type="button" onClick={() => void runConversion()} disabled={converting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF3300] px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white">
                  {converting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />} Decrypt & Download
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
