import { CalendarDays, Clock, ChevronRight } from "lucide-react";

const events = [
  {
    id: 1,
    title: "Morning Standup",
    time: "9:00 – 9:15",
    color: "border-l-primary",
    bg: "bg-primary/10",
    status: "done",
  },
  {
    id: 2,
    title: "Security Review",
    time: "10:00 – 11:30",
    color: "border-l-accent",
    bg: "bg-accent/10",
    status: "active",
  },
  {
    id: 3,
    title: "Lunch Break",
    time: "12:00 – 13:00",
    color: "border-l-muted-foreground",
    bg: "bg-muted/50",
    status: "upcoming",
  },
  {
    id: 4,
    title: "Product Roadmap Sync",
    time: "14:00 – 14:30",
    color: "border-l-primary",
    bg: "bg-primary/10",
    status: "upcoming",
  },
  {
    id: 5,
    title: "Deep Work – Vault v2",
    time: "15:00 – 17:00",
    color: "border-l-accent",
    bg: "bg-accent/10",
    status: "upcoming",
  },
];

export const ScheduleWidget = () => {
  return (
    <div className="glass rounded-2xl p-5 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Today's Plan</h3>
            <p className="text-xs text-muted-foreground">5 events · 2 remaining</p>
          </div>
        </div>
        <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Clock className="h-3 w-3" /> Now
        </span>
      </div>

      {/* Timeline */}
      <div className="relative space-y-2">
        <div className="absolute left-[18px] top-3 bottom-3 w-px bg-border/50" />

        {events.map((ev) => (
          <div
            key={ev.id}
            className={`relative flex items-start gap-3 p-3 rounded-xl border-l-2 ${ev.color} ${ev.bg} cursor-pointer hover:brightness-110 transition-all ${
              ev.status === "active" ? "ring-1 ring-primary/30" : ""
            } ${ev.status === "done" ? "opacity-50" : ""}`}
          >
            <div
              className={`h-2.5 w-2.5 rounded-full mt-1 shrink-0 ${
                ev.status === "active"
                  ? "bg-primary animate-pulse"
                  : ev.status === "done"
                  ? "bg-muted-foreground"
                  : "bg-border"
              }`}
            />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${ev.status === "done" ? "line-through" : ""}`}>{ev.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{ev.time}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-4 w-full flex items-center justify-center gap-2 text-xs text-primary font-medium py-2 rounded-xl hover:bg-primary/10 transition-colors">
        Full calendar <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
