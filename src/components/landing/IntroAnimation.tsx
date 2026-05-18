import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield } from "lucide-react";

export const IntroAnimation = ({ onComplete }: { onComplete: () => void }) => {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setTimeout(onComplete, 1000); // Wait for shrink animation to finish
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isAnimating && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0a]"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [0.8, 1.1, 1],
              opacity: 1,
              filter: ["blur(10px)", "blur(0px)"],
            }}
            transition={{
              duration: 1.5,
              ease: "easeOut",
            }}
            className="relative flex flex-col items-center"
          >
            <div className="relative">
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(249, 115, 22, 0.2)",
                    "0 0 60px rgba(249, 115, 22, 0.6)",
                    "0 0 20px rgba(249, 115, 22, 0.2)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="rounded-full p-6 bg-orange-500/10"
              >
                <Shield className="h-24 w-24 text-orange-500" strokeWidth={1.5} />
              </motion.div>
              
              {/* Decorative rings */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 -m-4 border border-orange-500/20 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 -m-8 border border-orange-500/10 rounded-full border-dashed"
              />
            </div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-8 text-4xl font-bold tracking-[0.3em] text-white"
            >
              KRYPTES
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="mt-2 text-orange-500/60 text-sm font-medium tracking-widest"
            >
              SECURE BY DESIGN
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
