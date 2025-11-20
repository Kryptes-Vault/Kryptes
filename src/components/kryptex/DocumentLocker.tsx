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
  Search,
  ArrowUpDown,
  Filter,
  MoreVertical,
  Grid,
  List,
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
    size: 2_411_724, // 2.3 MB approx
    type: "pdf",
    folder: "Government",
    updatedAt: "2026-04-08T12:00:00Z",
    thumbnailSeed: "P",
    source: "cache",
  },
  {
    id: "doc-2",
    name: "Bank_Statement_Q1.docx",
    size: 614_195, // 599.8 KB approx
    type: "docx",
    folder: "Education",
    updatedAt: "2026-04-07T12:00:00Z",
    thumbnailSeed: "B",
    source: "cache",
  },
  {
    id: "doc-3",
    name: "Tax_Receipt_2025.png",
    size: 892_006, // 871.1 KB approx
    type: "png",
    folder: "Certificates",
    updatedAt: "2026-04-06T12:00:00Z",
    thumbnailSeed: "T",
    source: "cache",
  },
  {
    id: "doc-4",
    name: "KYC_Selfie.webp",
    size: 1_020_416, // 996.5 KB approx
    type: "webp",
    folder: "Government",
    updatedAt: "2026-04-05T12:00:00Z",
    thumbnailSeed: "K",
    source: "cache",
  },
  {
    id: "doc-5",
    name: "Insurance_Certificate.pdf",
    size: 3_145_728, // 3.0 MB approx
    type: "pdf",
    folder: "Vehicle",
    updatedAt: "2026-04-04T12:00:00Z",
    thumbnailSeed: "I",
    source: "cache",
  },
];

