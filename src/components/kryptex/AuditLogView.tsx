/** Grouped share_history audit — redesigned with white + #FF3B13 Kryptex theme. */
import { useMemo } from "react";
import { Clock, Flame, ScrollText } from "lucide-react";
import { shareHistoryTime, type ShareHistoryRow } from "@/hooks/useShareHistory";
import type { VaultItemRow } from "@/hooks/useVaultItems";
import { groupShareHistoryByVaultItem } from "@/lib/vaultService";

type Props = {
  rows: ShareHistoryRow[];
  vaultItems: VaultItemRow[];
  loading: boolean;
  error: string | null;
};

export function AuditLogView({ rows, vaultItems, loading, error }: Props) {
  const titleById = useMemo(() => {
    const m = new Map<string, string>();
    for (const v of vaultItems) {
      const label = v.title?.trim() || v.id.slice(0, 8) + "…";
      m.set(v.id, label);
    }
    return m;
  }, [vaultItems]);

  const grouped = useMemo(() => groupShareHistoryByVaultItem(rows), [rows]);

  const sections = useMemo(() => {
    return Array.from(grouped.entries()).sort((a, b) => {
      const ta = shareHistoryTime(a[1][0]!);
      const tb = shareHistoryTime(b[1][0]!);
      return new Date(tb).getTime() - new Date(ta).getTime();
    });
  }, [grouped]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-black">Audit Log</h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">
          Share Events · Zero-Knowledge Transparency
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl border border-black/5 bg-white" />
          ))}
        </div>
      )}

      {!loading && rows.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black/10 bg-white px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#FF3B13]/5 flex items-center justify-center mx-auto mb-4">
            <ScrollText className="w-8 h-8 text-[#FF3B13]/30" />
          </div>
          <p className="text-sm font-bold text-black/60 mb-1">No share events yet</p>
          <p className="text-xs text-black/30">Creating a burn link will appear here.</p>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <ul className="space-y-4">
          {sections.map(([vaultId, events]) => (
            <li key={vaultId} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/25 mb-1">Vault Item</p>
                  <p className="text-sm font-bold text-black tracking-tight">{titleById.get(vaultId) ?? "Untitled"}</p>
                  <p className="font-mono text-[10px] text-black/20 mt-0.5 break-all">{vaultId}</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF3B13]/5 border border-[#FF3B13]/10">
                  <Flame className="w-3 h-3 text-[#FF3B13]" />
                  <span className="text-[10px] font-bold text-[#FF3B13]">{events.length}</span>
                </div>
              </div>
              <ul className="space-y-2 border-t border-black/5 pt-3">
                {events.map((ev) => (
                  <li
                    key={ev.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-1.5"
                  >
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF3B13]/5 border border-[#FF3B13]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#FF3B13]">
                      <Flame className="w-3 h-3" />
                      {ev.share_type}
                    </span>
                    <time
                      className="flex items-center gap-1.5 text-[11px] text-black/30 font-medium"
                      dateTime={shareHistoryTime(ev)}
                    >
                      <Clock className="w-3 h-3" />
                      {new Date(shareHistoryTime(ev)).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
