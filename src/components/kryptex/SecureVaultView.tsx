/** Kryptex vault grid — redesigned to match the white + #FF3B13 Kryptex design system. */
import { Plus } from "lucide-react";
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
          <h2 className="text-lg font-bold tracking-tight text-black">Secure Vault</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">AES-GCM · Client-Side · Share Counts Live</p>
        </div>
        <button
          type="button"
          onClick={onAddClick}
          className="h-11 px-5 rounded-xl bg-[#FF3B13] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2 shadow-[0_8px_20px_rgba(255,59,19,0.2)]"
        >
          <Plus className="w-4 h-4" />
          Add Secret
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl border border-black/5 bg-white" />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="rounded-2xl border-2 border-dashed border-black/10 bg-white px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#FF3B13]/5 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-[#FF3B13]/40" />
          </div>
          <p className="text-sm font-bold text-black/60 mb-1">No secrets yet</p>
          <p className="text-xs text-black/30">Add one — encryption runs entirely in your browser.</p>
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
