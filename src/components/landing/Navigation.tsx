import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Security", href: "#security" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-full w-full max-w-[1200px] items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 text-[#1F2937]">
          <Shield className="h-5 w-5 text-[#0EA5E9]" />
          <span className="text-sm font-bold tracking-[0.16em]">KRYPTES</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-[#374151] transition-colors hover:text-[#0EA5E9]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a href="/dashboard" className="text-sm font-semibold text-[#374151] hover:text-[#0EA5E9]">
            Sign In
          </a>
          <Button
            className="rounded-md bg-[#0EA5E9] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#0284C7]"
            asChild
          >
            <a href="/dashboard">Get Started</a>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-[#374151] lg:hidden"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-gray-200 bg-white lg:hidden">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 px-6 py-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium text-[#374151] transition-colors hover:text-[#0EA5E9]"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex items-center gap-3">
              <a href="/dashboard" className="text-sm font-semibold text-[#374151] hover:text-[#0EA5E9]">
                Sign In
              </a>
              <Button className="rounded-md bg-[#0EA5E9] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#0284C7]" asChild>
                <a href="/dashboard">Get Started</a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
