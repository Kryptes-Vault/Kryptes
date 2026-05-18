import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  items: string[];
  direction?: "left" | "right";
  speed?: number;
  className?: string;
  variant?: "default" | "subtle" | "accent";
}

export function Marquee({ 
  items, 
  direction = "left", 
  speed = 40, 
  className,
  variant = "default" 
}: MarqueeProps) {
  const content = [...items, ...items, ...items, ...items];
  
  return (
    <div className={cn("relative flex overflow-hidden py-4 select-none border-y border-white/5 bg-black/40 backdrop-blur-sm", className)}>
      <motion.div
        animate={{
          x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
        className="flex whitespace-nowrap min-w-max items-center gap-16 sm:gap-32"
      >
        {content.map((item, i) => (
          <div key={i} className="flex items-center gap-16 sm:gap-32">
            <span className={cn(
              "font-medium tracking-[0.2em] uppercase text-xs sm:text-sm",
              variant === "accent" ? "text-orange-500" : "text-neutral-400"
            )}>
              {item}
            </span>
            <div className="h-1 w-1 rounded-full bg-neutral-800 shrink-0" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
