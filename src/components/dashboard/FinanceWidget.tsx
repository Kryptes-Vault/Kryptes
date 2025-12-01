import { BarChart3, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";

const transactions = [
  { id: 1, name: "Spotify", amount: -9.99, category: "Entertainment", date: "Today" },
  { id: 2, name: "Salary", amount: 4200.0, category: "Income", date: "Apr 1" },
  { id: 3, name: "Uber Eats", amount: -32.5, category: "Food", date: "Apr 3" },
  { id: 4, name: "Amazon", amount: -67.89, category: "Shopping", date: "Apr 4" },
];

const spendingBars = [
  { label: "Food", value: 320, max: 500, color: "bg-primary" },
  { label: "Transport", value: 180, max: 500, color: "bg-accent" },
  { label: "Shopping", value: 420, max: 500, color: "bg-primary/60" },
  { label: "Bills", value: 290, max: 500, color: "bg-accent/60" },
];

export const FinanceWidget = () => {
  return (
    <div className="glass rounded-2xl p-5 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Finance Tracker</h3>
            <p className="text-xs text-muted-foreground">April 2026</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">$4,089.62</p>
          <p className="text-[10px] text-green-400 flex items-center gap-0.5 justify-end">
            <TrendingUp className="h-3 w-3" /> +12.4%
          </p>
        </div>
      </div>

      {/* Spending bars */}
      <div className="space-y-3 mb-5">
        {spendingBars.map((bar) => (
          <div key={bar.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">{bar.label}</span>
              <span className="font-medium">${bar.value}</span>
            </div>
            <div className="h-2 rounded-full bg-secondary">
              <div
                className={`h-full rounded-full ${bar.color} transition-all duration-700`}
                style={{ width: `${(bar.value / bar.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Recent transactions */}
      <div className="space-y-2">
        {transactions.slice(0, 3).map((tx) => (
          <div key={tx.id} className="flex items-center justify-between py-1.5">
            <div>
              <p className="text-xs font-medium">{tx.name}</p>
              <p className="text-[10px] text-muted-foreground">{tx.date}</p>
            </div>
            <span className={`text-xs font-semibold ${tx.amount > 0 ? "text-green-400" : "text-foreground"}`}>
              {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <button className="mt-4 w-full flex items-center justify-center gap-2 text-xs text-primary font-medium py-2 rounded-xl hover:bg-primary/10 transition-colors">
        View all transactions <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
