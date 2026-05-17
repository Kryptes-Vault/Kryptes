/** Vault item card — white + #FF3B13 design system */
import { useEffect, useState } from "react";
import { Flame, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import {
  decryptVaultPayload,
  decryptSecret,
  ENCRYPTION_VERSION_V2_PBKDF2,
  type VaultPayload,
} from "@/lib/crypto/vaultCrypto";
import type { VaultItemRow } from "@/hooks/useVaultItems";

type Props = {
  item: VaultItemRow;
  legacySessionKey: CryptoKey | null;
  pbkdfDerivedKey: CryptoKey | null;
  onBurn: (item: VaultItemRow) => void;
};

export function VaultItemCard({ item, legacySessionKey, pbkdfDerivedKey, onBurn }: Props) {
  const [payload, setPayload] = useState<VaultPayload | null>(null);
  const [bodyPlain, setBodyPlain] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(true);
  const [revealed, setRevealed] = useState(false);

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
    <article className="group relative flex flex-col rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-[#FF3B13]/20">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {lockedV2 ? (
            <div className="flex items-center gap-2 text-amber-600">
              <Lock className="h-4 w-4 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">Locked</span>
            </div>
          ) : decrypting ? (
            <div className="flex items-center gap-2 text-black/30">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span className="text-xs">Decrypting…</span>
            </div>
          ) : err ? (
            <p className="text-xs text-red-500 font-bold">{err}</p>
          ) : (
            <h3 className="truncate text-sm font-bold text-black tracking-tight">{displayTitle}</h3>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF3B13]/5 border border-[#FF3B13]/10">
          <Flame className="w-3 h-3 text-[#FF3B13]" />
          <span className="text-[10px] font-bold text-[#FF3B13]">{item.share_count}</span>
        </div>
      </div>

      {/* Body */}
      <div className="min-h-[4rem] flex-1 rounded-xl bg-[#f8f8f8] border border-black/[0.03] p-3">
        {lockedV2 ? (
          <div className="flex h-16 items-center justify-center text-xs text-black/20 font-medium">
            Unlock vault to view
          </div>
        ) : decrypting ? (
          <div className="h-16 animate-pulse rounded-lg bg-black/[0.03]" />
        ) : (
          <div className="relative">
            <pre className={`max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-black/60 ${
              !revealed && displayBody ? "blur-sm select-none" : ""
            }`}>
              {displayBody ? displayBody : err ? "" : "—"}
            </pre>
            {displayBody && (
              <button
                type="button"
                onClick={() => setRevealed(!revealed)}
                className="absolute top-1 right-1 w-7 h-7 rounded-lg bg-white border border-black/5 flex items-center justify-center text-black/30 hover:text-[#FF3B13] transition-colors shadow-sm"
                title={revealed ? "Hide" : "Reveal"}
              >
                {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-widest text-black/15">
          {isV2 ? "PBKDF2" : "v1"} · AES-GCM
        </span>
        <button
          type="button"
          disabled={decrypting || Boolean(err) || lockedV2}
          className="h-8 px-3 rounded-lg border border-[#FF3B13]/20 text-[10px] font-bold uppercase tracking-wider text-[#FF3B13] hover:bg-[#FF3B13] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
          onClick={() => onBurn(item)}
        >
          <Flame className="w-3 h-3" />
          Burn Link
        </button>
      </div>
    </article>
  );
}
