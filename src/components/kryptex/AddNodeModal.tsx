import React, { useState } from "react";
import { 
  Globe, 
  Code2, 
  Wallet, 
  FileText, 
  Eye, 
  EyeOff, 
  RefreshCcw, 
  Copy, 
  Plus, 
  X, 
  ShieldCheck, 
  Hash,
  ChevronRight,
  Loader2,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { AppAutocomplete } from "./AppAutocomplete";

type Category = "web" | "dev" | "financial" | "note";

interface AddNodeModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

const AddNodeModal = ({ onClose, onSave }: AddNodeModalProps) => {
  const [category, setCategory] = useState<Category>("web");
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    website: "",
    username: "",
    password: "",
    env: "Production",
    secretKey: "",
    secretValue: "",
    walletName: "",
    network: "Ethereum",
    seedPhrase: Array(12).fill(""),
    noteContent: "",
  });

  // Password Generator State
  const [passLength, setPassLength] = useState(16);
  const [showGen, setShowGen] = useState(false);

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
    let generated = "";
    for (let i = 0; i < passLength; i++) {
        generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password: generated });
    toast.success("Secure password generated");
  };

  const handleTagAdd = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate encryption delay
    setTimeout(() => {
        onSave({ ...formData, category, tags });
        setLoading(false);
        onClose();
        toast.success("Node encrypted and saved to vault");
    }, 1200);
  };

  const sidebarItems = [
    { id: "web", label: "Web Credential", icon: Globe },
    { id: "dev", label: "Developer Secret", icon: Code2 },
    { id: "financial", label: "Financial / Crypto", icon: Wallet },
    { id: "note", label: "Secure Note", icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-white/40 backdrop-blur-md font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white border border-black/5 w-full max-w-4xl h-[90vh] max-h-[700px] rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-[0_0_50px_rgba(0,0,0,0.1)] text-[#111]"
      >
        {/* Left Sidebar */}
        <div className="w-full md:w-64 bg-[#fafafa] border-b md:border-b-0 md:border-r border-black/5 flex flex-col">
          <div className="p-6 border-b border-black/5 flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FF3B13] rounded flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-bold tracking-[0.2em] text-black/50 uppercase">New Node</span>
          </div>
          
          <nav className="flex-1 p-3 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id as Category)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  category === item.id 
                    ? "bg-[#FF3B13] text-white shadow-[0_8px_20px_rgba(255,59,19,0.2)]" 
                    : "text-black/30 hover:bg-black/5 hover:text-black/60"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
                {category === item.id && <ChevronRight className="ml-auto w-3 h-3" />}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="p-6 border-b border-black/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ShieldCheck className="w-5 h-5 text-[#FF3B13]" />
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-black">Encryption Chamber</h2>
            </div>
            <button type="button" onClick={onClose} className="text-black/20 hover:text-black transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
              <AnimatePresence mode="wait">
                <motion.div
                  key={category}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 ml-1">Title</label>
                       <input 
                        required
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-[#f8f8f8] border border-black/5 rounded-xl px-4 py-4 text-xs font-bold tracking-widest focus:ring-1 focus:ring-[#FF3B13]/30 outline-none transition-all"
                        placeholder="e.g. Personal Gmail"
                       />
                    </div>
                    {/* Tags */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 ml-1">Tags (Enter to add)</label>
                       <div className="flex flex-wrap items-center gap-2 p-1.5 min-h-[50px] bg-[#f8f8f8] border border-black/5 rounded-xl focus-within:ring-1 focus-within:ring-[#FF3B13]/30 transition-all">
                          {tags.map((tag, idx) => (
                            <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-black/5 text-[10px] font-bold uppercase tracking-widest rounded-lg">
                              {tag}
                              <button type="button" onClick={() => removeTag(idx)} className="text-black/30 hover:text-[#FF3B13]"><X className="w-2.5 h-2.5" /></button>
                            </span>
                          ))}
                          <input 
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={handleTagAdd}
                            className="flex-1 bg-transparent border-none text-xs font-bold tracking-widest outline-none px-2 min-w-[100px]"
                            placeholder={tags.length === 0 ? "Work, Personal..." : ""}
                          />
                       </div>
                    </div>
                  </div>

                  {/* Category Specific Fields */}
                  {category === "web" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 ml-1">Company / Website App</label>
                        <AppAutocomplete 
                          onSelect={(brand) => {
                            setFormData({
                              ...formData,
                              title: brand.name,
                              website: brand.domain
                            });
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 ml-1">Username / Email</label>
                          <input 
                            required
                            value={formData.username}
                            onChange={e => setFormData({...formData, username: e.target.value})}
                            className="w-full bg-[#f8f8f8] border border-black/5 rounded-xl px-4 py-4 text-xs font-bold tracking-widest focus:ring-1 focus:ring-[#FF3B13]/30 outline-none transition-all"
                            placeholder="agent@kryptes.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 ml-1">Password</label>
                          <div className="relative">
                            <input 
                              required
                              type={showGen ? "text" : "password"}
                              value={formData.password}
                              onChange={e => setFormData({...formData, password: e.target.value})}
                              className="w-full bg-[#f8f8f8] border border-black/5 rounded-xl px-4 py-4 text-xs font-bold tracking-widest focus:ring-1 focus:ring-[#FF3B13]/30 outline-none transition-all"
                              placeholder="••••••••••••"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              <button type="button" onClick={() => setShowGen(!showGen)} className="p-2 text-black/20 hover:text-black transition-colors"><Eye className="w-4 h-4" /></button>
                              <button type="button" onClick={generatePassword} className="p-2 text-black/20 hover:text-[#FF3B13] transition-colors"><RefreshCcw className="w-4 h-4" /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {category === "dev" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {["Production", "Staging", "Development", "Test"].map(env => (
                          <button
                            key={env}
                            type="button"
                            onClick={() => setFormData({...formData, env})}
                            className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] border transition-all ${
                              formData.env === env ? "bg-black text-white border-black" : "bg-[#f8f8f8] border-black/5 text-black/30"
                            }`}
                          >
                            {env}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 ml-1">Secret Key</label>
                          <input 
                            value={formData.secretKey}
                            onChange={e => setFormData({...formData, secretKey: e.target.value})}
                            className="w-full bg-[#f8f8f8] border border-black/5 rounded-xl px-4 py-4 text-[10px] font-mono font-bold tracking-widest outline-none"
                            placeholder="STRIPE_SK_LIVE..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 ml-1">Secret Value</label>
                          <input 
                            value={formData.secretValue}
                            onChange={e => setFormData({...formData, secretValue: e.target.value})}
                            className="w-full bg-[#f8f8f8] border border-black/5 rounded-xl px-4 py-4 text-[10px] font-mono font-bold tracking-widest outline-none"
                            placeholder="sk_test_..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {category === "financial" && (
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 ml-1">Network</label>
                           <select 
                            value={formData.network}
                            onChange={e => setFormData({...formData, network: e.target.value})}
                            className="w-full bg-[#f8f8f8] border border-black/5 rounded-xl px-4 py-4 text-xs font-bold tracking-widest outline-none"
                           >
                              <option>Ethereum</option>
                              <option>Solana</option>
                              <option>Bitcoin</option>
                              <option>Polygon</option>
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 ml-1">12-Word Seed Phrase</label>
                           <div className="grid grid-cols-3 md:grid-cols-4 gap-3 bg-[#f8f8f8] p-6 rounded-2xl border border-black/5">
                              {formData.seedPhrase.map((word, i) => (
                                <div key={i} className="flex flex-col gap-1">
                                  <span className="text-[9px] font-bold text-black/20">{i + 1}</span>
                                  <input 
                                    value={word}
                                    onChange={e => {
                                      const newSeeds = [...formData.seedPhrase];
                                      newSeeds[i] = e.target.value;
                                      setFormData({...formData, seedPhrase: newSeeds});
                                    }}
                                    className="bg-white border border-black/5 rounded-lg px-3 py-2 text-[10px] font-mono font-bold outline-none focus:ring-1 focus:ring-[#FF3B13]/30"
                                  />
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  )}

                  {category === "note" && (
                    <div className="space-y-2 h-full min-h-[300px] flex flex-col">
                       <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 ml-1">Secure Content</label>
                       <textarea 
                        value={formData.noteContent}
                        onChange={e => setFormData({...formData, noteContent: e.target.value})}
                        className="flex-1 w-full bg-[#f8f8f8] border border-black/5 rounded-2xl p-6 text-xs font-bold leading-relaxed tracking-widest outline-none resize-none focus:ring-1 focus:ring-[#FF3B13]/30 transition-all"
                        placeholder="Type sensitive notes, recovery codes, or physical vault locations..."
                       />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="p-8 border-t border-black/5 bg-[#fafafa] flex items-center justify-between">
              <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.2em] text-black/30">
                <Lock className="w-3 h-3" />
                <span>End-to-End Encrypted (AES-256-GCM)</span>
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={onClose} className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-black/40 hover:text-black">Cancel</button>
                <button 
                  disabled={loading}
                  className="bg-black text-white px-10 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#FF3B13] shadow-lg shadow-black/5 transition-all flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Encrypting...
                    </>
                  ) : (
                    "Save Vault Node"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AddNodeModal;
