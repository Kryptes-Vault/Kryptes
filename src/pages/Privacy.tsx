import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-white text-[#111] font-sans selection:bg-[#FF3B13] selection:text-white">
      <header className="fixed top-0 left-0 right-0 z-[110] px-6 sm:px-12 py-6 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#FF3B13]/10 flex items-center justify-center text-[#FF3B13] group-hover:bg-[#FF3B13] group-hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold tracking-tighter uppercase italic">KRYPTEX</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-32 pb-24">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF3B13]/5 border border-[#FF3B13]/10 mb-6">
            <Shield className="w-4 h-4 text-[#FF3B13]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF3B13]">Secure Protocol</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-black mb-4">Privacy Policy</h1>
          <p className="text-sm text-black/40 font-bold uppercase tracking-widest">Effective Date: April 6, 2026</p>
        </div>

        <div className="prose prose-neutral max-w-none space-y-12">
          <section className="bg-[#f8f8f8] rounded-3xl p-8 border border-black/5">
            <h2 className="text-xl font-bold uppercase tracking-tight mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#FF3B13] text-white flex items-center justify-center text-xs">0</span>
              TL;DR
            </h2>
            <ul className="space-y-4">
              <li className="flex gap-4">
                <span className="text-[#FF3B13] font-bold">●</span>
                <p className="text-sm text-black/70"><strong>Zero-Knowledge:</strong> We use client-side AES-256 encryption. We cannot see your files, messages, or passwords.</p>
              </li>
              <li className="flex gap-4">
                <span className="text-[#FF3B13] font-bold">●</span>
                <p className="text-sm text-black/70"><strong>On-Device Processing:</strong> Financial metadata parsing happens locally. No raw transaction data is uploaded.</p>
              </li>
              <li className="flex gap-4">
                <span className="text-[#FF3B13] font-bold">●</span>
                <p className="text-sm text-black/70"><strong>Identity Only:</strong> OAuth 2.0 (Google, X, MS) is used strictly for account identity. We do not read your emails or tweets.</p>
              </li>
              <li className="flex gap-4">
                <span className="text-[#FF3B13] font-bold">●</span>
                <p className="text-sm text-black/70"><strong>No Monetization:</strong> We do not sell your data or use it for AI training.</p>
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">1. Introduction</h2>
            <p className="text-black/60 leading-relaxed">
              Kryptex is built on the principle of <strong>Privacy by Design</strong>. As a Zero-Knowledge Super App, we have architected the system so that we have a technical inability to access your unencrypted data. Our protocol complies with global data protection standards including GDPR, CCPA, and the Indian IT Act.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">2. Encryption Architecture</h2>
            <p className="text-black/60 leading-relaxed">
              All sensitive data (Digital Vault, Finance Manager, Smart Assistant notes) is encrypted on your device using <strong>AES-256-GCM</strong> before being transmitted. Your Master Password is used to derive the local encryption key via <strong>PBKDF2</strong>; this key never leaves your browser memory.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">3. Data Collection and Usage</h2>
            <div className="space-y-6 mt-4">
              <div>
                <h3 className="font-bold text-black mb-2">3.1 Authentication (OAuth 2.0)</h3>
                <p className="text-black/60 leading-relaxed">
                  We use OAuth 2.0 via Google, Microsoft, and X (Twitter) for identity verification. We only retrieve basic identity metadata (Email, Name, Unique Provider ID, Avatar) to create and sync your account shell.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-black mb-2">3.2 Financial Privacy (Local SMS Parsing)</h3>
                <p className="text-black/60 leading-relaxed">
                  The Finance Engine tracks expenses via browser-level parsing. All logic occurs <strong>strictly on-device</strong>. Raw transaction strings are never uploaded to our servers.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">4. Storage & Infrastructure</h2>
            <p className="text-black/60 leading-relaxed">
              Encrypted file "blobs" are stored via secure object storage. Metadata is managed via a Bitwarden-compatible, RLS-protected database architecture. We use Redis for temporary, encrypted session caching on our Render backend.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">5. No Data Monetization</h2>
            <p className="text-black/60 leading-relaxed">
              Governance: We do not sell data to third parties, nor do we use your encrypted data for AI model training or advertising.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">6. Jurisdiction</h2>
            <p className="text-black/60 leading-relaxed">
              All legal matters are governed by the laws of <strong>Hyderabad, India</strong>.
            </p>
          </section>

          <footer className="pt-12 border-t border-black/5 text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-black/20">© 2026 Kryptex protocol</p>
            <p className="text-xs text-black/40 mt-2 font-medium">Contact: <a href="mailto:privacy@kryptes.com" className="text-[#FF3B13] hover:underline">privacy@kryptes.com</a></p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
