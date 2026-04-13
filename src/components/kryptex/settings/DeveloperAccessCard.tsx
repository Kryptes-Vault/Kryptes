import React, { useCallback, useState } from "react";
import { ShieldAlert, Loader2, CheckCircle, Terminal, Mail, KeyRound, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useVaultCrypto } from "@/hooks/useVaultCrypto";
import { decryptSecretBody } from "@/lib/crypto/vaultCrypto";
import { unlockVaultWithPassword } from "@/lib/kryptexVaultService";
import type { VaultItemRow } from "@/hooks/useVaultItems";

interface DeveloperAccessCardProps {
  user: any;
  userId: string | null;
  items: VaultItemRow[];
  pbkdfDerivedKey: CryptoKey | null;
  onVaultUnlocked: (key: CryptoKey) => void;
}

type DeveloperAccessStep = "idle" | "verifying" | "success";

export const DeveloperAccessCard: React.FC<DeveloperAccessCardProps> = ({
  user: _user,
  userId,
  items,
  pbkdfDerivedKey,
  onVaultUnlocked,
}) => {
  const [step, setStep] = useState<DeveloperAccessStep>("idle");
  const [loading, setLoading] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [unlockBusy, setUnlockBusy] = useState(false);

  const { generateDeveloperAccessBundle } = useVaultCrypto();

  /** Returns a vault key: existing session key, or derives from inline master password and notifies parent. */
  const resolveVaultKey = useCallback(async (): Promise<CryptoKey | null> => {
    if (pbkdfDerivedKey) return pbkdfDerivedKey;
    if (!userId) {
      toast.error("Not signed in.");
      return null;
    }
    if (!masterPassword.trim()) {
      toast.error("Enter your master password", {
        description: "Unlock the vault here to continue — no need to open the Passwords tab.",
      });
      return null;
    }
    setUnlockBusy(true);
    try {
      const key = await unlockVaultWithPassword(userId, masterPassword.trim());
      onVaultUnlocked(key);
      setMasterPassword("");
      return key;
    } catch {
      toast.error("Could not unlock", { description: "Check your master password and try again." });
      return null;
    } finally {
      setUnlockBusy(false);
    }
  }, [pbkdfDerivedKey, userId, masterPassword, onVaultUnlocked]);

  const handleRequestOtp = async () => {
    if (!(await resolveVaultKey())) return;

    setLoading(true);
    try {
      const response = await fetch("/api/support/initialize", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to request verification code.");
      }

      setStep("verifying");
      toast.success("Verification Code Sent", {
        description: "A 6-digit code has been sent to your email to verify ownership.",
      });
    } catch (error: any) {
      console.error(error);
      toast.error("Transmission Failed", {
        description: error.message || "Failed to dispatch the OTP to your email.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAndGrant = async () => {
    if (enteredOtp.length !== 6) {
      toast.error("Invalid Code", {
        description: "Enter the 6-digit code from your email.",
      });
      return;
    }

    const key = await resolveVaultKey();
    if (!key) return;

    setLoading(true);
    try {
      const decryptedSnapshot = await Promise.all(
        items.map(async (item) => {
          try {
            const plain = await decryptSecretBody(item.ciphertext, item.iv, key);
            return {
              id: item.id,
              title: item.title,
              data: JSON.parse(plain),
              encryption_version: item.encryption_version,
            };
          } catch (e) {
            console.error("Failed to decrypt item for developer access snapshot:", item.id);
            return null;
          }
        })
      );

      const validSnapshot = decryptedSnapshot.filter(Boolean);
      const vaultJsonString = JSON.stringify(validSnapshot);

      const bundle = await generateDeveloperAccessBundle(vaultJsonString, enteredOtp);

      const response = await fetch("/api/support/request-developer-access", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otp: enteredOtp,
          developerAccessWrappedKey: bundle.developerAccessWrappedKey,
          developerAccessIv: bundle.developerAccessIv,
          vaultSnapshot: bundle.vaultSnapshot,
        }),
      });

      const errBody = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(errBody.error || "Failed to transmit developer access bundle to backend.");
      }

      setStep("success");
      toast.success("Developer Access Granted", {
        description: "The developer has been securely notified.",
      });
    } catch (error: any) {
      console.error(error);
      toast.error("Developer Access Failed", {
        description: error.message || "An error occurred during cryptographic wrapping.",
      });
    } finally {
      setLoading(false);
    }
  };

  const vaultLocked = !pbkdfDerivedKey;
  const busy = loading || unlockBusy;

  const masterPasswordBlock = vaultLocked && (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
      <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/50">
        <Key className="w-3.5 h-3.5 text-[#FF3B13]/80" />
        Master password
      </label>
      <input
        type="password"
        value={masterPassword}
        onChange={(e) => setMasterPassword(e.target.value)}
        placeholder="Unlock vault to continue"
        autoComplete="off"
        className="w-full rounded-lg bg-black/50 border border-[#FF3B13]/25 px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#FF3B13] transition-colors"
      />
      <p className="text-[9px] text-white/35 leading-relaxed">
        Your master password stays in this browser and is only used locally to derive your vault key.
      </p>
    </div>
  );

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#FF3B13]/30 bg-[#0A0A0A] p-1 shadow-2xl shadow-[#FF3300]/10">
      <div className="relative z-10 p-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF3B13]/10 text-[#FF3B13]">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Developer Access</h3>
              <p className="text-[10px] font-bold text-[#FF3B13]/60 uppercase tracking-widest">Protocol: Zero-Knowledge</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                step === "success"
                  ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                  : step === "verifying"
                    ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse"
                    : "bg-amber-500 animate-pulse"
              }`}
            />
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
              {step === "success" ? "Active" : step === "verifying" ? "Verifying..." : "Ready"}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] p-5">
            <div className="flex items-start gap-4">
              <Terminal className="w-5 h-5 text-white/20 mt-1 shrink-0" />
              <p className="text-[11px] leading-relaxed text-white/60 font-medium">
                Granting Developer Access creates a{" "}
                <span className="text-white font-bold">temporary, cryptographically sealed copy</span> of your vault nodes.
                Our engineers use this to troubleshoot your account without ever seeing your master password.
                <span className="block mt-2 text-[#FF3B13]/80 font-bold uppercase tracking-widest text-[9px]">
                  Access automatically expires and remains sealed until the OTP is used.
                </span>
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === "idle" && (
              <motion.div key="grant-block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {masterPasswordBlock}
                <motion.button
                  onClick={handleRequestOtp}
                  disabled={busy}
                  className="group relative w-full overflow-hidden rounded-2xl py-4 px-6 font-bold uppercase tracking-[0.2em] text-[11px] transition-all bg-[#FF3B13] text-white hover:bg-white hover:text-black shadow-lg shadow-[#FF3B13]/20 disabled:opacity-50"
                >
                  {busy ? (
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{unlockBusy ? "Unlocking…" : "Initiating Request..."}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <Mail className="w-4 h-4 transition-transform group-hover:scale-110" />
                      <span>{vaultLocked ? "Unlock vault & send verification code" : "Send Verification Code"}</span>
                    </div>
                  )}
                  {!busy && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                  )}
                </motion.button>
              </motion.div>
            )}

            {step === "verifying" && (
              <motion.div
                key="verifying-box"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {masterPasswordBlock}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 text-center">
                    Enter the 6-digit code sent to your email to verify ownership
                  </span>
                  <input
                    type="text"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="w-full max-w-[200px] rounded-lg bg-black/50 border border-[#FF3B13]/30 px-4 py-3 text-center text-xl font-mono tracking-[0.3em] font-bold text-white placeholder:text-white/10 outline-none focus:border-[#FF3B13] transition-colors"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setStep("idle");
                      setEnteredOtp("");
                    }}
                    disabled={busy}
                    className="flex-1 rounded-xl border border-white/10 bg-transparent py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAndGrant}
                    disabled={busy || enteredOtp.length !== 6}
                    className="flex-[2] rounded-xl bg-[#FF3B13] py-4 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-[#FF3B13]/20 hover:bg-white hover:text-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    {busy ? (unlockBusy ? "Unlocking…" : "Sealing Vault...") : "Confirm & Grant Access"}
                  </button>
                </div>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success-msg"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center gap-3 rounded-2xl bg-green-500/10 border border-green-500/20 py-4 px-6 text-green-500"
              >
                <CheckCircle className="w-5 h-5" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-center">
                  Access granted. The developer has been securely notified.
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#FF3B13]/5 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-[#FF3B13]/5 blur-[60px] rounded-full pointer-events-none" />
    </div>
  );
};
