import React, { useState, useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2, Lock, Unlock, ShieldAlert, KeyRound, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

// Client-side zero-knowledge SHA-256 hashing helper
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // PIN Verification State
  const [isPinVerified, setIsPinVerified] = useState<boolean>(() => {
    if (!user) return false;
    return sessionStorage.getItem(`kryptes_pin_verified_${user?.id}`) === "true";
  });

  // Local state to track metadata to avoid latency on context updates
  const [hasPinConfigured, setHasPinConfigured] = useState<boolean>(false);

  // Input states
  const [setupStep, setSetupStep] = useState<"enter" | "confirm">("enter");
  const [setupPin, setSetupPin] = useState<string[]>(Array(6).fill(""));
  const [confirmPin, setConfirmPin] = useState<string[]>(Array(6).fill(""));
  const [verifyPin, setVerifyPin] = useState<string[]>(Array(6).fill(""));

  // UX states
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isShake, setIsShake] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state with user metadata
  useEffect(() => {
    if (user) {
      const metadataHasPin = !!user.user_metadata?.secret_pin_hash;
      setHasPinConfigured(metadataHasPin);
      
      // Update verification state for this specific user
      const verified = sessionStorage.getItem(`kryptes_pin_verified_${user.id}`) === "true";
      setIsPinVerified(verified);
    }
  }, [user]);

  // Framer Motion Animation Variants
  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    },
    shake: {
      x: [0, -10, 10, -10, 10, -5, 5, 0],
      transition: { duration: 0.4, ease: "easeInOut" },
    },
    exit: { 
      opacity: 0, 
      y: -30, 
      scale: 0.95,
      transition: { duration: 0.3 }
    }
  };

  // Focus reference helper
  const focusInput = (idPrefix: string, index: number) => {
    const inputElement = document.getElementById(`${idPrefix}-${index}`) as HTMLInputElement | null;
    if (inputElement) {
      inputElement.focus();
      inputElement.select();
    }
  };

  // Keyboard and Input Handlers
  const handleInputChange = (
    value: string[],
    setValue: React.Dispatch<React.SetStateAction<string[]>>,
    idPrefix: string,
    index: number,
    val: string
  ) => {
    const numericVal = val.replace(/[^0-9]/g, "");
    if (!numericVal) {
      const newPin = [...value];
      newPin[index] = "";
      setValue(newPin);
      return;
    }

    const newPin = [...value];
    newPin[index] = numericVal.slice(-1);
    setValue(newPin);

    // Auto-focus next input
    if (index < 5) {
      focusInput(idPrefix, index + 1);
    }
  };

  const handleKeyDown = (
    value: string[],
    setValue: React.Dispatch<React.SetStateAction<string[]>>,
    idPrefix: string,
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      if (value[index] === "") {
        // Go back and clear the previous input
        if (index > 0) {
          const newPin = [...value];
          newPin[index - 1] = "";
          setValue(newPin);
          focusInput(idPrefix, index - 1);
        }
      } else {
        // Clear current input
        const newPin = [...value];
        newPin[index] = "";
        setValue(newPin);
      }
      e.preventDefault();
    }
  };

  const handlePaste = (
    setValue: React.Dispatch<React.SetStateAction<string[]>>,
    idPrefix: string,
    e: React.ClipboardEvent<HTMLInputElement>
  ) => {
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (pastedData.length > 0) {
      const newPin = Array(6).fill("");
      for (let i = 0; i < pastedData.length; i++) {
        newPin[i] = pastedData[i];
      }
      setValue(newPin);

      // Focus the last filled box or final box
      const focusIndex = Math.min(pastedData.length, 5);
      focusInput(idPrefix, focusIndex);
    }
    e.preventDefault();
  };

  // Submit functions
  const handleSetupContinue = () => {
    const pinStr = setupPin.join("");
    if (pinStr.length !== 6) {
      setErrorMessage("Please enter a 6-digit PIN.");
      setIsShake(true);
      setTimeout(() => setIsShake(false), 500);
      return;
    }
    setErrorMessage(null);
    setSetupStep("confirm");
    // Wait for render, then focus first confirmation box
    setTimeout(() => focusInput("confirm-pin", 0), 100);
  };

  const handleSetupBack = () => {
    setSetupStep("enter");
    setConfirmPin(Array(6).fill(""));
    setErrorMessage(null);
    setTimeout(() => focusInput("setup-pin", 0), 100);
  };

  const handleSetupPinSubmit = async (finalConfirmPin?: string[]) => {
    const pinStr = setupPin.join("");
    const confirmStr = (finalConfirmPin || confirmPin).join("");

    if (pinStr.length !== 6 || confirmStr.length !== 6) {
      setErrorMessage("Please complete the 6-digit PIN.");
      setIsShake(true);
      setTimeout(() => setIsShake(false), 500);
      return;
    }

    if (pinStr !== confirmStr) {
      setErrorMessage("PINs do not match. Try again.");
      setIsShake(true);
      setConfirmPin(Array(6).fill(""));
      setTimeout(() => setIsShake(false), 500);
      focusInput("confirm-pin", 0);
      return;
    }

    try {
      setIsActionLoading(true);
      setErrorMessage(null);
      const hashed = await hashPin(pinStr);

      const { error } = await supabase.auth.updateUser({
        data: { secret_pin_hash: hashed },
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success("Security PIN configured successfully!");

      if (user) {
        sessionStorage.setItem(`kryptes_pin_verified_${user.id}`, "true");
      }

      setTimeout(() => {
        setHasPinConfigured(true);
        setIsPinVerified(true);
        setIsSuccess(false);
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update Security PIN.");
      toast.error(err.message || "Failed to save Security PIN");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleVerificationSubmit = async (enteredPin: string[]) => {
    const pinStr = enteredPin.join("");
    if (pinStr.length !== 6) return;

    try {
      setIsActionLoading(true);
      setErrorMessage(null);
      const hashed = await hashPin(pinStr);
      const storedHash = user?.user_metadata?.secret_pin_hash;

      if (hashed === storedHash) {
        setIsSuccess(true);
        toast.success("Vault unlocked successfully!");
        if (user) {
          sessionStorage.setItem(`kryptes_pin_verified_${user.id}`, "true");
        }
        setTimeout(() => {
          setIsPinVerified(true);
          setIsSuccess(false);
        }, 1200);
      } else {
        setIsShake(true);
        setErrorMessage("Incorrect PIN. Please try again.");
        setVerifyPin(Array(6).fill(""));
        setTimeout(() => {
          setIsShake(false);
          focusInput("verify-pin", 0);
        }, 500);
      }
    } catch (err: any) {
      setErrorMessage("Verification failed. Please try again.");
      toast.error("An error occurred during verification");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Watchers to auto-advance or auto-submit
  useEffect(() => {
    if (setupStep === "enter" && setupPin.join("").length === 6) {
      handleSetupContinue();
    }
  }, [setupPin, setupStep]);

  useEffect(() => {
    if (setupStep === "confirm" && confirmPin.join("").length === 6) {
      void handleSetupPinSubmit(confirmPin);
    }
  }, [confirmPin, setupStep]);

  useEffect(() => {
    if (hasPinConfigured && !isPinVerified && verifyPin.join("").length === 6) {
      void handleVerificationSubmit(verifyPin);
    }
  }, [verifyPin, hasPinConfigured, isPinVerified]);

  // Initial Auth Loading state (Light theme compatible)
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white text-[#111] font-mono">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/40">Loading secure session…</p>
      </div>
    );
  }

  // Not logged in -> Redirect to index
  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Session verified & PIN exists -> Show dashboard/vault
  if (isPinVerified && hasPinConfigured) {
    return <>{children}</>;
  }

  // Render the Security Setup or Lock Screen (Premium Light theme)
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4 font-mono select-none">
      {/* Sleek premium glowing background blobs (light styled) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-[30%] -left-[20%] w-[70%] h-[70%] rounded-full blur-[120px] bg-primary/[0.04]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[70%] h-[70%] rounded-full blur-[120px] bg-[#10B981]/[0.03]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <AnimatePresence mode="wait">
        {!hasPinConfigured ? (
          /* =========================================================
             1. SECURITY PIN SETUP FLOW (New User / No PIN Saved)
             ========================================================= */
          <motion.div
            key="setup-card"
            variants={cardVariants}
            initial="hidden"
            animate={isShake ? "shake" : "visible"}
            exit="exit"
            className="relative z-10 w-full max-w-md p-8 rounded-[2.5rem] border border-black/[0.06] bg-white/85 backdrop-blur-2xl shadow-[0_40px_100px_rgba(0,0,0,0.06)] flex flex-col items-center"
          >
            {/* Glowing Icon Header */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 mb-6 shadow-md
              ${isSuccess 
                ? "bg-emerald-50 border border-emerald-200 text-emerald-600" 
                : "bg-primary/5 border border-primary/20 text-primary"
              }
            `}>
              {isSuccess ? (
                <Check className="h-7 w-7 animate-[scaleIn_0.3s_ease]" />
              ) : (
                <KeyRound className="h-7 w-7" />
              )}
            </div>

            {/* Typography */}
            <h2 className="gradient-text font-black uppercase tracking-[0.2em] text-center text-xl mb-2">
              Setup Security PIN
            </h2>
            <p className="text-[11px] text-black/40 font-bold uppercase tracking-widest text-center px-4 leading-relaxed">
              {setupStep === "enter"
                ? "Create a 6-digit key to securely lock and unlock your digital vault."
                : "Please confirm your security key by typing it again."}
            </p>

            {/* Steps Visual Indicator */}
            <div className="flex gap-2 my-4">
              <span className={`h-1.5 w-1.5 rounded-full transition-colors ${setupStep === "enter" ? "bg-primary" : "bg-black/10"}`} />
              <span className={`h-1.5 w-1.5 rounded-full transition-colors ${setupStep === "confirm" ? "bg-primary" : "bg-black/10"}`} />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-[10px] uppercase font-bold text-destructive flex items-center gap-1.5"
              >
                <ShieldAlert className="h-3 w-3" />
                {errorMessage}
              </motion.div>
            )}

            {/* PIN Inputs Container */}
            {setupStep === "enter" ? (
              <div className="flex justify-between gap-2 my-8 w-full max-w-xs mx-auto">
                {setupPin.map((digit, idx) => (
                  <div key={`setup-box-${idx}`} className="relative w-11 h-14">
                    <input
                      id={`setup-pin-${idx}`}
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      autoFocus={idx === 0}
                      value={digit}
                      onChange={(e) => handleInputChange(setupPin, setSetupPin, "setup-pin", idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(setupPin, setSetupPin, "setup-pin", idx, e)}
                      onPaste={idx === 0 ? (e) => handlePaste(setSetupPin, "setup-pin", e) : undefined}
                      disabled={isActionLoading || isSuccess}
                      className={`w-full h-full text-center text-xl font-bold rounded-xl border bg-black/[0.02] transition-all duration-300 focus:outline-none focus:ring-2
                        ${digit ? "border-primary/50 ring-2 ring-primary/10 text-black font-extrabold" : "border-black/10 text-black/60"}
                        ${errorMessage ? "border-red-400" : ""}
                        hover:border-black/20 focus:border-primary
                      `}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-between gap-2 my-8 w-full max-w-xs mx-auto">
                {confirmPin.map((digit, idx) => (
                  <div key={`confirm-box-${idx}`} className="relative w-11 h-14">
                    <input
                      id={`confirm-pin-${idx}`}
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      autoFocus={idx === 0}
                      value={digit}
                      onChange={(e) => handleInputChange(confirmPin, setConfirmPin, "confirm-pin", idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(confirmPin, setConfirmPin, "confirm-pin", idx, e)}
                      onPaste={idx === 0 ? (e) => handlePaste(setConfirmPin, "confirm-pin", e) : undefined}
                      disabled={isActionLoading || isSuccess}
                      className={`w-full h-full text-center text-xl font-bold rounded-xl border bg-black/[0.02] transition-all duration-300 focus:outline-none focus:ring-2
                        ${digit ? "border-primary/50 ring-2 ring-primary/10 text-black font-extrabold" : "border-black/10 text-black/60"}
                        ${errorMessage ? "border-red-400" : ""}
                        hover:border-black/20 focus:border-primary
                      `}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-4 w-full mt-4 justify-center">
              {setupStep === "confirm" && (
                <button
                  onClick={handleSetupBack}
                  disabled={isActionLoading || isSuccess}
                  className="px-5 py-2 rounded-full border border-black/10 text-[10px] font-bold uppercase tracking-wider text-black/60 hover:text-black hover:bg-black/5 active:scale-95 transition-all"
                >
                  Back
                </button>
              )}
              {setupStep === "enter" ? (
                <button
                  onClick={handleSetupContinue}
                  className="px-8 py-2 rounded-full bg-primary hover:bg-black hover:text-white text-[10px] font-black uppercase tracking-[0.2em] text-white active:scale-95 transition-all duration-300 shadow-sm"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={() => handleSetupPinSubmit()}
                  disabled={isActionLoading || isSuccess}
                  className="px-8 py-2 rounded-full bg-primary hover:bg-black hover:text-white text-[10px] font-black uppercase tracking-[0.2em] text-white active:scale-95 transition-all duration-300 shadow-sm flex items-center gap-2"
                >
                  {isActionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm & Lock
                </button>
              )}
            </div>

            {/* Zero Knowledge Notice */}
            <p className="mt-8 text-[9px] text-black/30 font-bold uppercase tracking-widest text-center px-4 leading-relaxed border-t border-black/5 pt-4">
              [!] ZERO-KNOWLEDGE ARCHITECTURE: PIN IS HASHED LOCALLY (SHA-256) AND NEVER EXPOSED IN PLAINTEXT.
            </p>
          </motion.div>
        ) : (
          /* =========================================================
             2. SECURITY PIN LOCK SCREEN (Existing User / Verification)
             ========================================================= */
          <motion.div
            key="lock-card"
            variants={cardVariants}
            initial="hidden"
            animate={isShake ? "shake" : "visible"}
            exit="exit"
            className="relative z-10 w-full max-w-md p-8 rounded-[2.5rem] border border-black/[0.06] bg-white/85 backdrop-blur-2xl shadow-[0_40px_100px_rgba(0,0,0,0.06)] flex flex-col items-center"
          >
            {/* Lock Icon Header */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 mb-6 shadow-md
              ${isSuccess 
                ? "bg-emerald-50 border border-emerald-200 text-emerald-600" 
                : errorMessage 
                ? "bg-red-50 border border-red-200 text-red-500 animate-pulse" 
                : "bg-primary/5 border border-primary/20 text-primary"
              }
            `}>
              {isSuccess ? (
                <Unlock className="h-6 w-6 animate-[scaleIn_0.3s_ease]" />
              ) : (
                <Lock className="h-6 w-6" />
              )}
            </div>

            {/* Typography */}
            <h2 className="gradient-text font-black uppercase tracking-[0.2em] text-center text-xl mb-2">
              Vault Locked
            </h2>
            <p className="text-[11px] text-black/40 font-bold uppercase tracking-widest text-center px-4 leading-relaxed">
              Enter your 6-digit security PIN to access the main dashboard.
            </p>

            {/* Dynamic Status / Error Label */}
            {errorMessage ? (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-[10px] uppercase font-bold text-destructive flex items-center gap-1.5"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                {errorMessage}
              </motion.div>
            ) : (
              <div className="h-8" />
            )}

            {/* PIN Inputs Container */}
            <div className="flex justify-between gap-2 my-6 w-full max-w-xs mx-auto">
              {verifyPin.map((digit, idx) => (
                <div key={`verify-box-${idx}`} className="relative w-11 h-14">
                  <input
                    id={`verify-pin-${idx}`}
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    autoFocus={idx === 0}
                    value={digit}
                    onChange={(e) => handleInputChange(verifyPin, setVerifyPin, "verify-pin", idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(verifyPin, setVerifyPin, "verify-pin", idx, e)}
                    onPaste={idx === 0 ? (e) => handlePaste(setVerifyPin, "verify-pin", e) : undefined}
                    disabled={isActionLoading || isSuccess}
                    className={`w-full h-full text-center text-xl font-bold rounded-xl border bg-black/[0.02] transition-all duration-300 focus:outline-none focus:ring-2
                      ${digit ? "border-primary/50 ring-2 ring-primary/10 text-black font-extrabold" : "border-black/10 text-black/60"}
                      ${errorMessage ? "border-red-400" : ""}
                      ${isSuccess ? "border-emerald-500/50 ring-emerald-500/10 text-emerald-600" : ""}
                      hover:border-black/20 focus:border-primary
                    `}
                  />
                </div>
              ))}
            </div>

            {/* Spinner when hashing or verifying */}
            <div className="h-6 flex items-center justify-center">
              {isActionLoading && (
                <div className="flex items-center gap-2 text-[10px] text-black/40 uppercase tracking-widest font-bold">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  Verifying Hash…
                </div>
              )}
            </div>

            {/* Quick Lock info */}
            <p className="mt-8 text-[9px] text-black/30 font-bold uppercase tracking-widest text-center px-4 leading-relaxed border-t border-black/5 pt-4">
              [!] DECRYPTION KEY IS LOCALLY DERIVED. ENCRYPTION IS HELD SECURELY.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
