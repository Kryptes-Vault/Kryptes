/** Kryptex vault grid; ciphertext arrives pre-encrypted via kryptexVaultService. */
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VaultItemCard } from "@/components/kryptex/VaultItemCard";
import type { VaultItemRow } from "@/hooks/useVaultItems";

type Props = {
  items: VaultItemRow[];
  loading: boolean;
  error: string | null;
  legacySessionKey: CryptoKey | null;
  pbkdfDerivedKey: CryptoKey | null;
  onAddClick: () => void;
  onBurn: (item: VaultItemRow) => void;
};

export function SecureVaultView({
  items,
  loading,
  error,
  legacySessionKey,
  pbkdfDerivedKey,
  onAddClick,
  onBurn,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Secure vault</h2>
          <p className="text-sm text-muted-foreground">AES-GCM locally · share counts update live</p>
        </div>
        <Button
          type="button"
          onClick={onAddClick}
          className="bg-emerald-600 text-black hover:bg-emerald-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add secret
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl border border-white/5 bg-white/[0.03]" />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-white/15 bg-black/30 px-6 py-16 text-center">
          <p className="text-muted-foreground">No secrets yet. Add one — encryption runs in your browser first.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <VaultItemCard
              key={item.id}
              item={item}
              legacySessionKey={legacySessionKey}
              pbkdfDerivedKey={pbkdfDerivedKey}
              onBurn={onBurn}
            />
          ))}
        </div>
      )}
    </div>
  );
}
