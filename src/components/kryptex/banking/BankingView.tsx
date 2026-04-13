import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Plus, 
  CreditCard, 
  ShieldCheck, 
  RefreshCcw,
  Landmark,
  Zap
} from "lucide-react";
import { PaymentCard } from "@/components/kryptex/banking/PaymentCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import type { VaultItemRow } from "@/hooks/useVaultItems";

interface CardData {
  id: string;
  name: string;
  bankName: string;
  card: {
    cardholderName: string;
    number: string;
    expMonth: string;
    expYear: string;
    code: string;
  };
  fields: Array<{
    name: string;
    value: string;
  }>;
}

interface BankData {
  id: string;
  bankName: string;
  domain: string;
  isAutoFetch: boolean;
  accountNumber: string;
  accountType: string;
  ifscRouting: string;
}

const BANK_DOMAINS: Record<string, string> = {
  SBI: "sbi.co.in",
  HDFC: "hdfcbank.com",
  ICICI: "icicibank.com",
  Axis: "axisbank.com",
  Chase: "chase.com",
  HSBC: "hsbc.com",
  "Wells Fargo": "wellsfargo.com",
};

export function BankingView({ 
  userId, 
  filter = "all", 
  items = [], 
  loading = false,
  onRefresh
}: { 
  userId: string, 
  filter?: "all" | "accounts" | "cards",
  items?: VaultItemRow[],
  loading?: boolean,
  onRefresh?: () => void
}) {
  // Map decrypted cards
  const mappedCards: CardData[] = items
    .filter(i => (i as any).item_type === "card" && (i as any).decrypted_data)
    .map(i => {
      const d = (i as any).decrypted_data;
      return {
        id: i.id,
        name: i.title || "Payment Card",
        bankName: d.bankName || "Secure Vault Account",
        card: {
          cardholderName: d.cardholderName || "",
          number: d.cardNumber || "",
          expMonth: d.expMonth || "",
          expYear: d.expYear || "",
          code: d.code || "",
        },
        fields: [
          { name: "Account Number", value: d.accountNumber || "" },
          { name: "IFSC Code", value: d.ifscCode || "" },
        ],
      };
    });

  // Map decrypted banks
  const mappedBanks: BankData[] = items
    .filter(i => (i as any).item_type === "bank" && (i as any).decrypted_data)
    .map(i => {
      const d = (i as any).decrypted_data;
      return {
        id: i.id,
        bankName: d.bankName || "Unknown Bank",
        domain: d.domain || "",
        isAutoFetch: !!d.isAutoFetch,
        accountNumber: d.accountNumber || "",
        accountType: d.accountType || "Savings",
        ifscRouting: d.ifscRouting || "",
      };
    });

  const filteredCards = mappedCards.filter(card => {
    if (filter === "accounts") return false;
    return true; 
  });

  const filteredBanks = mappedBanks.filter(() => {
    if (filter === "cards") return false;
    return true;
  });

  return (
    <div className="w-full max-w-[1600px] mx-auto">
      {/* Dynamic Header with Corner Utilization */}
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between pb-8 border-b border-black/[0.03]">
        <div className="flex items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-black text-white shadow-2xl shadow-black/20 shrink-0 border border-white/10">
            <Landmark className="h-8 w-8 text-[#FF3B13]" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black tracking-tighter text-black lg:text-4xl">
                Banking <span className="text-[#FF3B13] tracking-normal italic uppercase text-2xl ml-1">Vault</span>
              </h1>
              <div className="px-2 py-0.5 rounded-md bg-green-50 text-green-600 border border-green-100 text-[9px] font-black uppercase tracking-widest h-fit">
                Active Cluster
              </div>
            </div>
            <p className="text-[12px] text-black/40 flex items-center gap-2 font-bold uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4 text-[#FF3B13]" />
              Non-custodial cryptographic ledger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick Stats in the Corner */}
          <div className="hidden lg:flex items-center gap-6 px-6 py-4 rounded-3xl bg-white border border-black/5 shadow-sm mr-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-black/30 uppercase tracking-widest">Instruments</span>
              <span className="text-sm font-bold text-black">{mappedCards.length + mappedBanks.length}</span>
            </div>
            <div className="h-8 w-[1px] bg-black/5" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-black/30 uppercase tracking-widest">Vault Status</span>
              <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                VERIFIED
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onRefresh} 
              disabled={loading}
              className="h-12 w-12 rounded-2xl border-black/10 bg-white hover:bg-black/5 text-black shadow-sm transition-all active:scale-95"
            >
              <RefreshCcw className={cn("h-5 w-5", loading && "animate-spin")} />
            </Button>
            
            <Link to="/vault/banking/new">
              <Button className="h-12 gap-3 rounded-2xl bg-[#FF3B13] px-8 font-black text-[11px] uppercase tracking-[0.2em] text-white shadow-xl shadow-[#FF3B13]/20 hover:scale-[1.02] active:scale-95 transition-all outline-none border border-white/10">
                <Plus className="h-5 w-5" />
                Secure Entry
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Grid Sections */}
      <div className="space-y-12">
        {/* Linked Banks Section */}
        {filteredBanks.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-black/30">Linked Bank Accounts</h2>
              <div className="flex-1 h-[1px] bg-black/5" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBanks.map((bank) => (
                <div key={bank.id} className="group relative flex flex-col gap-4 rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-[#FF3B13]/20">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl border border-black/5 flex items-center justify-center bg-white p-2">
                        <img 
                          src={`https://logo.clearbit.com/${bank.domain || BANK_DOMAINS[bank.bankName] || "bank.com"}`} 
                          alt="" 
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/2830/2830284.png";
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-black">{bank.bankName}</h3>
                        <p className="text-[10px] font-bold text-black/30 uppercase tracking-wider">{bank.accountType}</p>
                      </div>
                    </div>
                    {bank.isAutoFetch && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Zap className="h-3 w-3 fill-current" />
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 space-y-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-black/40">Account Number</span>
                      <p className="font-mono text-xs font-bold text-black/70">
                        {bank.isAutoFetch ? "•••• •••• ••••" : (bank.accountNumber || "—")}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-black/40">IFSC / Routing</span>
                      <p className="font-mono text-xs font-bold text-black/70">
                        {bank.isAutoFetch ? "Linked via Hub" : (bank.ifscRouting || "—")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 pt-4 border-t border-black/5 flex items-center justify-between">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-black/20">
                      {bank.isAutoFetch ? "Auto-Sync Active" : "Manual Record"}
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wider text-[#FF3B13] hover:bg-[#FF3B13]/5">
                      Verify
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Cards Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-black/30">Payment Instruments</h2>
            <div className="flex-1 h-[1px] bg-black/5" />
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 w-full animate-pulse rounded-3xl bg-black/5 border border-black/5" />
              ))}
            </div>
          ) : filteredCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCards.map((card) => {
                const accountNumber = card.fields.find(f => f.name === "Account Number")?.value;
                const ifscCode = card.fields.find(f => f.name === "IFSC Code")?.value;
                
                return (
                  <PaymentCard
                    key={card.id}
                    cardholderName={card.card.cardholderName}
                    cardNumber={card.card.number}
                    expMonth={card.card.expMonth}
                    expYear={card.card.expYear}
                    cvv={card.card.code}
                    accountNumber={accountNumber}
                    ifscCode={ifscCode}
                    bankName={card.bankName}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-black/10 bg-black/5 p-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-black/5">
                <CreditCard className="h-8 w-8 text-black/20" />
              </div>
              <h3 className="text-xl font-bold text-black">No Cards Found</h3>
              <p className="mt-2 text-[13px] font-medium text-black/50 max-w-sm">
                You haven't added any cards to your vault yet.
              </p>
            </div>
          )}
        </div>

        {/* Empty State when no data at all */}
        {!loading && filteredCards.length === 0 && filteredBanks.length === 0 && (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[3rem] border border-dashed border-black/10 bg-white p-12 text-center shadow-sm">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#FF3B13]/5">
              <ShieldCheck className="h-10 w-10 text-[#FF3B13]" />
            </div>
            <h3 className="text-2xl font-bold text-black">Your Financial Vault is Empty</h3>
            <p className="mt-3 text-[14px] font-medium text-black/40 max-w-md mx-auto leading-relaxed">
              Start by secure-adding your first banking instrument or payment card. Encryption happens locally on your machine.
            </p>
            <Link to="/vault/banking/new" className="mt-8">
              <Button
                className="h-12 rounded-xl bg-[#FF3B13] px-8 font-bold text-white shadow-xl shadow-[#FF3B13]/25 hover:bg-black transition-all"
              >
                Secure Addition
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
