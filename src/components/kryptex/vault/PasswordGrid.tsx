/** Password Grid — category tabs, search, card grid with reveal/copy + audit logging. */
import { useState } from "react";
import { PasswordCard } from "./PasswordCard";
import {
  Briefcase,
  Lock,
  Plus,
  Search,
  Shield,
} from "lucide-react";
import { usePasswordVault, type CategoryFilter } from "@/hooks/usePasswordVault";
import type { VaultItemRow } from "@/hooks/useVaultItems";

type Props = {
  items: VaultItemRow[];
  userId: string;
  pbkdfDerivedKey: CryptoKey | null;
  onAddClick: () => void;
  activeCategory?: CategoryFilter;
};

export function PasswordGrid({ items, userId, pbkdfDerivedKey, onAddClick, activeCategory = "all" }: Props) {
  const { filtered, search, setSearch, counts } = usePasswordVault(items, activeCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-black">Passwords</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">
            AES-GCM · Zero-Knowledge · {counts.all} entries
          </p>
        </div>
        <button
          type="button"
          onClick={onAddClick}
          className="h-11 px-5 rounded-xl bg-[#FF3B13] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2 shadow-[0_8px_20px_rgba(255,59,19,0.2)]"
        >
          <Plus className="w-4 h-4" />
          Add Password
        </button>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search passwords..."
          className="w-full bg-white border border-black/5 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-[#FF3B13]/30 transition-all placeholder:text-black/20"
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-black/10 bg-white px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#FF3B13]/5 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-[#FF3B13]/30" />
          </div>
          <p className="text-sm font-bold text-black/50 mb-1">
            {counts.all === 0 ? "No passwords yet" : "No matches"}
          </p>
          <p className="text-xs text-black/30">
            {counts.all === 0
              ? "Add your first password — encryption runs entirely in your browser."
              : "Try a different search or category filter."}
          </p>
        </div>
      )}

      {/* Password cards grid */}
      {filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <PasswordCard
              key={item.id}
              item={item}
              userId={userId}
              pbkdfDerivedKey={pbkdfDerivedKey}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Password Card — individual entry with favicon, reveal, copy
   ═══════════════════════════════════════════════════════════════════ */





