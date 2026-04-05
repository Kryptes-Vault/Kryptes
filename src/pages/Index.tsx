import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Lock, Shield, Smartphone, Zap, User, Key, Eye, EyeOff } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";

const logos = [
  { name: "PAPERZ", img: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Logo_TV_2015.svg" },
  { name: "Dorfus", img: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Android_O_Preview_Logo.png" },
  { name: "Martino", img: "https://upload.wikimedia.org/wikipedia/commons/8/87/AVerMedia_Technologies_logo.svg" },
  { name: "square", img: "https://upload.wikimedia.org/wikipedia/commons/5/52/Free_logo.svg" },
  { name: "Gobona", img: "https://upload.wikimedia.org/wikipedia/commons/6/69/AirBnb_Logo_2014.svg" },
];
const serviceItems = ["FINANCE ENGINE", "ZERO-KNOWLEDGE VAULT", "UNIFIED DASHBOARD", "SMART SCHEDULER", "ON-DEVICE AUTOMATION"];

const Index = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAuthVisible, setIsAuthVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Transform values for the 4 cards
  const x1 = useTransform(scrollYProgress, [0.3, 0.6], [0, -100]);
  const y1 = useTransform(scrollYProgress, [0.3, 0.6], [0, -80]);
  const x2 = useTransform(scrollYProgress, [0.3, 0.6], [0, 100]);
  const y2 = useTransform(scrollYProgress, [0.3, 0.6], [0, -80]);
  const x3 = useTransform(scrollYProgress, [0.3, 0.6], [0, -100]);
  const y3 = useTransform(scrollYProgress, [0.3, 0.6], [0, 80]);
  const x4 = useTransform(scrollYProgress, [0.3, 0.6], [0, 100]);
  const y4 = useTransform(scrollYProgress, [0.3, 0.6], [0, 80]);

  const toggleAuth = () => setIsAuthVisible(!isAuthVisible);

  return (
    <div className="min-h-screen bg-white text-[#111111] font-sans selection:bg-[#FF3B13] selection:text-white overflow-x-hidden">
      <main className="mx-auto max-w-7xl px-6 sm:px-12 pt-12 sm:pt-24">
        {/* Hero Section */}
        <section className="relative pb-20">
          <div className="hidden lg:flex absolute left-[-40px] top-12 flex-col items-center text-[10px] text-[#FF3B13] uppercase tracking-[0.18em] font-medium">
            <span className="[writing-mode:vertical-rl] rotate-180">Scroll Down</span>
            <span className="mt-4 text-xs">?</span>
          </div>

          <div className="flex flex-col items-center text-center relative z-40">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <h1 className="text-[3rem] sm:text-[5rem] lg:text-[7.5rem] tracking-tighter leading-[0.8] font-medium uppercase text-black max-w-[1000px] flex flex-col items-center">
                <span className="italic font-black scale-x-125 inline-flex origin-center">
                  <motion.span animate={{ x: isAuthVisible ? -150 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>ZE</motion.span>
                  <motion.span animate={{ x: isAuthVisible ? 150 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>RO</motion.span>
                </span>
                <span className="italic font-black scale-x-125 inline-flex origin-center mt-2">
                  <motion.span animate={{ x: isAuthVisible ? -150 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>KNOW</motion.span>
                  <motion.span animate={{ x: isAuthVisible ? 150 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>LEDGE</motion.span>
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
              <h1 className="text-[3rem] sm:text-[5rem] lg:text-[7.5rem] tracking-tighter leading-[0.8] font-medium uppercase text-black max-w-[1000px] flex flex-col items-center">
                <span className="inline-flex">
                  <motion.span animate={{ x: isAuthVisible ? -200 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>DIGI</motion.span>
                  <motion.span animate={{ x: isAuthVisible ? 200 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>TAL</motion.span>
                </span>
                <span className="inline-flex mt-2">
                  <motion.span animate={{ x: isAuthVisible ? -200 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>ECOSY</motion.span>
                  <motion.span animate={{ x: isAuthVisible ? 200 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>STEM</motion.span>
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

          {/* Login Interface Overlay */}
          <AnimatePresence>
            {isAuthVisible && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
                {/* Backdrop / Click-outside Area */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={toggleAuth}
                  className="absolute inset-0 bg-white/60 backdrop-blur-md cursor-pointer"
                />
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white rounded-[2.5rem] border border-black/10 shadow-[0_40px_100px_rgba(0,0,0,0.2)] p-8 sm:p-12 w-full max-w-md relative z-10"
                >
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold tracking-tight text-black uppercase">Kryptex</h2>
                      <p className="text-xs text-black/40 mt-2 font-bold uppercase tracking-widest">Zero-Knowledge Entry</p>
                    </div>

                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#FF3B13] ml-4">Identifier</label>
                          <div className="relative group">
                             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-[#FF3B13] transition-colors">
                                <User className="w-5 h-5" />
                             </div>
                             <input 
                               type="text" 
                               placeholder="USERNAME OR EMAIL"
                               className="w-full bg-[#f8f8f8] border border-black/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold tracking-widest focus:outline-none focus:border-[#FF3B13] transition-all"
                             />
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#FF3B13] ml-4">Access Key</label>
                          <div className="relative group">
                             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-[#FF3B13] transition-colors">
                                <Key className="w-5 h-5" />
                             </div>
                             <input 
                               type={showPassword ? "text" : "password"}
                               placeholder="������������"
                               className="w-full bg-[#f8f8f8] border border-black/5 rounded-2xl py-4 pl-12 pr-12 text-xs font-bold tracking-widest focus:outline-none focus:border-[#FF3B13] transition-all"
                             />
                             <button 
                               onClick={() => setShowPassword(!showPassword)}
                               className="absolute right-4 top-1/2 -translate-y-1/2 text-black/20 hover:text-black transition-colors"
                             >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                             </button>
                          </div>
                       </div>

                       <button className="w-full bg-[#FF3B13] text-white py-5 rounded-2xl font-bold text-xs tracking-[0.2em] shadow-[0_15px_30px_rgba(255,59,19,0.3)] hover:bg-black transition-all flex items-center justify-center gap-4 group">
                          INITIATE SYNC
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                       </button>

                       <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest px-4">
                          <button onClick={toggleAuth} className="text-black/40 hover:text-black">Cancel</button>
                          <button className="text-[#FF3B13] hover:underline">Trouble Logging in?</button>
                       </div>
                    </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Hero Concept Container */}
          <div ref={containerRef} className="mt-16 sm:mt-24 rounded-[3rem] bg-[#f8f8f8] border border-black/5 h-[400px] sm:h-[600px] w-full overflow-hidden relative shadow-sm flex items-center justify-center">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 flex items-center justify-center opacity-40">
              <div className="w-[80%] h-[150%] sm:w-[600px] sm:h-[600px] rounded-full blur-[100px] bg-[radial-gradient(circle_at_50%_50%,#FF3B13_0%,#FF8B5E_40%,transparent_80%)]" />
            </div>
            
            {/* Grid Pattern Texture */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />

            {/* Central Concept Visualization */}
            <div className="relative z-10 w-full max-w-4xl px-8 flex flex-col items-center justify-center">
               <div className="relative">
                  {/* Central Shield/Lock Element (Book/Door Opening) */}
                  <div className="flex gap-1 relative z-20">
                    <motion.div 
                      animate={{ 
                        rotateY: isAuthVisible ? -110 : 0,
                        x: isAuthVisible ? -40 : 0,
                        scale: isAuthVisible ? 0.9 : 1
                      }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                      className="w-16 h-32 sm:w-24 sm:h-48 rounded-l-full bg-white border-y border-l border-black/5 flex items-center justify-end overflow-hidden origin-right shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
                    >
                       <div className="relative translate-x-1/2">
                          <Lock className="w-12 h-12 sm:w-16 sm:h-16 text-[#FF3B13]" />
                       </div>
                    </motion.div>
                    
                    <motion.div 
                      animate={{ 
                        rotateY: isAuthVisible ? 110 : 0,
                        x: isAuthVisible ? 40 : 0,
                        scale: isAuthVisible ? 0.9 : 1
                      }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                      className="w-16 h-32 sm:w-24 sm:h-48 rounded-r-full bg-white border-y border-r border-black/5 flex items-center justify-start overflow-hidden origin-left shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
                    >
                       <div className="relative -translate-x-1/2">
                          <Lock className="w-12 h-12 sm:w-16 sm:h-16 text-[#FF3B13]" />
                       </div>
                    </motion.div>
                  </div>

                  {/* Transforming Connecting Nodes */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
                     {/* Node 1: Local Processing */}
                     <motion.div 
                        style={{ x: x1, y: y1 }}
                        className="absolute -top-16 -left-24 sm:-top-20 sm:-left-40 bg-white/80 backdrop-blur-md border border-black/5 p-4 rounded-2xl flex items-center gap-3 shadow-sm"
                     >
                        <div className="w-8 h-8 rounded-full bg-[#FF3B13]/10 flex items-center justify-center text-[#FF3B13]">
                           <Smartphone className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-black text-xs font-bold leading-none">Local Processing</p>
                          <p className="text-black/40 text-[10px] mt-1">Siloed on-device</p>
                        </div>
                     </motion.div>

                     {/* Node 2: AES-256 Auth */}
                     <motion.div 
                        style={{ x: x2, y: y2 }}
                        className="absolute -top-16 -right-24 sm:-top-20 sm:-right-40 bg-white/80 backdrop-blur-md border border-black/5 p-4 rounded-2xl flex items-center gap-3 shadow-sm"
                     >
                        <div className="w-8 h-8 rounded-full bg-[#FF3B13]/10 flex items-center justify-center text-[#FF3B13]">
                           <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-black text-xs font-bold leading-none">AES-256 Auth</p>
                          <p className="text-black/40 text-[10px] mt-1">Zero-Knowledge</p>
                        </div>
                     </motion.div>

                     {/* Node 3: Offline Engine */}
                     <motion.div 
                        style={{ x: x3, y: y3 }}
                        className="absolute top-32 -left-24 sm:top-24 sm:-left-48 bg-white/80 backdrop-blur-md border border-black/5 p-4 rounded-2xl flex items-center gap-3 shadow-sm"
                     >
                        <div className="w-8 h-8 rounded-full bg-[#FF3B13]/10 flex items-center justify-center text-[#FF3B13]">
                           <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-black text-xs font-bold leading-none">Offline Engine</p>
                          <p className="text-black/40 text-[10px] mt-1">No API calls required</p>
                        </div>
                     </motion.div>

                     {/* Node 4: Secure Storage */}
                     <motion.div 
                        style={{ x: x4, y: y4 }}
                        className="absolute top-32 -right-24 sm:top-24 sm:-right-48 bg-white/80 backdrop-blur-md border border-black/5 p-4 rounded-2xl flex items-center gap-3 shadow-sm"
                     >
                        <div className="w-8 h-8 rounded-full bg-[#FF3B13]/10 flex items-center justify-center text-[#FF3B13]">
                           <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-black text-xs font-bold leading-none">Secure Vault</p>
                          <p className="text-black/40 text-[10px] mt-1">On-Device Keys</p>
                        </div>
                     </motion.div>
                  </div>
               </div>
            </div>
          </div>

          {/* Logos List */}
          <div className="mt-16 flex flex-wrap items-center justify-center sm:justify-between gap-8 text-black/40 font-semibold tracking-wider text-xs uppercase">
             <span>NO CLOUD HARVESTING</span>
             <span>ON-DEVICE PROCESSING</span>
             <span>AES-256 ENCRYPTED</span>
             <span>100% FREE</span>
             <span>BACKGROUND ORCHESTRATION</span>
          </div>
        </section>

        {/* Our Project Section */}
        <section className="py-20 border-t border-black/10">
          <div className="flex items-center justify-between mb-12">
            <p className="text-sm text-[#FF3B13] font-semibold uppercase tracking-wider">// CORE ARCHITECTURE</p>
            <div className="hidden sm:flex gap-3 text-black/60">
              <button className="h-12 w-12 rounded-full border border-black/10 flex items-center justify-center hover:bg-black hover:text-white transition-colors"><ChevronLeft className="h-5 w-5" /></button>
              <button className="h-12 w-12 rounded-full border border-black/10 flex items-center justify-center hover:bg-black hover:text-white transition-colors"><ChevronRight className="h-5 w-5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            <article className="group cursor-pointer">
              <div className="rounded-[2rem] bg-[#f4f4f4] aspect-[4/3] overflow-hidden relative shadow-sm border border-black/5">
                <div className="absolute inset-x-8 inset-y-8 bg-black rounded-3xl overflow-hidden shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]">
                   <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,59,19,0.4),rgba(0,0,0,1)_60%)]" />
                   <div className="absolute inset-0 flex flex-col justify-end p-8 text-white bg-gradient-to-t from-black/80 to-transparent">
                      <h4 className="text-3xl font-medium tracking-tight leading-tight">THE SMART<br/>SCHEDULER</h4>
                      <p className="mt-4 text-sm text-white/60 max-w-sm leading-relaxed">Dynamic daily planner acting. It tracks agendas and sends contextual reminders without sending your calendar to the cloud.</p>
                   </div>
                   <div className="absolute bottom-6 right-6 h-10 w-10 bg-[#FF3B13] rounded-full flex items-center justify-center text-white sm:scale-0 group-hover:scale-100 transition-transform">
                      <ArrowUpRight className="h-5 w-5" />
                   </div>
                </div>
              </div>
              <div className="mt-6 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-tight">SMART SCHEDULE</h3>
                  <p className="text-sm text-black/50 mt-1 uppercase tracking-widest text-[10px]">CONTEXTUAL REMINDERS</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-[#FF3B13] text-white flex items-center justify-center group-hover:bg-black transition-colors">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </div>
            </article>

            <article className="group cursor-pointer">
              <div className="rounded-[2rem] bg-[#f4f4f4] aspect-[4/3] overflow-hidden relative shadow-sm border border-black/5">
                 <div className="absolute inset-x-8 inset-y-8 bg-white rounded-3xl overflow-hidden shadow-2xl transition-transform duration-700 group-hover:scale-[1.02] border border-black/10 p-8 flex flex-col items-center justify-center text-center">
                    <h4 className="text-2xl font-bold uppercase tracking-tighter">FINANCE<br/>ENGINE</h4>
                    <div className="mt-8 flex justify-between w-full border-t border-black/10 pt-6">
                      <div><p className="text-xl text-[#FF3B13] font-bold">100%</p><p className="text-[8px] text-black/50 uppercase">OFFLINE PARSING</p></div>
                      <div><p className="text-xl font-bold">0</p><p className="text-[8px] text-black/50 uppercase">BANK APIs USED</p></div>
                      <div><p className="text-xl font-bold">ON</p><p className="text-[8px] text-black/50 uppercase">DEVICE SMS SYNC</p></div>
                    </div>
                    <p className="text-xs text-black/50 mt-6 leading-relaxed">Securely categorizes UPI and bank alerts directly on your phone.</p>
                 </div>
              </div>
              <div className="mt-6 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-tight">AUTO TRACKER</h3>
                  <p className="text-sm text-black/50 mt-1 uppercase tracking-widest text-[10px]">LOCAL FINANCE ENGINE</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-white border border-black/10 text-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </div>
            </article>
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
                 <span className="h-12 w-12 rounded-full bg-[#FF3B13] text-white flex items-center justify-center group-hover:bg-black transition-colors">
                  <ArrowRight className="h-5 w-5" />
                </span>
                DISCOVER THE SOLUTION
              </button>
           </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 h-[400px]">
            <div className="bg-[#f4f4f4] border border-black/5 rounded-3xl overflow-hidden relative flex flex-col items-center justify-center text-black/80">
               <h3 className="font-bold text-2xl tracking-tighter mb-2 text-black">Z-K VAULT</h3>
               <p className="text-xs max-w-[200px] text-center opacity-60">Locked using an on-device master key. Even we can't see your data.</p>
               <div className="absolute bottom-[-30px] right-[-30px] w-48 h-48 bg-[#FF3B13] rounded-full blur-[60px] opacity-[0.08]"></div>
            </div>
            
            <div className="bg-[#FF3B13] rounded-3xl overflow-hidden p-8 flex flex-col justify-end text-white shadow-[0_20px_40px_rgba(255,59,19,0.2)]">
               <div className="bg-white text-[#FF3B13] w-32 h-10 mb-auto flex items-center justify-center text-xs font-bold tracking-widest uppercase rounded-lg shadow-sm">UNIFIED</div>
               <div className="bg-black/5 backdrop-blur-md w-full p-6 shadow-lg rounded-2xl flex items-start gap-4 border border-white/10">
                  <div className="w-10 h-10 flex-shrink-0 rounded-full bg-white/20"></div>
                  <div>
                    <div className="h-3 w-20 bg-white/40 rounded-full mb-3"></div>
                    <div className="h-2 w-full bg-white/20 rounded-full mb-2"></div>
                    <div className="h-2 w-3/4 bg-white/20 rounded-full"></div>
                  </div>
               </div>
            </div>
            
            <div className="bg-[#f4f4f4] border border-black/5 rounded-3xl overflow-hidden flex items-center justify-center relative">
               <div className="w-52 h-64 bg-black rounded-2xl shadow-2xl flex flex-col items-start p-6 text-white transform rotate-3">
                  <div className="h-8 w-8 rounded-full bg-[#FF3B13] mb-auto shadow-[0_0_15px_rgba(255,59,19,0.5)]"></div>
                  <span className="font-bold text-xl uppercase tracking-tighter">All In One</span>
                  <span className="text-xs text-white/50 mt-1 uppercase tracking-widest">Digital Flow</span>
               </div>
            </div>
        </div>
      </section>

      <section className="py-24 sm:py-32 px-6 sm:px-12 bg-white">
         <div className="max-w-7xl mx-auto">
            <p className="text-sm text-[#FF3B13] font-semibold uppercase tracking-wider mb-6">// THE SOLUTION</p>
            <h2 className="text-[2.5rem] sm:text-[3.5rem] leading-[1] tracking-tight font-medium uppercase mb-16">
               THE UNIFIED ECOSYSTEM
            </h2>
            
            <div className="flex flex-col gap-4">
               {serviceItems.map((item, idx) => {
                 const isHoveredItem = idx === 1; 
                 return (
                   <div key={item} className={`group cursor-pointer border border-black/10 transition-colors duration-500 overflow-hidden rounded-3xl ${isHoveredItem ? 'bg-black text-white border-black' : 'bg-white hover:bg-black hover:text-white hover:border-black'}`}>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-6 sm:py-8 px-6 sm:px-10">
                         <div className="flex items-center gap-12 w-full">
                            <span className="text-lg sm:text-2xl font-bold uppercase tracking-tight min-w-[250px]">{item}</span>
                            {isHoveredItem && (
                              <div className="hidden lg:flex items-center gap-6 flex-1 px-8 animate-in fade-in duration-500">
                                 <div className="w-16 h-16 bg-[#FF3B13] rounded-2xl flex-shrink-0 shadow-2xl relative overflow-hidden flex items-center justify-center text-white font-bold opacity-80" />
                                 <div className="flex-1 text-sm text-white/60 leading-relaxed max-w-sm pl-4">
                                     A fully encrypted storage module for passwords, certificates, and sensitive documents. Locked strictly by device keys.
                                 </div>
                              </div>
                            )}
                         </div>

                         <div className="flex items-center gap-6 mt-4 sm:mt-0 sm:gap-12 pl-0 sm:pl-4 self-end sm:self-auto">
                            <span className="text-sm font-medium opacity-50">0{idx + 1}</span>
                            <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-all duration-300 ${isHoveredItem ? 'bg-[#FF3B13] text-white rotate-[-45deg]' : 'opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 group-hover:bg-white group-hover:text-black group-hover:-rotate-45'}`}>
                               <ArrowRight className="h-5 w-5" />
                            </div>
                         </div>
                      </div>
                   </div>
                 );
               })}
            </div>
         </div>
      </section>
    </div>
  );
};

export default Index;
