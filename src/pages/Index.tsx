import { useState } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { HeroSection } from "@/components/landing/HeroSection";
import { IntroAnimation } from "@/components/landing/IntroAnimation";
import { Marquee } from "@/components/landing/Marquee";
import { Cpu, Shield, Lock, Globe, Zap, Database } from "lucide-react";

const RevealSection = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-120px" }}
    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const Index = () => {
  const [showContent, setShowContent] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const productPhrases = [
    "End-to-End Security", "Privacy First", "Zero Trust", 
    "Encrypted Infrastructure", "Real-Time Protection", 
    "Secure Access", "Intelligent Defense", "Built for Privacy", 
    "Threat Detection", "Trusted Security"
  ];

  return (
    <div className="bg-black text-white selection:bg-orange-500/30 font-sans leading-normal overflow-x-hidden">
      {/* Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[2px] bg-orange-500 origin-left z-[150]"
        style={{ scaleX }}
      />

      <IntroAnimation onComplete={() => setShowContent(true)} />
      
      <AnimatePresence>
        {showContent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Minimal Logo Home Button - Fixed Top Left */}
            <div className="fixed top-8 left-8 z-[100] z- pointer-events-auto">
               <a href="/" className="block">
                 <img src="/kryptus.png" alt="Logo" className="h-8 w-8 object-contain opacity-80 hover:opacity-100 transition-opacity" />
               </a>
            </div>

            <main className="relative">
              <HeroSection />

              {/* Tighter Marquee Placement */}
              <section className="relative z-10 -mt-8 mb-16">
                <Marquee 
                  items={productPhrases} 
                  speed={70}
                  variant="subtle"
                  className="bg-neutral-950/40 border-y border-white/5 py-3"
                />
              </section>

              {/* Combined Content Area with dense layouts */}
              <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24">
                
                {/* 01: Core Philosophy */}
                <section className="py-20 lg:py-32 border-b border-white/[0.03]">
                  <div className="grid lg:grid-cols-[0.8fr,1.2fr] gap-16 lg:gap-24 items-start">
                    <RevealSection>
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-orange-500 block mb-6">LAYER 01 — PHILOSOPHY</span>
                        <h2 className="text-4xl sm:text-6xl font-black tracking-tighter mb-8 leading-[0.95]">
                          Securing the <br/>
                          <span className="text-orange-500 italic">Individual.</span>
                        </h2>
                        <p className="text-gray-400 font-medium leading-relaxed max-w-sm">
                          Privacy isn't just a right; it's a structural requirement for freedom in the digital age.
                        </p>
                    </RevealSection>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-16">
                      {[
                        { title: "Zero Knowledge", desc: "Your keys never touch our servers. Mathematically Certain.", icon: Lock },
                        { title: "Quantum Grade", desc: "Post-quantum lattice primitives for the next era.", icon: Zap },
                        { title: "Hardware Root", desc: "Isolated silicon enclaves for key derivations.", icon: Shield },
                        { title: "Distributed", desc: "No single point of failure in our consensus layers.", icon: Database }
                      ].map((item, i) => (
                        <RevealSection key={i} className="group">
                           <div className="flex items-start gap-5">
                              <div className="sm:h-10 sm:w-10 h-8 w-8 shrink-0 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center group-hover:border-orange-500/30 transition-colors">
                                 <item.icon className="h-4 w-4 text-orange-500" strokeWidth={1.5} />
                              </div>
                              <div>
                                 <h3 className="text-sm font-black tracking-tight mb-2 uppercase">{item.title}</h3>
                                 <p className="text-[11px] text-gray-500 leading-relaxed font-medium">{item.desc}</p>
                              </div>
                           </div>
                        </RevealSection>
                      ))}
                    </div>
                  </div>
                </section>

                {/* 02: Verification & Transparency */}
                <section className="py-20 lg:py-32">
                  <div className="grid lg:grid-cols-2 gap-16 lg:gap-32 items-center">
                    <RevealSection className="order-2 lg:order-1 relative">
                        {/* Glassmorphism Visualization */}
                        <div className="aspect-[16/10] bg-neutral-900/50 border border-white/5 rounded-[32px] overflow-hidden p-8 flex flex-col justify-between">
                           <div className="flex gap-1.5">
                              <div className="h-2 w-2 rounded-full bg-orange-500/20" />
                              <div className="h-2 w-2 rounded-full bg-orange-500/20" />
                              <div className="h-2 w-2 rounded-full bg-orange-500/20" />
                           </div>
                           <div className="space-y-3 opacity-40">
                              <div className="h-1.5 w-full bg-white/5 rounded-full" />
                              <div className="h-1.5 w-[80%] bg-white/5 rounded-full" />
                              <div className="h-1.5 w-[60%] bg-white/5 rounded-full" />
                           </div>
                           <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                              <Globe className="h-[200px] w-[200px]" />
                           </div>
                           <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Protocol Audit Log // PROD_NODE_01</div>
                        </div>
                    </RevealSection>

                    <div className="order-1 lg:order-2">
                       <RevealSection>
                         <span className="text-[9px] font-black uppercase tracking-[0.4em] text-orange-500 block mb-6">LAYER 02 — INTEGRITY</span>
                         <h2 className="text-4xl sm:text-6xl font-black tracking-tighter mb-8 leading-[0.95]">Open Source. <br/>Closed Loop.</h2>
                         <p className="text-gray-400 font-medium leading-relaxed mb-8 max-w-md">
                           Our logic is publicly auditable. No backdoors, no legacy baggage. Security verified by the community and mathematical proof.
                         </p>
                         <a href="#" className="text-[10px] font-black tracking-[0.3em] uppercase text-orange-500 flex items-center gap-3 hover:text-white transition-all group">
                            GIT REPOSITORY
                            <div className="h-px w-8 bg-orange-500 group-hover:w-16 transition-all" />
                         </a>
                       </RevealSection>
                    </div>
                  </div>
                </section>

                {/* Final CTA Container */}
                <section className="py-24 lg:py-40 text-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-orange-500/[0.02] to-transparent pointer-events-none" />
                   <RevealSection>
                      <h2 className="text-[10vw] sm:text-[8vw] font-black tracking-tighter leading-none mb-10">
                         SECURE THE <br/> FUTURE.
                      </h2>
                      <p className="text-base sm:text-lg text-gray-500 font-medium mb-12 max-w-xl mx-auto italic uppercase tracking-wider">
                         "Initialization is the first step toward sovereignty."
                      </p>
                      <a href="/dashboard" className="inline-flex px-12 py-4 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] hover:bg-orange-500 hover:text-white transition-all duration-500">
                        START INITIATIVE
                      </a>
                   </RevealSection>
                </section>

              </div>
            </main>

            <footer className="py-20 px-10 sm:px-12 lg:px-24 border-t border-white/5 bg-neutral-950">
               <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[1fr,2fr] gap-20">
                  <div>
                     <div className="flex items-center gap-2.5 mb-6">
                        <img src="/kryptus.png" alt="Logo" className="h-5 w-5" />
                        <span className="text-[10px] font-black tracking-[0.4em]">KRYPTES</span>
                     </div>
                     <p className="text-[9px] font-bold tracking-widest text-gray-600 leading-relaxed uppercase">
                        Sovereign security protocol built for the next century of digital trust and independent identity.
                     </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
                     <div>
                        <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-orange-500 mb-6 font-bold">Protocol</h4>
                        <ul className="space-y-3 text-[9px] font-bold tracking-widest text-gray-500">
                           <li><a href="#" className="hover:text-white transition-colors">SPECIFICATION</a></li>
                           <li><a href="#" className="hover:text-white transition-colors">AUDITS</a></li>
                           <li><a href="#" className="hover:text-white transition-colors">SECURITY</a></li>
                        </ul>
                     </div>
                     <div>
                        <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-orange-500 mb-6 font-bold">Network</h4>
                        <ul className="space-y-3 text-[9px] font-bold tracking-widest text-gray-500">
                           <li><a href="#" className="hover:text-white transition-colors">DISCORD</a></li>
                           <li><a href="#" className="hover:text-white transition-colors">TWITTER</a></li>
                           <li><a href="#" className="hover:text-white transition-colors uppercase">Github</a></li>
                        </ul>
                     </div>
                  </div>
               </div>
               <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/[0.03] flex justify-between gap-6 opacity-30">
                  <span className="text-[8px] font-black tracking-widest">VER 2.0.4 PROD</span>
                  <span className="text-[8px] font-black tracking-widest">© 2024 KRYPTES PROTOCOL</span>
               </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
