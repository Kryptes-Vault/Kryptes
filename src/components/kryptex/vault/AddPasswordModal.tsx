import { useState, useEffect } from "react";
import { 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Globe, 
  Key, 
  Loader2, 
  Mail, 
  Shield, 
  X, 
  Eye, 
  EyeOff, 
  Copy, 
  RotateCw, 
  ExternalLink, 
  Trash2, 
  UserPlus, 
  Check 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { 
  addPasswordEntry, 
  inferCategory, 
  getLogoForNameOrUrl, 
  generateSecurePassword, 
  type PasswordCategory 
} from "@/lib/passwordVaultService";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  pbkdfDerivedKey?: CryptoKey | null;
  onCreated?: () => void;
};

const CATEGORIES: { value: PasswordCategory; label: string }[] = [
  { value: "social", label: "Social" },
  { value: "work", label: "Work" },
  { value: "shopping", label: "Shopping" },
  { value: "finance", label: "Finance" },
  { value: "other", label: "Other" },
];

/**
 * LogoBox Component: Manages loading stages for logo previews
 */
function LogoBox({ name, url }: { name: string; url: string }) {
  const [retryStage, setRetryStage] = useState(0);
  const [src, setSrc] = useState("");

  const getDomain = (val: string) => {
    try {
      const cleanVal = val.trim();
      if (!cleanVal) return null;
      const urlObj = new URL(cleanVal.startsWith("http") ? cleanVal : `https://${cleanVal}`);
      return urlObj.hostname.replace(/^www\./, "");
    } catch {
      if (val.includes(".") && !val.includes(" ")) {
        return val.trim().replace(/^www\./, "");
      }
      return null;
    }
  };

  useEffect(() => {
    setRetryStage(0);
  }, [name, url]);

  useEffect(() => {
    const cleanName = (name || "").toLowerCase().trim();
    
    if (retryStage === 0) {
      // 1. Handcrafted logos mapping
      const logoMapped = getLogoForNameOrUrl(name, url);
      if (logoMapped && !logoMapped.includes("google.com/s2/favicons")) {
        setSrc(logoMapped);
        return;
      }
      
      // 2. Try clearbit for website URL
      if (url) {
        const dom = getDomain(url);
        if (dom) {
          setSrc(`https://logo.clearbit.com/${dom}`);
          return;
        }
      }

      // 3. Try clearbit for name if it looks like a domain
      const domFromName = getDomain(name);
      if (domFromName) {
        setSrc(`https://logo.clearbit.com/${domFromName}`);
        return;
      }

      setRetryStage(1);
    }

    if (retryStage === 1) {
      const dom = getDomain(url || name);
      if (dom) {
        setSrc(`https://www.google.com/s2/favicons?domain=${dom}&sz=128`);
      } else {
        setRetryStage(2);
      }
    }
  }, [name, url, retryStage]);

  if (retryStage === 2 || (!src && !name)) {
    return (
      <div className="w-14 h-14 rounded-2xl bg-[#FF3B13]/5 text-[#FF3B13] border border-[#FF3B13]/10 flex items-center justify-center font-bold text-xl select-none uppercase shadow-inner shrink-0 transition-all duration-300">
        <Shield className="w-6 h-6 text-[#FF3B13]/30 animate-pulse" />
      </div>
    );
  }

  if (retryStage === 2 && name) {
    const initial = name.trim().charAt(0).toUpperCase();
    return (
      <div className="w-14 h-14 rounded-2xl bg-[#FF3B13]/10 text-[#FF3B13] border border-[#FF3B13]/20 flex items-center justify-center font-bold text-xl select-none uppercase shadow-inner shrink-0 transition-all duration-300">
        {initial}
      </div>
    );
  }

  return (
    <div className="w-14 h-14 rounded-2xl bg-white border border-black/5 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-2 transition-all duration-300">
      <img
        src={src}
        alt=""
        className="w-10 h-10 object-contain"
        onError={() => {
          setRetryStage((prev) => prev + 1);
        }}
      />
    </div>
  );
}

