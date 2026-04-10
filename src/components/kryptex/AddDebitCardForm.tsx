import React, { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddDebitCardForm({ userId, onSuccess }: { userId: string; onSuccess?: () => void }) {
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiration, setExpiration] = useState("");
  const [cvv, setCvv] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validation
    if (!accountNumber.trim()) {
      toast.error("Account Number is required.");
      return;
    }
    if (!ifscCode.trim()) {
      toast.error("IFSC Code is required.");
      return;
    }

    // Split expiration: "MM/YY"
    const [expMonth, expYear] = expiration.split("/").map(s => s.trim());

    setSaving(true);
    try {
      const response = await fetch("/api/vault/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          cardholderName,
          cardNumber,
          expMonth: expMonth || "",
          expYear: expYear ? `20${expYear}` : "", // e.g. "25" -> "2025" or exact
          code: cvv,
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save card securely.");
      }

      toast.success("Card and Bank Details securely saved to Bitwarden!");
      
      // Reset form
      setCardholderName("");
      setCardNumber("");
      setExpiration("");
      setCvv("");
      setAccountNumber("");
      setIfscCode("");
      
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "An error occurred while saving the card.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm max-w-md w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 flex border border-black/5 items-center justify-center rounded-xl bg-orange-50 text-[#FF3B13]">
          <CreditCard className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-black uppercase tracking-widest">Add Payment Card</h2>
          <p className="text-[10px] text-black/50 font-medium">Securely stored with Zero-Knowledge</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card Details */}
        <div className="space-y-4 rounded-xl border border-black/5 bg-[#FAFAFB] p-4">
          <p className="text-[10px] font-bold text-black uppercase tracking-widest border-b border-black/5 pb-2">Card Details</p>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-black/60 uppercase tracking-widest">Cardholder Name</label>
            <Input
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="e.g. John Doe"
              className="bg-white border-black/5 text-xs text-black transition-all focus:border-[#FF3B13]/30"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-black/60 uppercase tracking-widest">Card Number</label>
             <Input
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="0000 0000 0000 0000"
              className="bg-white border-black/5 text-xs text-black font-mono transition-all focus:border-[#FF3B13]/30"
              autoComplete="off"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-black/60 uppercase tracking-widest">Expiration</label>
              <Input
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                placeholder="MM/YY"
                className="bg-white border-black/5 text-xs text-black font-mono"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-black/60 uppercase tracking-widest">CVV</label>
              <Input
                type="password"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                placeholder="•••"
                maxLength={4}
                className="bg-white border-black/5 text-xs text-black font-mono"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="space-y-4 rounded-xl border border-black/5 bg-[#FAFAFB] p-4">
          <p className="text-[10px] font-bold text-black uppercase tracking-widest border-b border-black/5 pb-2">Bank Detail Linking</p>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#FF3B13] uppercase tracking-widest">Account Number *</label>
            <Input
              type="password"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="e.g. 00000000000"
              className="bg-white border-black/5 text-xs font-mono transition-all focus:border-[#FF3B13]/30"
              autoComplete="off"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#FF3B13] uppercase tracking-widest">IFSC Code *</label>
            <Input
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
              placeholder="e.g. HDFC0001234"
              className="bg-white border-black/5 text-xs font-mono uppercase transition-all focus:border-[#FF3B13]/30"
              autoComplete="off"
              required
            />
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="w-full h-12 rounded-xl bg-[#FF3B13] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors shadow-lg shadow-[#FF3B13]/20"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Securely Add Card"}
          </Button>
        </div>
      </form>
    </div>
  );
}