const FRESH_DOCUMENTS: LockerDocument[] = [
  ...CACHED_DOCUMENTS.filter(doc => !["doc-6", "doc-7"].includes(doc.id)),
  {
    id: "doc-6",
    name: "Employment_Contract.pdf",
    size: 4_823_449, // 4.6 MB approx
    type: "pdf",
    folder: "Education",
    updatedAt: "2026-04-09T08:11:00Z",
    thumbnailSeed: "E",
    source: "fresh",
  },
  {
    id: "doc-7",
    name: "Travel_ID.webp",
    size: 1_258_291, // 1.2 MB approx
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
  const [activeFolder, setActiveFolder] = useState<string>(DEFAULT_FOLDERS[0]);
  const [folderName, setFolderName] = useState("");
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [previewDoc, setPreviewDoc] = useState<LockerDocument | null>(null);
  const [conversionDoc, setConversionDoc] = useState<LockerDocument | null>(null);
  const [targetFormat, setTargetFormat] = useState<DocumentFormat>("pdf");
  const [converting, setConverting] = useState(false);
  const [busyDocId, setBusyDocId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewLayout, setViewLayout] = useState<"grid" | "list">("grid");
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

  const hasUploads = uploads.length > 0;

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

  function startSimulatedUpload(file: File) {
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

        const uploadedDoc: LockerDocument = {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: extension,
          folder: activeFolder,
          updatedAt: new Date().toISOString(),
          thumbnailSeed: file.name.slice(0, 1).toUpperCase() || "D",
          source: "upload",
        };

        syncDocument(uploadedDoc);
        setUploads((prev) => prev.filter((item) => item.id !== tempId));
        return;
      }

      setUploads((prev) => prev.map((item) => (item.id === tempId ? { ...item, progress: Math.round(progress) } : item)));
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

  return (
    <>
    <div className="bg-white text-black min-h-full">
      <div className="w-full flex flex-col md:flex-row">
        {/* Left Sidebar for Folders - Matches Main Sidebar Geometry */}
        <aside className="w-full md:w-64 flex flex-col pt-8 px-6 bg-[#f7f7f7] rounded-tr-[2.5rem] min-h-screen">
          <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-black/30 mb-4">Vault Categories</p>
          <nav className="flex flex-col gap-1">
            {folderOptions.map((folder) => (
              <button
                key={folder}
                type="button"
                onClick={() => setActiveFolder(folder)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  activeFolder === folder 
                    ? "bg-white text-[#0066FF] shadow-sm font-bold" 
                    : "text-black/40 hover:bg-black/5 hover:text-black"
                }`}
              >
                <FolderOpen className="h-4 w-4 shrink-0" />
                <span className="text-[13px] font-medium">{folder}</span>
              </button>
            ))}
          </nav>
          
          <div className="mt-8 px-4">
            <div className="flex flex-col gap-2">
              <input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="New folder..."
                className="h-9 w-full rounded-xl border border-black/5 bg-white px-3 text-[11px] outline-none"
              />
              <button onClick={createFolder} className="text-[10px] font-bold uppercase tracking-widest text-[#0066FF] hover:underline text-left px-1">
                + Add Folder
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 py-8 px-4">
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
                  className={`flex h-12 w-12 items-center justify-center transition-colors ${viewLayout === "list" ? "bg-[#0066FF]/5 text-[#0066FF]" : "text-black/30 hover:bg-black/[0.02]"}`}
                >
                  <List className="h-4 w-4" />
                </button>
                <div className="w-[1px] h-6 bg-black/5" />
                <button 
                  onClick={() => setViewLayout("grid")}
                  className={`flex h-12 w-12 items-center justify-center transition-colors ${viewLayout === "grid" ? "bg-[#0066FF]/5 text-[#0066FF]" : "text-black/30 hover:bg-black/[0.02]"}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
              </div>

              <button 
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-2 h-12 px-6 bg-[#0066FF] text-white rounded-xl text-[13px] font-bold shadow-lg shadow-[#0066FF]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <CloudUpload className="h-4 w-4" /> Upload button
              </button>
              <input ref={inputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.docx" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            </div>
          </div>

          {/* Grid View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedDocuments.map((doc) => {
            const thumb = thumbnailForType(doc.type);
            const ThumbIcon = thumb.icon;
            const isBlue = doc.type === "docx";
            const isRed = doc.type === "pdf";
            const isGreen = doc.type === "png" || doc.type === "jpeg" || doc.type === "webp" || doc.folder === "Certificates";
            
            let colorClass = "text-gray-500";
            if (isBlue) colorClass = "text-[#0066FF]";
            if (isRed) colorClass = "text-[#FF3300]";
            if (isGreen) colorClass = "text-[#10B981]";

            return (
              <div 
                key={doc.id} 
                className="group relative bg-white border border-black/5 rounded-3xl p-6 transition-all hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1"
              >
                <button className="absolute top-4 right-4 p-2 text-black/20 hover:text-black/40 transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </button>

                <div className="flex flex-col items-center text-center">
                  <div className={`mb-6 h-16 w-16 flex items-center justify-center rounded-2xl ${colorClass.replace("text-", "bg-")}/5`}>
                    <ThumbIcon className={`h-10 w-10 ${colorClass}`} />
                  </div>
                  
                  <div className="space-y-1 mb-6">
                    <p className="text-[14px] font-bold text-[#111] truncate max-w-[150px]">
                      {doc.name}
                    </p>
                    <p className="text-[12px] font-medium text-black/40">
                      {formatDate(doc.updatedAt)}
                    </p>
                  </div>

                  <div className="flex w-full items-center justify-between border-t border-black/5 pt-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black/30">
                      {fileTypeLabel(doc.type)}
                    </span>
                    <button 
                      onClick={() => setPreviewDoc(doc)}
                      className="text-[10px] font-bold uppercase tracking-widest text-[#0066FF] hover:underline"
                    >
                      Preview
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state or upload progress */}
        {uploads.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploads.map((upload) => (
              <div key={upload.id} className="bg-white border border-black/5 rounded-2xl p-4 flex items-center gap-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#0066FF]/5 text-[#0066FF]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-black truncate">{upload.name}</p>
                  <div className="mt-1.5 h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0066FF] transition-all duration-300" style={{ width: `${upload.progress}%` }} />
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
                    <p className="text-sm font-medium text-black/40">{formatBytes(previewDoc.size)} · {formatDate(previewDoc.updatedAt)}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setPreviewDoc(null)} className="h-10 w-10 flex items-center justify-center rounded-full bg-black/5 text-black/40 transition hover:bg-black/10 hover:text-black">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    setConversionDoc(previewDoc);
                    runConversion();
                  }}
                  className="w-full h-14 bg-black text-white rounded-2xl font-bold uppercase tracking-widest text-[12px] shadow-lg shadow-black/10 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3"
                >
                  <ArrowDownToLine className="h-5 w-5" /> Download Securely
                </button>
                <div className="flex items-center justify-center gap-4 text-[11px] font-bold uppercase tracking-widest text-black/30 mt-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" /> AES-256 Encrypted
                  <Lock className="h-4 w-4 text-[#0066FF]" /> Zero-Knowledge
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
