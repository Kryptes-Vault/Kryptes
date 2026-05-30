import React, { useRef, useState } from "react";
import type { ChangeEvent, DragEvent, ReactNode } from "react";
import { motion } from "framer-motion";
import {
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
  ShieldCheck
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
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const Reveal = ({ children, className, delay = 0 }: RevealProps) => (
  <motion.div
    variants={reveal}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const GlassCard = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <motion.div
    whileHover={{ y: -2 }}
    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    className={`rounded-2xl border border-black/5 bg-white p-6 shadow-sm hover:shadow-md transition-all ${className}`}
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

export function FinanceView({
  userId,
  filter = "all"
}: {
  userId: string;
  filter?: "all" | "statements" | "analytics";
}) {
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

  const showUploader = filter === "all" || filter === "statements";
  const showAnalytics = filter === "all" || filter === "analytics";

  return (
    <div className="w-full max-w-[1600px] mx-auto">
      {/* Dynamic Header with Corner Utilization */}
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between pb-8 border-b border-black/[0.03]">
        <div className="flex items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-black text-white shadow-2xl shadow-black/20 shrink-0 border border-white/10">
            <LineChartIcon className="h-8 w-8 text-[#FF3B13]" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black tracking-tighter text-black lg:text-4xl">
                Finance <span className="text-[#FF3B13] tracking-normal italic uppercase text-2xl ml-1">Tracker</span>
              </h1>
              <div className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 border border-orange-100 text-[9px] font-black uppercase tracking-widest h-fit">
                Active Vault
              </div>
            </div>
            <p className="text-[12px] text-black/40 flex items-center gap-2 font-bold uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4 text-[#FF3B13]" />
              Zero-knowledge financial intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick Stats in the Corner */}
          <div className="hidden lg:flex items-center gap-6 px-6 py-4 rounded-3xl bg-white border border-black/5 shadow-sm mr-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-black/30 uppercase tracking-widest">Signal Score</span>
              <span className="text-sm font-bold text-black">{hasInsights ? "86" : "—"}</span>
            </div>
            <div className="h-8 w-[1px] bg-black/5" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-black/30 uppercase tracking-widest">Vault Status</span>
              <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                VERIFIED
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Sections */}
      <div className="space-y-12">
        {/* Upload & Summary Stats Row */}
        {showUploader && (
          <div className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr]">
            <Reveal>
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`group relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed p-8 text-center transition-all duration-500 ${
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
                <h2 className="text-xl font-bold tracking-tight text-gray-900">{isProcessing ? "Reading statement signals" : "Upload your bank statement"}</h2>
                <p className="mt-2 text-xs leading-relaxed text-gray-500 max-w-sm">
                  Drag and drop a PDF statement, or click to select one. The experience is designed to feel secure, private, and calm.
                </p>
                {fileName && (
                  <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm">
                    <FileText className="h-4 w-4 text-orange-500" />
                    {fileName}
                  </div>
                )}
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="grid gap-4 sm:grid-cols-2">
                {financeStats.map((stat) => (
                  <GlassCard key={stat.label}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{stat.label}</p>
                        <p className="mt-3 text-2xl font-black tracking-tight text-gray-900">{hasInsights || stat.label === "Signal Score" ? stat.value : "—"}</p>
                      </div>
                      <stat.icon className="h-6 w-6 text-orange-500" strokeWidth={1.6} />
                    </div>
                    <p className={`mt-4 text-xs font-bold uppercase tracking-wider ${hasInsights ? "text-green-600" : "text-gray-400"}`}>
                      {hasInsights ? stat.delta : "Awaiting statement"}
                    </p>
                  </GlassCard>
                ))}
              </div>
            </Reveal>
          </div>
        )}

        {/* Analytics Row */}
        {showAnalytics && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal>
              <GlassCard>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Expense categories</p>
                    <h2 className="mt-1 text-xl font-bold tracking-tight text-gray-900">Spending gravity</h2>
                  </div>
                  <LineChartIcon className="h-5 w-5 text-orange-500" />
                </div>
                <div className="grid gap-6 md:grid-cols-[0.82fr_1fr] md:items-center">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                          {categoryData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {categoryData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between rounded-xl border border-black/[0.03] bg-gray-50/50 px-4 py-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="font-semibold text-gray-600">{item.name}</span>
                        </div>
                        <span className="font-black text-gray-900">₹{item.value.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </Reveal>

            <Reveal delay={0.08}>
              <GlassCard>
                <div className="mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Monthly cashflow</p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-gray-900">Income versus expense</h2>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashflowData}>
                      <CartesianGrid stroke="rgba(0,0,0,0.04)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: "rgba(0,0,0,.42)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "rgba(0,0,0,.34)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="income" name="Income" fill="#fb923c" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Expense" fill="#34d399" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </Reveal>
          </div>
        )}

        {/* Timeline & Insights Row */}
        {showAnalytics && (
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <Reveal>
              <GlassCard>
                <div className="mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Spending timeline</p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-gray-900">Where the week bends</h2>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(0,0,0,0.04)" vertical={false} />
                      <XAxis dataKey="day" tick={{ fill: "rgba(0,0,0,.42)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "rgba(0,0,0,.34)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="spend" name="Spend" stroke="#ea580c" fill="url(#trendFill)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="grid gap-4">
                {insights.map((insight, index) => (
                  <GlassCard key={insight} className="!py-4">
                    <div className="flex gap-4 items-center">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                        {hasInsights ? <CheckCircle className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Insight 0{index + 1}</p>
                        <p className="mt-1 text-xs font-semibold text-gray-800 leading-normal">{hasInsights ? insight : "Upload a statement to unlock this financial signal."}</p>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </Reveal>
          </div>
        )}
      </div>
    </div>
  );
}
