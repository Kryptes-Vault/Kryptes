import type { MouseEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield, Folder, Database, Lock, Key } from "lucide-react";
import { BentoBox } from "@/components/landing/BentoBox";

const MotionLink = motion(Link);

const faqItems = [
  {
    question: "How does Zero-Knowledge work?",
    answer:
      "Your data is encrypted locally on your device using AES-GCM before it ever reaches our servers. The encryption key is derived from your master password, which is never transmitted to us. This means we physically cannot read your data.",
  },
  {
    question: "Can Kryptes recover my master password?",
    answer:
      "No. Your master password never leaves your device in a reversible form, so it cannot be recovered by Kryptes or anyone else.",
  },
  {
    question: "Where is the vault data stored?",
    answer:
      "Vault metadata is stored in our backend, while sensitive fields remain encrypted end-to-end. Only encrypted blobs leave your device.",
  },
  {
    question: "Is the ephemeral sharing fully secure?",
    answer:
      "Yes. Shared links are designed to expire after a single view, with the payload protected so it cannot be re-read once consumed.",
  },
];

const navLinks = [
  { href: "/", label: "Home", active: true },
  { href: "/#capabilities", label: "Capabilities", active: false },
  { href: "/#features", label: "Features", active: false },
  { href: "/#enterprise", label: "Enterprise", active: false },
  { href: "/#faq", label: "FAQ", active: false },
  { href: "/vault-finance", label: "Finance", active: false },
];

const BrandMark = () => (
  <a href="/" className="flex items-center gap-2 group">
    <img src="/kryptes.png" alt="Kryptes Logo" className="h-8 w-auto object-contain" />
    <span className="text-xl font-bold tracking-tight text-gray-900 ml-1">Kryptes</span>
  </a>
);

