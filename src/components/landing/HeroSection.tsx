import { motion } from "framer-motion";
import { CheckCircle2, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const trustSignals = ["End-to-end encrypted", "Open source", "No tracking"];

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative bg-white px-6 pb-20 pt-28 md:px-12 md:pt-36">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400 opacity-20 blur-3xl" />

      <div className="mx-auto w-full max-w-[1200px] rounded-3xl bg-white p-10 shadow-2xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-xl"
        >
          <p className="text-sm font-medium text-[#6B7280]">Your digital life, secured.</p>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
            Zero-knowledge vault for passwords, cards, <span className="text-[#0EA5E9]">documents</span>, and 2FA.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[#6B7280]">
            Military-grade encryption. Your data, your keys. We can&apos;t access what we don&apos;t hold.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-md bg-[#0EA5E9] px-8 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-[#0284C7]"
            >
              Get Started
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-md border-[#0EA5E9] bg-transparent px-8 py-3 text-sm font-bold text-[#0EA5E9] hover:bg-[#0EA5E9]/10 hover:text-[#0EA5E9]"
            >
              How it works →
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-[#6B7280]">
            {trustSignals.map((signal) => (
              <span key={signal} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#0EA5E9]" />
                {signal}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center"
        >
          <div className="relative w-full max-w-[460px] rounded-xl border border-gray-200 bg-white p-8 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
            <svg viewBox="0 0 360 250" className="h-auto w-full" role="img" aria-label="Animated lock opening">
              <rect x="48" y="92" width="264" height="138" rx="20" fill="#F3F4F6" stroke="#E5E7EB" />
              <motion.path
                d="M120 92V72C120 38 145 20 180 20C215 20 240 38 240 72V92"
                stroke="#0EA5E9"
                strokeWidth="14"
                strokeLinecap="round"
                fill="none"
                animate={{ pathLength: [1, 1], rotate: [0, -14, 0] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
                style={{ originX: "50%", originY: "37%" }}
              />
              <rect x="122" y="96" width="116" height="92" rx="16" fill="#0EA5E9" />
              <circle cx="180" cy="138" r="14" fill="white" />
              <rect x="176" y="136" width="8" height="26" rx="4" fill="white" />
              <motion.g
                animate={{ x: [0, 64, 130], opacity: [1, 1, 0.2] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <rect x="38" y="204" width="84" height="16" rx="8" fill="#0EA5E9" opacity="0.5" />
              </motion.g>
              <motion.g
                animate={{ x: [0, 80, 160], opacity: [0.5, 1, 0.25] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <rect x="28" y="180" width="96" height="16" rx="8" fill="#1E3A8A" opacity="0.25" />
              </motion.g>
            </svg>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-[#374151]">
              <Lock className="h-3.5 w-3.5 text-[#0EA5E9]" />
              Client-side encrypted vault
            </div>
          </div>
        </motion.div>
        </div>
      </div>
    </section>
  );
}
