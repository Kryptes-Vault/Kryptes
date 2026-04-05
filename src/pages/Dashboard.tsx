import { useState } from "react";
import { Shield, BarChart3, Mail, CalendarDays, Fingerprint, Eye, EyeOff, TrendingUp, TrendingDown, Clock, ChevronRight, Search, Bell, Plus } from "lucide-react";
import { VaultWidget } from "@/components/dashboard/VaultWidget";
import { FinanceWidget } from "@/components/dashboard/FinanceWidget";
import { EmailWidget } from "@/components/dashboard/EmailWidget";
import { ScheduleWidget } from "@/components/dashboard/ScheduleWidget";
import { AllExpensesSection } from "@/components/dashboard/AllExpensesSection";

const navItems = [
  { id: "all-expenses", label: "All Expenses", icon: BarChart3 },
  { id: "vault", label: "Vault", icon: Shield },
  { id: "finance", label: "Finance", icon: BarChart3 },
  { id: "email", label: "Email", icon: Mail },
  { id: "schedule", label: "Schedule", icon: CalendarDays },
] as const;

type NavId = (typeof navItems)[number]["id"];

const Dashboard = () => {
  const [activeNav, setActiveNav] = useState<NavId>("all-expenses");

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-20 lg:w-64 border-r border-border/50 glass sticky top-0 h-screen shrink-0">
        <div className="flex items-center gap-3 px-5 h-16 border-b border-border/50">
          <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <span className="hidden lg:block text-lg font-bold tracking-tight">SafeLife</span>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0 mx-auto lg:mx-0" />
                <span className="hidden lg:block">{item.label}</span>
                {active && <div className="hidden lg:block ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border/50">
          <button className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors">
            <Plus className="h-5 w-5 shrink-0" />
            <span className="hidden lg:block">Quick Action</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 glass h-16 flex items-center justify-between px-5 md:px-8">
          <div>
            <h1 className="text-lg font-bold">Good morning ☀️</h1>
            <p className="text-xs text-muted-foreground">Saturday, April 5</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
              <Search className="h-4 w-4 text-muted-foreground" />
            </button>
            <button className="relative h-9 w-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background" />
            </button>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-primary-foreground">
              JD
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-8">
          {activeNav === "all-expenses" ? (
            <AllExpensesSection />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 auto-rows-min">
              {/* Vault - spans 2 cols on xl */}
              <div className="xl:col-span-2">
                <VaultWidget />
              </div>
              {/* Finance - spans 2 cols on xl */}
              <div className="xl:col-span-2">
                <FinanceWidget />
              </div>
              {/* Email - spans 2 cols on md, 2 on xl */}
              <div className="md:col-span-1 xl:col-span-2">
                <EmailWidget />
              </div>
              {/* Schedule */}
              <div className="md:col-span-1 xl:col-span-2">
                <ScheduleWidget />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 glass border-t border-border/50">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${active ? "drop-shadow-[0_0_6px_hsl(28,92%,55%)]" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {active && <div className="h-0.5 w-4 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;
