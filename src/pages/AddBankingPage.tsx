import React from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AddDebitCardForm } from "@/components/kryptex/AddDebitCardForm";
import { Button } from "@/components/ui/button";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";

export default function AddBankingPage() {
  const navigate = useNavigate();
  const { user } = useSupabaseUser();

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-[#111] flex flex-col items-center py-12 px-4 selection:bg-[#FF3B13] selection:text-white">
      <div className="w-full max-w-md flex flex-col gap-8 bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm">
        {/* Simple Header without Sidebar */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/dashboard")}
            className="gap-2 text-black/40 hover:text-black/80 hover:bg-black/5 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF3B13]/10">
            <ShieldCheck className="h-5 w-5 text-[#FF3B13]" />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Secure <span className="text-[#FF3B13] italic">Addition</span></h1>
          <p className="mt-2 text-[13px] font-medium text-black/40">
            Encryption happens locally on your machine before reaching the vault.
          </p>
        </div>

        <div className="flex justify-center">
          {/* We refactor the form to be cleaner for a full page if needed, but the original is already well-styled */}
          <AddDebitCardForm 
            userId={user?.id || ""} 
            onSuccess={() => navigate("/dashboard")} 
          />
        </div>
        
        <p className="text-center text-[10px] font-medium text-black/30 mt-2 leading-relaxed max-w-[280px] mx-auto uppercase tracking-wider">
          By clicking save, your credentials are encrypted via AES-256 and pushed to your Bitwarden-backed secure vault.
        </p>
      </div>
    </div>
  );
}
