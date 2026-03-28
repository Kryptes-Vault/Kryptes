import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Briefcase,
  Key,
  KeyRound,
  LayoutGrid,
  LogOut,
  Shield,
  User,
  Receipt,
  Settings,
  QrCode,
  ChevronDown,
  LayoutDashboard,
  Users,
  ShoppingCart,
  MessageSquare,
  HelpCircle,
  FileSearch,
  Store,
  CreditCard,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { AddSecretModal } from "@/components/kryptex/AddSecretModal";
import { AddPasswordModal } from "@/components/kryptex/AddPasswordModal";
import AddNodeModal from "@/components/kryptex/AddNodeModal";
import { BurnShareModal } from "@/components/kryptex/BurnShareModal";
import SettingsView from "@/components/kryptex/SettingsView";
import TwoFAMigrationWizard from "@/components/kryptex/TwoFAMigrationWizard";
import DocumentLocker from "@/components/kryptex/DocumentLocker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordGrid } from "@/components/kryptex/PasswordGrid";
import type { CategoryFilter } from "@/hooks/usePasswordVault";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { useVaultItems, type VaultItemRow } from "@/hooks/useVaultItems";
import { useVaultMasterKey } from "@/hooks/useVaultMasterKey";
import { ENCRYPTION_VERSION_V2_PBKDF2 } from "@/lib/crypto/vaultCrypto";
import { unlockVaultWithPassword } from "@/lib/kryptexVaultService";
import { supabase } from "@/lib/supabase";

