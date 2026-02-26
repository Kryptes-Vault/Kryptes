import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Key,
  KeyRound,
  LayoutGrid,
  LogOut,
  ScrollText,
  Shield,
  Lock,
  Flame,
  User,
  Layout,
  Receipt,
  Settings,
  Menu,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { AddSecretModal } from "@/components/kryptex/AddSecretModal";
import { AddPasswordModal } from "@/components/kryptex/AddPasswordModal";
import { AuditLogView } from "@/components/kryptex/AuditLogView";
import { BurnShareModal } from "@/components/kryptex/BurnShareModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SecureVaultView } from "@/components/kryptex/SecureVaultView";
import { useShareHistory } from "@/hooks/useShareHistory";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { useVaultItems, type VaultItemRow } from "@/hooks/useVaultItems";
import { useVaultMasterKey } from "@/hooks/useVaultMasterKey";
import { ENCRYPTION_VERSION_V2_PBKDF2 } from "@/lib/crypto/vaultCrypto";
import { unlockVaultWithPassword } from "@/lib/kryptexVaultService";
import { supabase } from "@/lib/supabase";

type Tab = "vault" | "passwords" | "audit";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseUser();
  const legacySessionKey = useVaultMasterKey();
  const { items, loading: vaultLoading, error: vaultError, reload: reloadVault } = useVaultItems(user?.id ?? null);
  const { rows: historyRows, loading: historyLoading, error: historyError } = useShareHistory(user?.id ?? null);

  const [tab, setTab] = useState<Tab>("vault");
  const [addOpen, setAddOpen] = useState(false);
  const [addPasswordOpen, setAddPasswordOpen] = useState(false);
  const [burnItem, setBurnItem] = useState<VaultItemRow | null>(null);
  const [pbkdfDerivedKey, setPbkdfDerivedKey] = useState<CryptoKey | null>(null);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const hasV2Items = useMemo(
    () => items.some((i) => i.encryption_version === ENCRYPTION_VERSION_V2_PBKDF2),
    [items]
  );

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

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null;

  const initials =
    displayName?.slice(0, 2)?.toUpperCase() ?? "KX";

  const provider =
    user?.app_metadata?.provider ||
    "email";

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
    <div className="flex h-screen w-full bg-[#fafafa] text-[#111] font-sans selection:bg-[#FF3B13] selection:text-white overflow-hidden">
      {/* ── App Control Bar (Thin Sidebar) ────────────────────────────────── */}
      <aside className="hidden lg:flex w-16 flex-col items-center border-r border-black/5 bg-white py-6 shrink-0">
        <div className="flex flex-col items-center gap-6">
          <div className="w-10 h-10 rounded-xl bg-[#FF3B13] flex items-center justify-center shadow-lg shadow-[#FF3B13]/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          
          <div className="w-8 h-[1px] bg-black/5" />
          
          <nav className="flex flex-col items-center gap-4">
            {[
              { icon: Layout, active: true },
              { icon: Receipt, active: false },
              { icon: Settings, active: false },
            ].map((item, idx) => (
              <button
                key={idx}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  item.active 
                    ? "bg-black text-white" 
                    : "text-black/30 hover:bg-black/5 hover:text-black/60"
                }`}
              >
                <item.icon className="w-5 h-5" />
              </button>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto">
          {avatarUrl ? (
            <img src={avatarUrl} className="h-8 w-8 rounded-lg object-cover ring-2 ring-black/5" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF3B13]/10 font-bold text-[#FF3B13] text-[10px]">
              {initials}
            </div>
          )}
        </div>
      </aside>

      {/* ── Dashboard Sidebar (Main Sidebar) ─────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-16 z-50 w-64 border-r border-black/5 bg-white transition-all duration-300 lg:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } flex flex-col shrink-0`}
      >
        <div className="flex h-16 items-center px-6 border-b border-black/5 gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF3B13] flex items-center justify-center shadow-lg shadow-[#FF3B13]/20 shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-tighter uppercase italic leading-none">KRYPTES</p>
            <p className="text-[8px] font-bold uppercase tracking-widest text-black/30 leading-none mt-1">
              Zero-Knowledge
            </p>
          </div>
          <button
            type="button"
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <LogOut className="w-4 h-4 text-black/20" />
          </button>
        </div>

        <nav className="mt-6 flex-1 space-y-1 px-3">
          {([
            { id: "vault" as Tab, label: "Vault Items", icon: LayoutGrid },
            { id: "passwords" as Tab, label: "Credentials", icon: KeyRound },
            { id: "audit" as Tab, label: "Log Center", icon: ScrollText },
          ] as const).map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-all ${
                  active
                    ? "bg-[#FF3B13] text-white shadow-lg shadow-[#FF3B13]/20"
                    : "text-black/40 hover:bg-black/[0.03] hover:text-black/70"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-black/5 p-4">
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-black/5 py-3 text-[10px] font-bold uppercase tracking-widest text-black/40 hover:text-[#FF3B13] transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main content area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1200px] mx-auto">
            {tab === "vault" && (
              <>
                {hasV2Items && (
                  <form onSubmit={handleVaultUnlock} className="mb-8 bg-white rounded-2xl border border-black/5 p-5 shadow-sm">
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

                <SecureVaultView
                  items={items}
                  loading={vaultLoading}
                  error={vaultError}
                  legacySessionKey={legacySessionKey}
                  pbkdfDerivedKey={pbkdfDerivedKey}
                  onAddClick={() => setAddOpen(true)}
                  onBurn={(item) => setBurnItem(item)}
                />
              </>
            )}

            {tab === "audit" && (
              <AuditLogView
                rows={historyRows}
                vaultItems={items}
                loading={historyLoading}
                error={historyError}
              />
            )}
          </div>
        </main>
      </div>

      <AddSecretModal
        open={addOpen}
        onOpenChange={setAddOpen}
        userId={user.id}
        onCreated={() => void reloadVault()}
      />

      <BurnShareModal
        open={burnItem != null}
        onOpenChange={(o) => !o && setBurnItem(null)}
        item={burnItem}
        userId={user.id}
        legacySessionKey={legacySessionKey}
        pbkdfDerivedKey={pbkdfDerivedKey}
        onShared={() => void reloadVault()}
      />

      <AddPasswordModal
        open={addPasswordOpen}
        onOpenChange={setAddPasswordOpen}
        userId={user.id}
        onCreated={() => void reloadVault()}
      />
    </div>
  );
};

export default Dashboard;
