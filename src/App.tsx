/** Kryptex SPA routes: `/`, `/auth/callback`, `/dashboard`, `/share/:id`. */
import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Login from "@/components/kryptex/auth/Login";
import { supabase } from "@/lib/supabase";
import { ArrowRight, Loader2 } from "lucide-react";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";
import ShareReceive from "./pages/ShareReceive";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import AddBankingPage from "./pages/AddBankingPage";
import VaultFinance from "./pages/VaultFinance";

const queryClient = new QueryClient();

const pageTransition = {
  initial: { opacity: 0, y: 14, filter: "blur(10px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -10, filter: "blur(10px)" },
  transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
};

const PageTransition = ({ children }: { children: ReactNode }) => (
  <motion.div {...pageTransition} className="min-h-screen">
    {children}
  </motion.div>
);

const AuthRoute = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [showSessionPrompt, setShowSessionPrompt] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      setShowSessionPrompt(true);
    }
  }, [isLoading, user]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      setShowSessionPrompt(false);
    } catch (err) {
      console.error("Sign out failed:", err);
    } finally {
      setSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0b0f17] text-white">
        <Loader2 className="h-10 w-10 animate-spin text-[#FF3B13]" aria-hidden />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Loading session…</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,122,89,0.16),transparent_32%),linear-gradient(180deg,#0b0f17_0%,#06070a_100%)] flex items-center justify-center">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:46px_46px] opacity-30" />
      
      {showSessionPrompt && user ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-black/10 shadow-[0_40px_100px_rgba(0,0,0,0.2)] p-8 sm:p-12 w-full max-w-md relative z-10 text-center"
        >
          <div className="text-center mb-8 flex flex-col items-center">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-black uppercase">Active Session</h2>
            <p className="text-[10px] sm:text-xs text-black/40 mt-1 sm:mt-2 font-bold uppercase tracking-widest">You are currently logged in</p>
          </div>

          <div className="p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-[#f8f8f8] border border-black/5 mb-6 sm:mb-8 text-left flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#FF3B13]/10 flex items-center justify-center text-[#FF3B13] font-bold text-sm shrink-0">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-bold text-black/30 uppercase tracking-widest">Logged in as</div>
              <div className="text-xs font-bold text-black truncate">{user.email}</div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => navigate("/dashboard", { replace: true })}
              className="w-full bg-[#FF3B13] text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-[10px] sm:text-xs tracking-[0.2em] shadow-[0_15px_30px_rgba(255,59,19,0.3)] hover:bg-black transition-all flex items-center justify-center gap-3 sm:gap-4 group"
            >
              CONTINUE TO VAULT
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              disabled={signingOut}
              onClick={handleSignOut}
              className="w-full bg-transparent border border-black/10 text-black py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-[10px] sm:text-xs tracking-[0.2em] hover:bg-black/5 transition-all flex items-center justify-center disabled:opacity-50"
            >
              {signingOut ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "USE A DIFFERENT ACCOUNT"}
            </button>
          </div>
        </motion.div>
      ) : (
        <Login isVisible onClose={() => navigate("/", { replace: true })} />
      )}
    </div>
  );
};

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><AuthRoute /></PageTransition>} />
        <Route path="/login" element={<PageTransition><AuthRoute /></PageTransition>} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/dashboard/:view?"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/share/:secretId" element={<ShareReceive />} />
        <Route path="/vault-finance" element={<VaultFinance />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route
          path="/vault/banking/new"
          element={
            <ProtectedRoute>
              <AddBankingPage />
            </ProtectedRoute>
          }
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
