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
        className="h-full w-full rounded-3xl bg-gradient-to-br from-zinc-900 to-black p-6 shadow-xl ring-1 ring-black/5 overflow-hidden text-white"
      >
        {/* Card Background Decoration */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#FF3B13]/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        
        <div className="relative flex h-full flex-col justify-between">
          {/* Top Row: Bank & Chip */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF3B13]">
                {bankName}
              </span>
              <span className="text-xs font-medium text-white/40">
                Kryptes Private Ledger
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-10 rounded-md bg-gradient-to-br from-yellow-500/30 to-yellow-600/10 ring-1 ring-yellow-500/20" />
              <Vault className="h-6 w-6 text-white/20" />
            </div>
          </div>

          {/* Card Number Row */}
          <div className="flex items-center justify-between group">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                Card Number
              </span>
              <div className="flex items-center gap-4">
                <span className={cn(
                  "text-xl font-mono tracking-[0.2em] text-white transition-all duration-300",
                  !isRevealed && "blur-[3px] opacity-80"
                )}>
                  {maskNumber(cardNumber)}
                </span>
                {isRevealed && (
                  <button 
                    onClick={() => handleCopy(cardNumber, "Card Number")}
                    className="p-1 hover:text-primary transition-colors"
                  >
                    {copiedField === "Card Number" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 opacity-50 hover:opacity-100" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Name, Exp, CVV */}
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                Cardholder
              </span>
              <span className="text-sm font-medium tracking-wide uppercase text-white">
                {cardholderName || "Anonymous User"}
              </span>
            </div>

            <div className="flex gap-8">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Expires
                </span>
                <span className="text-sm font-mono tracking-wider text-white">
                  {expMonth}/{expYear.slice(-2)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  CVV
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono tracking-wider text-white">
                    {maskCvv(cvv)}
                  </span>
                  {isRevealed && (
                    <button 
                      onClick={() => handleCopy(cvv, "CVV")}
                      className="p-1 hover:text-primary transition-colors"
                    >
                      {copiedField === "CVV" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 opacity-50 hover:opacity-100" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Reveal Toggle */}
        <button
          onClick={() => setIsRevealed(!isRevealed)}
          className="absolute right-6 bottom-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-[#FF3B13]/20 transition-all duration-300 group shadow-lg"
        >
          {isRevealed ? (
            <EyeOff className="h-5 w-5 text-[#FF3B13]" />
          ) : (
            <Eye className="h-5 w-5 text-white/50 group-hover:text-[#FF3B13]" />
          )}
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
