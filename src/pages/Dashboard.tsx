/**
 * Kryptex Dashboard — Zero-Knowledge Vault
 *
 * Redesigned to match the landing page's white + #FF3B13 design system.
 * Features: vault grid, PBKDF2 unlock, add secret, burn share, audit log.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  Eye,
  EyeOff,
  Flame,
  Key,
  LayoutGrid,
  Loader2,
  Lock,
  LogOut,
  Plus,
  ScrollText,
  Shield,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { AddSecretModal } from "@/components/kryptex/AddSecretModal";
import { AuditLogView } from "@/components/kryptex/AuditLogView";
import { BurnShareModal } from "@/components/kryptex/BurnShareModal";
import { SecureVaultView } from "@/components/kryptex/SecureVaultView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useShareHistory } from "@/hooks/useShareHistory";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { useVaultItems, type VaultItemRow } from "@/hooks/useVaultItems";
import { useVaultMasterKey } from "@/hooks/useVaultMasterKey";
import { ENCRYPTION_VERSION_V2_PBKDF2 } from "@/lib/crypto/vaultCrypto";
import { unlockVaultWithPassword } from "@/lib/kryptexVaultService";
import { supabase } from "@/lib/supabase";

type Tab = "vault" | "audit";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseUser();
  const legacySessionKey = useVaultMasterKey();
  const { items, loading: vaultLoading, error: vaultError, reload: reloadVault } = useVaultItems(user?.id ?? null);
  const { rows: historyRows, loading: historyLoading, error: historyError } = useShareHistory(user?.id ?? null);

  const [tab, setTab] = useState<Tab>("vault");
  const [addOpen, setAddOpen] = useState(false);
  const [burnItem, setBurnItem] = useState<VaultItemRow | null>(null);
  const [pbkdfDerivedKey, setPbkdfDerivedKey] = useState<CryptoKey | null>(null);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-[#fafafa] text-[#111] font-sans selection:bg-[#FF3B13] selection:text-white">
      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-black/5 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-black/5">
          <div className="w-9 h-9 rounded-xl bg-[#FF3B13] flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tighter uppercase italic">KRYPTEX</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-black/30">Zero-Knowledge</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {([
            { id: "vault" as Tab, label: "Secure Vault", icon: LayoutGrid },
            { id: "audit" as Tab, label: "Audit Log", icon: ScrollText },
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
                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
                  active
                    ? "bg-[#FF3B13]/8 text-[#FF3B13] shadow-sm"
                    : "text-black/40 hover:bg-black/[0.03] hover:text-black/70"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF3B13]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User card + Sign out */}
        <div className="p-4 border-t border-black/5 space-y-3">
          <div className="flex items-center gap-3 px-2">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-9 h-9 rounded-xl object-cover border border-black/5"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[#FF3B13]/10 flex items-center justify-center text-xs font-bold text-[#FF3B13]">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-black truncate">{displayName}</p>
              <p className="text-[10px] text-black/30 truncate">{user.email || provider}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-black/5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-black/40 hover:text-[#FF3B13] hover:border-[#FF3B13]/20 transition-all"
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

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 sm:px-8 bg-white/80 backdrop-blur-md border-b border-black/5">
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              type="button"
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-black/5 hover:border-[#FF3B13]/20 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <div className="space-y-1">
                <div className="w-4 h-0.5 bg-black/40 rounded" />
                <div className="w-3 h-0.5 bg-black/40 rounded" />
                <div className="w-4 h-0.5 bg-black/40 rounded" />
              </div>
            </button>
            <div>
              <h1 className="text-sm font-bold uppercase tracking-tight">
                {tab === "vault" ? "Secure Vault" : "Audit Log"}
              </h1>
              <p className="text-[10px] text-black/30 font-bold uppercase tracking-widest">
                {tab === "vault" ? "AES-256-GCM · Client-Side Encryption" : "Share History · Zero-Knowledge Audit"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Vault status indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f8f8f8] border border-black/5">
              <div className={`w-1.5 h-1.5 rounded-full ${pbkdfDerivedKey ? "bg-green-500" : "bg-amber-400"}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-black/40">
                {pbkdfDerivedKey ? "Unlocked" : "Locked"}
              </span>
            </div>

            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-9 h-9 rounded-xl object-cover border border-black/5"
                title={user.email ?? user.id}
              />
            ) : (
              <div
                className="w-9 h-9 rounded-xl bg-[#FF3B13]/10 flex items-center justify-center text-xs font-bold text-[#FF3B13]"
                title={user.email ?? user.id}
              >
                {initials}
              </div>
            )}
          </div>
        </header>

        {/* Content area */}
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              {
                label: "Vault Items",
                value: items.length.toString(),
                icon: Lock,
                color: "text-[#FF3B13]",
                bg: "bg-[#FF3B13]/5",
              },
              {
                label: "Total Shares",
                value: items.reduce((sum, i) => sum + (i.share_count || 0), 0).toString(),
                icon: Flame,
                color: "text-orange-500",
                bg: "bg-orange-500/5",
              },
              {
                label: "Provider",
                value: provider.charAt(0).toUpperCase() + provider.slice(1),
                icon: User,
                color: "text-blue-500",
                bg: "bg-blue-500/5",
              },
              {
                label: "Encryption",
                value: pbkdfDerivedKey ? "Active" : "Locked",
                icon: Key,
                color: pbkdfDerivedKey ? "text-green-500" : "text-amber-500",
                bg: pbkdfDerivedKey ? "bg-green-500/5" : "bg-amber-500/5",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl border border-black/5 p-4 flex items-center gap-3 shadow-sm"
              >
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg font-bold tracking-tight">{stat.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {tab === "vault" && (
            <>
              {/* Vault unlock form (for v2 PBKDF2 items) */}
              {hasV2Items && (
                <form
                  onSubmit={handleVaultUnlock}
                  className="mb-8 bg-white rounded-2xl border border-black/5 p-5 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                    <div className="flex-1 space-y-2">
                      <label
                        htmlFor="vault-unlock"
                        className="text-[10px] font-bold uppercase tracking-widest text-[#FF3B13]"
                      >
                        {pbkdfDerivedKey ? "✓ Vault Unlocked" : "Master Password Required"}
                      </label>
                      <p className="text-[11px] text-black/40">
                        {pbkdfDerivedKey
                          ? "Your vault is decrypted for this browser session. Lock it when you're done."
                          : "Enter your master password to decrypt vault items. This key never leaves your browser."}
                      </p>
                      {!pbkdfDerivedKey && (
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20">
                            <Key className="w-4 h-4" />
                          </div>
                          <Input
                            id="vault-unlock"
                            type={showPassword ? "text" : "password"}
                            value={unlockPassword}
                            onChange={(e) => setUnlockPassword(e.target.value)}
                            placeholder="MASTER PASSWORD"
                            className="bg-[#f8f8f8] border-black/5 pl-11 pr-11 py-3.5 text-[10px] font-bold tracking-widest rounded-xl focus-visible:ring-[#FF3B13]"
                            autoComplete="off"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-black/20 hover:text-black transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!pbkdfDerivedKey ? (
                        <button
                          type="submit"
                          disabled={unlockBusy || !unlockPassword}
                          className="h-11 px-6 rounded-xl bg-[#FF3B13] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {unlockBusy ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                          Unlock
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPbkdfDerivedKey(null)}
                          className="h-11 px-6 rounded-xl border border-black/10 text-[10px] font-bold uppercase tracking-widest text-black/50 hover:border-[#FF3B13] hover:text-[#FF3B13] transition-all flex items-center gap-2"
                        >
                          <Lock className="w-4 h-4" />
                          Lock Vault
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              )}

              {/* Vault content */}
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
        </main>

        {/* Footer */}
        <footer className="px-6 sm:px-8 py-6 border-t border-black/5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/20">
              Kryptex · Zero-Knowledge Vault · Your Data, Your Keys
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] text-black/30 font-medium">All systems operational</span>
            </div>
          </div>
        </footer>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────── */}
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
    </div>
  );
};

export default Dashboard;
