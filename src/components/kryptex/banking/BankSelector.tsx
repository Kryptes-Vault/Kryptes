import * as React from "react";
import { Check, ChevronsUpDown, Landmark } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const SUPPORTED_BANKS = [
  // Top Indian Banks
  { label: "HDFC Bank", value: "HDFC", domain: "hdfcbank.com" },
  { label: "ICICI Bank", value: "ICICI", domain: "icicibank.com" },
  { label: "State Bank of India (SBI)", value: "SBI", domain: "sbi.co.in" },
  { label: "Kotak Mahindra Bank", value: "Kotak", domain: "kotak.com" },
  { label: "Axis Bank", value: "Axis", domain: "axisbank.com" },
  { label: "IndusInd Bank", value: "IndusInd", domain: "indusind.com" },
  { label: "IDFC FIRST Bank", value: "IDFC", domain: "idfcfirstbank.com" },
  { label: "Bank of Baroda", value: "BoB", domain: "bankofbaroda.in" },
  { label: "Punjab National Bank", value: "PNB", domain: "pnbindia.in" },
  { label: "Canara Bank", value: "Canara", domain: "canarabank.com" },
  { label: "Union Bank of India", value: "UnionBank", domain: "unionbankofindia.co.in" },
  { label: "IDBI Bank", value: "IDBI", domain: "idbibank.in" },
  { label: "Indian Bank", value: "IndianBank", domain: "indianbank.in" },
  { label: "Bank of India", value: "BoI", domain: "bankofindia.co.in" },
  { label: "Central Bank of India", value: "CentralBank", domain: "centralbankofindia.co.in" },
  { label: "Yes Bank", value: "YesBank", domain: "yesbank.in" },
  { label: "Federal Bank", value: "FederalBank", domain: "federalbank.co.in" },
  { label: "South Indian Bank", value: "SouthIndian", domain: "southindianbank.com" },
  { label: "RBL Bank", value: "RBL", domain: "rblbank.com" },
  { label: "Bandhan Bank", value: "Bandhan", domain: "bandhanbank.com" },
  { label: "Karur Vysya Bank", value: "KVB", domain: "kvb.co.in" },
  { label: "Karnataka Bank", value: "KarnatakaBank", domain: "karnatakabank.com" },
  { label: "UCO Bank", value: "UCOBank", domain: "ucobank.com" },
  { label: "Bank of Maharashtra", value: "BoM", domain: "bankofmaharashtra.in" },
  { label: "J&K Bank", value: "JKBank", domain: "jkbank.com" },

  // Top Global Banks
  { label: "JPMorgan Chase", value: "Chase", domain: "chase.com" },
  { label: "Bank of America", value: "BoA", domain: "bankofamerica.com" },
  { label: "Citigroup", value: "Citi", domain: "citi.com" },
  { label: "Wells Fargo", value: "WellsFargo", domain: "wellsfargo.com" },
  { label: "Goldman Sachs", value: "Goldman", domain: "goldmansachs.com" },
  { label: "Morgan Stanley", value: "MorganStanley", domain: "morganstanley.com" },
  { label: "HSBC", value: "HSBC", domain: "hsbc.com" },
  { label: "Barclays", value: "Barclays", domain: "barclays.com" },
  { label: "Standard Chartered", value: "StanChart", domain: "sc.com" },
  { label: "Deutsche Bank", value: "Deutsche", domain: "db.com" },
  { label: "BNP Paribas", value: "BNP", domain: "bnpparibas.com" },
  { label: "UBS", value: "UBS", domain: "ubs.com" },
  { label: "Societe Generale", value: "SocGen", domain: "socgen.com" },
  { label: "Santander", value: "Santander", domain: "santander.com" },
  { label: "Bank of China", value: "BoC", domain: "boc.cn" },
  { label: "DBS Bank", value: "DBS", domain: "dbs.com" },
];

export function BankSelector({ value, onSelect }: { value: string; onSelect: (value: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedBank = SUPPORTED_BANKS.find((bank) => bank.value === value);

  // Filter logic: Show Exactly 2 banks if search is empty, otherwise show filtered matches
  const filteredBanks = search.trim() === ""
    ? SUPPORTED_BANKS.slice(0, 2) // Initial 2-bank preview
    : SUPPORTED_BANKS.filter(b => 
        b.label.toLowerCase().includes(search.toLowerCase()) || 
        b.domain.toLowerCase().includes(search.toLowerCase())
      );

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) setSearch(""); // Reset search on close
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full h-12 justify-between rounded-2xl border-black/5 bg-white text-xs text-black/60 shadow-sm transition-all hover:bg-black/5"
        >
          {selectedBank ? (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg border border-black/5 bg-white p-1 flex items-center justify-center shrink-0">
                <img 
                  src={`https://logo.clearbit.com/${selectedBank.domain}`} 
                  alt="" 
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/2830/2830284.png";
                  }}
                />
              </div>
              <span className="font-bold text-black">{selectedBank.label}</span>
            </div>
          ) : (
            <span className="px-1 text-black/40 font-bold uppercase tracking-widest text-[10px]">Identify Financial Institution</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      {/* Overlapping Content: Aligning search exactly over the trigger bar */}
      <PopoverContent 
        sideOffset={-48} 
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl overflow-hidden border-black/10 shadow-2xl bg-white z-[60]"
      >
        <Command shouldFilter={false} className="bg-transparent">
          <div className="flex items-center border-b border-black/5 px-2 bg-white">
            <CommandInput 
              placeholder="Search by bank name..." 
              value={search}
              onValueChange={setSearch}
              className="h-12 text-xs font-bold uppercase tracking-widest placeholder:text-black/20 border-none focus:ring-0" 
            />
          </div>
          <CommandList className="max-h-[350px] scrollbar-hide overflow-y-auto bg-[#FAFAFB]/50">
            <CommandEmpty className="py-8 text-center text-xs font-bold text-black/20 uppercase tracking-widest">No matching institution found</CommandEmpty>
            <CommandGroup 
              heading={search === "" ? "Most Popular" : "Matching Institutions"} 
              className="p-2"
            >
              {filteredBanks.map((bank) => (
                <CommandItem
                  key={bank.value}
                  value={bank.label}
                  onSelect={() => {
                    onSelect(bank.value === value ? "" : bank.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="rounded-xl flex items-center gap-4 py-2.5 px-3 data-[selected=true]:bg-black data-[selected=true]:text-white transition-all cursor-pointer group mb-1"
                >
                  <div className="h-10 w-10 rounded-xl border border-black/5 bg-white p-1.5 flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110">
                    <img 
                      src={`https://logo.clearbit.com/${bank.domain}`} 
                      alt={bank.label} 
                      className="h-full w-full object-contain rounded-md bg-white p-0.5" 
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => { 
                        e.currentTarget.style.display = 'none'; 
                        if (e.currentTarget.nextElementSibling) {
                          (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'; 
                        }
                      }} 
                    />
                    <Landmark className="h-6 w-6 text-black/20 hidden" />
                  </div>
                  <div className="flex flex-col flex-1 text-left">
                    <span className="text-[11px] font-bold uppercase tracking-widest leading-none">{bank.label}</span>
                    <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest mt-1.5">{bank.domain}</span>
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4 text-[#FF3B13] transition-opacity",
                      value === bank.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            {search === "" && SUPPORTED_BANKS.length > 2 && (
              <div className="p-4 text-center border-t border-black/[0.03]">
                <p className="text-[8px] font-bold text-black/20 uppercase tracking-[0.2em]">Start typing to see full database</p>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Institutional Database: 40+ Certified Banks
