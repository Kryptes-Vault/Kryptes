import { motion } from "framer-motion";
import { CheckCircle2, Lock, Shield, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const trustSignals = ["End-to-end encrypted", "Open source", "Zero knowledge"];

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-[#0a0a0a] px-6 pb-20 pt-32 md:px-12 md:pt-48">
      {/* Dynamic Background */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/50 to-[#0a0a0a]" />
      
      {/* Animated Glow Orbs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="pointer-events-none absolute left-1/4 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-600/30 blur-[120px]" 
      />
      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="pointer-events-none absolute right-1/4 bottom-1/4 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-orange-900/20 blur-[100px]" 
      />

      <div className="relative mx-auto w-full max-w-[1200px]">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/5 px-4 py-1 text-xs font-bold uppercase tracking-widest text-orange-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500"></span>
            </span>
            Next-Gen Security
          </div>
          
          <h1 className="mt-8 text-5xl font-extrabold leading-[1.1] tracking-tight text-white md:text-7xl">
            Secure Your <span className="gradient-text">Digital Empire</span> With Confidence.
          </h1>
          
          <p className="mt-8 text-xl leading-relaxed text-gray-400 max-w-lg">
            Military-grade encryption for your passwords, identity and digital assets. Your data, your keys, absolute privacy.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="group h-14 rounded-full bg-orange-500 px-10 text-sm font-black uppercase tracking-widest text-white hover:bg-orange-600 transition-all duration-300 shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_40px_rgba(249,115,22,0.5)]"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              className="h-14 rounded-full border-white/10 bg-white/5 px-10 text-sm font-black uppercase tracking-widest text-white hover:bg-white/10"
            >
              Watch Demo
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-6 text-sm font-semibold uppercase tracking-widest text-gray-500">
            {trustSignals.map((signal) => (
              <span key={signal} className="inline-flex items-center gap-2">
                <Shield className="h-4 w-4 text-orange-500/60" />
                {signal}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="perspective-1000 relative flex justify-center"
        >
          <div className="group relative w-full max-w-[500px] overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-white/10 to-transparent p-1 backdrop-blur-3xl transition-all duration-500 hover:border-orange-500/30">
            <div className="rounded-[22px] bg-[#0d0d0d] p-10">
              <svg viewBox="0 0 360 250" className="h-auto w-full transition-transform duration-700 group-hover:scale-105" role="img" aria-label="Animated lock opening">
                <rect x="48" y="92" width="264" height="138" rx="20" fill="#1a1a1a" className="transition-colors duration-500 group-hover:fill-[#222]" />
                <motion.path
                  d="M120 92V72C120 38 145 20 180 20C215 20 240 38 240 72V92"
                  stroke="#f97316"
                  strokeWidth="14"
                  strokeLinecap="round"
                  fill="none"
                  animate={{ pathLength: [1, 1], rotate: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  style={{ originX: "50%", originY: "37%" }}
                />
                <motion.rect 
                  x="122" y="96" width="116" height="92" rx="16" fill="#f97316" 
                  animate={{ filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <circle cx="180" cy="138" r="14" fill="#0d0d0d" />
                <rect x="176" y="136" width="8" height="26" rx="4" fill="#0d0d0d" />
              </svg>
              
              <div className="mt-8 flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-white">Vault Status</p>
                    <p className="text-[10px] font-medium text-gray-500">Encrypted & Secure</p>
                  </div>
                </div>
                <div className="h-2 w-16 overflow-hidden rounded-full bg-white/10">
                  <motion.div 
                    initial={{ x: "-100%" }}
                    animate={{ x: "0%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="h-full w-full bg-orange-500" 
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Floating elements */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-4 -top-4 h-20 w-20 rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-xl"
          >
            <div className="h-full w-full rounded-lg bg-orange-500/20" />
          </motion.div>
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -left-6 bottom-12 h-16 w-16 rounded-2xl border border-white/10 bg-black/40 p-3 backdrop-blur-xl"
          >
            <div className="h-full w-full rounded-lg bg-white/5" />
          </motion.div>
        </motion.div>
        </div>
      </div>
    </section>
  );
}
