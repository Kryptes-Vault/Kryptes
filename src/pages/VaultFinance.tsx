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
    className={`rounded-lg border border-white/10 bg-white/[0.065] shadow-2xl shadow-black/20 backdrop-blur-xl ${className}`}
  >
    {children}
  </motion.div>
);

const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-[#12100f]/95 px-3 py-2 text-xs text-white shadow-xl backdrop-blur">
      {label && <p className="mb-1 font-bold text-white/70">{label}</p>}
      {payload.map((item) => (
        <p key={item.dataKey || item.name} style={{ color: item.color }}>
          {item.name || item.dataKey}: {item.value}
        </p>
      ))}
    </div>
  );
};

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
    <main className="min-h-screen overflow-hidden bg-[#0b0908] text-white selection:bg-orange-500/30">
      <motion.div
        className="pointer-events-none fixed inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9 }}
      >
        <div className="hero-aurora absolute inset-[-12%] opacity-80" />
        <div className="hero-grain absolute inset-0" />
        <div className="absolute left-[8%] top-[18%] h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="absolute right-[4%] top-[36%] h-96 w-96 rounded-full bg-emerald-300/10 blur-3xl" />
      </motion.div>

      <section className="relative z-10 px-5 pb-12 pt-8 lg:px-10">
        <motion.header
          initial={{ opacity: 0, y: -12, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto flex max-w-7xl items-center justify-between gap-4"
        >
          <Link to="/" className="group inline-flex items-center gap-3">
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white p-1.5 shadow-[0_0_30px_rgba(249,115,22,0.32)] transition duration-500 group-hover:scale-105 group-hover:shadow-[0_0_44px_rgba(249,115,22,0.52)]">
              <img src="/kryptes.png" alt="Kryptes logo" className="h-full w-full rounded-full object-contain" />
            </span>
            <span>
              <span className="block text-sm font-black tracking-tight">Kryptes</span>
              <span className="hidden text-[10px] font-bold uppercase tracking-[0.22em] text-white/42 sm:block">Vault Finance</span>
            </span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/60 transition-all duration-300 hover:border-orange-300/50 hover:text-orange-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </motion.header>

        <div className="mx-auto grid max-w-7xl items-center gap-10 py-14 lg:grid-cols-[0.92fr_1.08fr] lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 26, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-2 text-xs font-black uppercase tracking-[0.24em] text-orange-100/75">
              <Sparkles className="h-4 w-4 text-orange-300" />
              Financial intelligence
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-[0.96] tracking-tight sm:text-6xl lg:text-7xl">
              Understand where your money actually goes.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/62">
              Upload bank statements into a private vault interface and convert raw transactions into intelligent insights, spending signals, and calm financial clarity.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              {["PDF statements", "Encrypted analysis", "Smart breakdowns"].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/[0.065] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white/62 backdrop-blur">
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
            <GlassCard className="relative overflow-hidden p-5">
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl" />
              <div className="relative grid gap-4">
                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/42">Projected savings</p>
                    <p className="mt-2 text-4xl font-black">₹73,580</p>
                  </div>
                  <BadgeIndianRupee className="h-10 w-10 text-orange-300" strokeWidth={1.4} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {categoryData.slice(0, 3).map((item) => (
                    <div key={item.name} className="rounded-lg border border-white/10 bg-white/[0.055] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">{item.name}</p>
                      <p className="mt-2 text-lg font-black">₹{Math.round(item.value / 1000)}k</p>
                    </div>
                  ))}
                </div>
                <div className="h-48 rounded-lg border border-white/10 bg-black/20 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cashflowData}>
                      <defs>
                        <linearGradient id="heroIncome" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#fb923c" stopOpacity={0.65} />
                          <stop offset="100%" stopColor="#fb923c" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,.42)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="income" stroke="#fb923c" fill="url(#heroIncome)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 px-5 pb-16 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.86fr_1.14fr]">
          <Reveal>
            <GlassCard className="p-5">
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`group relative flex min-h-80 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center transition-all duration-500 ${
                  isDragging ? "border-orange-300 bg-orange-400/10 shadow-[0_0_42px_rgba(249,115,22,0.22)]" : "border-white/15 bg-black/20 hover:border-orange-300/50 hover:bg-white/[0.055]"
                }`}
              >
                <input ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={handleInput} className="hidden" />
                <motion.div
                  animate={isProcessing ? { rotate: 360 } : { rotate: 0 }}
                  transition={isProcessing ? { duration: 1.4, repeat: Infinity, ease: "linear" } : { duration: 0.4 }}
                  className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-orange-300/30 bg-orange-400/10 shadow-[0_0_34px_rgba(249,115,22,0.2)]"
                >
                  {isProcessing ? <Sparkles className="h-7 w-7 text-orange-200" /> : <UploadCloud className="h-7 w-7 text-orange-200" />}
                </motion.div>
                <h2 className="text-2xl font-black tracking-tight">{isProcessing ? "Reading statement signals" : "Upload your bank statement"}</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/54">
                  Drag and drop a PDF statement, or click to select one. The experience is designed to feel secure, private, and calm.
                </p>
                {fileName && (
                  <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs font-bold text-white/70">
                    <FileText className="h-4 w-4 text-orange-200" />
                    {fileName}
                  </div>
                )}
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="grid gap-4 sm:grid-cols-2">
              {financeStats.map((stat) => (
                <GlassCard key={stat.label} className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/40">{stat.label}</p>
                      <p className="mt-3 text-3xl font-black tracking-tight">{hasInsights || stat.label === "Signal Score" ? stat.value : "—"}</p>
                    </div>
                    <stat.icon className="h-6 w-6 text-orange-300" strokeWidth={1.6} />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-emerald-300/80">{hasInsights ? stat.delta : "Awaiting statement"}</p>
                </GlassCard>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative z-10 px-5 pb-20 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <GlassCard className="p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/40">Expense categories</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">Spending gravity</h2>
                </div>
                <LineChartIcon className="h-6 w-6 text-orange-300" />
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
                    <div key={item.name} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.045] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-bold text-white/72">{item.name}</span>
                      </div>
                      <span className="text-sm font-black">₹{item.value.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.08}>
            <GlassCard className="p-5">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/40">Monthly cashflow</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">Income versus expense</h2>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashflowData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,.42)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,.34)", fontSize: 11 }} axisLine={false} tickLine={false} />
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
            <GlassCard className="p-5">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/40">Spending timeline</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">Where the week bends</h2>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.62} />
                        <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,.42)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,.34)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="spend" name="Spend" stroke="#fb923c" fill="url(#trendFill)" strokeWidth={2.4} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="grid gap-4">
              {insights.map((insight, index) => (
                <GlassCard key={insight} className="p-5">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-400/12 text-orange-200">
                      {hasInsights ? <CheckCircle className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/38">Insight 0{index + 1}</p>
                      <p className="mt-2 text-base font-bold leading-6 text-white/82">{hasInsights ? insight : "Upload a statement to unlock this financial signal."}</p>
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