export default function Index() {
  const [activeFaqIndex, setActiveFaqIndex] = useState(0);
  const faqListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;

      if (target && faqListRef.current && !faqListRef.current.contains(target)) {
        setActiveFaqIndex(-1);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-orange-500/30 selection:text-black">
      
      {/* 
        Phase 1: Foundational Setup & Hero Section
        White background with a subtle dotted pattern 
      */}
      <section className="relative w-full pt-6 pb-32 overflow-hidden">
        {/* Dotted pattern background matching Symmetra (very light grey, tight spacing) */}
        <div 
          className="absolute inset-0 z-0 opacity-40" 
          style={{ backgroundImage: 'radial-gradient(circle, #d1d5db 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }} 
        />
        
        <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-10">
          
          {/* Navigation Bar */}
          <header className="flex items-center justify-between">
            <BrandMark />

            {/* Pill Navigation */}
            <nav className="hidden md:flex items-center bg-white border border-gray-100 rounded-full p-1.5 shadow-sm">
              {navLinks.map((link) => {
                const isRoute = link.href.startsWith("/") && !link.href.includes("#");
                const className = `px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  link.active 
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                }`;
                return isRoute ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    className={className}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    className={className}
                  >
                    {link.label}
                  </a>
                );
              })}
            </nav>

            {/* CTA */}
            <Link 
              to="/auth" 
              className="hidden md:inline-flex px-6 py-2.5 rounded-full bg-orange-500 text-white text-sm font-medium shadow-lg shadow-orange-500/25 transition-transform hover:scale-105 hover:bg-orange-600"
            >
              Access Vault
            </Link>
          </header>

          {/* Hero Content */}
          <div className="mt-20 md:mt-28 flex flex-col items-center text-center relative max-w-6xl mx-auto">
            
            <h1 className="text-5xl md:text-[5.5rem] lg:text-[6.2rem] font-bold tracking-tight text-gray-900 leading-[1.05] relative z-10 flex flex-col items-center">
              
              {/* Line 1 */}
              <div className="flex items-center justify-center gap-4 md:gap-6 whitespace-nowrap">
                <span>Secure and <span className="font-serif italic font-medium text-orange-600">Organize</span></span>
                {/* Server Sticker */}
                <motion.div 
                  className="hidden md:flex items-center justify-center -rotate-12 transform translate-y-2 z-20"
                  animate={{ y: [0, -8, 0], rotate: [-12, -8, -12] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Database className="w-16 h-16 text-orange-500 fill-orange-100 drop-shadow-xl" strokeWidth={1.5} />
                </motion.div>
              </div>

              {/* Line 2 */}
              <div className="flex items-center justify-center gap-4 md:gap-6 mt-2 md:mt-4 whitespace-nowrap">
                <span>Your</span>
                {/* Folder Sticker */}
                <motion.div 
                  className="hidden md:block rotate-[12deg] transform -translate-y-2 z-20"
                  animate={{ y: [0, 10, 0], rotate: [12, 16, 12] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Folder className="w-20 h-20 text-orange-500 fill-orange-100 drop-shadow-2xl" strokeWidth={1.5} />
                </motion.div>
                <span>Digital Life</span>
              </div>

              {/* Line 3 */}
              <div className="flex items-center justify-center gap-4 md:gap-6 mt-2 md:mt-4 whitespace-nowrap">
                <span>in One <span className="font-serif italic font-medium text-orange-600">Private</span> Vault</span>
                {/* Shield Sticker */}
                <motion.div 
                  className="hidden md:flex relative w-16 h-16 transform -translate-y-2 z-20"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <Shield className="absolute top-0 left-0 w-16 h-16 text-orange-500 fill-orange-100 drop-shadow-xl" strokeWidth={1.5} />
                </motion.div>
              </div>
            </h1>

            {/* Out-of-flow Floating Elements */}
            
            {/* Lock Sticker (Left side) */}
            <motion.div 
              className="absolute left-0 md:left-8 top-[60%] md:top-[40%] z-20"
              animate={{ y: [0, 15, 0], rotate: [-15, -5, -15] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
               <Lock className="w-16 h-16 md:w-24 md:h-24 text-orange-500 fill-orange-100 drop-shadow-2xl" strokeWidth={1.5} />
            </motion.div>

            {/* Key Sticker (Right side) */}
            <motion.div 
              className="absolute right-0 md:right-16 bottom-0 md:-bottom-8 z-20"
              animate={{ y: [0, -12, 0], rotate: [15, 25, 15] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            >
               <Key className="w-12 h-12 md:w-20 md:h-20 text-orange-500 fill-orange-100 drop-shadow-2xl" strokeWidth={1.5} />
            </motion.div>

            {/* Hero Buttons */}
            <div className="mt-16 flex items-center gap-4 relative z-30">
              <Link 
                to="/auth" 
                className="px-8 py-3.5 rounded-full bg-[#ea580c] text-white font-medium shadow-lg shadow-orange-500/20 transition-transform hover:scale-105"
              >
                Create Vault
              </Link>
              <a 
                href="#security" 
                className="px-8 py-3.5 rounded-full bg-gray-50 text-gray-700 font-medium transition-colors hover:bg-gray-100"
              >
                View features
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* Phase 2: Core Capabilities & Stats */}
      <section id="capabilities" className="bg-[#ea580c] py-20 text-white w-full">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="max-w-4xl">
            <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white mb-6">
              Core Capabilities
            </span>
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight leading-tight mb-16">
              Providing <span className="font-serif italic text-orange-200 font-normal">zero-knowledge</span> encryption solutions that transform your sensitive digital assets into a highly secure, private workspace.
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6 pt-10 border-t border-white/20">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">256-bit</div>
              <div className="text-white/80 text-sm font-medium">AES-GCM Encryption</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">0</div>
              <div className="text-white/80 text-sm font-medium">Server-held keys</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
              <div className="text-white/80 text-sm font-medium">Secure Access</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">100%</div>
              <div className="text-white/80 text-sm font-medium">Private & Isolated</div>
            </div>
          </div>
        </div>
      </section>

      {/* Phase 3: The 6 Bento Designs (Converted to Light Theme) */}
      <div id="features">
        <BentoBox />
      </div>

      {/* Phase 4: Featured Capabilities */}
      <section id="enterprise" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-4"><span className="font-serif italic font-medium text-orange-600">Enterprise</span> Features</h2>
            <p className="text-gray-500">Advanced cryptographic tools curated for exceptional security and professional enterprise standards.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Capability 1 */}
            <div className="group relative bg-gray-50 rounded-[32px] p-10 overflow-hidden border border-gray-100 transition-all hover:shadow-lg">
              <div className="absolute top-6 right-6 h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>
              <div className="mb-6">
                <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">Granular Gatekeeper</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4 max-w-xs leading-tight">Advanced Role-Based Access Control</h3>
              <p className="text-gray-500 text-sm max-w-sm mb-12">Configure custom rules and anomalies blocks to ensure keys are only decrypted exactly when and where they should be.</p>
              
              <div className="relative h-48 w-full rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-white" />
                <Shield className="h-20 w-20 text-orange-500 opacity-20" />
                <div className="absolute bottom-4 left-4 right-4 h-12 bg-gray-900 rounded-xl flex items-center px-4 shadow-lg">
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-3" />
                  <div className="h-2 w-24 bg-gray-700 rounded-full" />
                </div>
              </div>
            </div>

            {/* Capability 2 */}
            <div className="group relative bg-gray-50 rounded-[32px] p-10 overflow-hidden border border-gray-100 transition-all hover:shadow-lg">
              <div className="absolute top-6 right-6 h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>
              <div className="mb-6">
                <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">Ephemeral Sharing</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4 max-w-xs leading-tight">Burn-After-Read Shared Secrets</h3>
              <p className="text-gray-500 text-sm max-w-sm mb-12">Share sensitive data securely with external parties using URLs that permanently destruct after a single view.</p>
              
              <div className="relative h-48 w-full rounded-2xl bg-gray-900 shadow-inner overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiMzMzMiLz48L3N2Zz4=')] opacity-30" />
                <div className="relative h-16 w-16 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/50">
                  <div className="h-8 w-8 text-orange-500">
                     <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Phase 4: FAQ & Mobile Mockup Layout */}
      <section id="faq" className="bg-gray-50 py-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* FAQ Section (Left - 1 part conceptually, ~4/12 of grid) */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="mb-10 text-left">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-4">Frequently Asked Questions</h2>
                <p className="text-gray-500">Find answers regarding zero-knowledge encryption and vault architecture.</p>
              </div>

              <div ref={faqListRef} className="space-y-4">
                {faqItems.map((item, index) => {
                  const isOpen = index === activeFaqIndex;

                  return (
                    <div
                      key={item.question}
                      onClick={() => setActiveFaqIndex(isOpen ? -1 : index)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setActiveFaqIndex(isOpen ? -1 : index);
                        }
                      }}
                      className={`rounded-[24px] p-6 md:p-8 border transition-all ${
                        isOpen
                          ? "bg-orange-500 border-orange-500 text-white shadow-xl shadow-orange-500/20"
                          : "bg-white border-gray-200 hover:border-orange-200"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveFaqIndex(isOpen ? -1 : index)}
                        className="flex w-full items-center justify-between gap-4 text-left"
                        aria-expanded={isOpen}
                      >
                        <h4 className={`text-lg font-bold ${isOpen ? "text-white" : "text-gray-900"}`}>
                          {item.question}
                        </h4>
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                            isOpen
                              ? "bg-white/20 text-white"
                              : "bg-gray-50 text-gray-400"
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={isOpen ? "M20 12H4" : "M12 4v16m8-8H4"}
                            />
                          </svg>
                        </div>
                      </button>
                      <div
                        className={`grid transition-all duration-300 ease-out ${
                          isOpen ? "grid-rows-[1fr] mt-4" : "grid-rows-[0fr]"
                        }`}
                      >
                        <p
                          className={`overflow-hidden text-sm leading-relaxed pr-8 transition-opacity duration-300 ${
                            isOpen ? "text-orange-100 opacity-100" : "text-gray-500 opacity-0"
                          }`}
                        >
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile Interface Mockup (Right - 2 parts conceptually, ~7/12 of grid) */}
            <div className="lg:col-span-7 relative flex justify-center lg:justify-end">
              {/* Background abstract decoration */}
              <div className="absolute top-1/2 right-10 -translate-y-1/2 w-[500px] h-[500px] bg-orange-400/10 blur-[100px] rounded-full pointer-events-none" />
              
              <div className="relative w-full max-w-[340px] h-[680px] bg-gray-900 rounded-[3rem] border-[10px] border-gray-900 shadow-2xl overflow-hidden flex flex-col transform lg:rotate-3 transition-transform hover:rotate-0 duration-500">
                {/* Phone notch */}
                <div className="absolute top-0 inset-x-0 h-6 bg-gray-900 rounded-b-2xl w-36 mx-auto z-20" />
                
                {/* Mobile App Header */}
                <div className="pt-12 px-6 pb-6 bg-gray-900 text-white flex justify-between items-center relative z-10">
                  <div className="font-bold text-xl tracking-tight">Kryptes Vault</div>
                  <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-orange-500" />
                  </div>
                </div>
                
                {/* Mobile App Body */}
                <div className="flex-1 bg-gray-50 rounded-t-[2.5rem] p-6 overflow-y-auto scrollbar-hide relative z-10">
                  
                  {/* Security Score Widget */}
                  <div className="w-full h-40 bg-gradient-to-br from-[#ea580c] to-[#f97316] rounded-3xl shadow-lg p-6 text-white flex flex-col justify-between mb-8 relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    <div className="absolute top-0 right-0 p-6 opacity-40">
                      <Shield className="w-12 h-12" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-orange-100 mb-1">Security Score</div>
                      <div className="text-5xl font-black tracking-tight">98%</div>
                    </div>
                    <div className="text-xs text-orange-100 font-medium bg-black/10 self-start px-3 py-1.5 rounded-full backdrop-blur-md">
                      Vault is fully protected
                    </div>
                  </div>

                  {/* Vault Categories */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm font-bold text-gray-900 uppercase tracking-wider">Recent Items</div>
                      <div className="text-xs font-semibold text-orange-500 cursor-pointer hover:text-orange-600">See All</div>
                    </div>
                    <div className="space-y-3">
                      {/* Item 1 */}
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-colors hover:bg-gray-50">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 shrink-0">
                          <img src="/kryptes.png" alt="" className="w-6 h-6 opacity-60 filter grayscale" onError={(e) => e.currentTarget.style.display = 'none'} />
                          <div className="font-bold text-xl absolute">G</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-900 truncate">Google Account</div>
                          <div className="text-xs text-gray-400 truncate">admin@kryptes.com</div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </div>
                      
                      {/* Item 2 */}
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-colors hover:bg-gray-50">
                        <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white shrink-0">
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-900 truncate">Github Production</div>
                          <div className="text-xs text-gray-400 truncate">Personal Vault</div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </div>
                      
                      {/* Item 3 */}
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-colors hover:bg-gray-50">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 shrink-0">
                          <Folder className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-900 truncate">AWS SSH Keys</div>
                          <div className="text-xs text-gray-400 truncate">Work Vault</div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating Action Button */}
                  <div className="absolute bottom-6 right-6 w-14 h-14 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-xl shadow-gray-900/30 cursor-pointer hover:scale-105 transition-transform z-20">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  </div>
                  
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Phase 5: Final CTA & Footer */}
      <section className="bg-white pt-24 pb-12">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="bg-gray-50 rounded-[40px] p-10 md:p-16 border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative">
            <div className="relative z-10 max-w-xl">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
                Ready To Secure Your <span className="font-serif italic font-medium text-orange-600">Digital Life</span>
              </h2>
              <p className="text-gray-500 mb-10 text-lg">
                Join thousands of users who trust Kryptes to keep their most critical data completely private and instantly accessible.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link to="/auth" className="px-8 py-3.5 rounded-full bg-orange-500 text-white font-medium shadow-xl shadow-orange-500/30 transition-transform hover:scale-105 hover:bg-orange-600">
                  Create Vault
                </Link>
                <a href="#about" className="px-8 py-3.5 rounded-full bg-white text-gray-700 font-medium border border-gray-200 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-300">
                  View pricing
                </a>
              </div>
            </div>
            
            {/* CTA Graphic */}
            <div className="relative z-10 w-full max-w-sm hidden md:block">
               <div className="relative h-64 w-full rounded-2xl bg-white border border-gray-200 shadow-xl flex items-center justify-center p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNlN2U3ZTciLz48L3N2Zz4=')] opacity-50 rounded-2xl" />
                  <div className="bg-gray-900 w-full h-full rounded-xl shadow-inner relative flex flex-col items-center justify-center overflow-hidden">
                    <Shield className="w-16 h-16 text-orange-500 mb-4" />
                    <div className="text-white font-mono font-bold tracking-widest opacity-80">ENCRYPTED</div>
                    <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent" />
                  </div>
               </div>
            </div>
          </div>

          <footer className="mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
               <BrandMark />
            </div>
            <div className="flex items-center gap-8">
              <a href="#" className="hover:text-gray-900">Privacy Policy</a>
              <a href="#" className="hover:text-gray-900">Terms of Service</a>
              <a href="#" className="hover:text-gray-900">Help Center</a>
              <a href="#" className="hover:text-gray-900">Contact</a>
            </div>
            <div className="flex items-center gap-4">
               {/* Social Icons Placeholders */}
               <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 cursor-pointer transition-colors">in</div>
               <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 cursor-pointer transition-colors">X</div>
            </div>
          </footer>
        </div>
      </section>

    </div>
  );
}
