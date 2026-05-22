import type { MouseEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  Database,
  FileKey2,
  Github,
  Globe,
  KeyRound,
  Lock,
  LucideIcon,
  ServerCog,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";

import laptopMockup from "@/assets/laptop-ui-mockup.jpg";
import phoneMockup from "@/assets/smartphone-ui-mockup.jpg";

type RevealSectionProps = {
  children: ReactNode;
  className?: string;
};

type FeatureCardProps = {
  title: string;
  desc: string;
  icon: LucideIcon;
};

type Stat = {
  value: string;
  label: string;
  countTo?: number;
  suffix?: string;
  prefix?: string;
};

type MagneticButtonProps = {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary";
};

const trustBadges = ["Zero-knowledge encrypted", "Open source", "End-to-end security"];

const stats: Stat[] = [
  { value: "256-bit", label: "vault encryption", countTo: 256, suffix: "-bit" },
  { value: "0", label: "server-held keys", countTo: 0 },
  { value: "24/7", label: "secure access", prefix: "24/7" },
];

const features = [
  {
    icon: Lock,
    title: "Zero Knowledge",
    desc: "Private keys stay on your side of the vault boundary, so sensitive data is never exposed upstream.",
  },
  {
    icon: Zap,
    title: "Fast Recovery",
    desc: "Encrypted recovery paths keep access practical without weakening the protection model.",
  },
  {
    icon: Shield,
    title: "Shared Secrets",
    desc: "Burn links and support grants help you share exactly what is needed, then close access cleanly.",
  },
  {
    icon: Database,
    title: "Structured Vaults",
    desc: "Passwords, documents, cards, media, and banking records live in one organized encrypted workspace.",
  },
];

const workflow = [
  { icon: KeyRound, title: "Create", desc: "Generate or import secrets into a private encrypted vault." },
  { icon: ServerCog, title: "Sync", desc: "Store ciphertext in the cloud while keys remain under user control." },
  { icon: FileKey2, title: "Share", desc: "Grant narrow access with time-boxed, auditable handoffs." },
];

const navLinks = [
  { href: "#security", label: "Security" },
  { href: "#workflow", label: "Workflow" },
  { href: "#open-source", label: "Integrity" },
];

const heroStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.35,
      staggerChildren: 0.12,
    },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 22, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.82, ease: [0.22, 1, 0.36, 1] as unknown as any },
  },
};

const particles = [
  { left: "8%", top: "18%", size: 3 },
  { left: "18%", top: "72%", size: 2 },
  { left: "29%", top: "32%", size: 2 },
  { left: "42%", top: "14%", size: 3 },
  { left: "55%", top: "78%", size: 2 },
  { left: "66%", top: "27%", size: 2 },
  { left: "78%", top: "64%", size: 3 },
  { left: "90%", top: "22%", size: 2 },
  { left: "94%", top: "82%", size: 2 },
];

const RevealSection = ({ children, className }: RevealSectionProps) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.65, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

const FeatureCard = ({ title, desc, icon: Icon }: FeatureCardProps) => (
  <motion.div
    whileHover={{ y: -6, rotateX: 1.5, rotateY: -1.5 }}
    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    className="h-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all duration-500 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/80"
  >
    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-orange-200 bg-orange-50">
      <Icon className="h-5 w-5 text-orange-600" strokeWidth={1.8} />
    </div>
    <h3 className="mb-3 text-lg font-black tracking-tight text-gray-950">{title}</h3>
    <p className="text-sm leading-6 text-gray-600">{desc}</p>
  </motion.div>
);

