import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface IntroAnimationProps {
  onComplete: () => void;
}

export function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMoved, setIsMoved] = useState(false);

  useEffect(() => {
    // Stage 1: Initial pause
    const moveTimer = setTimeout(() => {
      setIsMoved(true);
    }, 1200);

    // Stage 2: Fade out container (onComplete starts content reveal)
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 2200);

    return () => {
      clearTimeout(moveTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // macOS Genie-style spring physics
  const genieTransition = {
    type: "spring",
    stiffness: 80,
    damping: 18,
    mass: 1
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black overflow-hidden"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: isMoved ? 0.3 : 1,
              // Move from center to absolute top-left corner
              // Coordinates calculated based on viewport percentage
              x: isMoved ? "-42vw" : "0", 
              y: isMoved ? "-42vh" : "0",
              opacity: 1
            }}
            transition={genieTransition}
            className="relative"
          >
            <img 
              src="/kryptus.png" 
              alt="Kryptus Logo" 
              className="w-32 h-32 sm:w-48 sm:h-48 object-contain"
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: isMoved ? 0 : 1 }}
            className="absolute bottom-12"
          >
             <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    className="h-1 w-1 rounded-full bg-orange-500"
                  />
                ))}
             </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
