import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => {
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
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF3B13]">Protocol Rules</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-black mb-4">Terms of Service</h1>
          <p className="text-sm text-black/40 font-bold uppercase tracking-widest">Effective Date: April 6, 2026</p>
        </div>

        <div className="prose prose-neutral max-w-none space-y-12">
          <section className="bg-[#f8f8f8] rounded-3xl p-8 border border-black/5">
            <h2 className="text-xl font-bold uppercase tracking-tight mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#FF3B13] text-white flex items-center justify-center text-xs">📜</span>
              TL;DR
            </h2>
            <ul className="space-y-4">
              <li className="flex gap-4">
                <span className="text-[#FF3B13] font-bold">●</span>
                <p className="text-sm text-black/70"><strong>Encrypted:</strong> All data is AES-256 encrypted locally. We have no way to read it.</p>
              </li>
              <li className="flex gap-4">
                <span className="text-[#FF3B13] font-bold">●</span>
                <p className="text-sm text-black/70"><strong>No Password Recovery:</strong> If you lose your Master Password, your data is <strong>lost forever</strong>.</p>
              </li>
              <li className="flex gap-4">
                <span className="text-[#FF3B13] font-bold">●</span>
                <p className="text-sm text-black/70"><strong>OAuth Identity:</strong> Google, X, and Microsoft login is used strictly for authentication.</p>
              </li>
              <li className="flex gap-4">
                <span className="text-[#FF3B13] font-bold">●</span>
                <p className="text-sm text-black/70"><strong>Jurisdiction:</strong> Legal matters are handled in Hyderabad, India.</p>
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">1. Acceptance of Terms</h2>
            <p className="text-black/60 leading-relaxed">
              By using Kryptex, you agree to these Terms. If you do not agree, do not use the app. These terms are governed by the <strong>Indian IT Act</strong> and international data protocols.
            </p>
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-4">
              <span className="text-red-500 font-bold">!</span>
              <p className="text-xs font-bold text-red-600 uppercase tracking-wide leading-relaxed">
                User Responsibility: You are the sole custodian of your encryption keys. Loss of your Master Password means permanent loss of your data.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">2. Zero-Knowledge Architecture</h2>
            <p className="text-black/60 leading-relaxed">
              Kryptex is a <strong>Zero-Knowledge</strong> application. Our developers and staff have no technical way to decrypt your data, reset your vault password, or recover vault items. Everything is siloed at the device level.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">3. Authentication</h2>
            <p className="text-black/60 leading-relaxed">
              Account identity is managed via OAuth 2.0 (Google, Microsoft, X). This is used strictly for identity verification. We retrieve only your email/name to manage your account identity and do not access any third-party account data beyond this scope.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">4. Financial Engine</h2>
            <p className="text-black/60 leading-relaxed">
              Expense tracking occurs <strong>strictly on-device</strong> via browser-level metadata parsing. Raw transaction strings are never uploaded to our servers, only encrypted summaries you choose to store in your Zero-Knowledge vault.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">5. Infrastructure & Storage</h2>
            <p className="text-black/60 leading-relaxed">
              By using Kryptex, you acknowledge that your encrypted data blobs are stored via our infrastructure but remain encrypted with your locally-managed keys.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">6. Limitation of Liability</h2>
            <p className="text-black/60 leading-relaxed">
              To the maximum extent permitted by law, Kryptex is not liable for data loss due to forgotten passwords, unauthorized device access, or user error.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">7. Jurisdiction</h2>
            <p className="text-black/60 leading-relaxed">
              These terms are governed by the laws of <strong>Hyderabad, India</strong>. All legal matters will be handled in the courts of Hyderabad.
            </p>
          </section>

          <footer className="pt-12 border-t border-black/5 text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-black/20">© 2026 Kryptex protocol</p>
            <p className="text-xs text-black/40 mt-2 font-medium">Contact: <a href="mailto:support@kryptes.com" className="text-[#FF3B13] hover:underline">support@kryptes.com</a></p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Terms;
