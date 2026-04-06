/** Burn-on-read recipient page; key stays in URL fragment only. */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { decryptBurnCipher, importKeyFromFragment, unpackBurnCipher } from "@/lib/crypto/vaultCrypto";

type Status = "idle" | "loading" | "done" | "error";

const ShareReceive = () => {
  const { secretId } = useParams<{ secretId: string }>();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [plaintext, setPlaintext] = useState<string | null>(null);

  useEffect(() => {
    if (!secretId) {
      setStatus("error");
      setMessage("Missing secret id in URL");
      return;
    }

    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) {
      setStatus("error");
      setMessage("Missing key in URL fragment (#). The full burn link is required.");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setMessage(null);
    setPlaintext(null);

    void (async () => {
      try {
        const key = await importKeyFromFragment(hash);
        const { data, error } = await supabase.rpc("get_and_burn_secret", { secret_id: secretId });
        if (cancelled) return;
        if (error) throw error;
        if (data == null) {
          setStatus("error");
          setMessage("Secret not found, expired, or already consumed.");
          return;
        }
        const packed = data as string;
        const { iv, ciphertext } = unpackBurnCipher(packed);
        const text = await decryptBurnCipher(ciphertext, iv, key);
        if (cancelled) return;
        setPlaintext(text);
        setStatus("done");
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Could not decrypt");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [secretId]);

  let bodyPreview = plaintext;
  try {
    if (plaintext && plaintext.trim().startsWith("{")) {
      const j = JSON.parse(plaintext) as { title?: string; body?: string };
      if (j.title != null || j.body != null) {
        bodyPreview = `${j.title ?? ""}${j.title && j.body ? "\n\n" : ""}${j.body ?? ""}`;
      }
    }
  } catch {
    /* keep raw */
  }

  return (
    <div className="min-h-screen bg-black px-4 py-16 text-foreground">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Kryptex · Burn receipt</h1>
            <p className="text-xs text-muted-foreground">One-time read — ciphertext removed after unlock</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/50 p-6 backdrop-blur-md">
          {status === "idle" && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
              <span>Preparing…</span>
            </div>
          )}

          {status === "loading" && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
              <span>Decrypting and burning…</span>
            </div>
          )}

          {status === "error" && message && (
            <div className="flex gap-3 text-red-300">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <p className="text-sm">{message}</p>
            </div>
          )}

          {status === "done" && bodyPreview != null && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-500/90">Secret</p>
              <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-emerald-500/20 bg-black/60 p-4 font-mono text-sm text-emerald-100/90">
                {bodyPreview}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareReceive;
