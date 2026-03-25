import { useState } from "react";
import { Shield, Fingerprint, Eye, EyeOff, ChevronRight, Lock } from "lucide-react";

const credentials = [
  { id: 1, name: "Netflix", user: "john@email.com", icon: "🎬", color: "bg-red-500/15 text-red-400" },
  { id: 2, name: "Proton VPN", user: "j.doe@proton.me", icon: "🛡️", color: "bg-green-500/15 text-green-400" },
  { id: 3, name: "Google", user: "johndoe@gmail.com", icon: "🔍", color: "bg-[#FF3B13]/15 text-[#FF3B13]" },
  { id: 4, name: "GitHub", user: "johndoe", icon: "🐙", color: "bg-purple-500/15 text-purple-400" },
];

export const VaultWidget = () => {
  const [revealed, setRevealed] = useState<number | null>(null);

  return (
    <div className="glass rounded-2xl p-5 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Secure Vault</h3>
            <p className="text-xs text-muted-foreground">4 credentials stored</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5 text-primary animate-pulse" />
          <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Unlocked</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {credentials.map((cred) => (
          <div
            key={cred.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer group/item"
          >
            <span className="text-lg">{cred.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{cred.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {revealed === cred.id ? cred.user : "••••••••••••"}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRevealed(revealed === cred.id ? null : cred.id);
              }}
              className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
            >
              {revealed === cred.id ? (
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          </div>
        ))}
      </div>

      <button className="mt-4 w-full flex items-center justify-center gap-2 text-xs text-primary font-medium py-2 rounded-xl hover:bg-primary/10 transition-colors">
        View all credentials <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
