import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import MarketTicker from "@/components/MarketTicker";
import WatchlistPanel from "@/components/WatchlistPanel";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

export const WatchlistContext = ({ children }: { children: React.ReactNode }) => {
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  return (
    <WatchlistCtx.Provider value={{ open: watchlistOpen, setOpen: setWatchlistOpen }}>
      {children}
      <WatchlistPanel open={watchlistOpen} onClose={() => setWatchlistOpen(false)} />
    </WatchlistCtx.Provider>
  );
};

import { createContext, useContext } from "react";
export const WatchlistCtx = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({ open: false, setOpen: () => {} });
export const useWatchlist = () => useContext(WatchlistCtx);

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <>
      <MarketTicker />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
