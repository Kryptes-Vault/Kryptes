import { motion } from "framer-motion";
import { Lock, Shield, Cpu, Activity } from "lucide-react";

export function HeroSection() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center px-6 sm:px-12 lg:px-24 pt-20 pb-16 overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(249,115,22,0.04),transparent_50%)]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_60%,transparent_100%)]" />
      </div>

      <div className="mx-auto w-full max-w-7xl">
        <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-12 lg:gap-20 items-center">
          
          <div className="text-left">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 mb-8">
                <div className="h-1 w-1 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[10px] font-bold tracking-[0.2em] text-orange-500 uppercase">
                  V2.0.4 PRODUCTION READY
                </span>
              </div>
              
              <h1 className="text-[10vw] sm:text-[7vw] lg:text-[6.5vw] font-black leading-[0.9] tracking-tighter text-white mb-6">
                THE <br />
                <span className="text-orange-500 italic">Kryptus</span> <br />
                Vault.
              </h1>

              <p className="text-base sm:text-lg text-gray-400 font-medium leading-relaxed mb-10 max-w-lg">
                High-performance security for the digital age. Built with zero-knowledge primitives and military-grade hardware isolation.
              </p>

              <div className="flex flex-wrap items-center gap-5">
                 <a 
                   href="/auth"
                   className="px-8 py-3.5 bg-orange-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-orange-600 transition-all shadow-[0_0_30px_rgba(249,115,22,0.15)]"
                 >
                   Access Vault
                 </a>
                 <a 
                   href="#docs"
                   className="px-8 py-3.5 bg-transparent text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-white/10 hover:bg-white/5 transition-all text-center"
                 >
                   Documentation
                 </a>
              </div>
            </motion.div>
          </div>

          <div className="relative aspect-square sm:aspect-[4/3] lg:aspect-square flex items-center justify-center">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="relative w-full h-full max-w-[500px]"
            >
              {/* Central Visualization */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                   className="w-[90%] h-[90%] border border-white/[0.025] rounded-full flex items-center justify-center"
                >
                   <div className="w-[70%] h-[70%] border border-orange-500/[0.05] rounded-full" />
                </motion.div>
              </div>

              {/* Tighter Card Composition */}
              <motion.div 
                variants={item}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
              >
                 <div className="bg-neutral-900/40 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] shadow-2xl flex flex-col items-center">
                    <Lock className="h-10 w-10 text-orange-500 mb-4" strokeWidth={1} />
                    <div className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-1">Status</div>
                    <div className="text-xl font-black text-white tracking-tight text-center">ENCRYPTED</div>
                 </div>
              </motion.div>

              <motion.div 
                variants={item}
                className="absolute top-[15%] right-[5%] z-10 p-5 bg-neutral-900/30 backdrop-blur-xl border border-white/5 rounded-3xl"
              >
                 <Activity className="h-4 w-4 text-orange-500/40 mb-3" />
                 <div className="h-0.5 w-10 bg-orange-500/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-orange-500"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                 </div>
              </motion.div>

              <motion.div 
                variants={item}
                className="absolute bottom-[15%] left-[5%] z-10 p-5 bg-neutral-900/30 backdrop-blur-xl border border-white/5 rounded-3xl flex items-center gap-4"
              >
                 <div className="p-2.5 bg-orange-500/5 rounded-xl border border-orange-500/10">
                    <Cpu className="h-5 w-5 text-orange-500" strokeWidth={1.5} />
                 </div>
                 <div className="hidden sm:block">
                    <div className="text-[7px] font-bold text-gray-500 uppercase tracking-tighter">Hardware Key</div>
                    <div className="text-[10px] font-bold text-white tracking-tight">ENCLAVE_ACTIVE</div>
                 </div>
              </motion.div>

              <motion.div 
                variants={item}
                className="absolute top-[20%] left-[10%] opacity-20"
              >
                 <Shield className="h-12 w-12 text-white" strokeWidth={0.5} />
              </motion.div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