const MagneticButton = ({ children, href, variant = "primary" }: MagneticButtonProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 18, mass: 0.3 });
  const springY = useSpring(y, { stiffness: 220, damping: 18, mass: 0.3 });

  const handleMouseMove = (event: MouseEvent<HTMLAnchorElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left - rect.width / 2) * 0.18);
    y.set((event.clientY - rect.top - rect.height / 2) * 0.18);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const baseClass =
    "group relative inline-flex overflow-hidden rounded-lg px-6 py-4 text-xs font-black uppercase tracking-[0.22em] transition-all duration-500 ease-out";
  const variantClass =
    variant === "primary"
      ? "bg-orange-500 text-white shadow-xl shadow-orange-500/25 hover:-translate-y-1 hover:shadow-orange-500/45"
      : "border border-white/20 bg-white/[0.08] text-white shadow-sm backdrop-blur hover:-translate-y-1 hover:border-orange-300/80 hover:bg-white/[0.12]";

  return (
    <motion.a
      href={href}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      whileTap={{ scale: 0.98 }}
      className={`${baseClass} ${variantClass}`}
    >
      <span className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <span className="absolute inset-x-[-30%] top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
      </span>
      <span className="relative flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.a>
  );
};

const CountUpStat = ({ stat }: { stat: Stat }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView || typeof stat.countTo !== "number") return;

    const duration = 1100;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(stat.countTo * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, stat.countTo]);

  const display = stat.prefix ?? `${value}${stat.suffix ?? ""}`;

  return (
    <div ref={ref} className="px-5 py-4 md:border-r md:border-white/10 md:last:border-r-0">
      <p className="text-3xl font-black tracking-tight text-white">{display}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-white/50">{stat.label}</p>
    </div>
  );
};

