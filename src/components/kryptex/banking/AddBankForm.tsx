import React, { useState } from "react";
import { Loader2, Landmark, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { BankSelector, SUPPORTED_BANKS } from "./BankSelector";

export function AddBankForm({ userId, onSuccess }: { userId: string; onSuccess?: () => void }) {
  const [bankId, setBankId] = useState("");
  const [isAutoFetch, setIsAutoFetch] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState("Savings");
  const [ifscRouting, setIfscRouting] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validation
    const selectedBank = SUPPORTED_BANKS.find(b => b.value === bankId);
    if (!selectedBank) {
      toast.error("Please select a bank from the list.");
      return;
    }
    
    if (!isAutoFetch) {
      if (!accountNumber.trim()) {
        toast.error("Account Number is required for manual entry.");
        return;
      }
      if (!ifscRouting.trim()) {
        toast.error("IFSC/Routing Code is required for manual entry.");
        return;
      }
    }

    setSaving(true);
    try {
      const response = await fetch("/api/vault/banks", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          bankName: selectedBank.label,
          domain: selectedBank.domain,
          isAutoFetch,
          accountNumber: isAutoFetch ? "" : accountNumber.trim(),
          accountType: isAutoFetch ? "Automated" : accountType,
          ifscRouting: isAutoFetch ? "" : ifscRouting.trim(),
        }),
      });

      let data: { error?: string; message?: string } = {};
      try {
        data = await response.json();
      } catch {
        throw new Error("Unexpected response from server.");
      }
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to save bank account securely.");
      }

      toast.success("Kryptes Vault: Bank account securely encrypted and saved.");
      
      // Reset form
      setBankId("");
      setIsAutoFetch(false);
      setAccountNumber("");
      setIfscRouting("");
      
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "An error occurred while saving the bank account.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm w-full mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 flex border border-black/5 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
          <Landmark className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-black uppercase tracking-[0.2em]">Institutional Integration</h2>
          <p className="text-[10px] text-black/50 font-bold uppercase tracking-widest mt-1">Bank-grade Zero-Knowledge Vault</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Bank Selection */}
          <div className="space-y-6">
            <div className="space-y-4 rounded-2xl border border-black/5 bg-[#FAFAFB] p-6 h-full">
              <p className="text-[10px] font-bold text-black uppercase tracking-[0.2em] border-b border-black/5 pb-3">Financial Institution</p>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest px-1">Search & Select *</label>
                <BankSelector value={bankId} onSelect={setBankId} />
              </div>

              <div className="flex items-center space-x-3 pt-4 px-1">
                <Checkbox 
                  id="autoFetch" 
                  checked={isAutoFetch} 
                  onCheckedChange={(checked) => setIsAutoFetch(checked as boolean)}
                  className="h-5 w-5 rounded-lg border-black/10 bg-white data-[state=checked]:bg-[#FF3B13] data-[state=checked]:border-[#FF3B13] transition-all shadow-sm"
                />
                <label
                  htmlFor="autoFetch"
                  className="text-[11px] font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-black/60 hover:text-black transition-colors"
                >
                  Enable Automated Account Hub Sync
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Sync Mode / Manual Fields */}
          <div className="space-y-6">
            {isAutoFetch ? (
              <div className="h-full min-h-[180px] flex flex-col items-center justify-center space-y-4 rounded-2xl border border-orange-200/50 bg-orange-50/30 p-8 text-center transition-all animate-in fade-in zoom-in-95">
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-orange-100/50">
                  <Zap className="h-6 w-6 text-[#FF3B13] animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-black uppercase tracking-wider">Ready for Linking</h3>
                  <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest mt-2 leading-relaxed">
                    Account details will be pulled via <br />
                    Secure Open Banking Protocol 2.0
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-600 border border-green-100">
                  <ShieldCheck className="h-3 w-3" />
                  <span className="text-[9px] font-bold uppercase">Verified Hub</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 rounded-2xl border border-black/5 bg-[#FAFAFB] p-6 transition-all">
                <p className="text-[10px] font-bold text-black uppercase tracking-[0.2em] border-b border-black/5 pb-3">Account Specifications</p>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest px-1">Private Account Number *</label>
                  <Input
                    type="password"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="ENTER ACCOUNT NO."
                    className="h-11 bg-white border-black/5 text-[11px] font-mono font-bold tracking-[0.2em] transition-all focus:border-[#FF3B13]/30 rounded-xl"
                    autoComplete="off"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest px-1">Type</label>
                    <select 
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-black/5 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-black/70 focus:outline-none focus:ring-1 focus:ring-black/5 transition-all"
                    >
                      <option value="Savings">Savings</option>
                      <option value="Checking">Checking</option>
                      <option value="Current">Current</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest px-1">IFSC/Routing *</label>
                    <Input
                      value={ifscRouting}
                      onChange={(e) => setIfscRouting(e.target.value.toUpperCase())}
                      placeholder="HUB CODE"
                      className="h-11 bg-white border-black/5 text-[11px] font-mono font-bold transition-all focus:border-[#FF3B13]/30 rounded-xl"
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="w-full md:w-auto min-w-[240px] h-14 rounded-2xl bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#FF3B13] transition-all shadow-xl shadow-black/5 hover:scale-[1.02] active:scale-95"
          >
            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : isAutoFetch ? "Initiate Hub Handshake" : "Encrypt & Secure Details"}
          </Button>
        </div>
      </form>
    </div>
  );
}
