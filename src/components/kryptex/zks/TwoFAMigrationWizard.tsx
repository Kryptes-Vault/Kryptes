import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Copy,
  Fingerprint,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  SquareCode,
} from "lucide-react";
import { toast } from "sonner";

export type AuthenticatorProvider = "google" | "microsoft" | "authy" | "apple";

type GuideCopy = {
  title: string;
  body: string;
  steps: string[];
};

const PROVIDERS: Array<{
  id: AuthenticatorProvider;
  label: string;
  short: string;
  icon: typeof ShieldCheck;
}> = [
  { id: "google", label: "Google Authenticator", short: "G", icon: ShieldCheck },
  { id: "microsoft", label: "Microsoft Authenticator", short: "M", icon: ShieldCheck },
  { id: "authy", label: "Authy", short: "A", icon: Fingerprint },
  { id: "apple", label: "Apple Passwords", short: "", icon: ShieldCheck },
];

const COPY: Record<AuthenticatorProvider, GuideCopy> = {
  google: {
    title: "Google Authenticator Migration",
    body:
      "Google does not allow automatic syncing. To migrate to Kryptes, move each account manually and regenerate a new setup key.",
    steps: [
      "Log into your accounts (e.g., GitHub, Twitter).",
      "Disable your existing 2FA.",
      "Re-enable 2FA and paste the new Setup Key into Kryptes.",
    ],
  },
  microsoft: {
    title: "Microsoft Authenticator Migration",
    body:
      "Microsoft Authenticator can’t be directly synced into Kryptes, so you’ll re-establish each code generator one account at a time.",
    steps: [
      "Open each service that uses Microsoft Authenticator.",
      "Turn off your existing 2FA device or app binding.",
      "Create a new setup key and paste it into Kryptes.",
    ],
  },
  authy: {
    title: "Authy Migration",
    body:
      "Authy restricts exporting. You will need to log into your individual accounts, disable 2FA, and re-enable it using Kryptes as your new generator.",
    steps: [
      "Visit each app or website protected by Authy.",
      "Disable the old Authy-based 2FA entry.",
      "Create a new 2FA setup key and save it in Kryptes.",
    ],
  },
  apple: {
    title: "Apple Passwords Migration",
    body:
      "Apple Passwords on iPhone and Mac can be moved manually into Kryptes. Follow the on-device steps to retrieve the setup key for each account.",
    steps: [
      "Open Settings > Passwords on your Mac/iPhone.",
      "Select the account you want to migrate.",
      "Copy the Setup Key and paste it into the Kryptes Node.",
    ],
  },
};

function makeCode() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

