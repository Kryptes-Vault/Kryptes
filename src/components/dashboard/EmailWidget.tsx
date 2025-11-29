import { Mail, ChevronRight } from "lucide-react";

const emails = [
  {
    id: 1,
    sender: "Sarah Chen",
    subject: "Q2 Security Audit Results",
    preview: "Hi John, the audit came back clean. All endpoints passed penetration testing...",
    time: "10:32 AM",
    unread: true,
    avatar: "SC",
  },
  {
    id: 2,
    sender: "GitHub",
    subject: "New pull request #487",
    preview: "dependabot[bot] opened a PR: Bump axios from 1.6.2 to 1.7.0...",
    time: "9:15 AM",
    unread: true,
    avatar: "GH",
  },
  {
    id: 3,
    sender: "Stripe",
    subject: "Your March invoice is ready",
    preview: "Your invoice for March 2026 totaling $149.00 is now available...",
    time: "Yesterday",
    unread: false,
    avatar: "ST",
  },
  {
    id: 4,
    sender: "Alex Rivera",
    subject: "Re: Product roadmap sync",
    preview: "Sounds good! Let's block 30 min on Thursday to go over the timeline...",
    time: "Yesterday",
    unread: true,
    avatar: "AR",
  },
];

export const EmailWidget = () => {
  const unreadCount = emails.filter((e) => e.unread).length;

  return (
    <div className="glass rounded-2xl p-5 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Unified Email</h3>
            <p className="text-xs text-muted-foreground">{unreadCount} unread messages</p>
          </div>
        </div>
        <span className="text-xs font-bold text-primary-foreground bg-primary h-6 w-6 rounded-full flex items-center justify-center">
          {unreadCount}
        </span>
      </div>

      <div className="space-y-1">
        {emails.map((email) => (
          <div
            key={email.id}
            className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-secondary ${
              email.unread ? "bg-secondary/50" : ""
            }`}
          >
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 mt-0.5">
              {email.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-xs truncate ${email.unread ? "font-semibold" : "font-medium text-muted-foreground"}`}>
                  {email.sender}
                </p>
                <span className="text-[10px] text-muted-foreground shrink-0">{email.time}</span>
              </div>
              <p className={`text-xs truncate ${email.unread ? "font-medium" : "text-muted-foreground"}`}>
                {email.subject}
              </p>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{email.preview}</p>
            </div>
            {email.unread && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />}
          </div>
        ))}
      </div>

      <button className="mt-4 w-full flex items-center justify-center gap-2 text-xs text-primary font-medium py-2 rounded-xl hover:bg-primary/10 transition-colors">
        Open inbox <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
