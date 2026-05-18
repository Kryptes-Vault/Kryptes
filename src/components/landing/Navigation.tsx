import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, Shield, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Security", href: "#security" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`fixed inset-x-0 top-0 z-50 h-20 transition-all duration-300 ${
        scrolled ? "bg-black/60 backdrop-blur-xl border-b border-white/10" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-full w-full max-w-[1200px] items-center justify-between px-6">
        <Link to="/" className="group flex items-center gap-2">
          <div className="relative">
            <Shield className="h-6 w-6 text-orange-500 transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute inset-0 bg-orange-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
          </div>
          <span className="text-sm font-bold tracking-[0.2em] text-white">KRYPTES</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs font-semibold uppercase tracking-widest text-gray-400 transition-colors hover:text-orange-500"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-6 lg:flex">
          <a href="/dashboard" className="text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-orange-500 transition-colors">
            Sign In
          </a>
          <Button
            className="group relative overflow-hidden rounded-full bg-orange-500 px-6 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-orange-600 transition-all duration-300 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]"
            asChild
          >
            <a href="/dashboard" className="flex items-center gap-2">
              Get Started
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </a>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white lg:hidden bg-white/5"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-x-0 top-20 border-b border-white/10 bg-black/95 backdrop-blur-2xl lg:hidden"
          >
            <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-6 py-8">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-bold uppercase tracking-widest text-gray-300 transition-colors hover:text-orange-500"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-4 flex flex-col gap-4">
                <a href="/dashboard" className="text-sm font-bold uppercase tracking-widest text-gray-300 hover:text-orange-500">
                  Sign In
                </a>
                <Button className="rounded-full bg-orange-500 px-8 py-3 text-xs font-bold uppercase tracking-widest text-white" asChild>
                  <a href="/dashboard">Get Started</a>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
