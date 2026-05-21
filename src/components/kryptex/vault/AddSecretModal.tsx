/** Add Secret: encrypt via `addSecretWithMasterPassword` from `kryptexVaultService` before Supabase insert. */
import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { addSecretWithMasterPassword } from "@/lib/kryptexVaultService";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onCreated?: () => void;
};

export function AddSecretModal({ open, onOpenChange, userId, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    const b = body.trim();
    const pwd = masterPassword;
    if (!t) {
      toast.error("Title is required");
      return;
    }
    if (!pwd) {
      toast.error("Master password is required");
      return;
    }
    setSaving(true);
    try {
      await addSecretWithMasterPassword({
        userId,
        title: t,
        secretBody: b,
        masterPassword: pwd,
      });
      toast.success("Secret encrypted locally and stored");
      setTitle("");
      setBody("");
      setMasterPassword("");
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save secret");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-emerald-500/20 bg-black/95 text-foreground shadow-[0_0_40px_-12px_rgba(16,185,129,0.35)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-sans tracking-tight text-emerald-400">Add secret</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            PBKDF2 derives a key from your master password in-browser; only ciphertext and an optional label are sent to
            Supabase.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Master password</label>
            <Input
              type="password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              placeholder="Never sent to the server"
              className="border-white/10 bg-black/60 font-sans"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Label (stored as plaintext for UX)</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. API key — production"
              className="border-white/10 bg-black/60 font-sans"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Secret</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Paste sensitive content…"
              className="min-h-[120px] resize-y border-white/10 bg-black/60 font-mono text-sm"
              spellCheck={false}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 text-black hover:bg-emerald-500"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Encrypt & save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
