import React, { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BankSelector } from "./BankSelector";

/** Standard card length for this form — 16 digits, shown as four groups of four. */
const MAX_CARD_DIGITS = 16;
/** Formatted length: 16 digits + 3 spaces */
const MAX_CARD_INPUT_LENGTH = MAX_CARD_DIGITS + 3;

/** Display as "1234 5678 9012 3456" — at most 16 digits. */
function formatCardNumberGroups(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, MAX_CARD_DIGITS);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trimEnd();
}

/** Format expiration date as MM/YY with month validation (01-12) */
function formatExpiration(raw: string): string {
  let digits = raw.replace(/\D/g, "").slice(0, 4);
  
  // Validate month (first 2 digits)
  if (digits.length >= 2) {
    const month = parseInt(digits.slice(0, 2), 10);
    if (month > 12) {
      // If month is invalid (e.g. 13), force it to 12 or keep the first digit if it's '0' or '1'
      digits = "12" + digits.slice(2);
    } else if (month === 0 && digits.length === 2) {
      // Don't allow '00'
      digits = "0";
    }
  } else if (digits.length === 1) {
    // If first digit is 2-9, automatically make it 02, 03, etc.
    const firstDigit = parseInt(digits, 10);
    if (firstDigit > 1) {
      digits = "0" + digits;
    }
  }

  if (digits.length >= 2) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

export function AddDebitCardForm({ userId, onSuccess }: { userId: string; onSuccess?: () => void }) {
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [expiration, setExpiration] = useState("");
  const [cvv, setCvv] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validation
    if (!cardNumber.trim()) {
      toast.error("Card Number is required.");
      return;
    }

    // Split expiration: "MM/YY"
    const [expMonth, expYear] = expiration.split("/").map(s => s.trim());

    setSaving(true);
    try {
      const response = await fetch("/api/vault/cards", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          cardholderName,
          cardNumber: cardNumber.replace(/\D/g, ""),
          bankName,
          expMonth: expMonth || "",
          expYear: expYear ? `20${expYear}` : "",
          code: cvv,
        }),
      });

      let data: { error?: string; message?: string } = {};
      try {
        data = await response.json();
      } catch {
        throw new Error("Unexpected response from server.");
      }
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to save card securely.");
      }

      toast.success("Kryptes Vault: Card securely encrypted and saved.");
      
      // Reset form
      setCardholderName("");
      setCardNumber("");
      setBankName("");
      setExpiration("");
      setCvv("");
      
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "An error occurred while saving the card.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm w-full mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 flex border border-black/5 items-center justify-center rounded-2xl bg-orange-50 text-[#FF3B13] shadow-sm">
          <CreditCard className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-black uppercase tracking-[0.2em]">Card Provisioning</h2>
          <p className="text-[10px] text-black/50 font-bold uppercase tracking-widest mt-1">Zero-Knowledge Secure Encryption</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Bank Selection */}
          <div className="space-y-6">
            <div className="space-y-4 rounded-2xl border border-black/5 bg-[#FAFAFB] p-6 h-full">
              <p className="text-[10px] font-bold text-black uppercase tracking-[0.2em] border-b border-black/5 pb-3">Institution Mapping</p>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest px-1">Issuing Bank</label>
                <BankSelector value={bankName} onSelect={setBankName} />
              </div>
              <div className="p-4 rounded-xl border border-dashed border-black/5 bg-white/50 mt-4">
                <p className="text-[9px] font-bold text-black/30 uppercase tracking-widest leading-relaxed">
                  Mapping your card to an institution allows for <br />
                  enhanced vault branding and automated icon fetching.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Card Details */}
          <div className="space-y-6">
            <div className="space-y-4 rounded-2xl border border-black/5 bg-[#FAFAFB] p-6">
              <p className="text-[10px] font-bold text-black uppercase tracking-[0.2em] border-b border-black/5 pb-3">Security Parameters</p>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest px-1">Cardholder Name</label>
                  <Input
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="FULL NAME"
                    className="h-11 bg-white border-black/5 text-[11px] font-bold uppercase tracking-widest transition-all focus:border-[#FF3B13]/30 rounded-xl"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest px-1">Primary Account Number</label>
                  <Input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumberGroups(e.target.value))}
                    placeholder="0000 0000 0000 0000"
                    inputMode="numeric"
                    maxLength={MAX_CARD_INPUT_LENGTH}
                    className="h-11 bg-white border-black/5 text-[11px] font-mono font-bold tracking-[0.2em] transition-all focus:border-[#FF3B13]/30 rounded-xl"
                    autoComplete="off"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest px-1">Expiration</label>
                    <Input
                      value={expiration}
                      onChange={(e) => setExpiration(formatExpiration(e.target.value))}
                      placeholder="MM/YY"
                      inputMode="numeric"
                      maxLength={5}
                      className="h-11 bg-white border-black/5 text-[11px] font-mono font-bold transition-all focus:border-[#FF3B13]/30 rounded-xl text-center"
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest px-1">Security Code</label>
                    <Input
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="•••"
                      maxLength={4}
                      className="h-11 bg-white border-black/5 text-[11px] font-mono font-bold transition-all focus:border-[#FF3B13]/30 rounded-xl text-center"
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="w-full md:w-auto min-w-[240px] h-14 rounded-2xl bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#FF3B13] transition-all shadow-xl shadow-black/5 hover:scale-[1.02] active:scale-95"
          >
            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : "Encrypt & Push to Vault"}
          </Button>
        </div>
      </form>
    </div>
  );
}
