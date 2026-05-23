/** Kryptex SPA routes: `/`, `/auth/callback`, `/dashboard`, `/share/:id`. */
import { useEffect, type ReactNode } from "react";
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

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [isLoading, navigate, user]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,122,89,0.16),transparent_32%),linear-gradient(180deg,#0b0f17_0%,#06070a_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:46px_46px] opacity-30" />
      <Login isVisible onClose={() => navigate("/", { replace: true })} />
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
