import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Lock, Shield, Smartphone, Zap, User, Key, Eye, EyeOff, Mail, Phone, CheckCircle2 } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

const apiBase = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

/** OAuth return URL: always matches the current origin (localhost:5173, Vercel, etc.) — never a hardcoded port. */
function getOAuthRedirectUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

async function syncApiSession(accessToken: string) {
  const res = await fetch(`${apiBase}/api/auth/supabase/sync`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "API session sync failed");
  }
}

const logos = [
  { name: "PAPERZ", img: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Logo_TV_2015.svg" },
  { name: "Dorfus", img: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Android_O_Preview_Logo.png" },
  { name: "Martino", img: "https://upload.wikimedia.org/wikipedia/commons/8/87/AVerMedia_Technologies_logo.svg" },
  { name: "square", img: "https://upload.wikimedia.org/wikipedia/commons/5/52/Free_logo.svg" },
  { name: "Gobona", img: "https://upload.wikimedia.org/wikipedia/commons/6/69/AirBnb_Logo_2014.svg" },
];
const serviceItems = ["FINANCE ENGINE", "ZERO-KNOWLEDGE VAULT", "UNIFIED DASHBOARD", "SMART SCHEDULER", "ON-DEVICE AUTOMATION"];

const Index = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAuthVisible, setIsAuthVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    confirmPassword: ""
  });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const x1 = useTransform(scrollYProgress, [0.3, 0.6], [0, -100]);
  const y1 = useTransform(scrollYProgress, [0.3, 0.6], [0, -80]);
  const x2 = useTransform(scrollYProgress, [0.3, 0.6], [0, 100]);
  const y2 = useTransform(scrollYProgress, [0.3, 0.6], [0, -80]);
  const x3 = useTransform(scrollYProgress, [0.3, 0.6], [0, -100]);
  const y3 = useTransform(scrollYProgress, [0.3, 0.6], [0, 80]);
  const x4 = useTransform(scrollYProgress, [0.3, 0.6], [0, 100]);
  const y4 = useTransform(scrollYProgress, [0.3, 0.6], [0, 80]);

  const toggleAuth = () => {
    setIsAuthVisible(!isAuthVisible);
    setEmailSent(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: formData.identifier,
          password: formData.password,
          options: {
            emailRedirectTo: getOAuthRedirectUrl(),
          },
        });
        if (error) {
          toast.error(error.message);
        } else {
          setEmailSent(true);
          toast.success("Check your email to confirm your account.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.identifier,
          password: formData.password,
        });
        if (error) {
          toast.error(error.message);
        } else if (data.session) {
          await syncApiSession(data.session.access_token);
          toast.success("Welcome back!");
          setIsAuthVisible(false);
          navigate("/dashboard");
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider: "google" | "azure" | "twitter") => {
    setOauthLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getOAuthRedirectUrl(),
        },
      });
      if (error) toast.error(error.message);
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] font-sans selection:bg-[#FF3B13] selection:text-white overflow-x-hidden">
      {/* Navigation / Header */}
      <header className="fixed top-0 left-0 right-0 z-[110] px-6 sm:px-12 py-6 bg-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tighter uppercase italic">KRYPTEX</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 sm:px-12 pt-12 sm:pt-24">
        {/* Hero Section */}
        <section className="relative pb-20 pt-16">
          <div className="hidden lg:flex absolute left-[-40px] top-12 flex-col items-center text-[10px] text-[#FF3B13] uppercase tracking-[0.18em] font-medium">
            <span className="[writing-mode:vertical-rl] rotate-180">Scroll Down</span>
            <span className="mt-4 text-xs">?</span>
          </div>

          <div className="flex flex-col items-center text-center relative z-40">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <h1 className="text-black max-w-[1000px] flex flex-col items-center tracking-tighter leading-[0.8] font-medium uppercase">
                <span className="italic font-black scale-x-125 inline-flex origin-center text-[11vw] sm:text-[5rem] lg:text-[7.5rem]">
                  <motion.span animate={{ x: isAuthVisible ? -100 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>ZE</motion.span>
                  <motion.span animate={{ x: isAuthVisible ? 100 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>RO</motion.span>
                </span>
                <span className="italic font-black scale-x-125 inline-flex origin-center mt-2 text-[11vw] sm:text-[5rem] lg:text-[7.5rem]">
                  <motion.span animate={{ x: isAuthVisible ? -100 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>KNOW</motion.span>
                  <motion.span animate={{ x: isAuthVisible ? 100 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>LEDGE</motion.span>
                </span>
              </h1>
            </div>

            <div className="relative z-[60] mt-4 mb-4">
              <button 
                onClick={toggleAuth}
                className="h-10 sm:h-16 px-4 sm:px-6 rounded-full border border-black/10 bg-white hover:border-[#FF3B13] group flex items-center gap-2 sm:gap-4 transition-colors shadow-xl"
              >
                <span className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-[#FF3B13] text-white flex items-center justify-center group-hover:bg-black transition-colors">
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <span className="text-xs sm:text-sm text-[#FF3B13] font-semibold tracking-wide uppercase">SECURE NOW</span>
              </button>
            </div>

            <div className="relative">
              <h1 className="text-black max-w-[1000px] flex flex-col items-center tracking-tighter leading-[0.8] font-medium uppercase">
                <span className="inline-flex text-[11vw] sm:text-[5rem] lg:text-[7.5rem]">
                  <motion.span animate={{ x: isAuthVisible ? -150 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>DIGI</motion.span>
                  <motion.span animate={{ x: isAuthVisible ? 150 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>TAL</motion.span>
                </span>
                <span className="inline-flex mt-2 text-[11vw] sm:text-[5rem] lg:text-[7.5rem]">
                  <motion.span animate={{ x: isAuthVisible ? -150 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>ECOSY</motion.span>
                  <motion.span animate={{ x: isAuthVisible ? 150 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>STEM</motion.span>
                </span>
              </h1>
              <motion.p 
                animate={{ opacity: isAuthVisible ? 0 : 1, y: isAuthVisible ? 20 : 0 }}
                className="mt-8 sm:mt-12 max-w-lg mx-auto text-base text-black/50 font-medium px-4"
              >
                We are building a unified "Super App" designed to act as your secure, automated personal assistant. Never trade your privacy for convenience again.
              </motion.p>
            </div>
          </div>

          <AnimatePresence>
            {isAuthVisible && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-6">
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={toggleAuth}
                  className="absolute inset-0 bg-white/60 backdrop-blur-md cursor-pointer"
                />
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-black/10 shadow-[0_40px_100px_rgba(0,0,0,0.2)] p-6 sm:p-12 w-full max-w-md relative z-10"
                >
                  {emailSent ? (
                    <div className="text-center py-8">
                       <CheckCircle2 className="w-16 h-16 text-[#FF3B13] mx-auto mb-6" />
                       <h2 className="text-2xl font-bold text-black uppercase mb-2">Check Your Email</h2>
                       <p className="text-sm text-black/50 mb-8">We have sent a verification link to your inbox. Please verify to activate your Kryptex vault.</p>
                       <button onClick={toggleAuth} className="w-full bg-black text-white py-4 rounded-xl font-bold text-xs tracking-widest uppercase">GOT IT</button>
                    </div>
                  ) : (
                    <form onSubmit={handleAuth} className="space-y-6">
                      <div className="text-center mb-6 sm:mb-8 flex flex-col items-center">
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-black uppercase">Kryptex</h2>
                        <p className="text-[10px] sm:text-xs text-black/40 mt-1 sm:mt-2 font-bold uppercase tracking-widest">Zero-Knowledge Entry</p>
                      </div>

                      <div className="space-y-4">
                        {/* SOCIAL AUTH OPTIONS */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                          <button
                            type="button"
                            disabled={!!oauthLoading}
                            onClick={() => signInWithProvider("google")}
                            className="flex items-center justify-center p-3.5 bg-white border border-black/5 rounded-xl hover:border-[#FF3B13] transition-all group shadow-sm disabled:opacity-50"
                          >
                            <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" className="w-5 h-5 transition-all" alt="Google" />
                          </button>
                          <button
                            type="button"
                            disabled={!!oauthLoading}
                            onClick={() => signInWithProvider("azure")}
                            className="flex items-center justify-center p-3.5 bg-white border border-black/5 rounded-xl hover:border-[#FF3B13] transition-all group shadow-sm disabled:opacity-50"
                          >
                            <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" className="w-5 h-5 transition-all" alt="Microsoft" />
                          </button>
                          <button
                            type="button"
                            disabled={!!oauthLoading}
                            onClick={() => signInWithProvider("twitter")}
                            className="flex items-center justify-center p-3.5 bg-white border border-black/5 rounded-xl hover:border-[#FF3B13] transition-all group shadow-sm disabled:opacity-50"
                          >
                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-black transition-all" aria-hidden>
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-[9px] text-center text-black/35 mb-2 font-medium uppercase tracking-wide">
                          Yahoo and other providers: add via Supabase custom OAuth (see docs/architecture_update.md)
                        </p>

                        <div className="relative mb-6">
                          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/5"></div></div>
                          <div className="relative flex justify-center text-[8px] font-bold uppercase tracking-widest"><span className="bg-white px-2 text-black/30">OR CONTINUE WITH</span></div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#FF3B13] ml-4">Email or Phone Number</label>
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-[#FF3B13] transition-colors">
                              <Mail className="w-4 h-4" />
                            </div>
                            <input 
                              required
                              type="text" 
                              placeholder="EMAIL OR PHONE"
                              value={formData.identifier}
                              onChange={(e) => setFormData({...formData, identifier: e.target.value})}
                              className="w-full bg-[#f8f8f8] border border-black/5 rounded-xl py-3.5 pl-11 pr-4 text-[10px] sm:text-xs font-bold tracking-widest focus:outline-none focus:border-[#FF3B13] transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#FF3B13] ml-4">Access Key</label>
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-[#FF3B13] transition-colors">
                              <Key className="w-4 h-4" />
                            </div>
                            <input 
                              required
                              type={showPassword ? "text" : "password"}
                              placeholder="������������"
                              value={formData.password}
                              onChange={(e) => setFormData({...formData, password: e.target.value})}
                              className="w-full bg-[#f8f8f8] border border-black/5 rounded-xl py-3.5 pl-11 pr-11 text-[10px] sm:text-xs font-bold tracking-widest focus:outline-none focus:border-[#FF3B13] transition-all"
                            />
                            <button 
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-black/20 hover:text-black transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {isSignUp && (
                          <div className="space-y-1.5">
                            <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#FF3B13] ml-4">Confirm Access Key</label>
                            <div className="relative group">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-[#FF3B13] transition-colors">
                                <Key className="w-4 h-4" />
                              </div>
                              <input 
                                required
                                type={showPassword ? "text" : "password"}
                                placeholder="������������"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                className="w-full bg-[#f8f8f8] border border-black/5 rounded-xl py-3.5 pl-11 pr-11 text-[10px] sm:text-xs font-bold tracking-widest focus:outline-none focus:border-[#FF3B13] transition-all"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <button 
                        disabled={loading}
                        className="w-full bg-[#FF3B13] text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-[10px] sm:text-xs tracking-[0.2em] shadow-[0_15px_30px_rgba(255,59,19,0.3)] hover:bg-black transition-all flex items-center justify-center gap-3 sm:gap-4 group disabled:opacity-50"
                      >
                        {loading ? "PROCESSING..." : isSignUp ? "CREATE VAULT" : "LOGIN"}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 sm:px-4">
                        <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-[#FF3B13] hover:underline">
                          {isSignUp ? "Already have a vault?" : "Need a vault?"}
                        </button>
                        <button type="button" onClick={toggleAuth} className="text-black/40 hover:text-black">Cancel</button>
                      </div>
                    </form>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <div ref={containerRef} className="mt-16 sm:mt-24 relative rounded-[3rem] bg-[#f8f8f8] border border-black/5 h-[400px] sm:h-[600px] w-full overflow-hidden shadow-sm flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center opacity-40">
              <div className="w-[80%] h-[150%] sm:w-[600px] sm:h-[600px] rounded-full blur-[100px] bg-[radial-gradient(circle_at_50%_50%,#FF3B13_0%,#FF8B5E_40%,transparent_80%)]" />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />
            <div className="relative z-10 w-full max-w-4xl px-8 flex flex-col items-center justify-center">
               <div className="relative">
                  <div className="flex gap-1 relative z-20">
                    <motion.div 
                      animate={{ rotateY: isAuthVisible ? -110 : 0, x: isAuthVisible ? -40 : 0, scale: isAuthVisible ? 0.9 : 1 }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                      className="w-16 h-32 sm:w-24 sm:h-48 rounded-l-full bg-white border-y border-l border-black/5 flex items-center justify-end overflow-hidden origin-right shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
                    >
                       <div className="relative translate-x-1/2"><Lock className="w-12 h-12 sm:w-16 sm:h-16 text-[#FF3B13]" /></div>
                    </motion.div>
                    <motion.div 
                      animate={{ rotateY: isAuthVisible ? 110 : 0, x: isAuthVisible ? 40 : 0, scale: isAuthVisible ? 0.9 : 1 }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                      className="w-16 h-32 sm:w-24 sm:h-48 rounded-r-full bg-white border-y border-r border-black/5 flex items-center justify-start overflow-hidden origin-left shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
                    >
                       <div className="relative -translate-x-1/2"><Lock className="w-12 h-12 sm:w-16 sm:h-16 text-[#FF3B13]" /></div>
                    </motion.div>
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
                     <motion.div style={{ x: x1, y: y1 }} className="absolute -top-16 -left-24 sm:-top-20 sm:-left-40 bg-white/80 backdrop-blur-md border border-black/5 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-[#FF3B13]/10 flex items-center justify-center text-[#FF3B13]"><Smartphone className="w-4 h-4" /></div>
                        <div><p className="text-black text-xs font-bold leading-none">Local Processing</p><p className="text-black/40 text-[10px] mt-1">Siloed on-device</p></div>
                     </motion.div>
                     <motion.div style={{ x: x2, y: y2 }} className="absolute -top-16 -right-24 sm:-top-20 sm:-right-40 bg-white/80 backdrop-blur-md border border-black/5 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-[#FF3B13]/10 flex items-center justify-center text-[#FF3B13]"><Shield className="w-4 h-4" /></div>
                        <div><p className="text-black text-xs font-bold leading-none">AES-256 Auth</p><p className="text-black/40 text-[10px] mt-1">Zero-Knowledge</p></div>
                     </motion.div>
                     <motion.div style={{ x: x3, y: y3 }} className="absolute top-32 -left-24 sm:top-24 sm:-left-48 bg-white/80 backdrop-blur-md border border-black/5 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-[#FF3B13]/10 flex items-center justify-center text-[#FF3B13]"><Zap className="w-4 h-4" /></div>
                        <div><p className="text-black text-xs font-bold leading-none">Offline Engine</p><p className="text-black/40 text-[10px] mt-1">No API calls required</p></div>
                     </motion.div>
                     <motion.div style={{ x: x4, y: y4 }} className="absolute top-32 -right-24 sm:top-24 sm:-right-48 bg-white/80 backdrop-blur-md border border-black/5 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-[#FF3B13]/10 flex items-center justify-center text-[#FF3B13]"><Lock className="w-4 h-4" /></div>
                        <div><p className="text-black text-xs font-bold leading-none">Secure Vault</p><p className="text-black/40 text-[10px] mt-1">On-Device Keys</p></div>
                     </motion.div>
                  </div>
               </div>
            </div>
          </div>
        </section>
      </main>
      <section className="bg-[#fcfcfc] border-y border-black/5 text-[#111111] py-24 sm:py-32 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-12">
           <div className="max-w-4xl">
              <p className="text-sm text-[#FF3B13] font-medium uppercase tracking-wider mb-8">// THE PROBLEM</p>
              <h2 className="text-[2.2rem] sm:text-[3.2rem] lg:text-[4rem] leading-[1.1] tracking-tight font-bold text-black/90">
                MANAGING DIGITAL LIFE REQUIRES JUGGLING A HIGHLY
                <span className="text-black/30"> FRAGMENTED ECOSYSTEM OF DATA-HARVESTING APPLICATIONS.</span>
              </h2>
           </div>
           <div className="flex flex-col gap-6 lg:pb-4 min-w-[280px]">
              <p className="text-sm text-black/50 border-l border-[#FF3B13]/50 pl-4">
                Most productivity apps monetize by harvesting your data. Truly secure alternatives drain your wallet. It's time to end the privacy tax and cognitive overload.
              </p>
              <button className="inline-flex items-center gap-4 text-sm text-[#FF3B13] font-semibold w-fit hover:opacity-80 transition-opacity group">
                 <span className="h-12 w-12 rounded-full bg-[#FF3B13] text-white flex items-center justify-center group-hover:bg-black transition-colors"><ArrowRight className="h-5 w-5" /></span>
                DISCOVER THE SOLUTION
              </button>
           </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
