import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Plus, 
  CreditCard, 
  ShieldCheck, 
  RefreshCcw 
} from "lucide-react";
import { PaymentCard } from "@/components/kryptex/PaymentCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CardData {
  id: string;
  name: string;
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

export function BankingView({ userId, filter = "all" }: { userId: string, filter?: "all" | "accounts" | "cards" }) {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/vault/cards?userId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch cards");
      const data = await response.json();
      setCards(data.cards || []);
    } catch (error) {
      console.error("Fetch cards error:", error);
      toast.error("Could not sync banking vault");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [userId]);

  const filteredCards = cards.filter(card => {
    const hasAccount = !!card.fields.find(f => f.name === "Account Number")?.value;
    if (filter === "accounts") return hasAccount;
    if (filter === "cards") return !hasAccount; // Or just return all cards that aren't strictly an account only, but this is simple enough
    return true; // "all"
  });

  return (
    <div className="w-full">
      {/* Header aligned with other Dashboard sections */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-black/5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF3B13]/10">
            <CreditCard className="h-6 w-6 text-[#FF3B13]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black sm:text-3xl">
              Banking & <span className="text-[#FF3B13] italic">Cards</span>
            </h1>
            <p className="mt-1 text-[13px] text-black/40 flex items-center gap-2 font-medium">
              <ShieldCheck className="h-4 w-4 text-[#FF3B13]" />
              Your payment instruments and bank accounts, encrypted with AES-256.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchCards} 
            disabled={loading}
            className="rounded-xl border-black/10 bg-white hover:bg-black/5 text-black"
          >
            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          
          <Link to="/vault/banking/new">
            <Button className="h-11 gap-2 rounded-xl bg-[#FF3B13] px-6 font-semibold text-white shadow-lg shadow-[#FF3B13]/20 hover:scale-[1.02] active:scale-95 transition-all outline-none">
              <Plus className="h-5 w-5" />
              Add New Entry
            </Button>
          </Link>
        </div>
      </header>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 w-full animate-pulse rounded-3xl bg-black/5 border border-black/5" />
          ))}
        </div>
      ) : filteredCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              />
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-black/10 bg-black/5 p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-black/5">
            <CreditCard className="h-8 w-8 text-black/20" />
          </div>
          <h3 className="text-xl font-bold text-black">No Cards Found</h3>
          <p className="mt-2 text-[13px] font-medium text-black/50 max-w-sm">
            You haven't added any cards to your vault yet. Start securing your banking credentials now.
          </p>
          <Link to="/vault/banking/new">
            <Button 
              variant="outline" 
              className="mt-6 rounded-xl border-black/10 text-black hover:bg-black/5"
            >
              Create your first entry
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
