import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Loader2, 
  Globe, 
  X,
  Check,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CompanySuggestion {
  name: string;
  domain: string;
  logo: string;
}

interface AppAutocompleteProps {
  value: string;
  onChange: (name: string, domain: string, logo: string) => void;
  placeholder?: string;
}

export const AppAutocomplete: React.FC<AppAutocompleteProps> = ({ 
  value, 
  onChange,
  placeholder = "Search for a Website or App..." 
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced API Search
  useEffect(() => {
    if ((query || "").trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    // Don't search if the query matches the current selection exactly
    if (value === query && selectedLogo) return;

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(
          `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(query)}`,
          { signal: abortControllerRef.current.signal }
        );
        const data = await response.json();
        setSuggestions(data);
        setIsOpen(data.length > 0);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Clearbit API Error:", err);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, value, selectedLogo]);

  const handleSelect = (item: CompanySuggestion) => {
    setQuery(item.name);
    setSelectedLogo(item.logo);
    onChange(item.name, item.domain, item.logo);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val === "") {
        setSelectedLogo(null);
        onChange("", "", "");
    }
  };

  return (
    <div className="relative w-full font-sans" ref={dropdownRef}>
      <div className="relative group">
        {/* Leading Icon / App Logo */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 z-10">
          {selectedLogo ? (
            <img 
              src={selectedLogo} 
              alt="App Logo" 
              className="w-5 h-5 rounded-md object-contain"
              onError={() => setSelectedLogo(null)}
            />
          ) : (
            <Globe className="w-4 h-4 text-black/20 dark:text-white/20" />
          )}
        </div>

        {/* The Input Field */}
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-[#f8f8f8] dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl pl-12 pr-12 py-4 text-xs font-bold tracking-widest text-[#111] dark:text-white outline-none transition-all focus:ring-2 focus:ring-[#FF3300]/50 focus:border-[#FF3300] placeholder:text-black/20 dark:placeholder:text-white/20 shadow-sm"
        />

        {/* Trailing Indicators (Loader or Chevron) */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#FF3300]" />
          ) : (
            <ChevronDown className={`w-3.5 h-3.5 text-black/20 dark:text-white/20 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          )}
        </div>
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-[#0f0f0f] border border-black/5 dark:border-white/10 rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.1)] backdrop-blur-md dark:backdrop-blur-xl"
          >
            <div className="max-h-[280px] overflow-y-auto scrollbar-hide py-2">
              {suggestions.map((item, index) => (
                <button
                  key={item.domain + index}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center p-1 border border-black/5 dark:border-white/5 shadow-sm">
                    <img 
                        src={item.logo} 
                        alt={item.name} 
                        className="w-full h-full object-contain" 
                        loading="lazy"
                    />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#111] dark:text-white truncate">
                      {item.name}
                    </span>
                    <span className="text-[9px] font-medium text-black/40 dark:text-white/30 truncate">
                      {item.domain}
                    </span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Check className="w-3 h-3 text-[#FF3300]" />
                  </div>
                </button>
              ))}
            </div>
            
            {/* API Attribution */}
            <div className="px-4 py-2 border-t border-black/5 dark:border-white/5 bg-[#fafafa] dark:bg-black/20">
               <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-black/20 dark:text-white/10 text-center">
                 Powered by Clearbit
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