export default function TwoFAMigrationWizard() {
  const [activeProvider, setActiveProvider] = useState<AuthenticatorProvider | null>(null);
  const [setupKey, setSetupKey] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [mobileScanOpen, setMobileScanOpen] = useState(false);

  const guide = activeProvider ? COPY[activeProvider] : null;

  const appCards = useMemo(
    () =>
      PROVIDERS.map((provider) => ({
        ...provider,
        guide: COPY[provider.id],
      })),
    []
  );

  function handleGenerate() {
    if (!setupKey.trim()) {
      toast.error("Paste a Setup Key first");
      return;
    }
    setGeneratedCode(makeCode());
    setCopied(false);
    toast.success("Kryptes code generator started");
  }

  async function handleCopyCode() {
    if (!generatedCode) {
      toast.error("Generate a code first");
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      toast.success("Code copied");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Unable to copy code");
    }
  }

  return (
    <div className="space-y-6 text-[#111] dark:text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-black/30 dark:text-white/25">
            Kryptes Security
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            2FA Migration Wizard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-black/45 dark:text-white/40">
            A guided, zero-knowledge migration flow for manually moving your authenticator codes into Kryptes.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!guide ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {appCards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setActiveProvider(card.id)}
                  className="group rounded-3xl border border-black/5 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#FF3300]/20 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF3300]/10 text-lg font-bold text-[#FF3300]">
                      {card.short}
                    </div>
                    <card.icon className="h-5 w-5 text-black/25 transition-colors group-hover:text-[#FF3300] dark:text-white/25" />
                  </div>
                  <h2 className="mt-4 text-sm font-bold text-black dark:text-white">{card.label}</h2>
                  <p className="mt-2 text-xs leading-relaxed text-black/40 dark:text-white/35">
                    Open the migration instructions and generate a new Kryptes-friendly setup flow.
                  </p>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="guide"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.28 }}
            className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-6"
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveProvider(null);
                  setGeneratedCode("");
                  setSetupKey("");
                  setMobileScanOpen(false);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-black/5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-black/45 transition hover:border-[#FF3300]/20 hover:text-[#FF3300] dark:border-white/10 dark:text-white/35"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-black/[0.03] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:border-white/10 dark:bg-white/5 dark:text-white/35">
                <ShieldCheck className="h-4 w-4 text-[#FF3300]" />
                Manual migration only
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5">
                <div className="rounded-3xl border border-black/5 bg-black/[0.02] p-5 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/30 dark:text-white/30">
                        Selected App
                      </p>
                      <h2 className="mt-1 text-xl font-bold">{guide.title}</h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF3300]/10 text-[#FF3300]">
                      <SquareCode className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-black/45 dark:text-white/40">{guide.body}</p>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/30 dark:text-white/30">
                    Migration Steps
                  </p>
                  <div className="space-y-3">
                    {guide.steps.map((step, index) => (
                      <div
                        key={step}
                        className="flex gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-white/[0.02]"
                      >
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF3300] text-[10px] font-bold text-white">
                          {index + 1}
                        </div>
                        <p className="leading-relaxed text-black/65 dark:text-white/70">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-[#FF3300]/15 bg-[#FF3300]/5 p-5">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#FF3300]">
                    <Sparkles className="h-4 w-4" />
                    Add Key Quick Action
                  </div>
                  <div className="mt-4 space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/35 dark:text-white/35">
                      Paste Setup Key Here
                    </label>
                    <input
                      value={setupKey}
                      onChange={(e) => setSetupKey(e.target.value)}
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      className="w-full rounded-2xl border border-black/5 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-[#FF3300]/30 dark:border-white/10 dark:bg-[#0f0f0f]"
                    />
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#FF3300] px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition hover:brightness-110"
                    >
                      Start Generating Code
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-black/5 bg-black/[0.02] p-5 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-black/30 dark:text-white/30">
                    <QrCode className="h-4 w-4 text-[#FF3300]" />
                    Laptop / Desktop
                  </div>
                  <p className="mt-3 text-sm text-black/45 dark:text-white/40">
                    On laptop, keep it simple: use the setup key to generate your Kryptes code.
                  </p>
                  <div className="mt-4 rounded-3xl border border-dashed border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#0f0f0f]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/30 dark:text-white/30">
                      Generated Code
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-black/[0.03] px-4 py-3 font-mono text-lg font-bold tracking-[0.4em] dark:border-white/10 dark:bg-white/[0.05]">
                      <span>{generatedCode || "------"}</span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="inline-flex items-center gap-2 rounded-xl border border-black/5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-black/45 transition hover:border-[#FF3300]/20 hover:text-[#FF3300] dark:border-white/10 dark:text-white/35"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="hidden rounded-3xl border border-black/5 bg-black/[0.02] p-5 dark:border-white/10 dark:bg-white/[0.03] md:hidden">
                  {/* Intentionally hidden by default; this block is toggled visible on mobile below. */}
                </div>

                <div className="md:hidden rounded-3xl border border-[#FF3300]/15 bg-white p-5 dark:bg-white/[0.03]">
                  <button
                    type="button"
                    onClick={() => setMobileScanOpen((s) => !s)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white"
                  >
                    <Smartphone className="h-4 w-4" />
                    {mobileScanOpen ? "Hide Scan Option" : "Show Scan Option"}
                  </button>

                  <AnimatePresence>
                    {mobileScanOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 rounded-3xl border border-dashed border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-[#0f0f0f]">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-black/30 dark:text-white/30">
                            <QrCode className="h-4 w-4 text-[#FF3300]" />
                            Scan Option
                          </div>
                          <div className="mt-4 flex items-center gap-4">
                            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-sm dark:bg-white/5">
                              <div className="grid h-16 w-16 grid-cols-4 gap-1 rounded-xl bg-black p-2">
                                {Array.from({ length: 16 }).map((_, i) => (
                                  <span
                                    key={i}
                                    className={`rounded-[2px] ${i % 3 === 0 || i % 5 === 0 ? "bg-white" : "bg-transparent"}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold">Scan with authenticator app</p>
                              <p className="mt-1 text-xs text-black/45 dark:text-white/40">
                                Use this visual scan helper on mobile, then paste the setup key above.
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
