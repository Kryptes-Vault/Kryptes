/**
 * Kryptex Dashboard — Zero-Knowledge Vault
 *
 * Redesigned to match the landing page's white + #FF3B13 design system.
 * Features: vault grid, password vault, PBKDF2 unlock, add secret, burn share, audit log.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  Eye,
  EyeOff,
  Flame,
  Key,
  KeyRound,
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
import { AddPasswordModal } from "@/components/kryptex/AddPasswordModal";
import { AuditLogView } from "@/components/kryptex/AuditLogView";
import { BurnShareModal } from "@/components/kryptex/BurnShareModal";
import { PasswordGrid } from "@/components/kryptex/PasswordGrid";
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
  const [showPassword, setShowPassword] = useState(false);

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
      {/* ── Navigation Bar ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 h-16 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FF3B13] flex items-center justify-center shadow-lg shadow-[#FF3B13]/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold tracking-tighter uppercase italic leading-none">KRYPTEX</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-black/30 leading-none mt-1">
                  Zero-Knowledge
                </p>
              </div>
            </div>

            {/* Main Tabs */}
            <nav className="flex items-center gap-1">
              {([
                { id: "vault" as Tab, label: "Vault", icon: LayoutGrid },
                { id: "passwords" as Tab, label: "Passwords", icon: KeyRound },
                { id: "audit" as Tab, label: "Log", icon: ScrollText },
              ] as const).map((item) => {
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
                      active
                        ? "bg-[#FF3B13]/8 text-[#FF3B13]"
                        : "text-black/40 hover:bg-black/[0.03] hover:text-black/70"
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Vault status indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f8f8f8] border border-black/5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${pbkdfDerivedKey ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-amber-400"}`}
              />
              <span className="text-[9px] font-bold uppercase tracking-wider text-black/40">
                {pbkdfDerivedKey ? "Unlocked" : "Locked"}
              </span>
            </div>

            {/* User Dropdown/Sign Out */}
            <div className="flex items-center gap-3 pl-4 border-l border-black/5">
              <div className="hidden lg:block text-right">
                <p className="text-[10px] font-bold text-black leading-none">{displayName}</p>
                <p className="text-[9px] text-black/30 font-bold uppercase tracking-wider leading-none mt-1">
                  {provider}
                </p>
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
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-black/5 text-black/30 hover:text-[#FF3B13] hover:border-[#FF3B13]/20 transition-all ml-1"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8">
        <div className="py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-tighter italic">
                {tab === "vault" ? "Secure Vault" : tab === "passwords" ? "Password Vault" : "Audit Log"}
              </h1>
              <p className="text-[10px] text-black/30 font-bold uppercase tracking-[0.2em] mt-1">
                {tab === "vault" ? "AES-256-GCM · Client-Side" : tab === "passwords" ? "Zero-Knowledge · Encrypted Credentials" : "Share History · Zero-Knowledge"}
              </p>
            </div>
          </div>

          {/* Content area */}
          <div>
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

          {tab === "passwords" && user && (
            <PasswordGrid
              items={items}
              userId={user.id}
              pbkdfDerivedKey={pbkdfDerivedKey}
              onAddClick={() => setAddPasswordOpen(true)}
            />
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
        {/* Footer */}
        <footer className="py-8 border-t border-black/5 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/20">
              Kryptex · Zero-Knowledge Vault
            </p>
            <div className="flex items-center gap-1.5 border-l border-black/5 pl-6 font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
              <span className="text-[10px] text-black/30 font-medium font-sans">Live System</span>
            </div>
          </div>
          <div className="flex items-center gap-6 mt-4 md:mt-0 text-[10px] font-bold uppercase tracking-widest text-black/40">
            <Link to="/privacy" className="hover:text-[#FF3B13] transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#FF3B13] transition-colors">Terms of Service</Link>
          </div>
        </footer>
      </div>
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
