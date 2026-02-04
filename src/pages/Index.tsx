import { Lock, Shield, Smartphone, Zap, ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { lazy, Suspense, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Login from "@/components/kryptex/Login";

/* ── Lazy-load the 3D canvas so Three.js never blocks initial paint ── */
const VaultIntroCanvas = lazy(
  () => import("@/components/vault-intro/VaultIntroCanvas")
);

/* ── Stagger orchestration for hero content reveal ─────────────────── */
const heroReveal = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

const Index = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAuthVisible, setIsAuthVisible] = useState(false);
  const [isIntroComplete, setIsIntroComplete] = useState(false);

  const handleAnimationComplete = useCallback(() => {
    setIsIntroComplete(true);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Floating card animation transforms
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
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#FF3B13] selection:text-white overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════════════
          3D Vault Intro Overlay — fixed fullscreen, z-50
          Unmounts from DOM once animation fires isIntroComplete.
          AnimatePresence handles the exit fade.
          ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {!isIntroComplete && (
          <Suspense
            fallback={
              /* Subtle loader dot while Three.js chunk downloads */
              <motion.div
                key="intro-loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-white pointer-events-none"
              >
                <div className="w-3 h-3 rounded-full bg-[#10B981] animate-pulse" />
              </motion.div>
            }
          >
            <VaultIntroCanvas
              key="vault-intro"
              onAnimationComplete={handleAnimationComplete}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* ── Background Grid ────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
      </div>

      {/* ══════════════════════════════════════════════════════════════
          Main Page Content — hidden until intro completes.
          Uses AnimatePresence to fade in the hero section ONLY after
          the 3D sequence signals completion and unmounts.
          ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isIntroComplete && (
          <motion.main
            key="main-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 mx-auto max-w-7xl px-6 sm:px-12 pt-8 sm:pt-16 font-mono"
          >
            {/* ── Hero Section ─────────────────────────────────────── */}
            <section className="relative pb-20 pt-16">
              <div className="hidden lg:flex absolute left-[-40px] top-12 flex-col items-center text-[10px] text-black/20 uppercase tracking-[0.3em] font-black">
                <span className="[writing-mode:vertical-rl] rotate-180">Initialize protocol</span>
                <span className="mt-4 text-xs">//</span>
              </div>

              <div className="flex flex-col items-center text-center relative z-40">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col items-center"
                >
                  <div className="flex items-center justify-center gap-4 flex-wrap">
                    <motion.h1
                      custom={0}
                      variants={heroReveal}
                      className="text-black max-w-[1000px] flex flex-col items-center tracking-tighter leading-[0.8] font-black uppercase"
                    >
                      <span className="italic font-black scale-x-125 inline-flex origin-center text-[11vw] sm:text-[5rem] lg:text-[7.5rem]">
                        <motion.span animate={{ x: isAuthVisible ? -100 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>ZE</motion.span>
                        <motion.span animate={{ x: isAuthVisible ? 100 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>RO</motion.span>
                      </span>
                      <span className="italic font-black scale-x-125 inline-flex origin-center mt-2 text-[11vw] sm:text-[5rem] lg:text-[7.5rem] text-[#FF3B13]">
                        <motion.span animate={{ x: isAuthVisible ? -100 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>KNOW</motion.span>
                        <motion.span animate={{ x: isAuthVisible ? 100 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>LEDGE</motion.span>
                      </span>
                    </motion.h1>
                  </div>

                  <motion.div
                    custom={1}
                    variants={heroReveal}
                    className="relative z-[60] mt-12 mb-12"
                  >
                    <button
                      onClick={toggleAuth}
                      className="h-10 sm:h-20 px-6 sm:px-10 rounded-full border border-black/10 bg-white hover:border-[#FF3B13] group flex items-center gap-2 sm:gap-6 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_rgba(255,59,19,0.15)] active:scale-95"
                    >
                      <span className="h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-[#FF3B13] text-white flex items-center justify-center group-hover:bg-black transition-colors">
                        <Lock className="h-4 w-4 sm:h-6 sm:w-6" />
                      </span>
                      <span className="text-xs sm:text-base text-black font-black tracking-[0.3em] uppercase">ACCESS VAULT</span>
                    </button>
                  </motion.div>

                  <div className="relative">
                    <motion.h1
                      custom={2}
                      variants={heroReveal}
                      className="text-black max-w-[1000px] flex flex-col items-center tracking-tighter leading-[0.8] font-black uppercase"
                    >
                      <span className="inline-flex text-[11vw] sm:text-[5rem] lg:text-[7.5rem]">
                        <motion.span animate={{ x: isAuthVisible ? -150 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>DIGI</motion.span>
                        <motion.span animate={{ x: isAuthVisible ? 150 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>TAL</motion.span>
                      </span>
                      <span className="inline-flex mt-2 text-[11vw] sm:text-[5rem] lg:text-[7.5rem]">
                        <motion.span animate={{ x: isAuthVisible ? -150 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>ECOSY</motion.span>
                        <motion.span animate={{ x: isAuthVisible ? 150 : 0, opacity: isAuthVisible ? 0 : 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>STEM</motion.span>
                      </span>
                    </motion.h1>
                    <motion.p
                      custom={3}
                      variants={heroReveal}
                      className="mt-8 sm:mt-16 max-w-lg mx-auto text-[10px] sm:text-xs text-black/40 font-bold px-4 leading-loose tracking-[0.2em] uppercase"
                    >
                      KRYPTEX_PROTOCOL_V2.0 // DEPLOYING UNIFIED ZERO-KNOWLEDGE INFRASTRUCTURE. YOUR IDENTITY IS YOUR KEY. PRIVACY IS THE STANDARD.
                    </motion.p>
                  </div>
                </motion.div>
              </div>

              <Login isVisible={isAuthVisible} onClose={() => setIsAuthVisible(false)} />

              {/* ── Interactive Vault Visualization ────────────────── */}
              <div ref={containerRef} className="mt-24 sm:mt-32 relative rounded-[3rem] bg-white border border-black/5 h-[450px] sm:h-[650px] w-full overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.05)] flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <div className="w-[80%] h-[150%] sm:w-[600px] sm:h-[600px] rounded-full blur-[120px] bg-[radial-gradient(circle_at_50%_50%,#FF3B13_0%,#8b1e0a_40%,transparent_80%)]" />
                </div>

                <div className="relative z-10 w-full max-w-4xl px-8 flex flex-col items-center justify-center">
                   <div className="relative">
                     <div className="flex gap-2 relative z-20">
                       <motion.div
                         animate={{ rotateY: isAuthVisible ? -110 : 0, x: isAuthVisible ? -50 : 0, scale: isAuthVisible ? 0.9 : 1 }}
                         transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                         className="w-16 h-32 sm:w-28 sm:h-56 rounded-l-full bg-white border-y border-l border-black/5 flex items-center justify-end overflow-hidden origin-right shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
                       >
                          <div className="relative translate-x-1/2 text-[#FF3B13] opacity-20"><Lock className="w-12 h-12 sm:w-20 sm:h-20" /></div>
                       </motion.div>
                       <motion.div
                         animate={{ rotateY: isAuthVisible ? 110 : 0, x: isAuthVisible ? 50 : 0, scale: isAuthVisible ? 0.9 : 1 }}
                         transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                         className="w-16 h-32 sm:w-28 sm:h-56 rounded-r-full bg-white border-y border-r border-black/5 flex items-center justify-start overflow-hidden origin-left shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
                       >
                          <div className="relative -translate-x-1/2 text-[#FF3B13] opacity-20"><Lock className="w-12 h-12 sm:w-20 sm:h-20" /></div>
                       </motion.div>
                     </div>

                     {/* Floating Metric Cards */}
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
                        <motion.div style={{ x: x1, y: y1 }} className="absolute -top-24 -left-24 sm:-top-28 sm:-left-56 bg-white/80 backdrop-blur-xl border border-black/5 p-4 rounded-2xl flex items-center gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
                           <div className="w-10 h-10 rounded-xl bg-[#FF3B13]/5 flex items-center justify-center text-[#FF3B13]"><Smartphone className="w-5 h-5" /></div>
                           <div><p className="text-black text-[10px] font-black tracking-widest leading-none">LOCAL_SYNC</p><p className="text-black/30 text-[9px] mt-1 font-mono">ENCRYPTED_ON_DEVICE</p></div>
                        </motion.div>

                        <motion.div style={{ x: x2, y: y2 }} className="absolute -top-24 -right-24 sm:-top-28 sm:-right-56 bg-white/80 backdrop-blur-xl border border-black/5 p-4 rounded-2xl flex items-center gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
                           <div className="w-10 h-10 rounded-xl bg-[#FF3B13]/5 flex items-center justify-center text-[#FF3B13]"><Shield className="w-5 h-5" /></div>
                           <div><p className="text-black text-[10px] font-black tracking-widest leading-none">AES_GCM_256</p><p className="text-black/30 text-[9px] mt-1 font-mono">MILITARY_GRADE</p></div>
                        </motion.div>

                        <motion.div style={{ x: x3, y: y3 }} className="absolute top-36 -left-24 sm:top-40 sm:-left-64 bg-white/80 backdrop-blur-xl border border-black/5 p-4 rounded-2xl flex items-center gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
                           <div className="w-10 h-10 rounded-xl bg-[#FF3B13]/5 flex items-center justify-center text-[#FF3B13]"><Zap className="w-5 h-5" /></div>
                           <div><p className="text-black text-[10px] font-black tracking-widest leading-none">ZERO_CALL</p><p className="text-black/30 text-[9px] mt-1 font-mono">ULTRA_LOW_LATENCY</p></div>
                        </motion.div>

                        <motion.div style={{ x: x4, y: y4 }} className="absolute top-36 -right-24 sm:top-40 sm:-right-64 bg-white/80 backdrop-blur-xl border border-black/5 p-4 rounded-2xl flex items-center gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
                           <div className="w-10 h-10 rounded-xl bg-[#FF3B13]/5 flex items-center justify-center text-[#FF3B13]"><Lock className="w-5 h-5" /></div>
                           <div><p className="text-black text-[10px] font-black tracking-widest leading-none">MASTER_KEY</p><p className="text-black/30 text-[9px] mt-1 font-mono">CLIENT_SIDE_ONLY</p></div>
                        </motion.div>
                     </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Problem/Solution Section ─────────────────────────── */}
            <section className="bg-white border-y border-black/5 text-black py-24 sm:py-48 px-4 flex flex-col lg:flex-row lg:items-end justify-between gap-16">
              <div className="max-w-4xl">
                <p className="text-[10px] text-[#FF3B13] font-black uppercase tracking-[0.4em] mb-12 italic">// SYSTEM_OVERVIEW</p>
                <h2 className="text-[2.5rem] sm:text-[4rem] lg:text-[5rem] leading-[0.95] tracking-tight font-black text-black uppercase italic">
                  IDENTITY IS FRAGMENTED.
                  <span className="text-black/10"> KRYPTEX IS THE SINGULARITY.</span>
                </h2>
              </div>
              <div className="flex flex-col gap-10 lg:pb-6 min-w-[320px]">
                <p className="text-sm text-black/40 border-l-2 border-[#FF3B13] pl-8 leading-relaxed max-w-sm uppercase font-bold tracking-widest text-[9px] sm:text-[10px]">
                  Platform economics depend on the gap between your intent and your data. We collapse that gap into an offline-first, zero-knowledge vault.
                </p>
                <button
                  onClick={toggleAuth}
                  className="inline-flex items-center gap-6 text-xs text-[#FF3B13] font-black w-fit hover:text-black transition-all group tracking-[0.3em] uppercase italic"
                >
                  <span className="h-12 w-12 rounded-full border border-black/5 bg-[#FF3B13]/5 text-[#FF3B13] flex items-center justify-center group-hover:bg-[#FF3B13] group-hover:text-white transition-all transform group-hover:scale-110 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                  Initialize Entry
                </button>
              </div>
            </section>
          </motion.main>
        )}
      </AnimatePresence>

      {/* ── Footer (always mounted, fades with main) ─────────────── */}
      {isIntroComplete && (
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative z-10 mx-auto max-w-7xl px-6 sm:px-12 py-24 border-t border-black/5 flex flex-col sm:flex-row items-center justify-between gap-12 text-black/40"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FF3B13]/5 border border-black/5 flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
              <Shield className="w-6 h-6 text-[#FF3B13]" />
            </div>
            <div className="flex flex-col text-black">
              <span className="text-base font-black tracking-[0.4em] uppercase italic leading-none">KRYPTEX</span>
              <span className="text-[8px] font-black text-black/20 uppercase tracking-widest mt-1">Zero-Knowledge Vault</span>
            </div>
          </div>

          <div className="flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.25em]">
            <Link to="/privacy" className="hover:text-[#FF3B13] transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-[#FF3B13] transition-colors">Terms</Link>
            <a href="mailto:support@kryptes.com" className="hover:text-[#FF3B13] transition-colors">Contact</a>
          </div>

          <div className="flex flex-col items-center sm:items-end">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/20 font-mono">
              [PROTOCOL_V2.0_STABLE]
            </p>
            <p className="text-[8px] font-bold text-black/5 uppercase tracking-widest mt-2">
              © 2026 KRYPTEX INC. // ALL RIGHTS RESERVED
            </p>
          </div>
        </motion.footer>
      )}
    </div>
  );
};

export default Index;
