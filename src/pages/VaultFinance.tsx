import type { ChangeEvent, DragEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeIndianRupee,
  Brain,
  CheckCircle,
  FileText,
  LineChart as LineChartIcon,
  Lock,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UploadCloud,
  WalletCards,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

type ChartTooltipPayload = {
  color?: string;
  dataKey?: string | number;
  name?: string | number;
  value?: string | number;
};

type ChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: ChartTooltipPayload[];
};

const financeStats = [
  { label: "Total Income", value: "₹1,82,000", delta: "+12.4%", icon: TrendingUp },
  { label: "Total Expenses", value: "₹1,08,420", delta: "-4.8%", icon: TrendingDown },
  { label: "Savings", value: "₹73,580", delta: "+18.2%", icon: WalletCards },
  { label: "Signal Score", value: "86", delta: "Healthy", icon: Brain },
];

const categoryData = [
  { name: "Food", value: 28400, color: "#f97316" },
  { name: "Rent", value: 42000, color: "#fb923c" },
  { name: "Travel", value: 14600, color: "#34d399" },
  { name: "Subscriptions", value: 2400, color: "#facc15" },
  { name: "Shopping", value: 21020, color: "#f43f5e" },
];

const cashflowData = [
  { month: "Jan", income: 142, expense: 96 },
  { month: "Feb", income: 151, expense: 103 },
  { month: "Mar", income: 146, expense: 98 },
  { month: "Apr", income: 168, expense: 116 },
  { month: "May", income: 182, expense: 108 },
];

const trendData = [
  { day: "Mon", spend: 8.2 },
  { day: "Tue", spend: 10.4 },
  { day: "Wed", spend: 7.6 },
  { day: "Thu", spend: 12.1 },
  { day: "Fri", spend: 18.4 },
  { day: "Sat", spend: 24.2 },
  { day: "Sun", spend: 21.8 },
];

const insights = [
  "Food spending increased 18% this month",
  "Subscriptions cost ₹2,400 this month",
  "Weekend spending is significantly higher",
  "You saved more compared to last month",
];

const reveal = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const Reveal = ({ children, className, delay = 0 }: RevealProps) => (
  <motion.div
    variants={reveal}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-90px" }}
    transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const GlassCard = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <motion.div
    whileHover={{ y: -4 }}
    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    className={`rounded-2xl border border-gray-100 bg-white/75 shadow-xl shadow-gray-200/30 backdrop-blur-xl ${className}`}
  >
    {children}
  </motion.div>
);

const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white/95 px-3 py-2 text-xs text-gray-900 shadow-xl backdrop-blur">
      {label && <p className="mb-1 font-bold text-gray-500">{label}</p>}
      {payload.map((item) => (
        <p key={item.dataKey || item.name} style={{ color: item.color }} className="font-medium">
          {item.name || item.dataKey}: {item.value}
        </p>
      ))}
    </div>
  );
};
const navLinks = [
  { href: "/", label: "Home", active: false },
  { href: "/#capabilities", label: "Capabilities", active: false },
  { href: "/#features", label: "Features", active: false },
  { href: "/#enterprise", label: "Enterprise", active: false },
  { href: "/#faq", label: "FAQ", active: false },
  { href: "/vault-finance", label: "Finance", active: true },
];

const BrandMark = () => (
  <Link to="/" className="flex items-center gap-2 group">
    <img src="/kryptes.png" alt="Kryptes Logo" className="h-8 w-auto object-contain" />
    <span className="text-xl font-bold tracking-tight text-gray-900 ml-1">Kryptes</span>
  </Link>
);

