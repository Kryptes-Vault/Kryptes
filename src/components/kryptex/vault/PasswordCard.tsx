import { useState } from "react";
import { Check, Copy, Eye, EyeOff, Globe, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { decryptSecretBody, ENCRYPTION_VERSION_V2_PBKDF2 } from "@/lib/crypto/vaultCrypto";
import { getFaviconUrl, logAuditEvent } from "@/lib/passwordVaultService";
import type { VaultItemRow } from "@/hooks/useVaultItems";

export function PasswordCard({
  item,
  userId,
  pbkdfDerivedKey,
}: {
  item: VaultItemRow;
  userId: string;
  pbkdfDerivedKey: CryptoKey | null;
}) {
  const [revealed, setRevealed] = useState(false);
  const [decryptedUsername, setDecryptedUsername] = useState<string | null>(null);
  const [decryptedPassword, setDecryptedPassword] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [copied, setCopied] = useState(false);

  const ext = item as any;
  const websiteUrl: string = ext.website_url ?? "";
  const cat: string = ext.category ?? "other";
  const isV2 = item.encryption_version === ENCRYPTION_VERSION_V2_PBKDF2;
  const locked = isV2 && !pbkdfDerivedKey;

  const faviconSrc = websiteUrl ? getFaviconUrl(websiteUrl) : null;

  async function handleReveal() {
    if (!pbkdfDerivedKey || !isV2) {
      toast.error("Unlock the vault first with your Master Password");
      return;
    }

    if (revealed) {
      setRevealed(false);
      return;
    }

    setDecrypting(true);
    try {
      const plainJson = await decryptSecretBody(item.ciphertext, item.iv, pbkdfDerivedKey);
      const parsed = JSON.parse(plainJson) as { username?: string; password?: string };
      setDecryptedUsername(parsed.username ?? "");
      setDecryptedPassword(parsed.password ?? "");
      setRevealed(true);

      // Audit log
      void logAuditEvent({
        userId,
        vaultItemId: item.id,
        action: "reveal",
        metadata: { title: item.title },
      });
    } catch {
      toast.error("Decryption failed � wrong Master Password?");
    } finally {
      setDecrypting(false);
    }
  }

  async function handleCopy() {
    if (!pbkdfDerivedKey || !isV2) {
      toast.error("Unlock the vault first");
      return;
    }

    try {
      let pw = decryptedPassword;
      if (!pw) {
        const plainJson = await decryptSecretBody(item.ciphertext, item.iv, pbkdfDerivedKey);
        const parsed = JSON.parse(plainJson) as { password?: string };
        pw = parsed.password ?? "";
      }
      await navigator.clipboard.writeText(pw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Password copied");

      // Audit log
      void logAuditEvent({
        userId,
        vaultItemId: item.id,
        action: "copy",
        metadata: { title: item.title },
      });
    } catch {
      toast.error("Could not copy � decryption failed");
    }
  }

  const categoryColors: Record<string, string> = {
    social: "bg-[#FF3B13]/5 text-[#FF3B13] border-[#FF3B13]/10",
    work: "bg-violet-50 text-violet-600 border-violet-100",
    shopping: "bg-amber-50 text-amber-600 border-amber-100",
    finance: "bg-green-50 text-green-600 border-green-100",
    other: "bg-gray-50 text-gray-500 border-gray-100",
  };

  return (
    <article className="group relative flex flex-col rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-[#FF3B13]/15">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-[#f8f8f8] border border-black/5 flex items-center justify-center overflow-hidden shrink-0">
          {faviconSrc ? (
            <img
              src={faviconSrc}
              alt=""
              className="w-7 h-7 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <Globe className="w-5 h-5 text-black/20" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-black tracking-tight truncate">
            {locked ? (
              <span className="flex items-center gap-1.5 text-amber-600">
                <Lock className="w-3.5 h-3.5" /> Locked
              </span>
            ) : (
              item.title ?? "Untitled"
            )}
          </h3>
          {websiteUrl && (
            <p className="text-[10px] text-black/30 truncate font-medium mt-0.5">
              {websiteUrl.replace(/^https?:\/\//, "")}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${categoryColors[cat] ?? categoryColors.other}`}
        >
          {cat}
        </span>
      </div>

      <div className="space-y-2 flex-1">
        <div className="rounded-xl bg-[#f8f8f8] border border-black/[0.03] px-3 py-2.5">
          <p className="text-[8px] font-bold uppercase tracking-widest text-black/25 mb-1">Username</p>
          <p className="text-[11px] font-bold text-black/50 font-mono truncate">
            {locked ? "����������" : revealed && decryptedUsername ? decryptedUsername : "����������"}
          </p>
        </div>
        <div className="rounded-xl bg-[#f8f8f8] border border-black/[0.03] px-3 py-2.5">
          <p className="text-[8px] font-bold uppercase tracking-widest text-black/25 mb-1">Password</p>
          <p className="text-[11px] font-bold text-black/50 font-mono truncate">
            {locked ? "������������" : revealed && decryptedPassword ? decryptedPassword : "������������"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => void handleReveal()}
          disabled={locked || decrypting}
          className={`flex-1 h-9 rounded-lg border border-black/5 text-[10px] font-bold uppercase tracking-wider text-black/40 hover:border-[#FF3B13]/20 hover:text-[#FF3B13] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5`}
        >
          {decrypting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {revealed ? "Hide" : "Reveal"}
        </button>
        <button
          type="button"
          onClick={() => void handleCopy()}
          disabled={locked}
          className={`flex-1 h-9 rounded-lg border border-[#FF3B13]/15 text-[10px] font-bold uppercase tracking-wider text-[#FF3B13] hover:bg-[#FF3B13] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5`}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[8px] font-bold uppercase tracking-widest text-black/10">PBKDF2 � AES-GCM</span>
        <span className="text-[8px] font-bold text-black/10">{new Date(item.created_at).toLocaleDateString()}</span>
      </div>
    </article>
  );
}

