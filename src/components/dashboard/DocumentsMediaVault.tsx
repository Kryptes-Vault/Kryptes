import React, { useState } from "react";
import { 
  Folder, 
  File, 
  FileText, 
  Image as ImageIcon, 
  ChevronRight, 
  Loader2, 
  FolderOpen, 
  Plus, 
  Upload, 
  MoreVertical,
  Search,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
interface VaultItem {
  id: string;
  name: string;
  type: "folder" | "image" | "pdf" | "doc";
  size?: string;
  thumbnail?: string;
  parentId: string | null;
}

interface Breadcrumb {
  id: string | null;
  name: string;
}

// --- Mock Data ---
const MOCK_DATA: VaultItem[] = [
  { id: "f1", name: "Financial Documents", type: "folder", parentId: null },
  { id: "f2", name: "Personal Assets", type: "folder", parentId: null },
  { id: "f3", name: "Work Projects", type: "folder", parentId: null },
  { id: "f1-1", name: "2026 Tax Returns", type: "folder", parentId: "f1" },
  { id: "img1", name: "Identification_Front.jpg", type: "image", size: "1.2 MB", thumbnail: "https://images.unsplash.com/photo-1557683311-eac922347aa1?q=80&w=400&auto=format&fit=crop", parentId: "f2" },
  { id: "doc1", name: "Rental_Agreement_Final.pdf", type: "pdf", size: "450 KB", parentId: "f2" },
  { id: "img2", name: "Workspace_Config.png", type: "image", size: "3.4 MB", thumbnail: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=400&auto=format&fit=crop", parentId: "f3" },
  { id: "pdf2", name: "Q1_Tax_Liability.pdf", type: "pdf", size: "2.1 MB", parentId: "f1-1" },
  { id: "img3", name: "Signature_Specimen.png", type: "image", size: "800 KB", thumbnail: "https://images.unsplash.com/photo-1614850523296-6ca7d3d2c974?q=80&w=400&auto=format&fit=crop", parentId: "f1-1" },
];

const DocumentsMediaVault: React.FC = () => {
  // --- States ---
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ id: null, name: "Root" }]);

  // --- Derived Data ---
  const currentItems = MOCK_DATA.filter(item => item.parentId === currentFolderId);
  const folders = currentItems.filter(item => item.type === "folder");
  const files = currentItems.filter(item => item.type !== "folder");

  // --- Actions ---
  const handleDownloadClick = (file: VaultItem) => {
    // In a real implementation, this would trigger the conversion modal
    console.log(`Opening format conversion modal for: ${file.name}`);
    alert(`Format Conversion Modal\nSecurely converting: ${file.name}\n\nSelect Format:\n- Original\n- PNG\n- PDF\n- WEBP`);
  };

  const navigateToFolder = (folderId: string | null, folderName: string) => {
    setIsLoading(true);
    
    // Simulate Decryption/Loading Delay
    setTimeout(() => {
      setCurrentFolderId(folderId);
      
      if (folderId === null) {
        setBreadcrumbs([{ id: null, name: "Root" }]);
      } else {
        const index = breadcrumbs.findIndex(b => b.id === folderId);
        if (index !== -1) {
          setBreadcrumbs(breadcrumbs.slice(0, index + 1));
        } else {
          setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
        }
      }
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 font-sans selection:bg-[#FF3300]/30">
      {/* --- Header & Global Actions --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Documents <span className="text-[#FF3300]">/</span> Media
          </h1>
          <p className="text-gray-500 text-xs font-mono uppercase tracking-[0.2em]">End-to-End Encrypted Node: V1-PRIMARY</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#FF3300] transition-colors" />
            <input 
              type="text" 
              placeholder="Search encrypted index..." 
              className="bg-[#111] border border-[#222] rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#FF3300] w-64 transition-all placeholder:text-gray-700"
            />
          </div>
          <button className="flex items-center gap-2 bg-[#FF3300] hover:bg-[#E62E00] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(255,51,0,0.15)] active:scale-95">
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>
      </div>

      {/* --- Breadcrumbs Navigation --- */}
      <nav className="flex items-center gap-2 mb-6 text-xs overflow-x-auto whitespace-nowrap pb-2 scrollbar-none">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.id || "root"}>
            <button
              onClick={() => navigateToFolder(crumb.id, crumb.name)}
              className={`hover:text-[#FF3300] transition-colors uppercase tracking-widest font-mono ${
                idx === breadcrumbs.length - 1 ? "text-[#FF3300] font-bold" : "text-gray-600"
              }`}
            >
              {crumb.name}
            </button>
            {idx < breadcrumbs.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-gray-800" />}
          </React.Fragment>
        ))}
      </nav>

      {/* --- Main Vault Container --- */}
      <div className="relative bg-[#111] border border-[#1A1A1A] rounded-[2rem] min-h-[500px] overflow-hidden backdrop-blur-md shadow-2xl">
        
        {/* State 1: Loading (Decrypting Overlay) */}
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0A]/90 backdrop-blur-xl"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 border-[3px] border-t-[#FF3300] border-r-transparent border-b-transparent border-l-transparent rounded-full shadow-[0_0_30px_rgba(255,51,0,0.2)]"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 w-20 h-20 border border-b-[#FF3300]/30 border-t-transparent border-r-transparent border-l-transparent rounded-full"
                />
                <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-[#FF3300] animate-pulse" />
              </div>
              <p className="mt-8 font-mono text-[10px] tracking-[0.3em] text-[#FF3300] uppercase animate-pulse">
                Decrypting Node Data...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* State 2 & 3: Content (Populated or Empty) */}
        <div className={`p-8 transition-all duration-700 ${isLoading ? "opacity-0 scale-95 blur-sm" : "opacity-100 scale-100 blur-0"}`}>
          {currentItems.length === 0 ? (
            /* --- Empty State --- */
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <div className="relative mb-8 group">
                <div className="absolute -inset-4 bg-[#FF3300]/5 rounded-full blur-2xl group-hover:bg-[#FF3300]/10 transition-all duration-500" />
                <FolderOpen className="w-24 h-24 text-gray-900 group-hover:text-gray-800 transition-colors" strokeWidth={1} />
                <motion.div 
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute bottom-1 right-1 w-8 h-8 bg-[#FF3300] rounded-full flex items-center justify-center shadow-2xl shadow-[#FF3300]/40"
                >
                  <Plus className="w-5 h-5 text-white" strokeWidth={3} />
                </motion.div>
              </div>
              <h3 className="text-2xl font-bold mb-3 tracking-tight text-gray-200 uppercase tracking-widest text-sm">Directory Empty</h3>
              <p className="text-gray-600 max-w-sm mb-10 text-sm leading-relaxed">
                Unlock your vault's potential. Securely upload assets or establish a new virtual directory hierarchy.
              </p>
              <button 
                onClick={() => alert("Upload Triggered")}
                className="group relative flex items-center gap-3 bg-[#FF3300] px-8 py-3 rounded-2xl text-[13px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[#FF3300]/20 active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Upload className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Initialize Upload</span>
              </button>
            </div>
          ) : (
            /* --- Populated State (The Grid) --- */
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {/* Folders (Distinct Style) */}
              {folders.map(folder => (
                <motion.div
                  key={folder.id}
                  whileHover={{ y: -6, scale: 1.03 }}
                  onDoubleClick={() => navigateToFolder(folder.id, folder.name)}
                  className="group relative cursor-pointer bg-[#0D0D0D] border border-[#1A1A1A] p-5 rounded-2xl hover:border-[#FF3300]/40 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-[#111] border border-[#1A1A1A] rounded-xl group-hover:border-[#FF3300]/20 group-hover:shadow-[0_0_15px_rgba(255,51,0,0.1)] transition-all">
                      <Folder className="w-7 h-7 text-[#FF3300]" fill="#FF3300" fillOpacity={0.05} />
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-[#1A1A1A] rounded-lg transition-all text-gray-600 hover:text-white">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-bold text-[13px] text-gray-300 truncate group-hover:text-white transition-colors tracking-tight">
                    {folder.name}
                  </h4>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-[2px] w-4 bg-[#FF3300]/40 rounded-full" />
                    <p className="text-[9px] font-mono text-gray-700 uppercase tracking-tighter">DIRECTORY</p>
                  </div>
                </motion.div>
              ))}

              {/* Files (Generic & Image Previews) */}
              {files.map(file => (
                <motion.div
                  key={file.id}
                  whileHover={{ y: -6, scale: 1.03 }}
                  className="group relative flex flex-col bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl overflow-hidden hover:border-[#FF3300]/40 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                >
                  {/* Thumbnail / Icon Container */}
                  <div className="aspect-[4/3] bg-[#0A0A0A] flex items-center justify-center relative overflow-hidden border-b border-[#1A1A1A]">
                    {file.type === "image" ? (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/10 to-transparent animate-pulse" />
                        <img 
                          src={file.thumbnail} 
                          alt={file.name} 
                          loading="lazy"
                          onLoad={(e) => {
                            (e.currentTarget.previousSibling as HTMLElement).style.display = 'none';
                          }}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[10%] group-hover:grayscale-0 relative z-10"
                        />
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-[#111] rounded-2xl border border-[#1A1A1A] group-hover:shadow-[0_0_20px_rgba(255,51,0,0.05)]">
                          {file.type === "pdf" ? (
                            <FileText className="w-10 h-10 text-gray-700 group-hover:text-[#FF3300]/60 transition-colors" strokeWidth={1.5} />
                          ) : (
                            <File className="w-10 h-10 text-gray-700 group-hover:text-[#FF3300]/60 transition-colors" strokeWidth={1.5} />
                          )}
                        </div>
                        <span className="text-[9px] font-mono text-gray-800 uppercase tracking-[0.3em] font-black">{file.type}</span>
                      </div>
                    )}
                    
                    {/* Interaction Overlay */}
                    <div className="absolute inset-0 bg-[#FF3300]/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none" />
                  </div>

                  {/* Metadata Footer */}
                  <div className="p-4 pt-3 space-y-1">
                    <h4 className="font-bold text-[12px] text-gray-400 truncate group-hover:text-white transition-colors tracking-tight">
                      {file.name}
                    </h4>
                    <div className="flex items-center justify-end">
                      <button 
                        onClick={() => handleDownloadClick(file)}
                        className="flex items-center gap-1.5 text-[9px] font-bold text-[#FF3300] bg-[#FF3300]/5 hover:bg-[#FF3300]/10 border border-[#FF3300]/20 px-3 py-1.5 rounded-lg uppercase tracking-widest transition-all"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- Vault Audit Logs (Footer Status) --- */}
      <footer className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-6">
          <div className="space-y-0.5">
            <p className="text-[9px] font-mono text-gray-700 uppercase tracking-widest">Active Storage</p>
            <div className="flex items-center gap-2">
              <div className="w-32 h-1 bg-[#111] rounded-full overflow-hidden border border-[#1A1A1A]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "65%" }}
                  className="h-full bg-[#FF3300] shadow-[0_0_10px_#FF3300]" 
                />
              </div>
              <span className="text-[10px] font-mono text-gray-400">65% CAP</span>
            </div>
          </div>
          <div>
            <p className="text-[9px] font-mono text-gray-700 uppercase tracking-widest">Shard Integrity</p>
            <p className="text-[10px] font-mono text-green-500/80">SYNCHRONIZED</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-[#0D0D0D] border border-[#1A1A1A] px-4 py-2 rounded-xl">
          <div className="w-2 h-2 bg-[#FF3300] rounded-full animate-pulse shadow-[0_0_8px_#FF3300]" />
          <span className="text-[9px] font-mono text-gray-500 tracking-tighter uppercase">Protocol: KRYPT-GCM-256</span>
        </div>
      </footer>

      {/* --- CSS Customization for Scrollbars --- */}
      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default DocumentsMediaVault;