const VaultFinance = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasInsights, setHasInsights] = useState(false);

  const processFile = (file?: File) => {
    if (!file) return;

    setFileName(file.name);
    setHasInsights(false);
    setIsProcessing(true);

    window.setTimeout(() => {
      setIsProcessing(false);
      setHasInsights(true);
    }, 1400);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    processFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    processFile(event.dataTransfer.files?.[0]);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-white text-gray-900 selection:bg-orange-500/20">
      <motion.div
        className="pointer-events-none fixed inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9 }}
      >
        <div 
          className="absolute inset-0 z-0 opacity-20" 
          style={{ backgroundImage: 'radial-gradient(circle, #ea580c 1px, transparent 1px)', backgroundSize: '36px 36px' }} 
        />
        <div className="absolute left-[8%] top-[18%] h-72 w-72 rounded-full bg-orange-100/40 blur-3xl" />
        <div className="absolute right-[4%] top-[36%] h-96 w-96 rounded-full bg-emerald-100/30 blur-3xl" />
      </motion.div>

      <section className="relative w-full pt-6 pb-20 overflow-hidden">
        <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-10">
          <motion.header
            initial={{ opacity: 0, y: -12, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-between"
          >
          <BrandMark />

          {/* Pill Navigation */}
          <nav className="hidden md:flex items-center bg-white border border-gray-100 rounded-full p-1.5 shadow-sm">
            {navLinks.map((link) => {
              const isRoute = link.href.startsWith("/") && !link.href.includes("#");
              const className = `px-5 py-2 rounded-full text-sm font-medium transition-all ${
                link.active 
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
              }`;
              return isRoute ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className={className}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className={className}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* CTA */}
          <Link 
            to="/auth" 
            className="hidden md:inline-flex px-6 py-2.5 rounded-full bg-orange-500 text-white text-sm font-medium shadow-lg shadow-orange-500/25 transition-transform hover:scale-105 hover:bg-orange-600"
          >
            Access Vault
          </Link>
        </motion.header>

          <div className="grid items-center gap-10 py-14 lg:grid-cols-[0.92fr_1.08fr] lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 26, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-black uppercase tracking-[0.24em] text-orange-600">
              <Sparkles className="h-4 w-4 text-orange-500" />
              Financial intelligence
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-[0.96] tracking-tight sm:text-6xl lg:text-7xl text-gray-900">
              Understand where your money <span className="font-serif italic font-medium text-orange-600">actually</span> goes.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-gray-500">
              Upload bank statements into a private vault interface and convert raw transactions into intelligent insights, spending signals, and calm financial clarity.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              {["PDF statements", "Encrypted analysis", "Smart breakdowns"].map((item) => (
                <span key={item} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-gray-600 shadow-sm">
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 48, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.95, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <GlassCard className="relative overflow-hidden p-6 border border-gray-100 bg-white/80 shadow-2xl shadow-gray-200/50">
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-orange-100/50 blur-3xl" />
              <div className="relative grid gap-5">
                <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400">Projected savings</p>
                    <p className="mt-2 text-4xl font-black text-gray-900">₹73,580</p>
                  </div>
                  <BadgeIndianRupee className="h-10 w-10 text-orange-500" strokeWidth={1.4} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {categoryData.slice(0, 3).map((item) => (
                    <div key={item.name} className="rounded-2xl border border-gray-100 bg-gray-50/40 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{item.name}</p>
                      <p className="mt-2 text-lg font-black text-gray-900">₹{Math.round(item.value / 1000)}k</p>
                    </div>
                  ))}
                </div>
                <div className="h-48 rounded-2xl border border-gray-100 bg-gray-50/40 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cashflowData}>
                      <defs>
                        <linearGradient id="heroIncome" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fill: "rgba(0,0,0,.42)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="income" stroke="#ea580c" fill="url(#heroIncome)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </GlassCard>
          </motion.div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 pb-16 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.86fr_1.14fr]">
          <Reveal>
            <GlassCard className="p-6">
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`group relative flex min-h-[340px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-500 ${
                  isDragging 
                    ? "border-orange-500 bg-orange-50 shadow-[0_0_42px_rgba(249,115,22,0.15)]" 
                    : "border-gray-200 bg-gray-50/50 hover:border-orange-500/50 hover:bg-orange-50/10"
                }`}
              >
                <input ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={handleInput} className="hidden" />
                <motion.div
                  animate={isProcessing ? { rotate: 360 } : { rotate: 0 }}
                  transition={isProcessing ? { duration: 1.4, repeat: Infinity, ease: "linear" } : { duration: 0.4 }}
                  className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-orange-200 bg-orange-50 shadow-[0_0_34px_rgba(249,115,22,0.1)]"
                >
                  {isProcessing ? <Sparkles className="h-7 w-7 text-orange-500" /> : <UploadCloud className="h-7 w-7 text-orange-500" />}
                </motion.div>
                <h2 className="text-2xl font-black tracking-tight text-gray-900">{isProcessing ? "Reading statement signals" : "Upload your bank statement"}</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-gray-500">
                  Drag and drop a PDF statement, or click to select one. The experience is designed to feel secure, private, and calm.
                </p>
                {fileName && (
                  <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm">
                    <FileText className="h-4 w-4 text-orange-500" />
                    {fileName}
                  </div>
                )}
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="grid gap-4 sm:grid-cols-2">
              {financeStats.map((stat) => (
                <GlassCard key={stat.label} className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400">{stat.label}</p>
                      <p className="mt-3 text-3xl font-black tracking-tight text-gray-900">{hasInsights || stat.label === "Signal Score" ? stat.value : "—"}</p>
                    </div>
                    <stat.icon className="h-6 w-6 text-orange-500" strokeWidth={1.6} />
                  </div>
                  <p className={`mt-4 text-sm font-semibold ${hasInsights ? "text-emerald-600" : "text-gray-400"}`}>
                    {hasInsights ? stat.delta : "Awaiting statement"}
                  </p>
                </GlassCard>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative z-10 px-5 pb-20 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <GlassCard className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400">Expense categories</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-gray-900">Spending gravity</h2>
                </div>
                <LineChartIcon className="h-6 w-6 text-orange-500" />
              </div>
              <div className="grid gap-5 md:grid-cols-[0.82fr_1fr] md:items-center">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
                        {categoryData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {categoryData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-bold text-gray-700">{item.name}</span>
                      </div>
                      <span className="text-sm font-black text-gray-900">₹{item.value.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.08}>
            <GlassCard className="p-6">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400">Monthly cashflow</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-gray-900">Income versus expense</h2>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashflowData}>
                    <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "rgba(0,0,0,.42)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(0,0,0,.34)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="income" name="Income" fill="#fb923c" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#34d399" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </Reveal>
        </div>
      </section>

      <section className="relative z-10 px-5 pb-24 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <Reveal>
            <GlassCard className="p-6">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400">Spending timeline</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-gray-900">Where the week bends</h2>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "rgba(0,0,0,.42)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(0,0,0,.34)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="spend" name="Spend" stroke="#ea580c" fill="url(#trendFill)" strokeWidth={2.4} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="grid gap-4">
              {insights.map((insight, index) => (
                <GlassCard key={insight} className="p-6">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
                      {hasInsights ? <CheckCircle className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400">Insight 0{index + 1}</p>
                      <p className="mt-2 text-base font-bold leading-6 text-gray-800">{hasInsights ? insight : "Upload a statement to unlock this financial signal."}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
};

export default VaultFinance;
