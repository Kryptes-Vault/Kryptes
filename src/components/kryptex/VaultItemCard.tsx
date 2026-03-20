/** Vault row UI: `share_count` on the badge reflects Supabase audit trigger (see docs/16). */
import { useEffect, useState } from "react";
import { Flame, Loader2, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  decryptVaultPayload,
  decryptSecret,
  ENCRYPTION_VERSION_V2_PBKDF2,
  type VaultPayload,
} from "@/lib/crypto/vaultCrypto";
import type { VaultItemRow } from "@/hooks/useVaultItems";

type Props = {
  item: VaultItemRow;
  /** v1 session random key */
  legacySessionKey: CryptoKey | null;
  /** v2 PBKDF2-derived key (unlock vault first) */
  pbkdfDerivedKey: CryptoKey | null;
  onBurn: (item: VaultItemRow) => void;
};

export function VaultItemCard({ item, legacySessionKey, pbkdfDerivedKey, onBurn }: Props) {
  const [payload, setPayload] = useState<VaultPayload | null>(null);
  const [bodyPlain, setBodyPlain] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(true);

  const isV2 = item.encryption_version === ENCRYPTION_VERSION_V2_PBKDF2;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setDecrypting(true);
      setErr(null);
      setPayload(null);
      setBodyPlain(null);

      if (isV2) {
        if (!pbkdfDerivedKey) {
          if (!cancelled) setDecrypting(false);
          return;
        }
        try {
          const text = await decryptSecret(item.ciphertext, item.iv, pbkdfDerivedKey);
          if (!cancelled) setBodyPlain(text);
        } catch {
          if (!cancelled) {
            setErr("Decrypt failed — wrong password?");
            setBodyPlain(null);
          }
        } finally {
          if (!cancelled) setDecrypting(false);
        }
        return;
      }

      if (!legacySessionKey) {
        if (!cancelled) setDecrypting(false);
        return;
      }
      try {
        const p = await decryptVaultPayload(item.ciphertext, item.iv, legacySessionKey);
        if (!cancelled) setPayload(p);
      } catch {
        if (!cancelled) {
          setErr("Decrypt failed");
          setPayload(null);
        }
      } finally {
        if (!cancelled) setDecrypting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [item.ciphertext, item.iv, item.encryption_version, isV2, legacySessionKey, pbkdfDerivedKey]);

  const displayTitle = isV2 ? item.title ?? "Untitled" : payload?.title ?? "Untitled";
  const displayBody = isV2 ? bodyPlain : payload?.body;

  const lockedV2 = isV2 && !pbkdfDerivedKey;

  return (
    <article className="group relative flex flex-col rounded-xl border border-white/10 bg-black/40 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-md transition hover:border-emerald-500/30">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {lockedV2 ? (
            <div className="flex items-center gap-2 text-amber-200/90">
              <Lock className="h-4 w-4 shrink-0" />
              <span className="text-sm">Unlock vault with master password to view</span>
            </div>
          ) : decrypting ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span className="text-sm">Unlocking…</span>
            </div>
          ) : err ? (
            <p className="text-sm text-destructive">{err}</p>
          ) : (
            <h3 className="truncate font-medium text-foreground">{displayTitle}</h3>
          )}
        </div>
        <Badge variant="secondary" className="shrink-0 border border-emerald-500/25 bg-emerald-500/10 font-mono text-[10px] text-emerald-400">
          {item.share_count} shares
        </Badge>
      </div>
      <div className="min-h-[4rem] flex-1 rounded-md border border-white/5 bg-black/50 p-2">
        {lockedV2 ? (
          <div className="flex h-16 items-center justify-center text-xs text-muted-foreground">—</div>
        ) : decrypting ? (
          <div className="h-16 animate-pulse rounded bg-white/5" />
        ) : (
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-emerald-100/80">
            {displayBody ? displayBody : err ? "" : "—"}
          </pre>
        )}
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={decrypting || Boolean(err) || lockedV2}
          className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
          onClick={() => onBurn(item)}
        >
          <Flame className="mr-1.5 h-3.5 w-3.5" />
          Burn link
        </Button>
      </div>
    </article>
  );
}
