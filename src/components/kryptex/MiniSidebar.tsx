import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutGrid, 
  KeyRound, 
  CreditCard, 
  FileText,
  QrCode,
  Shield, 
  Settings,
  LogOut,
  Landmark
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { id: "documents", icon: FileText, label: "Documents", path: "/dashboard" },
  { id: "passwords", icon: KeyRound, label: "Passwords", path: "/dashboard" }, // In a real app, maybe /vault/passwords
  { id: "banking", icon: CreditCard, label: "Banking & Cards", path: "/vault/banking" },
  { id: "authenticator", icon: QrCode, label: "Authenticator", path: "/dashboard" },
];

export function MiniSidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex w-16 flex-col items-center bg-[#f7f7f7] py-6 shrink-0 fixed left-0 top-0 h-screen z-50 border-r border-black/5">
      <nav className="flex flex-1 flex-col items-center gap-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path && 
                           (item.id === "banking" ? location.pathname === "/vault/banking" : 
                            item.id === "cards" ? location.pathname === "/vault/cards" : true);
          
          // Special case for dashboard sub-views if needed, but for now we match by path
          const reallyActive = (item.path === "/vault/banking" && location.pathname === "/vault/banking") ||
                               (item.path === "/vault/cards" && location.pathname === "/vault/cards") ||
                               (item.path === "/dashboard" && location.pathname === "/dashboard" && item.id === "documents");

          return (
            <Tooltip key={item.id} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  to={item.path}
                   className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    reallyActive 
                      ? "bg-[#FF3B13] text-white shadow-md shadow-[#FF3B13]/20" 
                      : "text-black/30 hover:bg-black/5 hover:text-black/60"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-4">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link
              to="/dashboard"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-black/30 hover:bg-black/5 hover:text-black/60 transition-all"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Settings</TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button className="w-10 h-10 rounded-xl flex items-center justify-center text-black/30 hover:bg-destructive/10 hover:text-destructive transition-all">
              <LogOut className="w-5 h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Logout</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
