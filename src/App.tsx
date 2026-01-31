/** Kryptex SPA routes: `/`, `/auth/callback`, `/dashboard`, `/share/:id`. */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import NotFound from "./pages/NotFound.tsx";
import AuthCallback from "./pages/AuthCallback.tsx";
import ShareReceive from "./pages/ShareReceive.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/share/:secretId" element={<ShareReceive />} />
          <Route path="/privacy" element={<div dangerouslySetInnerHTML={{ __html: `<iframe src="/privacy.html" style="width:100%; height:100vh; border:none;"></iframe>` }} />} />
          <Route path="/terms" element={<div dangerouslySetInnerHTML={{ __html: `<iframe src="/terms.html" style="width:100%; height:100vh; border:none;"></iframe>` }} />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
