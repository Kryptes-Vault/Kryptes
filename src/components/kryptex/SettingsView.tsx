import React, { useState } from "react";
import {
  User,
  Shield,
  Settings2,
  Database,
  AlertTriangle,
  Moon,
  Sun,
  Monitor,
  LayoutGrid,
  List,
  Clock,
  Fingerprint,
  Key,
  Download,
  Upload,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";

type SettingsTab = "identity" | "account" | "security" | "vault" | "categories" | "data";

interface SettingsProps {
  user: any;
  items: VaultItemRow[];
  pbkdfDerivedKey: CryptoKey | null;
  onVaultUnlocked: (key: CryptoKey) => void;
  onSignOut: () => void;
  activeTab?: SettingsTab;
}

import { DeveloperAccessCard } from "./DeveloperAccessCard";
import type { VaultItemRow } from "@/hooks/useVaultItems";

const SettingsView = ({
  user,
  items,
  pbkdfDerivedKey,
  onVaultUnlocked,
  onSignOut,
  activeTab: externalActiveTab,
}: SettingsProps) => {
  const [internalActiveTab, setInternalActiveTab] = useState<SettingsTab>("identity");
  const [confirmDelete, setConfirmDelete] = useState("");

  const activeTab = externalActiveTab || internalActiveTab;
  const setActiveTab = (tab: SettingsTab) => setInternalActiveTab(tab);

  const menuItems = [
    { id: "identity", label: "Identity Profile", icon: User },
    { id: "account", label: "Account & Identity", icon: User },
    { id: "security", label: "Security & Access", icon: Shield },
    { id: "vault", label: "Vault Preferences", icon: Settings2 },
    { id: "categories", label: "Vault Categories", icon: Database },
    { id: "data", label: "Data Management", icon: Database },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "identity":
        return (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <section className="space-y-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#FF3300]">Identity Profile</h3>
              <div className="bg-[#f8f8f8] border border-black/5 rounded-2xl p-6 flex items-center gap-6">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                  {user?.email?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-black mb-1">Authenticated Node</p>
                  <code className="text-[10px] font-mono text-black/40">{user?.email}</code>
                </div>
              </div>
            </section>
          </motion.div>
        );

      case "account":
        return (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#FF3300]">Master Revision</h3>
                <div className="h-[1px] flex-1 bg-black/5" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-black/40 ml-1">Current Key</label>
                  <input type="password" placeholder="••••••••••••" className="w-full bg-[#f8f8f8] border border-black/5 rounded-xl px-4 py-3.5 text-xs font-mono outline-none focus:ring-1 focus:ring-[#FF3300]/30 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-black/40 ml-1">New Identity Key</label>
                  <input type="password" placeholder="••••••••••••" className="w-full bg-[#f8f8f8] border border-black/5 rounded-xl px-4 py-3.5 text-xs font-mono outline-none focus:ring-1 focus:ring-[#FF3300]/30 transition-all" />
                </div>
              </div>

              <div className="bg-[#FF3300]/5 border border-[#FF3300]/10 rounded-xl p-4 flex items-start gap-4">
                <AlertTriangle className="w-5 h-5 text-[#FF3300] shrink-0" />
                <p className="text-[10px] leading-relaxed text-[#FF3300]/80 font-medium">
                  CAUTION: Kryptes is zero-knowledge. If you forget your master password, we cannot recover your data.
                </p>
              </div>
            </section>

            <section className="pt-10 space-y-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#FF3300]">Protocol: Terminal</h3>
              <div className="border border-[#FF3300]/20 rounded-2xl p-8 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-black mb-2">Purge Vault & Disconnect</h4>
                  <p className="text-[10px] text-black/40 leading-relaxed">This action will permanently delete all encrypted nodes and identity data.</p>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    value={confirmDelete}
                    onChange={(e) => setConfirmDelete(e.target.value)}
                    placeholder='Type "DELETE" to confirm'
                    className="w-full bg-transparent border-b border-black/10 px-0 py-2 text-xs font-mono outline-none focus:border-[#FF3300] transition-all"
                  />
                  <button
                    disabled={confirmDelete !== "DELETE"}
                    className="w-full md:w-auto border border-[#FF3300] text-[#FF3300] text-[10px] font-bold uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-[#FF3300] hover:text-white disabled:opacity-30 transition-all"
                  >
                    Initiate Vault Purge
                  </button>
                </div>
              </div>
            </section>
          </motion.div>
        );

      case "security":
        return (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <section className="space-y-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#FF3300]">Access Hardware</h3>

              <div className="flex items-center justify-between p-6 bg-[#f8f8f8] border border-black/5 rounded-2xl">
                <div className="flex items-center gap-4">
                  <Clock className="w-5 h-5 text-black/40" />
                  <div>
                    <p className="text-xs font-bold text-black">Auto-Lock Protocol</p>
                    <p className="text-[9px] text-black/40 uppercase tracking-wider">Inactivity Timeout</p>
                  </div>
                </div>
                <select className="bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer">
                  <option>1 Minute</option>
                  <option>5 Minutes</option>
                  <option>15 Minutes</option>
                  <option>Never</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-6 bg-[#f8f8f8] border border-black/5 rounded-2xl">
                <div className="flex items-center gap-4">
                  <Fingerprint className="w-5 h-5 text-black/40" />
                  <div>
                    <p className="text-xs font-bold text-black">Biometric Unlock</p>
                    <p className="text-[9px] text-black/40 uppercase tracking-wider">FaceID / Windows Hello</p>
                  </div>
                </div>
                <button className="w-10 h-5 bg-[#FF3300] rounded-full relative p-1 transition-all">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                </button>
              </div>

              <div className="flex items-center justify-between p-6 bg-[#f8f8f8] border border-black/5 rounded-2xl">
                <div className="flex items-center gap-4">
                  <Key className="w-5 h-5 text-black/40" />
                  <div>
                    <p className="text-xs font-bold text-black">2FA Protocol</p>
                    <p className="text-[9px] text-black/40 uppercase tracking-wider">Authenticator App</p>
                  </div>
                </div>
                <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF3300] hover:underline transition-all">Configure</button>
              </div>

              {/* Developer Access */}
              <div className="pt-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#FF3300] mb-6">Developer Access</h3>
                <DeveloperAccessCard
                  user={user}
                  userId={user?.id ?? null}
                  items={items}
                  pbkdfDerivedKey={pbkdfDerivedKey}
                  onVaultUnlocked={onVaultUnlocked}
                />
              </div>
            </section>
          </motion.div>
        );

      case "vault":
        return (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <section className="space-y-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#FF3300]">UI Parameters</h3>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: "light", icon: Sun, label: "Light" },
                  { id: "dark", icon: Moon, label: "Dark" },
                  { id: "system", icon: Monitor, label: "System" },
                ].map((t) => (
                  <button key={t.id} className="flex flex-col items-center gap-3 p-6 bg-[#f8f8f8] border border-black/5 rounded-2xl hover:border-[#FF3300]/30 transition-all group">
                    <t.icon className="w-5 h-5 text-black/20 group-hover:text-[#FF3300]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black/40 group-hover:text-black">{t.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between p-6 bg-[#f8f8f8] border border-black/5 rounded-2xl">
                <div className="flex items-center gap-4">
                  <LayoutGrid className="w-5 h-5 text-black/40" />
                  <div>
                    <p className="text-xs font-bold text-black">Default Layout</p>
                    <p className="text-[9px] text-black/40 uppercase tracking-wider">Dashboard Grid</p>
                  </div>
                </div>
                <div className="flex bg-black/5 p-1 rounded-lg">
                  <button className="p-2 bg-white rounded-md shadow-sm"><LayoutGrid className="w-3 h-3" /></button>
                  <button className="p-2 text-black/20"><List className="w-3 h-3" /></button>
                </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-[#f8f8f8] border border-black/5 rounded-2xl">
                <div className="flex items-center gap-4">
                  <Trash2 className="w-5 h-5 text-black/40" />
                  <div>
                    <p className="text-xs font-bold text-black">Clipboard Sanitation</p>
                    <p className="text-[9px] text-black/40 uppercase tracking-wider">Flush after 30s</p>
                  </div>
                </div>
                <button className="w-10 h-5 bg-[#FF3300] rounded-full relative p-1">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                </button>
              </div>
            </section>
          </motion.div>
        );

      case "categories":
        return (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <section className="space-y-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#FF3300]">Vault Categories</h3>
              <div className="rounded-2xl border border-black/5 bg-[#f8f8f8] p-6">
                <p className="text-xs font-bold text-black">Category controls</p>
                <p className="mt-1 text-[10px] leading-relaxed text-black/40">Organize, rename, and maintain your vault taxonomy here.</p>
              </div>
            </section>
          </motion.div>
        );

      case "data":
        return (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <section className="space-y-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#FF3300]">Encrypted Portability</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-[#f8f8f8] border border-black/5 rounded-3xl flex flex-col items-center text-center space-y-4 group hover:border-[#FF3300]/20 transition-all cursor-pointer">
                  <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center text-black/20 group-hover:text-[#FF3300] transition-colors">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-black mb-1">Export Vault</h4>
                    <p className="text-[9px] text-black/40 uppercase tracking-widest">Download Encrypted JSON</p>
                  </div>
                </div>

                <div className="p-8 bg-[#f8f8f8] border border-dashed border-black/10 rounded-3xl flex flex-col items-center text-center space-y-4 hover:border-[#FF3300]/40 transition-all cursor-pointer">
                  <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center text-black/20">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-black mb-1">Import Data</h4>
                    <p className="text-[9px] text-black/40 uppercase tracking-widest">Drag & Drop CSV/JSON</p>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-[600px] h-full bg-white text-[#111] font-sans overflow-hidden">
      <main className="h-full overflow-y-auto p-6 lg:p-12">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Vault Control</h2>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-black/30">Configuration Node</p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-xl border border-black/10 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-black/50 transition hover:border-[#FF3300]/30 hover:text-[#FF3300]"
            >
              Sign Out
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="max-w-3xl">{renderContent()}</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsView;
