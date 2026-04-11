import React, { useState } from "react";
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  CreditCard,
  Vault,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BANK_DOMAINS: Record<string, string> = {
  SBI: "sbi.co.in",
  HDFC: "hdfcbank.com",
  ICICI: "icicibank.com",
  Axis: "axisbank.com",
  Chase: "chase.com",
  HSBC: "hsbc.com",
  "Wells Fargo": "wellsfargo.com",
};


interface PaymentCardProps {
  cardholderName: string;
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
}

export function PaymentCard({
  cardholderName,
  cardNumber,
  expMonth,
  expYear,
  cvv,
  accountNumber,
  ifscCode,
  bankName = "Secure Vault Account"
}: PaymentCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const maskNumber = (num: string, visibleCount: number = 4) => {
    if (!num) return "•••• •••• •••• ••••";
    const cleaned = num.replace(/\s/g, "");
    if (isRevealed) return num;
    const lastChars = cleaned.slice(-visibleCount);
    return `•••• •••• •••• ${lastChars}`;
  };

  const maskCvv = (val: string) => (isRevealed ? val : "•••");

  return (
    <div className="relative h-64 w-full max-w-[420px] perspective-1000">
      <motion.div
        initial={false}
        animate={{ rotateY: isRevealed ? [0, 5, 0] : 0 }}
        className="h-full w-full rounded-[2.5rem] bg-gradient-to-br from-white via-slate-50 to-slate-100 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-black/[0.03] overflow-hidden text-black relative"
      >
        {/* Card Background Decoration - Multi-Layered for Depth */}
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#FF3B13]/5 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/[0.02] blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-white/40 to-transparent pointer-events-none" />
        
        <div className="relative flex h-full flex-col justify-between">
          {/* Top Row: Bank & Chip */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl border border-black/5 bg-white p-1.5 shadow-sm flex items-center justify-center">
                <img 
                  src={`https://logo.clearbit.com/${BANK_DOMAINS[bankName] || "bank.com"}`} 
                  alt="" 
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/2830/2830284.png";
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#FF3B13]">
                  {bankName}
                </span>
                <span className="text-[10px] font-bold text-black/30 mt-0.5 tracking-tight">
                  SECURE CRYPTOGRAPHIC LEDGER
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Modernized Chip Design */}
              <div className="h-9 w-12 rounded-lg bg-gradient-to-br from-amber-200 via-amber-400 to-amber-500 shadow-sm border border-amber-600/20 relative">
                <div className="absolute inset-2 border-t border-black/10" />
                <div className="absolute inset-2 border-l border-black/10" />
              </div>
              <div className="flex flex-col items-center">
                <Vault className="h-5 w-5 text-black/10" />
              </div>
            </div>
          </div>
 
          {/* Card Number Row */}
          <div className="flex items-center justify-between group">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/20">
                Encrypted Sequence
              </span>
              <div className="flex items-center gap-4">
                <span className={cn(
                  "text-2xl font-mono tracking-[0.15em] text-black transition-all duration-300",
                  !isRevealed && "blur-[4px] opacity-40"
                )}>
                  {maskNumber(cardNumber)}
                </span>
                {isRevealed && (
                  <button 
                    onClick={() => handleCopy(cardNumber, "Card Number")}
                    className="p-1.5 hover:bg-black/5 rounded-lg transition-colors"
                  >
                    {copiedField === "Card Number" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-black/30 hover:text-black" />}
                  </button>
                )}
              </div>
            </div>
          </div>
 
          {/* Bottom Row: Name, Exp, CVV */}
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/20">
                Cardholder
              </span>
              <span className="text-sm font-bold tracking-wide uppercase text-black/80">
                {cardholderName || "Kryptes User"}
              </span>
            </div>
 
            <div className="flex gap-10">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/20">
                  Expiry
                </span>
                <span className="text-sm font-bold font-mono tracking-wider text-black/80">
                  {expMonth}/{expYear.slice(-2)}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/20">
                  CVV
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono tracking-wider text-black/80">
                    {maskCvv(cvv)}
                  </span>
                  {isRevealed && (
                    <button 
                      onClick={() => handleCopy(cvv, "CVV")}
                      className="p-1 hover:bg-black/5 rounded-lg transition-colors"
                    >
                      {copiedField === "CVV" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-black/30 hover:text-black" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
 
        {/* Global Reveal Toggle - Floating Pill Style */}
        <button
          onClick={() => setIsRevealed(!isRevealed)}
          className={cn(
            "absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 p-2 rounded-2xl transition-all duration-500 group border",
            isRevealed 
              ? "bg-[#FF3B13] border-[#FF3B13]/30 shadow-lg shadow-[#FF3B13]/20" 
              : "bg-white border-black/5 shadow-sm hover:border-[#FF3B13]/20"
          )}
        >
          {isRevealed ? (
            <EyeOff className="h-5 w-5 text-white" />
          ) : (
            <Eye className="h-5 w-5 text-black/20 group-hover:text-[#FF3B13]" />
          )}
          <span className={cn(
            "text-[8px] font-bold uppercase tracking-tighter transition-colors",
            isRevealed ? "text-white/80" : "text-black/20 group-hover:text-[#FF3B13]"
          )}>
            {isRevealed ? "Hide" : "Peek"}
          </span>
        </button>
      </motion.div>

      {/* Account Info Details (Revealed below) */}
      <AnimatePresence>
        {isRevealed && (accountNumber || ifscCode) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-black/40">Account Number</span>
                <div className="flex items-center justify-between font-mono text-xs text-black">
                  <span>{accountNumber}</span>
                  <button onClick={() => handleCopy(accountNumber!, "Account Number")}>
                    {copiedField === "Account Number" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-black/40 hover:text-black" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-black/40">IFSC Code</span>
                <div className="flex items-center justify-between font-mono text-xs text-black">
                  <span>{ifscCode}</span>
                  <button onClick={() => handleCopy(ifscCode!, "IFSC Code")}>
                    {copiedField === "IFSC Code" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-black/40 hover:text-black" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
