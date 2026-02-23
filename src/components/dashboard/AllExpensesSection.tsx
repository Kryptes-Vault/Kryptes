import { ArrowDownRight, ArrowUpRight, CircleDollarSign, EllipsisVertical, Goal, ReceiptText } from "lucide-react";

const monthlyBars = [
  { month: "Dec", amount: 17600 },
  { month: "Jan", amount: 24800 },
  { month: "Feb", amount: 9800 },
  { month: "Mar", amount: 16100 },
  { month: "Apr", amount: 23600 },
  { month: "May", amount: 21400 },
];

const categorySplit = [
  { name: "Food & Grocery", amount: 6156, share: 28, color: "bg-primary" },
  { name: "Investment", amount: 5000, share: 19, color: "bg-accent" },
  { name: "Shopping", amount: 4356, share: 16, color: "bg-green-400" },
  { name: "Travelling", amount: 3670, share: 14, color: "bg-purple-400" },
  { name: "Bill & Subscription", amount: 2162, share: 10, color: "bg-cyan-400" },
];

const recentExpenses = [
  { id: 1, amount: 2100, category: "Shopping", subCategory: "Amazon", date: "31 May 2025", mode: "UPI" },
  { id: 2, amount: 299, category: "Movie", subCategory: "PVR", date: "28 May 2025", mode: "UPI" },
  { id: 3, amount: 5000, category: "Investment", subCategory: "Grow", date: "24 May 2025", mode: "Bank" },
  { id: 4, amount: 2460, category: "Travel", subCategory: "IRCTC", date: "20 May 2025", mode: "Card" },
  { id: 5, amount: 678, category: "Food", subCategory: "Swiggy", date: "15 May 2025", mode: "UPI" },
];

const subscriptions = [
  { name: "Netflix", price: 149, date: "15 Jun 2025", icon: "N" },
  { name: "Spotify", price: 49, date: "24 Aug 2025", icon: "S" },
  { name: "Figma", price: 3999, date: "01 Jan 2026", icon: "F" },
  { name: "WiFi", price: 799, date: "11 Jun 2025", icon: "W" },
  { name: "Electricity", price: 1265, date: "31 Jun 2025", icon: "E" },
];

const maxExpense = Math.max(...monthlyBars.map((item) => item.amount));

const formatCurrency = (amount: number) =>
  `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export const AllExpensesSection = () => {
  return (
    <section className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <article className="glass rounded-2xl p-4 md:p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <CircleDollarSign className="h-5 w-5 text-primary" />
            </div>
            <EllipsisVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">Account Balance</p>
          <p className="text-2xl font-bold mt-1">₹8,98,450</p>
          <p className="mt-2 text-xs text-green-400 flex items-center gap-1">
            <ArrowUpRight className="h-3.5 w-3.5" /> 6% more than last month
          </p>
        </article>

        <article className="glass rounded-2xl p-4 md:p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <ReceiptText className="h-5 w-5 text-primary" />
            </div>
            <EllipsisVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">Monthly Expenses</p>
          <p className="text-2xl font-bold mt-1">₹24,093</p>
          <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
            <ArrowDownRight className="h-3.5 w-3.5" /> 2% less than last month
          </p>
        </article>

        <article className="glass rounded-2xl p-4 md:p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <ArrowUpRight className="h-5 w-5 text-primary" />
            </div>
            <EllipsisVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">Total Investment</p>
          <p className="text-2xl font-bold mt-1">₹1,45,555</p>
          <p className="mt-2 text-xs text-green-400">+11% this quarter</p>
        </article>

        <article className="glass rounded-2xl p-4 md:p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <Goal className="h-5 w-5 text-primary" />
            </div>
            <EllipsisVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">Goal</p>
          <p className="text-base font-semibold mt-1">iPhone 17 Pro</p>
          <p className="mt-2 text-xs text-muted-foreground">Required: ₹145,000 · Collected: ₹75,000</p>
        </article>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        <article className="glass rounded-2xl p-4 md:p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm">Monthly Expenses</h3>
              <p className="text-xs text-green-400">6% more than last month</p>
            </div>
            <button className="text-xs px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground">Recent</button>
          </div>

          <div className="grid grid-cols-6 gap-3 items-end h-56">
            {monthlyBars.map((item) => (
              <div key={item.month} className="flex flex-col items-center justify-end gap-2 h-full">
                <div className="w-full rounded-xl bg-secondary/70 relative overflow-hidden" style={{ height: "100%" }}>
                  <div
                    className="absolute bottom-0 inset-x-0 bg-primary rounded-xl transition-all duration-500"
                    style={{ height: `${(item.amount / maxExpense) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{item.month}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="glass rounded-2xl p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Top Category</h3>
            <button className="text-xs px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground">Recent</button>
          </div>

          <div className="flex items-center justify-center py-2">
            <div
              className="h-40 w-40 rounded-full relative"
              style={{
                background:
                  "conic-gradient(hsl(var(--primary)) 0 28%, hsl(var(--accent)) 28% 47%, rgb(74 222 128) 47% 63%, rgb(192 132 252) 63% 77%, rgb(34 211 238) 77% 87%, hsl(var(--muted)) 87% 100%)",
              }}
            >
              <div className="absolute inset-6 rounded-full bg-card border border-border/40" />
            </div>
          </div>

          <div className="space-y-2 mt-2">
            {categorySplit.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        <article className="glass rounded-2xl p-4 md:p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Recent Expenses</h3>
            <button className="text-xs px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground">Filter</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border/60">
                  <th className="pb-2 font-medium">S.N</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Sub Category</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Mode</th>
                </tr>
              </thead>
              <tbody>
                {recentExpenses.map((expense, index) => (
                  <tr key={expense.id} className="border-b border-border/30 last:border-0">
                    <td className="py-2.5 text-muted-foreground">{index + 1}.</td>
                    <td className="py-2.5 font-medium">{formatCurrency(expense.amount)}</td>
                    <td className="py-2.5">{expense.category}</td>
                    <td className="py-2.5 text-muted-foreground">{expense.subCategory}</td>
                    <td className="py-2.5 text-muted-foreground">{expense.date}</td>
                    <td className="py-2.5">{expense.mode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="glass rounded-2xl p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Bill & Subscription</h3>
            <EllipsisVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {subscriptions.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground">{item.date}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(item.price)}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
};