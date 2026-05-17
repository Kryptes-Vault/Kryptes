import { motion } from "framer-motion";
import {
  Database,
  Github,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const featureCards = [
  {
    title: "Simple to use",
    description: "Generate, save, and autofill strong passwords for all your accounts with ease.",
    icon: Lock,
  },
  {
    title: "Easy to manage",
    description: "Organize credentials in a centralized vault with intuitive controls.",
    icon: Database,
  },
  {
    title: "Trusted security",
    description: "Zero-knowledge encryption with industry-grade protection and privacy.",
    icon: ShieldCheck,
  },
];

const featureCardsMore = [
  {
    title: "Easy imports",
    description: "Move passwords from browsers or other managers to Kryptes in minutes.",
    icon: Lock,
  },
  {
    title: "Share with others",
    description: "Share secrets with teammates using controlled access and secure encrypted sharing.",
    icon: Database,
  },
  {
    title: "Self-host option",
    description: "Deploy Kryptes on-premises or in your private cloud for full data ownership.",
    icon: ShieldCheck,
  },
];

const architecture = [
  "Client-side encryption",
  "Zero-knowledge model",
  "Secure sync",
  "Supabase Auth",
  "Protected session layer",
];

const stats = [
  { value: "AES-256-GCM", label: "Encryption standard" },
  { value: "Zero Knowledge", label: "Architecture model" },
  { value: "Local Encryption", label: "Encryption execution" },
  { value: "Secure Sync", label: "Protected sync workflow" },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="fixed inset-0 -z-20 bg-[linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:48px_48px] opacity-[0.09]" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_85%_8%,rgba(34,211,238,0.2),transparent_32%),radial-gradient(circle_at_15%_12%,rgba(37,99,235,0.2),transparent_30%)]" />

      <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 sm:px-8 lg:px-10">
          <Link to="/" className="text-lg font-bold tracking-tight text-gray-900">
            Kryptes
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-500 md:flex">
            <a href="#features" className="transition-colors hover:text-gray-900">
              Features
            </a>
            <a href="#security" className="transition-colors hover:text-gray-900">
              Security
            </a>
            <a href="#docs" className="transition-colors hover:text-gray-900">
              Docs
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition duration-200 hover:scale-[1.02] hover:bg-blue-700 hover:shadow-[0_0_28px_rgba(37,99,235,0.35)]"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-gradient-to-b from-white to-blue-50 py-24">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-56 opacity-20 bg-[repeating-radial-gradient(circle_at_50%_0,rgba(37,99,235,0.25)_0,rgba(37,99,235,0.25)_1px,transparent_1px,transparent_22px)]" />

          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs tracking-widest text-gray-500 uppercase">THE MOST SECURE DIGITAL VAULT</p>
            <h1 className="mt-4 text-5xl font-bold text-blue-700 md:text-6xl leading-tight">
              Protect your data from breaches and unauthorized access
            </h1>
            <p className="mt-4 text-gray-600 text-lg">
              Secure passwords, documents, banking details, and 2FA with zero-knowledge encryption. Only you can access your vault.
            </p>

            <div className="mt-6 flex justify-center gap-4">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="bg-blue-600 text-white rounded-full px-6 py-3 shadow-md hover:bg-blue-700 transition"
              >
                Get Started Free
              </button>
              <a
                href="mailto:support@kryptes.com?subject=Kryptes%20Sales"
                className="border border-blue-600 text-blue-600 rounded-full px-6 py-3 hover:bg-blue-50 transition"
              >
                Talk to Sales
              </a>
            </div>
          </div>

          <div className="relative mx-auto mt-16 max-w-6xl -mb-16">
            <div className="pointer-events-none absolute -inset-6 blur-3xl opacity-10 bg-gradient-to-r from-blue-400/40 to-cyan-400/40" />

            <div className="relative rounded-2xl bg-white shadow-xl border border-gray-200 p-6">
              <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
                <aside className="rounded-2xl bg-blue-600/5 border border-blue-600/10 p-5">
                  <p className="text-sm font-semibold text-blue-700">Vault</p>
                  <nav className="mt-4 space-y-2 text-sm font-medium text-gray-600">
                    <div className="rounded-lg bg-blue-600/10 px-3 py-2 text-blue-700">Vault</div>
                    <div className="rounded-lg px-3 py-2 hover:bg-blue-600/5">Send</div>
                    <div className="rounded-lg px-3 py-2 hover:bg-blue-600/5">Tools</div>
                    <div className="rounded-lg px-3 py-2 hover:bg-blue-600/5">Settings</div>
                  </nav>
                </aside>

                <div className="relative rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-gray-900 font-semibold">Passwords</h3>
                    <span className="rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-semibold border border-blue-100">
                      Protected
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {["GitHub", "Banking Portal", "Google Workspace", "AWS Console"].map((item) => (
                      <div
                        key={item}
                        className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
                      >
                        <span className="text-sm font-medium text-gray-900">{item}</span>
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute right-5 top-16 w-64 rounded-2xl border border-gray-200 bg-white shadow-lg p-4">
                <p className="text-xs font-medium text-gray-500">Generator</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">Password Generator</p>
                <div className="mt-3 space-y-2">
                  <div className="h-2.5 rounded bg-blue-50 border border-blue-100" />
                  <div className="h-2.5 w-4/5 rounded bg-blue-100 border border-blue-200" />
                  <div className="h-2.5 w-3/4 rounded bg-blue-200 border border-blue-100" />
                </div>
                <button
                  type="button"
                  className="mt-4 w-full rounded-lg bg-blue-600 text-white py-2 text-sm font-semibold hover:bg-blue-700 transition"
                >
                  Generate & Copy
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-gradient-to-b from-white to-blue-50 px-6 py-20">
          <div className="mx-auto w-full max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featureCards.map((card) => (
                <article
                  key={card.title}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <card.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mt-4">{card.title}</h3>
                  <p className="text-gray-600 mt-2 leading-relaxed">{card.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-20 md:px-12">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg sm:p-8"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Product showcase</h2>
              <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Dashboard preview</span>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-gray-200 p-4 transition duration-300 hover:scale-105 hover:shadow-xl">
                <p className="text-sm font-semibold text-gray-900">Vault Items</p>
                <p className="mt-1 text-sm text-gray-500">Passwords, documents, cards, and secure notes in one place.</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 transition duration-300 hover:scale-105 hover:shadow-xl">
                <p className="text-sm font-semibold text-gray-900">Security Score</p>
                <p className="mt-1 text-sm text-gray-500">Track weak credentials and monitor risk in real time.</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 transition duration-300 hover:scale-105 hover:shadow-xl">
                <p className="text-sm font-semibold text-gray-900">Recent Activity</p>
                <p className="mt-1 text-sm text-gray-500">See encrypted updates and controlled vault access logs.</p>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="security" className="border-y border-gray-200 bg-gray-50/70">
          <div className="mx-auto w-full max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp}>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Security architecture</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Enterprise-ready by design
              </h2>
            </motion.div>

            <div className="mt-10 grid gap-4 lg:grid-cols-5">
              {architecture.map((item) => (
                <div key={item} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg transition duration-300 hover:scale-105 hover:shadow-xl">
                  <Database className="h-5 w-5 text-blue-600" />
                  <p className="mt-3 text-sm font-semibold text-gray-900">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 py-20 md:px-12">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <motion.div
                key={stat.value}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-lg transition duration-300 hover:scale-105 hover:shadow-xl"
              >
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="mt-2 text-sm text-gray-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-24 md:px-12">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg sm:p-12"
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Privacy should be the default.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500">
              Build trust with a secure-by-default vault designed for modern individuals and teams.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition duration-200 hover:scale-[1.02] hover:bg-blue-700 hover:shadow-[0_0_28px_rgba(37,99,235,0.35)]"
              >
                Create Vault
              </button>
              <a
                href="mailto:support@kryptes.com?subject=Kryptes%20Sales"
                className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-900 transition duration-200 hover:scale-[1.02] hover:bg-gray-100"
              >
                Contact Sales
              </a>
            </div>
          </motion.div>
        </section>
      </main>

      <footer id="docs" className="border-t border-gray-200 bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-12 md:px-12 lg:grid-cols-3">
          <div>
            <p className="text-base font-bold text-gray-900">Kryptes</p>
            <p className="mt-2 text-sm text-gray-500">Zero-knowledge password and data vault for modern teams.</p>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <p className="font-semibold text-gray-900">Product</p>
              <a href="#features" className="block text-gray-500 hover:text-gray-900">Features</a>
              <a href="#security" className="block text-gray-500 hover:text-gray-900">Security</a>
              <a href="#" className="block text-gray-500 hover:text-gray-900">Docs</a>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-900">Company</p>
              <a href="https://github.com" className="block text-gray-500 hover:text-gray-900">GitHub</a>
              <Link to="/privacy" className="block text-gray-500 hover:text-gray-900">Privacy</Link>
              <Link to="/terms" className="block text-gray-500 hover:text-gray-900">Terms</Link>
            </div>
          </div>

          <div className="flex items-start justify-start lg:justify-end">
            <a
              href="https://github.com"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-900 transition duration-200 hover:scale-[1.02] hover:bg-gray-100"
            >
              <Github className="h-4 w-4" />
              View on GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
