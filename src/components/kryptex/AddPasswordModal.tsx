/** Add Password Modal — encrypts username + password locally, stores metadata as searchable plaintext. */
import { useState } from "react";
import { ArrowRight, ChevronDown, Globe, Key, Loader2, Mail, Shield, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { addPasswordEntry, inferCategory, type PasswordCategory } from "@/lib/passwordVaultService";
import { PasswordGenerator } from "@/components/kryptex/PasswordGenerator";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onCreated?: () => void;
};

const CATEGORIES: { value: PasswordCategory; label: string }[] = [
  { value: "social", label: "Social" },
  { value: "work", label: "Work" },
  { value: "shopping", label: "Shopping" },
  { value: "finance", label: "Finance" },
  { value: "other", label: "Other" },
];

export function AddPasswordModal({ open, onOpenChange, userId, onCreated }: Props) {
  const [accountName, setAccountName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState<PasswordCategory>("other");
  const [masterPassword, setMasterPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  function handleUrlBlur() {
    if (websiteUrl.trim()) {
      setCategory(inferCategory(websiteUrl));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountName.trim()) { toast.error("Account name is required"); return; }
    if (!username.trim()) { toast.error("Username/Email is required"); return; }
    if (!password.trim()) { toast.error("Password is required"); return; }
    if (!masterPassword) { toast.error("Master password is required for encryption"); return; }

    setSaving(true);
    try {
      await addPasswordEntry({
        userId,
        title: accountName,
        websiteUrl,
        username,
        password,
        category,
        masterPassword,
      });
      toast.success("Password encrypted & stored");
      // Reset
      setAccountName("");
      setWebsiteUrl("");
      setUsername("");
      setPassword("");
      setCategory("other");
      setMasterPassword("");
      setShowGenerator(false);
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 bg-white rounded-2xl border border-black/10 shadow-[0_40px_100px_rgba(0,0,0,0.15)] w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-black/5 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF3B13]/5 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#FF3B13]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-black">Add Password</h2>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-black/30">
                    AES-GCM · Client-Encrypted
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Account Name */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[#FF3B13] ml-1">
                  Account Name
                </label>
                <input
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Gmail, Netflix, Amazon..."
                  className="w-full bg-[#f8f8f8] border border-black/5 rounded-xl py-3 px-4 text-xs font-bold tracking-wide focus:outline-none focus:border-[#FF3B13] transition-all placeholder:text-black/20"
                />
              </div>

              {/* Website URL */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[#FF3B13] ml-1">
                  Website URL
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                  <input
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    onBlur={handleUrlBlur}
                    placeholder="https://accounts.google.com"
                    className="w-full bg-[#f8f8f8] border border-black/5 rounded-xl py-3 pl-10 pr-4 text-xs font-bold tracking-wide focus:outline-none focus:border-[#FF3B13] transition-all placeholder:text-black/20"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[#FF3B13] ml-1">
                  Category
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PasswordCategory)}
                    className="w-full bg-[#f8f8f8] border border-black/5 rounded-xl py-3 px-4 pr-10 text-xs font-bold tracking-wide appearance-none focus:outline-none focus:border-[#FF3B13] transition-all"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                </div>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-black/5" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-[8px] font-bold uppercase tracking-widest text-black/20">
                    Encrypted Fields
                  </span>
                </div>
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[#FF3B13] ml-1">
                  Username / Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                  <input
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-[#f8f8f8] border border-black/5 rounded-xl py-3 pl-10 pr-4 text-xs font-bold tracking-wide focus:outline-none focus:border-[#FF3B13] transition-all placeholder:text-black/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-[#FF3B13] ml-1">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowGenerator(!showGenerator)}
                    className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-black/30 hover:text-[#FF3B13] transition-colors"
                  >
                    <Wand2 className="w-3 h-3" />
                    {showGenerator ? "Hide" : "Generator"}
                  </button>
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#f8f8f8] border border-black/5 rounded-xl py-3 pl-10 pr-4 text-xs font-bold tracking-widest focus:outline-none focus:border-[#FF3B13] transition-all placeholder:text-black/20"
                  />
                </div>
              </div>

              {/* Generator (collapsible) */}
              <AnimatePresence>
                {showGenerator && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <PasswordGenerator onGenerated={(pw) => setPassword(pw)} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#FF3B13]/10" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-[8px] font-bold uppercase tracking-widest text-[#FF3B13]/40">
                    Encryption Key
                  </span>
                </div>
              </div>

              {/* Master Password */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[#FF3B13] ml-1">
                  Master Password
                </label>
                <p className="text-[9px] text-black/30 ml-1">
                  Never sent to the server. Used to derive your AES-256 encryption key locally.
                </p>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF3B13]/40" />
                  <input
                    required
                    type="password"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    placeholder="MASTER PASSWORD"
                    className="w-full bg-[#FF3B13]/[0.03] border border-[#FF3B13]/10 rounded-xl py-3 pl-10 pr-4 text-[10px] font-bold tracking-widest focus:outline-none focus:border-[#FF3B13] transition-all placeholder:text-[#FF3B13]/20"
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  disabled={saving}
                  className="h-11 px-5 rounded-xl border border-black/5 text-[10px] font-bold uppercase tracking-widest text-black/40 hover:border-black/20 hover:text-black transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-11 px-6 rounded-xl bg-[#FF3B13] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2 shadow-[0_8px_20px_rgba(255,59,19,0.2)]"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Encrypt & Save
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
