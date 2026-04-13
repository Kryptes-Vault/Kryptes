import React, { useState } from "react";
import { ArrowLeft, ShieldCheck, CreditCard, Landmark, Shield, Lock, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AddDebitCardForm } from "@/components/kryptex/banking/AddDebitCardForm";
import { AddBankForm } from "@/components/kryptex/banking/AddBankForm";
import { Button } from "@/components/ui/button";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AddBankingPage() {
  const navigate = useNavigate();
  const { user } = useSupabaseUser();
  const [activeTab, setActiveTab] = useState("card");

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-[#111] flex flex-col items-center selection:bg-[#FF3B13] selection:text-white overflow-x-hidden">
      {/* FULL WIDTH HEADER: Pushing navigation elements to the absolute corners */}
      <div className="w-full flex items-center justify-between py-6 px-6 md:px-16 border-b border-black/[0.03] bg-white/30 backdrop-blur-sm sticky top-0 z-50">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/dashboard/banking")}
          className="group gap-2 text-black/40 hover:text-black/80 hover:bg-black/5 rounded-xl px-4 h-11 transition-all"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="font-bold uppercase tracking-[0.2em] text-[10px]">Back to Dashboard</span>
        </Button>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Secure Connection</span>
            <span className="text-[9px] font-mono text-black/20">NODE_ID: 0x82A_VAULT</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-black/5 shadow-sm">
            <Lock className="h-4 w-4 text-green-500" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/60">Encrypted</span>
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Content Area: Expanded to fill most of the screen width */}
      <div className="w-full max-w-[1400px] flex flex-col gap-12 py-10 md:py-20 px-6 md:px-16">
        
        <div className="flex flex-col md:flex-row gap-16 lg:gap-24 items-start">
          
          {/* Laptop Left Column: Expanded Branding & Technical Details */}
          <div className="hidden md:flex flex-[0.8] flex-col gap-10 pt-4">
            <div>
              <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-[#FF3B13] text-white shadow-xl shadow-[#FF3B13]/20 mb-8 border border-white/20">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter leading-[0.9] text-black">
                Vault <br />
                <span className="text-[#FF3B13] italic">Provisioning</span>
              </h1>
              <p className="mt-8 text-sm font-bold uppercase tracking-widest text-black/30 leading-relaxed max-w-[340px]">
                Establishing zero-knowledge tunnel for financial asset encryption.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <div className="flex gap-5 items-start">
                <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-green-50 text-green-600 border border-green-100 shadow-sm">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[11px] font-black text-black uppercase tracking-[0.2em]">Client-Side Cipher</h3>
                  <p className="text-[11px] text-black/40 font-bold uppercase tracking-wider mt-2 leading-relaxed">Local AES-256-GCM encryption with randomized IV per transaction.</p>
                </div>
              </div>
              
              <div className="flex gap-5 items-start">
                <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-[#FF3B13]/5 text-[#FF3B13] border border-[#FF3B13]/10 shadow-sm">
                  <Zap className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-[11px] font-black text-black uppercase tracking-[0.2em]">Non-Custodial Sync</h3>
                  <p className="text-[11px] text-black/40 font-bold uppercase tracking-wider mt-2 leading-relaxed">No private keys ever persist in plaintext on our clusters.</p>
                </div>
              </div>
            </div>

            {/* Unique "Corner Widget" for tech details */}
            <div className="mt-6 p-6 rounded-3xl border border-black/[0.03] bg-white shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-black/[0.03] pb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/20">Security Topology</span>
                <div className="h-2 w-12 rounded-full bg-black/[0.03]" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-black/40 uppercase tracking-widest">Protocol</span>
                  <span className="text-[9px] font-mono font-bold text-green-600">TLS 1.3 / AES</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-black/40 uppercase tracking-widest">Latency</span>
                  <span className="text-[9px] font-mono font-bold text-black/40">~14ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Area: Multi-Column Expansion */}
          <div className="w-full flex-[1.2] flex flex-col gap-8">
            
            {/* Mobile-only Header */}
            <div className="text-center md:hidden mb-4">
              <h1 className="text-3xl font-black tracking-tighter uppercase italic">Secure <span className="text-[#FF3B13]">Entry</span></h1>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-black/30 text-center mx-auto">
                Local cryptographic processing active.
              </p>
            </div>

            <Tabs defaultValue="card" className="w-full" onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2 scrollbar-hide">
                <TabsList className="flex rounded-2xl p-1.5 bg-white border border-black/5 shadow-sm h-14 w-full md:w-auto md:min-w-[400px]">
                  <TabsTrigger 
                    value="card" 
                    className="flex-1 rounded-xl data-[state=active]:bg-[#FF3B13] data-[state=active]:text-white transition-all gap-3 text-[11px] font-black uppercase tracking-[0.2em]"
                  >
                    <CreditCard className="h-4 w-4" />
                    Debit/Credit
                  </TabsTrigger>
                  <TabsTrigger 
                    value="bank" 
                    className="flex-1 rounded-xl data-[state=active]:bg-black data-[state=active]:text-white transition-all gap-3 text-[11px] font-black uppercase tracking-[0.2em]"
                  >
                    <Landmark className="h-4 w-4" />
                    Institutions
                  </TabsTrigger>
                </TabsList>
                
                {/* Visual Status Indicator in desktop */}
                <div className="hidden lg:flex items-center gap-3 px-6 h-14 rounded-2xl bg-white border border-black/5 shadow-sm ml-6 shrink-0">
                  <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Ready to Encrypt</span>
                </div>
              </div>

              <div className="transition-all animate-in fade-in zoom-in-[0.98] duration-500">
                <TabsContent value="card" className="w-full m-0 outline-none">
                  <AddDebitCardForm 
                    userId={user?.id || ""} 
                    onSuccess={() => navigate("/dashboard/banking")} 
                  />
                </TabsContent>
                <TabsContent value="bank" className="w-full m-0 outline-none">
                  <AddBankForm 
                    userId={user?.id || ""} 
                    onSuccess={() => navigate("/dashboard/banking")} 
                  />
                </TabsContent>
              </div>
            </Tabs>
            
            <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4 py-6 border-t border-black/[0.03]">
              <p className="text-[9px] font-bold text-black/20 uppercase tracking-[0.25em] text-center md:text-left">
                Secured by Kryptes Zero-Knowledge Protocol v2.4.1
              </p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-black/10" />
                  <span className="text-[9px] font-bold text-black/20 uppercase tracking-widest">FIPS 140-2</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-black/10" />
                  <span className="text-[9px] font-bold text-black/20 uppercase tracking-widest">PCI-DSS COMPLIANT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
