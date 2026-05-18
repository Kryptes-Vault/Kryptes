import { useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import {
  Lock,
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Fingerprint
} from "lucide-react";
import { Navigation } from "@/components/landing/Navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { IntroAnimation } from "@/components/landing/IntroAnimation";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [showContent, setShowContent] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  return (
    <div className="bg-black text-white selection:bg-orange-500/30">
      <IntroAnimation onComplete={() => setShowContent(true)} />
      
      <div className={`transition-opacity duration-1000 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600 origin-left z-[60]"
          style={{ scaleX }}
        />
        
        <Navigation />
        
        <main>
          <HeroSection />

          {/* Stats Bar */}
          <section className="relative py-12 border-y border-white/5 bg-black/50 backdrop-blur-sm">
            <div className="mx-auto max-w-[1200px] px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { label: "Encryption", value: "AES-256" },
                  { label: "Audited", value: "SOC2" },
                  { label: "Knowledge", value: "Zero" },
                  { label: "Uptime", value: "99.9%" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex flex-col items-center md:items-start"
                  >
                    <span className="text-2xl md:text-3xl font-bold text-orange-500">{stat.value}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">{stat.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-32 px-6 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[120px] -z-10" />
            
            <div className="mx-auto max-w-[1200px]">
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                className="text-center mb-24"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500">Security Layers</span>
                <h2 className="mt-4 text-4xl md:text-6xl font-bold tracking-tight">The ultimate vault for<br/>your <span className="gradient-text">digital sovereignty.</span></h2>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    title: "Hardware-Grade Security",
                    desc: "State-of-the-art AES-256-GCM encryption usually reserved for enterprise hardware, now on your browser.",
                    icon: Lock,
                  },
                  {
                    title: "Universal Sync",
                    desc: "Real-time, end-to-end encrypted synchronization across all your platforms without breaking the chain.",
                    icon: Zap,
                  },
                  {
                    title: "Zero Knowledge",
                    desc: "Architecture designed so that your master keys never leave your device. Even we can't see your data.",
                    icon: Shield,
                  },
                  {
                    title: "Open Source Verified",
                    desc: "Fully transparent code reviewed by the community. No backdoors, no secrets, just pure security.",
                    icon: Globe,
                  },
                  {
                    title: "Biometric Integration",
                    desc: "Seamlessly unlock your vaults using Touch ID or Face ID, bridging physical and digital security.",
                    icon: Fingerprint,
                  },
                  {
                    title: "Emergency Rescue",
                    desc: "Sophisticated recovery mechanisms that don't compromise your privacy or centralize control.",
                    icon: Shield,
                  },
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    variants={sectionVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group glass p-8 border border-white/5 hover:border-orange-500/20 transition-all"
                  >
                    <feature.icon className="h-8 w-8 text-orange-500 mb-6 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed font-medium">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-32 px-6">
            <div className="mx-auto max-w-[1200px]">
              <div className="relative glass p-12 md:p-24 overflow-hidden rounded-3xl border border-white/5">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-500/10 blur-[100px]" />
                <div className="relative z-10 max-w-2xl">
                  <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">Secure your future <br/>today.</h2>
                  <p className="text-lg text-gray-400 mb-10 font-medium">Join 50,000+ users protecting their digital life with Kryptes.</p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button className="rounded-full bg-orange-500 px-8 h-14 text-sm font-bold uppercase tracking-widest text-white hover:bg-orange-600 transition-all hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                      Create Secure Vault
                    </Button>
                    <Button variant="outline" className="rounded-full border-white/10 px-8 h-14 text-sm font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
                      View Documentation
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="py-20 px-6 border-t border-white/5">
          <div className="mx-auto max-w-[1200px] grid grid-cols-2 md:grid-cols-4 gap-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="h-6 w-6 text-orange-500" />
                <span className="text-sm font-black tracking-[0.3em]">KRYPTES</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed font-bold uppercase tracking-wider italic">
                Sovereign Digital Identity
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-6">Product</h4>
              <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-6">Company</h4>
              <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Open Source</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-6">Support</h4>
              <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Guide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="mx-auto max-w-[1200px] mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between gap-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">© 2024 Kryptes Inc. All rights reserved.</span>
            <div className="flex gap-6">
               <a href="#" className="text-gray-600 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">Twitter</a>
               <a href="#" className="text-gray-600 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">GitHub</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