export function AddPasswordModal({ open, onOpenChange, userId, pbkdfDerivedKey, onCreated }: Props) {
  const [accountName, setAccountName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<PasswordCategory>("other");
  const [masterPassword, setMasterPassword] = useState("");
  const [saving, setSaving] = useState(false);
  
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [showConfirmPasswordText, setShowConfirmPasswordText] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Auto-fill category on URL blur
  function handleUrlBlur() {
    if (websiteUrl.trim() && category === "other") {
      setCategory(inferCategory(websiteUrl));
    }
  }

  // Handle password regeneration
  const regeneratePassword = () => {
    const newPw = generateSecurePassword({
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true
    });
    setPassword(newPw);
    setConfirmPassword(newPw); // Automatically fill confirm field too!
    toast.success("Generated random secure password!");
  };

  // Copy password to clipboard
  const copyPassword = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopiedPassword(true);
      toast.success("Password copied to clipboard");
      setTimeout(() => setCopiedPassword(false), 2000);
    } catch {
      toast.error("Could not copy password");
    }
  };

  // Open website URL in new tab
  const handleOpenWebsite = () => {
    if (!websiteUrl) return;
    const target = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
    window.open(target, "_blank", "noopener,noreferrer");
  };

  // Clear form fields
  const handleResetForm = () => {
    setAccountName("");
    setWebsiteUrl("");
    setEmail("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setNote("");
    setCategory("other");
    setMasterPassword("");
    toast.success("Form fields cleared");
  };

  // Calculate password strength
  const strengthInfo = (() => {
    if (!password) return { label: "", color: "bg-gray-100", barWidth: "w-0", textClass: "text-gray-400" };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) {
      return { label: "Weak", color: "bg-red-500", barWidth: "w-1/3", textClass: "text-red-500 font-bold" };
    } else if (score <= 4) {
      return { label: "Strong!", color: "bg-amber-500", barWidth: "w-2/3", textClass: "text-amber-500 font-bold" };
    } else {
      return { label: "Ultimate!", color: "bg-green-500", barWidth: "w-full", textClass: "text-green-500 font-bold" };
    }
  })();

  // Confirm password border styling based on matches
  const confirmBorderClass = (() => {
    if (!confirmPassword) {
      return "border-gray-200 hover:border-gray-300 focus:border-[#FF3B13]/40 focus:ring-[#FF3B13]/10";
    }
    if (password === confirmPassword) {
      return "border-emerald-500/40 bg-emerald-50/[0.01] text-emerald-950 focus:border-emerald-500 focus:ring-emerald-500/20";
    }
    return "border-rose-500/40 bg-rose-50/[0.01] text-rose-950 focus:border-rose-500 focus:ring-rose-500/20";
  })();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountName.trim()) { toast.error("Service Name is required"); return; }
    if (!password.trim()) { toast.error("Password is required"); return; }
    
    // Check password matching
    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    
    // Check master password if vault is locked
    if (!pbkdfDerivedKey && !masterPassword) {
      toast.error("Master password is required to encrypt");
      return;
    }

    setSaving(true);
    try {
      await addPasswordEntry({
        userId,
        title: accountName,
        websiteUrl,
        username,
        password,
        email,
        note,
        category,
        masterPassword: pbkdfDerivedKey ? undefined : masterPassword,
        pbkdfDerivedKey
      });
      
      toast.success("Password encrypted & securely stored");
      
      // Reset & close
      handleResetForm();
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save entry");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm cursor-pointer"
          />

          {/* Slide-out Drawer Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0.95 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.95 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="relative z-10 bg-white w-full max-w-lg h-full shadow-[0_0_60px_rgba(0,0,0,0.15)] flex flex-col border-l border-black/5 rounded-l-[2rem] overflow-hidden"
          >
            {/* Header section (Mockup Style) */}
            <div className="bg-white border-b border-black/5 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <LogoBox name={accountName} url={websiteUrl} />
                <div className="min-w-0">
                  <h2 className="text-xl font-bold tracking-tight text-black truncate leading-tight">
                    {accountName || "New account"}
                  </h2>
                  <p className="text-xs font-semibold text-black/40 mt-1 truncate font-mono tracking-tight">
                    {websiteUrl ? websiteUrl.replace(/^https?:\/\//, "") : "no website URL"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="text-black/35 hover:text-black/60 transition-colors p-2 hover:bg-black/5 rounded-xl shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alert Banner */}
            <div className="mx-8 mt-6 px-5 py-4 rounded-2xl bg-[#EBF5FF] border border-[#D0E7FF] flex items-start gap-3">
              <span className="text-blue-600 font-bold text-sm select-none mt-0.5 font-mono">!</span>
              <div className="flex-1 text-[11px] font-medium text-blue-900 leading-normal">
                This account uses end-to-end zero-knowledge encryption. Your credentials never leave your browser in plaintext.
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-6 space-y-6 flex flex-col scrollbar-thin">
              
              {/* Direct inputs matching the Neonexus mockup */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-black/80 tracking-tight pb-2 border-b border-black/5 px-0.5">
                  Login details
                </h3>

                <div className="space-y-5">
                  {/* Service / Account Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-black/60 ml-0.5 block mb-1">
                      Service Name
                    </label>
                    <input
                      required
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="e.g. Airtable, Figma, Pinterest..."
                      className="w-full bg-white border border-gray-200 hover:border-gray-300 rounded-xl py-3 px-4 text-xs font-medium focus:outline-none focus:border-[#FF3B13]/40 focus:ring-1 focus:ring-[#FF3B13]/10 transition-all placeholder:text-black/20 text-black"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-black/60 ml-0.5 block mb-1">
                      Email
                    </label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. chloe@neonexus.com"
                      className="w-full bg-white border border-gray-200 hover:border-gray-300 rounded-xl py-3 px-4 text-xs font-medium focus:outline-none focus:border-[#FF3B13]/40 focus:ring-1 focus:ring-[#FF3B13]/10 transition-all placeholder:text-black/20 text-black"
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-black/60 ml-0.5 block mb-1">
                      Username
                    </label>
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. Chloe"
                      className="w-full bg-white border border-gray-200 hover:border-gray-300 rounded-xl py-3 px-4 text-xs font-medium focus:outline-none focus:border-[#FF3B13]/40 focus:ring-1 focus:ring-[#FF3B13]/10 transition-all placeholder:text-black/20 text-black"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-black/60 ml-0.5 block mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        required
                        type={showPasswordText ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••••••"
                        className={`w-full bg-white border border-gray-200 hover:border-gray-300 rounded-xl py-3 pl-4 pr-28 text-xs font-medium focus:outline-none focus:border-[#FF3B13]/40 focus:ring-1 focus:ring-[#FF3B13]/10 transition-all placeholder:text-black/20 text-black ${!showPasswordText && password ? "tracking-widest" : ""}`}
                      />
                      
                      {/* Inline action buttons */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {/* Copy button */}
                        {password && (
                          <button
                            type="button"
                            onClick={copyPassword}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-black/35 hover:text-black hover:bg-black/5 transition-all"
                            title="Copy password"
                          >
                            {copiedPassword ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        )}

                        {/* Visibility toggle */}
                        <button
                          type="button"
                          onClick={() => setShowPasswordText(!showPasswordText)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-black/35 hover:text-black hover:bg-black/5 transition-all"
                          title={showPasswordText ? "Hide password" : "Show password"}
                        >
                          {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>

                        {/* Regenerate password */}
                        <button
                          type="button"
                          onClick={regeneratePassword}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-black/35 hover:text-black hover:bg-black/5 transition-all"
                          title="Generate secure password"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Password strength bar & text */}
                    {password && (
                      <div className="mt-1 space-y-1">
                        <div className="h-1 w-full bg-black/5 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-300 ${strengthInfo.color} ${strengthInfo.barWidth}`} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 px-0.5">
                          <span className="text-[10px] text-black/40">Password strength:</span>
                          <span className={`text-[10px] ${strengthInfo.textClass}`}>
                            {strengthInfo.label}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password (typed twice) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-black/60 ml-0.5 block mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        required
                        type={showConfirmPasswordText ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className={`w-full bg-white border rounded-xl py-3 pl-4 pr-12 text-xs font-medium focus:outline-none focus:ring-1 transition-all placeholder:text-black/20 ${confirmBorderClass} ${!showConfirmPasswordText && confirmPassword ? "tracking-widest" : ""}`}
                      />
                      
                      {/* Separate visibility toggle */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowConfirmPasswordText(!showConfirmPasswordText)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-black/35 hover:text-black hover:bg-black/5 transition-all"
                          title={showConfirmPasswordText ? "Hide password" : "Show password"}
                        >
                          {showConfirmPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {password && confirmPassword && (
                      <div className="px-1.5 pt-1.5 flex items-center gap-1.5">
                        {password === confirmPassword ? (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Passwords match
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                            <X className="w-3.5 h-3.5" /> Passwords do not match
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Website URL with Link Out button */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-black/60 ml-0.5 block mb-1">
                      Website
                    </label>
                    <div className="relative">
                      <input
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        onBlur={handleUrlBlur}
                        placeholder="https://airtable.com/login"
                        className="w-full bg-white border border-gray-200 hover:border-gray-300 rounded-xl py-3 pl-4 pr-12 text-xs font-medium focus:outline-none focus:border-[#FF3B13]/40 focus:ring-1 focus:ring-[#FF3B13]/10 transition-all placeholder:text-black/20 text-black"
                      />
                      {websiteUrl && (
                        <button
                          type="button"
                          onClick={handleOpenWebsite}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-black/35 hover:text-black hover:bg-black/5 transition-all"
                          title="Open website"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Note (mockup notes description) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-black/60 ml-0.5 block mb-1">
                      Note
                    </label>
                    <textarea
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Enter a description..."
                      className="w-full bg-white border border-gray-200 hover:border-gray-300 rounded-xl py-3 px-4 text-xs font-medium focus:outline-none focus:border-[#FF3B13]/40 focus:ring-1 focus:ring-[#FF3B13]/10 transition-all placeholder:text-black/20 text-black resize-none min-h-[80px]"
                    />
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-black/60 ml-0.5 block mb-1">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as PasswordCategory)}
                        className="w-full bg-white border border-gray-200 hover:border-gray-300 rounded-xl py-3 px-4 pr-10 text-xs font-medium appearance-none focus:outline-none focus:border-[#FF3B13]/40 focus:ring-1 focus:ring-[#FF3B13]/10 transition-all text-black"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 pointer-events-none" />
                    </div>
                  </div>

                </div>
              </div>

              {/* Master Password Card (For security keys derivation) */}
              {pbkdfDerivedKey ? (
                <div className="border border-green-500/10 bg-green-500/[0.02] rounded-3xl p-5 flex items-center gap-4 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-green-700 uppercase tracking-wider leading-none">
                      Active Vault Session
                    </h4>
                    <p className="text-[10px] font-medium text-black/40 mt-1.5 leading-normal">
                      Vault is decrypted. This entry will be encrypted locally with your active session key.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border border-[#FF3B13]/10 bg-[#FF3B13]/[0.02] rounded-[2rem] p-6 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-[#FF3B13]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF3B13]">
                      Encryption Key
                    </h3>
                  </div>
                  <p className="text-[10px] font-medium text-black/40 leading-normal">
                    Your Master Password is used to derive the client-side encryption key and is never sent to the server.
                  </p>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF3B13]/40" />
                    <input
                      required
                      type="password"
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      placeholder="ENTER MASTER PASSWORD TO SAVE"
                      className="w-full bg-white border border-[#FF3B13]/15 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold tracking-widest focus:outline-none focus:border-[#FF3B13] transition-all placeholder:text-[#FF3B13]/25"
                      autoComplete="off"
                    />
                  </div>
                </div>
              )}

              {/* Actions Footer inside drawer */}
              <div className="mt-auto pt-6 border-t border-black/5 flex items-center justify-between shrink-0">
                {/* Left side actions (Mockup matching) */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="w-11 h-11 rounded-xl border border-black/5 text-black/40 hover:border-black/20 hover:text-red-500 hover:bg-red-50/50 flex items-center justify-center transition-all bg-white shadow-sm"
                    title="Clear all fields"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.info("Sharing features are accessible from the main sharing hub")}
                    className="w-11 h-11 rounded-xl border border-black/5 text-black/40 hover:border-black/20 hover:text-[#FF3B13] hover:bg-[#FF3B13]/5 flex items-center justify-center transition-all bg-white shadow-sm"
                    title="Sharing options"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>

                {/* Right side actions */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    disabled={saving}
                    className="h-11 px-6 rounded-xl border border-black/5 text-[10px] font-bold uppercase tracking-widest text-black/40 hover:border-black/20 hover:text-black transition-all bg-white shadow-sm"
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
                        Save
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
