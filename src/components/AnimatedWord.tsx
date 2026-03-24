import { motion } from "framer-motion";

export const AnimatedWord = ({
  text,
  isAuthVisible,
  splitAt,
  distance
}: {
  text: string;
  isAuthVisible: boolean;
  splitAt: number;
  distance: number;
}) => {
  return (
    <>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          animate={{
            x: isAuthVisible ? (i < splitAt ? -distance : distance) : 0,
            opacity: isAuthVisible ? 0 : 1
          }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1],
            delay: isAuthVisible ? 0 : i * 0.05
          }}
          className="inline-block"
        >
          {char}
        </motion.span>
      ))}
    </>
  );
};

