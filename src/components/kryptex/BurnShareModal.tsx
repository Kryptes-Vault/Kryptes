/** Burn link flow: decrypt locally with keys from kryptexVaultService / session crypto. */
import { useMemo, useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  decryptVaultPayload,
  decryptSecret,
  encryptForBurn,
  exportKeyToFragment,
  generateBurnKey,
  packBurnCipher,
  ENCRYPTION_VERSION_V2_PBKDF2,
  type VaultPayload,
} from "@/lib/crypto/vaultCrypto";
import { supabase } from "@/lib/supabase";
import type { VaultItemRow } from "@/hooks/useVaultItems";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: VaultItemRow | null;
  userId: string;
  legacySessionKey: CryptoKey | null;
  pbkdfDerivedKey: CryptoKey | null;
  onShared?: () => void;
};

export function BurnShareModal({
  open,
  onOpenChange,
  item,
  userId,
  legacySessionKey,
  pbkdfDerivedKey,
  onShared,
}: Props) {
  const [step, setStep] = useState<"confirm" | "done">("confirm");
  const [busy, setBusy] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const canShare = useMemo(() => Boolean(item && open), [item, open]);

  function resetOnClose(next: boolean) {
    if (!next) {
      setStep("confirm");
      setShareUrl("");
    }
    onOpenChange(next);
  }

  async function handleCreateLink() {
    if (!item) return;
    setBusy(true);
    try {
      let plain: string;

      if (item.encryption_version === ENCRYPTION_VERSION_V2_PBKDF2) {
        if (!pbkdfDerivedKey) {
          toast.error("Unlock the vault with your master password first");
          setBusy(false);
          return;
        }
        try {
          const body = await decryptSecret(item.ciphertext, item.iv, pbkdfDerivedKey);
          const synthetic: VaultPayload = {
            title: item.title ?? "",
            body,
          };
          plain = JSON.stringify(synthetic);
        } catch {
          toast.error("Could not decrypt this item");
          setBusy(false);
          return;
        }
      } else {
        if (!legacySessionKey) {
          toast.error("Session crypto key unavailable");
          setBusy(false);
          return;
        }
        try {
          const payload = await decryptVaultPayload(item.ciphertext, item.iv, legacySessionKey);
          plain = JSON.stringify(payload);
        } catch {
          toast.error("Could not decrypt this item with your session key");
          setBusy(false);
          return;
        }
      }

      const burnKey = await generateBurnKey();
      const { ciphertext, iv } = await encryptForBurn(plain, burnKey);
      const packed = packBurnCipher(iv, ciphertext);

      const { data: row, error: insErr } = await supabase
        .from("shared_secrets")
        .insert({
          ciphertext: packed,
          burn_after_read: true,
        })
        .select("id")
        .single();

      if (insErr || !row) throw insErr ?? new Error("Insert failed");

      const { error: histErr } = await supabase.from("share_history").insert({
        user_id: userId,
        vault_item_id: item.id,
        share_type: "burn_link",
      });
      if (histErr) throw histErr;

      const fragment = await exportKeyToFragment(burnKey);
      const base = `${window.location.origin}/share/${row.id}`;
      const url = `${base}#${fragment}`;
      setShareUrl(url);
      setStep("done");
      toast.success("Burn link created — copy and send; opening it consumes the secret");
      onShared?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Share failed");
    } finally {
      setBusy(false);
    }
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <Dialog open={open} onOpenChange={resetOnClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border border-emerald-500/20 bg-black/95 text-foreground shadow-[0_0_40px_-12px_rgba(16,185,129,0.35)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-sans tracking-tight text-emerald-400">Burn-on-read link</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            A one-time symmetric key is generated in your browser. Only the URL fragment holds the key — it never
            reaches Supabase.
          </DialogDescription>
        </DialogHeader>

        {step === "confirm" && (
          <>
            <div className="rounded-lg border border-white/10 bg-black/50 p-3 text-sm">
              <p className="text-xs text-muted-foreground">Vault item</p>
              <p className="font-mono text-xs text-emerald-300/90 break-all">{item?.id ?? "—"}</p>
              <p className="mt-2 text-xs text-amber-200/90">
                Recipients need the full link including everything after <span className="font-mono">#</span>. First
                open deletes the ciphertext server-side.
              </p>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button type="button" variant="ghost" onClick={() => resetOnClose(false)} disabled={busy}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!canShare || busy}
                onClick={() => void handleCreateLink()}
                className="bg-emerald-600 text-black hover:bg-emerald-500"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate link"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "done" && (
          <>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Share URL (fragment = key)</label>
              <div className="flex gap-2">
                <Input readOnly value={shareUrl} className="font-mono text-xs border-white/10 bg-black/60" />
                <Button type="button" size="icon" variant="outline" className="shrink-0 border-emerald-500/40" onClick={() => void copyUrl()}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" className="w-full bg-emerald-600 text-black hover:bg-emerald-500" onClick={() => resetOnClose(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