const Marquee = ({ items }: { items: string[] }) => {
  const duplicatedItems = [...items, ...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-gray-200 bg-gray-950 text-white">
      <motion.div
        animate={{ x: [0, -1200] }}
        transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
        className="flex whitespace-nowrap px-6 py-3"
      >
        {duplicatedItems.map((item, i) => (
          <div key={`${item}-${i}`} className="flex shrink-0 items-center gap-8 pr-8">
            <span className="text-xs font-black uppercase tracking-[0.28em] text-gray-100">{item}</span>
            <Sparkles className="h-4 w-4 text-orange-400" strokeWidth={1.8} />
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const BrandMark = () => (
  <motion.a
    href="/"
    aria-label="Kryptes home"
    whileHover={{ scale: 1.035 }}
    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    className="group inline-flex items-center gap-3"
  >
    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white p-1.5 shadow-[0_0_30px_rgba(249,115,22,0.28)] transition duration-500 group-hover:shadow-[0_0_44px_rgba(249,115,22,0.48)]">
      <span className="absolute inset-[-5px] rounded-full border border-orange-300/35 opacity-80 transition duration-500 group-hover:border-orange-300/70" />
      <img src="/kryptes.png" alt="Kryptes logo" className="h-full w-full rounded-full object-contain" />
    </span>
    <span className="block">
      <span className="block text-sm font-black leading-none tracking-tight text-white sm:text-base">Kryptes</span>
      <span className="hidden text-[10px] font-bold uppercase tracking-[0.22em] text-white/42 sm:block">Private vault</span>
    </span>
  </motion.a>
);

const Index = () => {
  const shouldReduceMotion = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 90, damping: 24, mass: 0.4 });
  const smoothY = useSpring(mouseY, { stiffness: 90, damping: 24, mass: 0.4 });
  const auroraX = useTransform(smoothX, [-0.5, 0.5], ["-1.4%", "1.4%"]);
  const auroraY = useTransform(smoothY, [-0.5, 0.5], ["-1%", "1%"]);
  const deviceRotateY = useTransform(smoothX, [-0.5, 0.5], [4, -4]);
  const deviceRotateX = useTransform(smoothY, [-0.5, 0.5], [-3, 3]);
  const phoneX = useTransform(smoothX, [-0.5, 0.5], [-10, 10]);

  const handleHeroMouseMove = (event: MouseEvent<HTMLElement>) => {
    if (shouldReduceMotion) return;

    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set((event.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <div className="min-h-screen bg-white text-gray-950 selection:bg-orange-100 selection:text-orange-950">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-[#090807]"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8, delay: 1.2, ease: [0.65, 0, 0.35, 1] }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.82 }}
          animate={{ opacity: [0, 1, 1], scale: [0.82, 1.08, 1] }}
          transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
          className="group relative flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-white p-4 shadow-2xl shadow-orange-500/30"
        >
          <motion.div
            className="absolute inset-[-9px] rounded-full border border-orange-400/50"
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 1.45, opacity: 0 }}
            transition={{ duration: 1.1, repeat: 1, ease: "easeOut" }}
          />
          <img src="/kryptes.png" alt="" className="h-full w-full rounded-full object-contain" />
        </motion.div>
      </motion.div>

      <main>
        <section
          onMouseMove={handleHeroMouseMove}
          className="relative min-h-screen overflow-hidden bg-[#0b0908] px-5 pb-16 pt-8 text-white lg:px-10 lg:pb-24 lg:pt-14"
        >
          <motion.div
            aria-hidden="true"
            className="hero-aurora pointer-events-none absolute inset-[-12%] opacity-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.8, delay: 0.45, ease: "easeOut" }}
            style={{ x: auroraX, y: auroraY }}
          />
          <div aria-hidden="true" className="hero-grain pointer-events-none absolute inset-0" />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-[6%] top-[22%] h-72 w-72 rounded-full bg-orange-500/18 blur-3xl"
            initial={{ opacity: 0, scale: 0.86 }}
            animate={{ opacity: 0.55, scale: [0.96, 1.08, 0.96] }}
            transition={{ opacity: { duration: 1.6, delay: 0.25 }, scale: { duration: 8, repeat: Infinity, ease: "easeInOut" } }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute right-[4%] top-[12%] h-80 w-80 rounded-full bg-white/[0.08] blur-3xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.35, scale: [1.04, 0.96, 1.04] }}
            transition={{ opacity: { duration: 1.8, delay: 0.5 }, scale: { duration: 9, repeat: Infinity, ease: "easeInOut" } }}
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            {particles.map((particle, index) => (
              <span
                key={`${particle.left}-${particle.top}`}
                className="ambient-particle absolute rounded-full bg-orange-100/70 shadow-[0_0_18px_rgba(251,146,60,0.45)]"
                style={{
                  left: particle.left,
                  top: particle.top,
                  height: particle.size,
                  width: particle.size,
                  animationDelay: `${index * -1.4}s`,
                }}
              />
            ))}
          </div>

          <motion.header
            initial={{ opacity: 0, y: -14, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.72, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-20 mx-auto flex max-w-7xl items-center justify-between gap-4"
          >
            <BrandMark />

            <nav className="hidden min-w-0 items-center justify-end gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 shadow-2xl shadow-black/20 backdrop-blur-xl min-[460px]:flex sm:gap-5 sm:px-5">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="whitespace-nowrap rounded-full px-2 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/52 transition-all duration-300 hover:bg-white/[0.08] hover:text-orange-100 sm:px-3 sm:text-[11px] sm:tracking-[0.2em]"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </motion.header>

          <div className="relative z-10 mx-auto grid min-h-[calc(100vh-11rem)] max-w-7xl items-center gap-12 pt-12 lg:grid-cols-[0.92fr_1.08fr] lg:pt-10">
            <motion.div variants={heroStagger} initial="hidden" animate="visible">
              <motion.h1 className="max-w-3xl text-5xl font-black leading-[0.96] tracking-tight text-white sm:text-6xl lg:text-7xl">
                {["Secure your", "digital life in", "one private vault."].map((line) => (
                  <motion.span key={line} variants={heroItem} className="block">
                    {line}
                  </motion.span>
                ))}
              </motion.h1>

              <motion.p variants={heroItem} className="mt-7 max-w-2xl text-lg leading-8 text-white/62">
                Kryptes keeps passwords, documents, banking details, and shared secrets organized behind a zero-knowledge security model built for everyday use.
              </motion.p>

              <motion.div variants={heroItem} className="mt-9 flex flex-col gap-3 sm:flex-row">
                <MagneticButton href="/dashboard">
                  Access Vault
                  <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
                </MagneticButton>
                <MagneticButton href="#security" variant="secondary">
                  Explore Security
                </MagneticButton>
              </motion.div>

              <motion.div variants={heroStagger} className="mt-8 flex flex-wrap gap-3">
                {trustBadges.map((badge) => (
                  <motion.div
                    key={badge}
                    variants={heroItem}
                    whileHover={{ y: -2, scale: 1.02 }}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-2 shadow-sm backdrop-blur"
                  >
                    <CheckCircle className="h-4 w-4 text-emerald-300" strokeWidth={2} />
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">{badge}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 72, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 1.05, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="relative min-h-[420px] [perspective:1400px] lg:min-h-[560px]"
              style={{ rotateX: deviceRotateX, rotateY: deviceRotateY }}
            >
              <motion.div
                className="absolute left-6 top-4 h-52 w-52 rounded-full bg-emerald-300/15 blur-3xl"
                animate={{ scale: [1, 1.12, 1], opacity: [0.45, 0.7, 0.45] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute bottom-2 right-8 h-64 w-64 rounded-full bg-orange-400/20 blur-3xl"
                animate={{ scale: [1.08, 0.96, 1.08], opacity: [0.45, 0.72, 0.45] }}
                transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
              />

              <motion.div
                className="relative ml-auto max-w-3xl rounded-lg border border-white/10 bg-white/10 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <img
                  src={laptopMockup}
                  alt="Kryptes desktop vault interface"
                  className="aspect-video w-full rounded-md object-cover"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 34, rotate: -4 }}
                animate={{ opacity: 1, y: [0, -10, 0], rotate: 0 }}
                style={{ x: phoneX }}
                transition={{
                  opacity: { duration: 0.6, delay: 1 },
                  y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.2 },
                  rotate: { duration: 0.7, delay: 1, ease: "easeOut" },
                }}
                className="absolute -bottom-2 left-4 w-36 rounded-lg border border-white/15 bg-white/10 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl sm:w-44 lg:left-10 lg:w-52"
              >
                <img
                  src={phoneMockup}
                  alt="Kryptes mobile vault interface"
                  className="aspect-[9/16] w-full rounded-md object-cover"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 top-0 hidden rounded-lg border border-orange-300/20 bg-white/10 p-4 shadow-xl shadow-orange-950/20 backdrop-blur-xl lg:block"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-400/15">
                    <Shield className="h-5 w-5 text-orange-200" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Protected</p>
                    <p className="text-sm font-black text-white">Keys stay local</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 1.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mx-auto mt-12 grid max-w-7xl gap-3 border-y border-white/10 bg-white/[0.06] py-4 backdrop-blur-xl md:grid-cols-3"
          >
            {stats.map((stat) => (
              <CountUpStat key={stat.label} stat={stat} />
            ))}
          </motion.div>
        </section>

        <Marquee items={["Zero-knowledge vault", "Encrypted documents", "Burn-after-read sharing", "Banking records", "Password manager"]} />

        <section id="security" className="px-5 py-20 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <RevealSection className="mb-12 max-w-3xl">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.34em] text-orange-600">Layer 01 — Security</p>
              <h2 className="text-4xl font-black tracking-tight text-gray-950 lg:text-5xl">Fuller protection without the clutter.</h2>
              <p className="mt-5 text-lg leading-8 text-gray-600">
                A cleaner vault experience should still feel serious. Kryptes groups sensitive workflows into focused surfaces, with direct controls and visible security states.
              </p>
            </RevealSection>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <RevealSection key={feature.title}>
                  <FeatureCard {...feature} />
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="border-y border-gray-200 bg-gray-950 px-5 py-20 text-white lg:px-10 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <RevealSection>
              <p className="mb-4 text-xs font-black uppercase tracking-[0.34em] text-orange-400">Layer 02 — Workflow</p>
              <h2 className="text-4xl font-black tracking-tight lg:text-5xl">Built for the way private data actually moves.</h2>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Most vaults stop at storage. Kryptes adds the operational pieces around it: protected sharing, support grants, audit history, and organized document storage.
              </p>
            </RevealSection>

            <div className="grid gap-4 md:grid-cols-3">
              {workflow.map((item, index) => (
                <RevealSection key={item.title} className="rounded-lg border border-white/10 bg-white/[0.06] p-6">
                  <div className="mb-8 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-500 text-white">
                      <item.icon className="h-5 w-5" strokeWidth={1.8} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.24em] text-gray-500">0{index + 1}</span>
                  </div>
                  <h3 className="mb-3 text-xl font-black">{item.title}</h3>
                  <p className="text-sm leading-6 text-gray-300">{item.desc}</p>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        <section id="open-source" className="px-5 py-20 lg:px-10 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
            <RevealSection>
              <p className="mb-4 text-xs font-black uppercase tracking-[0.34em] text-orange-600">Layer 03 — Integrity</p>
              <h2 className="text-4xl font-black tracking-tight text-gray-950 lg:text-5xl">
                Open source where it matters. Closed to everyone else.
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                The security model is designed to be inspectable, but your vault contents remain private. That balance gives the page a stronger promise and gives users a cleaner reason to trust it.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {["Publicly auditable logic", "No server-held master keys", "Ephemeral sharing flows", "Encrypted document storage"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2} />
                    <span className="text-sm font-bold text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </RevealSection>

            <RevealSection className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-gray-500">Audit Console</p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-gray-950">Vault events</h3>
                  </div>
                  <Globe className="h-8 w-8 text-orange-600" strokeWidth={1.6} />
                </div>
                <div className="space-y-3">
                  {["Master key derived locally", "Document uploaded as ciphertext", "Burn share link expired", "Support grant revoked"].map((event) => (
                    <div key={event} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                      <span className="text-sm font-semibold text-gray-700">{event}</span>
                      <span className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Verified</span>
                    </div>
                  ))}
                </div>
              </div>
            </RevealSection>
          </div>
        </section>

        <section className="bg-orange-500 px-5 py-16 text-center text-white lg:px-10">
          <RevealSection className="mx-auto max-w-4xl">
            <p className="mb-5 text-xs font-black uppercase tracking-[0.34em] text-orange-100">Kryptes Protocol</p>
            <h2 className="text-4xl font-black tracking-tight lg:text-6xl">Bring your vault into one clean command center.</h2>
            <div className="mt-8 flex justify-center">
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-4 text-xs font-black uppercase tracking-[0.22em] text-orange-700 shadow-xl shadow-orange-900/20 transition-all hover:bg-gray-950 hover:text-white"
              >
                Start Initiative
                <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
              </a>
            </div>
          </RevealSection>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white px-5 py-10 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-orange-200 bg-white p-1.5 shadow-[0_0_24px_rgba(249,115,22,0.18)]">
              <img src="/kryptes.png" alt="Kryptes logo" className="h-full w-full rounded-full object-contain" />
            </div>
            <div>
              <span className="block text-lg font-black leading-none tracking-tight">KRYPTES</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500">Zero-knowledge vault</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
            <a href="/privacy" className="transition-colors hover:text-orange-600">
              Privacy
            </a>
            <a href="/terms" className="transition-colors hover:text-orange-600">
              Terms
            </a>
            <a href="#open-source" className="transition-colors hover:text-orange-600">
              Repository
            </a>
          </div>

          <a
            href="#open-source"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
            aria-label="View repository"
          >
            <Github className="h-5 w-5" strokeWidth={1.6} />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Index;
