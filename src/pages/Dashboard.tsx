/**
 * Kryptex dashboard: vault grid (secrets encrypted via VaultService / vaultCrypto before Supabase),
 * PBKDF2 unlock for v2 items, Add Secret modal, burn flow,
 * grouped share_history audit (shared_at per item) + share_count on each card.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, Loader2, LogOut, ScrollText, Shield } from "lucide-react";
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

const navItems: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "vault", label: "Vault", icon: LayoutGrid },
  { id: "audit", label: "Audit", icon: ScrollText },
];

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

  const initials =
    user?.email?.slice(0, 2).toUpperCase() ??
    user?.user_metadata?.full_name?.slice(0, 2)?.toUpperCase() ??
    "KX";

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-emerald-500">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-foreground">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="glass flex shrink-0 flex-col border-b border-white/10 md:w-56 md:border-b-0 md:border-r">
          <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight">Kryptex</p>
              <p className="text-[10px] font-mono text-muted-foreground">ZK dashboard</p>
            </div>
          </div>
          <nav className="flex flex-1 flex-row gap-1 p-3 md:flex-col md:gap-0">
            {navItems.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex flex-1 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors md:flex-none ${
                    active
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label}
                  {active && <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-emerald-400 md:block" />}
                </button>
              );
            })}
          </nav>
          <div className="border-t border-white/10 p-3">
            <Button
              type="button"
              variant="outline"
              className="w-full border-white/15 text-muted-foreground hover:bg-white/5 hover:text-foreground"
              onClick={() => void handleSignOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="glass sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 px-5 md:px-8">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                {tab === "vault" ? "Secure vault" : "Share audit"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {tab === "vault" ? "PBKDF2 + AES-GCM · live sync" : "Grouped share history"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 font-mono text-xs font-bold text-emerald-300"
                title={user.email ?? user.id}
              >
                {initials}
              </div>
            </div>
          </header>

          <div className="flex-1 p-4 md:p-8">
            {tab === "vault" && (
              <>
                {hasV2Items && (
                  <form
                    onSubmit={handleVaultUnlock}
                    className="mb-6 flex flex-col gap-3 rounded-xl border border-white/10 bg-black/40 p-4 sm:flex-row sm:items-end"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <label htmlFor="vault-unlock" className="text-xs text-muted-foreground">
                        Master password (decrypt v2 items in this browser)
                      </label>
                      <Input
                        id="vault-unlock"
                        type="password"
                        value={unlockPassword}
                        onChange={(e) => setUnlockPassword(e.target.value)}
                        placeholder="Same password used when adding secrets"
                        className="border-white/10 bg-black/60"
                        autoComplete="off"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={unlockBusy}
                        className="bg-emerald-600 text-black hover:bg-emerald-500"
                      >
                        {unlockBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlock"}
                      </Button>
                      {pbkdfDerivedKey && (
                        <Button type="button" variant="outline" onClick={() => setPbkdfDerivedKey(null)}>
                          Lock
                        </Button>
                      )}
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
    </div>
  );
};

export default Dashboard;
