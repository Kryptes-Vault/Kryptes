import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Plus, 
  CreditCard, 
  ShieldCheck, 
  RefreshCcw 
} from "lucide-react";
import { MiniSidebar } from "@/components/kryptex/MiniSidebar";
import { PaymentCard } from "@/components/kryptex/PaymentCard";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
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

export default function BankingDashboard() {
  const { user } = useSupabaseUser();
  const location = useLocation();
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/vault/cards?userId=${user.id}`);
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
  }, [user?.id]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <MiniSidebar />
      
      <main className="flex-1 pl-16 md:pl-20 transition-all duration-300">
        <div className="container max-w-7xl px-6 py-10">
          {/* Header */}
          <header className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 glow-orange transition-all duration-500">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl animate-in fade-in slide-in-from-left-4 duration-500">
                  Banking & <span className="text-primary italic">Cards</span>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-vault-glow" />
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
                className="rounded-xl border-border/40 bg-secondary/50 hover:bg-secondary"
              >
                <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
              
              <Link to="/vault/banking/new">
                <Button className="h-11 gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all outline-none">
                  <Plus className="h-5 w-5" />
                  Add New Entry
                </Button>
              </Link>
            </div>
          </header>

          {/* Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 w-full animate-pulse rounded-3xl bg-secondary/30 border border-white/5" />
              ))}
            </div>
          ) : cards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {cards.map((card) => {
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
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-secondary/10 p-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/30">
                <CreditCard className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-xl font-semibold">No Cards Found</h3>
              <p className="mt-2 max-w-xs text-muted-foreground">
                You haven't added any cards to your vault yet. Start securing your banking credentials now.
              </p>
              <Link to="/vault/banking/new">
                <Button className="mt-6 h-11 rounded-xl bg-[#FF3B13] px-6 font-semibold text-white shadow-lg shadow-[#FF3B13]/25 hover:bg-[#e6350f] hover:text-white">
                  Create your first entry
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