type ViewMode = "documents" | "passwords" | "settings" | "authenticator";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseUser();
  const legacySessionKey = useVaultMasterKey();
  const { items, reload: reloadVault } = useVaultItems(user?.id ?? null);
  const [viewMode, setViewMode] = useState<ViewMode>("documents");
  const [passwordCategory, setPasswordCategory] = useState<CategoryFilter>("all");
  const [addNodeOpen, setAddNodeOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addPasswordOpen, setAddPasswordOpen] = useState(false);
  const [burnItem, setBurnItem] = useState<VaultItemRow | null>(null);
  const [pbkdfDerivedKey, setPbkdfDerivedKey] = useState<CryptoKey | null>(null);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const hasV2Items = useMemo(() => items.some((i) => i.encryption_version === ENCRYPTION_VERSION_V2_PBKDF2), [items]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/", { replace: true });
    }
  }, [authLoading, user, navigate]);

  async function handleSignOut() {
    setPbkdfDerivedKey(null);
    const { error } = await supabase.auth.signOut();
    if (error) toast.error(error.message);
    else navigate("/", { replace: true });
  }

  async function handleVaultUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id || !unlockPassword) return;
    setUnlockBusy(true);
    try {
      const key = await unlockVaultWithPassword(user.id, unlockPassword);
      setPbkdfDerivedKey(key);
      setUnlockPassword("");
      toast.success("Vault unlocked for this session");
    } catch {
      toast.error("Could not derive key — check password");
    } finally {
      setUnlockBusy(false);
    }
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.user_name ||
    user?.email?.split("@")[0] ||
    "Agent";

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const initials = displayName?.slice(0, 2)?.toUpperCase() ?? "KX";

  const passwordSections = [
    { id: "all" as const, label: "All Credentials", icon: LayoutGrid },
    { id: "social" as const, label: "Social", icon: User },
    { id: "work" as const, label: "Work", icon: Briefcase },
    { id: "shopping" as const, label: "Shopping", icon: Receipt },
    { id: "finance" as const, label: "Finance", icon: Shield },
  ];

  const activeSidebarItems = viewMode === "passwords" ? passwordSections : [];
  const showMainSidebar = viewMode === "passwords" || viewMode === "settings";

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-[#FF3B13] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-black/40">Loading vault…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#FAFAFB] text-[#111] font-sans selection:bg-[#0066FF] selection:text-white overflow-hidden flex-col">
      {/* Full-Width Navigation Bar */}
      <header className="h-20 bg-white flex items-center justify-between px-6 lg:px-8 shrink-0 z-50">
        <div className="flex items-center gap-6 lg:gap-10">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#111] flex items-center gap-2">
              Kryptes<span className="h-2 w-2 rounded-full bg-[#0066FF]" />
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-1 bg-[#2D2D33] text-white px-3 py-1.5 rounded-full text-[10px] font-bold">
            Seller <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
          </div>
          
          <nav className="hidden md:flex items-center gap-6 ml-4">
            <button className={`text-[13px] font-medium transition-colors ${viewMode === "documents" ? "text-[#0066FF] bg-[#0066FF]/5 px-4 py-2 rounded-xl" : "text-black/40 hover:text-black/60 px-4 py-2"}`} onClick={() => setViewMode("documents")}>
              Invoice
            </button>
            <button className="text-[13px] font-medium text-black/40 hover:text-black/60 px-4 py-2">
              Files
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4 lg:gap-6">
          <div className="hidden lg:flex flex-1 max-w-sm relative">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black/20">📍</div>
             <input type="text" placeholder="Search here" className="h-10 w-full pl-10 pr-4 rounded-full border border-black/5 bg-[#FAFAFB] text-[12px] outline-none transition-all focus:border-[#0066FF]/20 focus:ring-4 focus:ring-[#0066FF]/5" />
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden sm:flex text-[11px] font-bold text-black/60 hover:text-black bg-black/5 px-4 py-2 rounded-full transition-colors">
              Get Loan
            </button>
            <button className="text-black/40 hover:text-black/60 transition-colors">
              <Shield className="w-5 h-5" />
            </button>
            <button className="text-black/40 hover:text-black/60 transition-colors">
              <Receipt className="w-5 h-5" />
            </button>
            <button className="hidden sm:flex items-center gap-1.5 text-black/40 hover:text-black/60 transition-colors">
              <div className="w-5 h-5 rounded-full bg-black/5 flex items-center justify-center text-[10px] border border-black/5">
                🌐
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest">Hindi-IND</span>
            </button>

            <div className="hidden sm:block h-8 w-[1px] bg-black/5 mx-2" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[12px] font-bold text-black leading-tight">{displayName}</p>
                <p className="text-[10px] font-medium text-black/40 leading-tight">{user?.email}</p>
              </div>
              {avatarUrl ? (
                <img src={avatarUrl} className="h-10 w-10 rounded-xl object-cover ring-2 ring-black/5" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0066FF]/10 font-bold text-[#0066FF] text-[12px] border border-[#0066FF]/5">
                  {initials}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 relative">
        {/* Original Mini Sidebar - Always Visible */}
        <aside className="hidden lg:flex w-16 flex-col items-center bg-white py-6 shrink-0 relative z-40">
          <nav className="flex flex-col items-center gap-4">
            {[
              { id: "documents", icon: FileText },
              { id: "passwords", icon: KeyRound },
              { id: "authenticator", icon: QrCode },
              { id: "settings", icon: Settings },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setViewMode(item.id as ViewMode);
                  setSidebarOpen(false);
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  viewMode === item.id ? "bg-[#0066FF] text-white shadow-md shadow-[#0066FF]/20" : "text-black/30 hover:bg-black/5 hover:text-black/60"
                }`}
              >
                <item.icon className="w-5 h-5" />
              </button>
            ))}
          </nav>
        </aside>

        {/* Redesigned Expanded Sidebar (Only for settings and passwords/keys) */}
        {showMainSidebar && (
          <aside className="hidden lg:flex w-[260px] flex-col bg-transparent shrink-0 relative z-30">
            {/* Sidebar Body with flush left and Rounded Top-Right Side */}
            <div className="flex-1 flex flex-col bg-white border-r border-[#F3F4F6] rounded-tr-[2.5rem] ml-0 mt-0 mb-0 py-6 px-6 overflow-y-auto overflow-x-hidden shadow-[2px_0_12px_rgba(0,0,0,0.01)] transition-all">
              <div className="mb-8">
                <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-black/30 mb-4">Vault Categories</p>
                <nav className="flex flex-col gap-1">
                  {viewMode === "passwords" && activeSidebarItems.map((item) => {
                    const active = passwordCategory === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setPasswordCategory(item.id as CategoryFilter);
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                          active
                            ? "bg-white text-[#0066FF] shadow-sm font-bold" 
                            : "text-black/50 hover:bg-white/50 hover:text-black"
                        }`}
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        <span className="text-[13px] font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="mt-auto pt-6 border-t border-black/10">
                <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-black/30 mb-4">System</p>
                <nav className="flex flex-col gap-1">
                  {[
                    { id: "settings", label: "Settings", icon: Settings },
                    { id: "logout", label: "Logout", icon: LogOut },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === "logout") handleSignOut();
                        else if (item.id === "settings") setViewMode("settings");
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                        viewMode === item.id 
                          ? "bg-white text-[#0066FF] shadow-sm font-bold" 
                          : "text-black/50 hover:bg-white/50 hover:text-black"
                      }`}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className="text-[13px] font-medium">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>
        )}

        <main className="flex-1 overflow-y-auto bg-[#FAFAFB]">
          <div className={`p-8 ${viewMode === "documents" ? "max-w-[1400px]" : "max-w-[1200px]"} mx-auto`}>
            {viewMode === "documents" && <DocumentLocker />}
            {/* ... other views ... */}

            {viewMode === "passwords" && (
              <div className="space-y-6">
                {hasV2Items && (
                  <form onSubmit={handleVaultUnlock} className="bg-white rounded-2xl border border-black/5 p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                      <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#FF3B13]">Master Password</label>
                        {!pbkdfDerivedKey ? (
                          <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                            <Input
                              type="password"
                              value={unlockPassword}
                              onChange={(e) => setUnlockPassword(e.target.value)}
                              placeholder="••••••••••••"
                              className="bg-[#f8f8f8] border-black/5 pl-11 py-3.5 text-[10px] font-bold tracking-widest rounded-xl"
                              autoComplete="off"
                            />
                          </div>
                        ) : (
                          <p className="text-[11px] text-black/40">Your vault is decrypted for this browser session.</p>
                        )}
                      </div>
                      <Button
                        type={pbkdfDerivedKey ? "button" : "submit"}
                        disabled={unlockBusy || (!pbkdfDerivedKey && !unlockPassword)}
                        onClick={pbkdfDerivedKey ? () => setPbkdfDerivedKey(null) : undefined}
                        className={`h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-[10px] ${
                          pbkdfDerivedKey ? "bg-black text-white" : "bg-[#FF3B13] text-white shadow-lg shadow-[#FF3B13]/20"
                        }`}
                      >
                        {unlockBusy ? "Deriving..." : pbkdfDerivedKey ? "Lock" : "Unlock"}
                      </Button>
                    </div>
                  </form>
                )}

                <PasswordGrid
                  items={items}
                  userId={user.id}
                  pbkdfDerivedKey={pbkdfDerivedKey}
                  onAddClick={() => setAddNodeOpen(true)}
                  activeCategory={passwordCategory}
                />
              </div>
            )}

            {viewMode === "settings" && <SettingsView user={user} onSignOut={handleSignOut} />}
            {viewMode === "authenticator" && <TwoFAMigrationWizard />}
          </div>
        </main>
      </div>

      {addNodeOpen && (
        <AddNodeModal
          onClose={() => setAddNodeOpen(false)}
          onSave={() => {
            reloadVault();
          }}
        />
      )}

      <AddSecretModal open={addOpen} onOpenChange={setAddOpen} userId={user.id} onCreated={() => void reloadVault()} />

      <BurnShareModal
        open={burnItem != null}
        onOpenChange={(o) => !o && setBurnItem(null)}
        item={burnItem}
        userId={user.id}
        legacySessionKey={legacySessionKey}
        pbkdfDerivedKey={pbkdfDerivedKey}
        onShared={() => void reloadVault()}
      />

      <AddPasswordModal open={addPasswordOpen} onOpenChange={setAddPasswordOpen} userId={user.id} onCreated={() => void reloadVault()} />
    </div>
  );
};

export default Dashboard;
