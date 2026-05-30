import { motion } from "framer-motion";
import { 
  Folder, 
  Lock, 
  Search, 
  Server, 
  Shield, 
  Sparkles, 
  Github, 
  Leaf, 
  Settings, 
  Star,
  Globe 
} from "lucide-react";

export const BentoBox = () => {
  return (
    <section className="relative bg-white py-24 text-gray-900">
      {/* Subtle dotted background pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-10" 
        style={{ backgroundImage: 'radial-gradient(circle, #000000 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} 
      />
      
      <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-10">
        
        {/* Asymmetric 12-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 1. Zone Aware Engine (lg:col-span-5) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="group relative lg:col-span-5 min-h-[340px] flex flex-col justify-between overflow-hidden rounded-[24px] border border-gray-200 bg-gray-50 p-8 transition-all hover:border-orange-500/50 shadow-sm hover:shadow-md"
          >
            {/* CSS Globe Graphic */}
            <div className="absolute right-0 bottom-0 h-full w-full pointer-events-none overflow-hidden rounded-[24px] flex items-end justify-end transition-transform duration-700 group-hover:scale-105">
              <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl" />
              
              {/* Radar Rings */}
              <div className="absolute -right-10 -bottom-10 w-72 h-72 border border-orange-200 rounded-full" />
              <div className="absolute -right-2 -bottom-2 w-56 h-56 border border-orange-200/60 rounded-full" />
              
              {/* Globe Icon */}
              <Globe className="absolute -right-6 -bottom-6 w-64 h-64 text-orange-100 stroke-[0.7]" />
              
              {/* Ping Marker */}
              <div className="absolute right-28 bottom-28 w-3 h-3 bg-orange-500 rounded-full shadow-[0_0_20px_rgba(249,115,22,1)] z-10" />
              <div className="absolute right-[6.6rem] bottom-[6.6rem] w-8 h-8 border border-orange-500 rounded-full animate-ping opacity-40" />
            </div>

            <div className="relative z-10 max-w-xs md:max-w-md">
              <h3 className="text-[1.1rem] font-mono font-bold tracking-tight text-gray-900 mb-2">Zone Aware Engine</h3>
              <p className="text-sm leading-relaxed text-gray-500 font-medium">Smart control based on region, risk or regulation.</p>
            </div>
          </motion.div>

          {/* 2. System Topology (lg:col-span-3) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="group relative lg:col-span-3 min-h-[340px] flex flex-col justify-between overflow-hidden rounded-[24px] border border-gray-200 bg-gray-50 p-8 transition-all hover:border-orange-500/50 shadow-sm hover:shadow-md"
          >
            <div className="relative z-10">
              <h3 className="text-[1.1rem] font-mono font-bold tracking-tight text-gray-900 mb-2">System Topology</h3>
              <p className="text-sm leading-relaxed text-gray-500 font-medium">One graph to rule them all.</p>
            </div>

            {/* Topology Graphic */}
            <div className="relative h-44 w-full flex items-center justify-center">
              {/* Connected Lines */}
              <div className="absolute h-[2px] w-36 bg-gradient-to-r from-transparent via-orange-400 to-transparent rotate-[30deg]" />
              <div className="absolute h-[2px] w-36 bg-gradient-to-r from-transparent via-orange-400 to-transparent rotate-[-30deg]" />
              <div className="absolute h-[2px] w-36 bg-gradient-to-r from-transparent via-orange-400 to-transparent" />
              
              {/* Central S-logo Hub */}
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-[20px] border border-orange-200 bg-white shadow-lg">
                <div className="absolute inset-0 rounded-[20px] bg-orange-50" />
                <img 
                  src="/kryptes.png" 
                  alt="Kryptes Hub Logo" 
                  className="h-8 w-8 object-contain drop-shadow-md" 
                />
              </div>

              {/* Surrounding Nodes */}
              {[
                { top: "8%", left: "12%", icon: Database },
                { top: "8%", right: "12%", icon: Github },
                { top: "45%", left: "0%", icon: Search },
                { top: "45%", right: "0%", icon: Leaf },
                { bottom: "8%", left: "12%", icon: Settings },
                { bottom: "8%", right: "12%", icon: Star },
              ].map((node, i) => (
                <div
                  key={i}
                  className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 shadow-sm group-hover:border-orange-300 group-hover:text-orange-500 transition-colors duration-300"
                  style={{ top: node.top, left: node.left, right: node.right, bottom: node.bottom }}
                >
                  <node.icon className="h-3.5 w-3.5" />
                </div>
              ))}
            </div>
          </motion.div>

          {/* 3. Secure Vaults (lg:col-span-4) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="group relative lg:col-span-4 min-h-[340px] flex flex-col justify-between overflow-hidden rounded-[24px] border border-gray-200 bg-gray-50 p-8 transition-all hover:border-orange-500/50 shadow-sm hover:shadow-md"
          >
            <div className="relative z-10">
              <h3 className="text-[1.1rem] font-mono font-bold tracking-tight text-gray-900 mb-2">Secure Vaults</h3>
              <p className="text-sm leading-relaxed text-gray-500 font-medium">High-trust document and secret storage.</p>
            </div>

            {/* Folder Graphic */}
            <div className="relative h-44 w-full flex items-center justify-center">
              <motion.div 
                className="relative flex h-28 w-36 items-end justify-center"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                {/* Glow behind folder */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-36 w-36 bg-orange-400/20 blur-[40px] rounded-full pointer-events-none" />
                
                {/* Real Sparkles / Light Beams */}
                <div className="absolute -top-6 inset-x-0 flex justify-center gap-6 pointer-events-none">
                  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 1.8, repeat: Infinity }}><Sparkles className="h-4 w-4 text-orange-500 opacity-80" /></motion.div>
                  <motion.div animate={{ y: [-4, 2, -4] }} transition={{ duration: 2.2, repeat: Infinity }}><Sparkles className="h-5 w-5 text-orange-400" /></motion.div>
                  <motion.div animate={{ y: [2, -6, 2] }} transition={{ duration: 2, repeat: Infinity }}><Sparkles className="h-4 w-4 text-orange-500 opacity-90" /></motion.div>
                </div>

                {/* Folder Body */}
                <div className="relative z-10 h-22 w-full rounded-2xl border border-gray-200 bg-white shadow-xl flex flex-col justify-end p-3 overflow-hidden">
                  <div className="absolute -top-3.5 left-0 h-5 w-[45%] rounded-t-lg border-t border-x border-gray-200 bg-white" />
                  {/* Glowing orange line inside folder */}
                  <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-[0_2px_12px_rgba(249,115,22,0.4)]" />
                  
                  {/* Embedded Logo */}
                  <div className="flex justify-center mb-1">
                    <img src="/kryptes.png" alt="logo" className="h-5 w-5 opacity-40 object-contain filter grayscale" />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* 4. Dynamic Access (lg:col-span-3) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="group relative lg:col-span-3 min-h-[340px] flex flex-col justify-between overflow-hidden rounded-[24px] border border-gray-200 bg-gray-50 p-8 transition-all hover:border-orange-500/50 shadow-sm hover:shadow-md"
          >
            <div className="relative z-10">
              <h3 className="text-[1.1rem] font-mono font-bold tracking-tight text-gray-900 mb-2">Dynamic Access</h3>
              <p className="text-sm leading-relaxed text-gray-500 font-medium">Context-aware access with anomaly blocking.</p>
            </div>

            {/* Shield with lock Graphic */}
            <div className="relative h-44 w-full flex items-center justify-center">
              <div className="absolute inset-0 bg-orange-400/10 blur-[40px] rounded-full" />
              
              <div className="relative flex h-32 w-28 items-center justify-center rounded-[28px] border border-gray-200 bg-white shadow-xl transition-all duration-500 group-hover:border-orange-300">
                {/* Shield Path */}
                <div 
                  className="absolute inset-0 rounded-[28px] border-[1.5px] border-orange-200 bg-orange-50" 
                  style={{ clipPath: "polygon(50% 0%, 100% 18%, 100% 72%, 50% 100%, 0% 72%, 0% 18%)" }} 
                />
                <Lock className="h-10 w-10 text-orange-500 z-10" />
              </div>
            </div>
          </motion.div>

          {/* 5. Behavior Graph (lg:col-span-4) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="group relative lg:col-span-4 min-h-[340px] flex flex-col justify-between overflow-hidden rounded-[24px] border border-gray-200 bg-gray-50 p-8 transition-all hover:border-orange-500/50 shadow-sm hover:shadow-md"
          >
            <div className="relative z-10">
              <h3 className="text-[1.1rem] font-mono font-bold tracking-tight text-gray-900 mb-2">Behavior Graph</h3>
              <p className="text-sm leading-relaxed text-gray-500 font-medium">Understand usage like never before.</p>
            </div>

            {/* Graph Columns Graphic */}
            <div className="relative h-44 w-full flex items-end justify-center gap-6 pb-2">
              {/* Left Bar */}
              <div className="h-16 w-10 rounded-t-xl bg-gray-200 border border-gray-300 transition-all duration-300 group-hover:bg-gray-300 shadow-sm" />
              
              {/* Center Active Bar */}
              <div className="relative flex h-28 w-14 items-end justify-center">
                <div className="absolute inset-x-0 bottom-0 h-full rounded-t-xl bg-gradient-to-t from-orange-500 to-orange-400 shadow-md" />
                
                {/* Tooltip hovering on top */}
                <div className="absolute -top-12 whitespace-nowrap rounded-lg bg-gray-900 border border-gray-700 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                  $23,045.00
                  <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-gray-700 bg-gray-900" />
                </div>
              </div>

              {/* Right Bar */}
              <div className="h-24 w-10 rounded-t-xl bg-gray-200 border border-gray-300 transition-all duration-300 group-hover:bg-gray-300 shadow-sm" />
            </div>
          </motion.div>

          {/* 6. KERN AI Assistant (lg:col-span-5) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="group relative lg:col-span-5 min-h-[340px] flex flex-col justify-between overflow-hidden rounded-[24px] border border-gray-200 bg-gray-50 p-8 transition-all hover:border-orange-500/50 shadow-sm hover:shadow-md"
          >
            <div className="relative z-10">
              <h3 className="text-[1.1rem] font-mono font-bold tracking-tight text-gray-900 mb-2">KERN AI Assistant</h3>
              <p className="text-sm leading-relaxed text-gray-500 font-medium">Command, explain, troubleshoot — in plain language.</p>
            </div>

            {/* AI Chip Graphic */}
            <div className="relative h-44 w-full flex items-center justify-center">
              {/* Glowing back auroras */}
              <div className="absolute h-36 w-36 rounded-full bg-orange-400/20 blur-[40px] pointer-events-none" />
              
              {/* Circular trace lines */}
              <div className="absolute h-32 w-32 rounded-full border border-orange-200 pointer-events-none" />
              <div className="absolute h-40 w-40 rounded-full border border-orange-100 pointer-events-none" />

              <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-xl">
                {/* Golden circuit trace arms */}
                <div className="absolute -left-10 top-1/2 h-[2px] w-10 bg-gradient-to-r from-transparent via-orange-300 to-orange-400" />
                <div className="absolute -right-10 top-1/2 h-[2px] w-10 bg-gradient-to-l from-transparent via-orange-300 to-orange-400" />
                <div className="absolute -top-10 left-1/2 w-[2px] h-10 bg-gradient-to-b from-transparent via-orange-300 to-orange-400" />
                <div className="absolute -bottom-10 left-1/2 w-[2px] h-10 bg-gradient-to-t from-transparent via-orange-300 to-orange-400" />

                {/* Smaller microchips lines */}
                <div className="absolute inset-[6px] rounded-xl border border-gray-100 bg-gray-50" />
                
                <span className="text-3xl font-black text-orange-500 tracking-wider z-10">AI</span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

// Database helper component
const Database = (props: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
  </svg>
);
