/** Grouped `share_history` audit — transparency for share events per vault item. */
import { useMemo } from "react";
import { ScrollText } from "lucide-react";
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
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Audit log</h2>
        <p className="text-sm text-muted-foreground">
          Share events per vault item — timestamps from <span className="font-mono text-emerald-500/90">share_history</span>
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border border-white/5 bg-white/[0.03]" />
          ))}
        </div>
      )}

      {!loading && rows.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/30 px-6 py-16 text-center">
          <ScrollText className="mb-3 h-10 w-10 text-emerald-500/40" />
          <p className="text-muted-foreground">No share events yet. Creating a burn link will appear here.</p>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <ul className="space-y-6">
          {sections.map(([vaultId, events]) => (
            <li key={vaultId} className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Vault item</p>
              <p className="mb-1 font-mono text-sm text-emerald-200/90 break-all">{titleById.get(vaultId) ?? vaultId}</p>
              <p className="mb-3 font-mono text-[10px] text-muted-foreground break-all">{vaultId}</p>
              <ul className="space-y-2 border-t border-white/5 pt-3">
                {events.map((ev) => (
                  <li
                    key={ev.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm"
                  >
                    <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-emerald-400">
                      {ev.share_type}
                    </span>
                    <time className="font-mono text-muted-foreground" dateTime={shareHistoryTime(ev)}>
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
