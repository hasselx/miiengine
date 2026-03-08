import { ReactNode, useState, useRef, useEffect } from "react";
import { Search, BarChart3, TrendingUp, Shield, Target, Activity, ChevronLeft, ChevronRight, LineChart, Layers, AlertTriangle, FileText, User, LogOut, Menu, X, Eye, BookOpen, Brain, FlaskConical, DollarSign, Zap, Building2, PieChart, ArrowUpDown, Globe, Home, Triangle, Gauge, TrendingDown, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useWatchlist } from "@/App";

interface DashboardLayoutProps {
  children: ReactNode;
  activeSection?: string;
  onSectionClick?: (section: string) => void;
  onSearchOpen: () => void;
  companyName?: string;
}

const NAV_ITEMS = [
  { id: "ai-summary", label: "AI Summary", icon: Brain },
  { id: "summary", label: "Executive Summary", icon: FileText },
  { id: "scores", label: "Score Matrix", icon: BarChart3 },
  { id: "fundamentals", label: "Fundamentals", icon: Layers },
  { id: "earnings", label: "Earnings Breakdown", icon: DollarSign },
  { id: "earnings-surprise", label: "Earnings Surprise", icon: Zap },
  { id: "valuation", label: "DCF Valuation", icon: TrendingUp },
  { id: "valuation-triangle", label: "Valuation Triangle", icon: Triangle },
  { id: "price", label: "Price Projection", icon: Target },
  { id: "catalyst-timeline", label: "Catalyst Timeline", icon: Zap },
  { id: "price-extremes", label: "Price Extremes", icon: TrendingDown },
  { id: "trading-plan", label: "Trading Plan", icon: Crosshair },
  { id: "technical", label: "Technicals", icon: LineChart },
  { id: "support-resistance", label: "Support / Resistance", icon: Target },
  { id: "pattern", label: "Pattern Finder", icon: Activity },
  { id: "institutional", label: "Institutional Ownership", icon: Building2 },
  { id: "insider", label: "Insider Activity", icon: Building2 },
  { id: "sentiment", label: "Market Sentiment", icon: Globe },
  { id: "macro", label: "Macro & Tailwinds", icon: Activity },
  { id: "sector-rotation", label: "Sector Rotation", icon: PieChart },
  { id: "correlation", label: "Correlation", icon: ArrowUpDown },
  { id: "moat", label: "Competitive Moat", icon: Shield },
  { id: "factor-exposure", label: "Factor Exposure", icon: Gauge },
  { id: "risk", label: "Risk Analysis", icon: AlertTriangle },
  { id: "dividend", label: "Dividend Strategy", icon: PieChart },
  { id: "backtest", label: "Backtest Simulator", icon: FlaskConical },
  { id: "verdict", label: "Final Verdict", icon: Gauge },
];

const DashboardLayout = ({ children, activeSection, onSectionClick, onSearchOpen, companyName }: DashboardLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { setOpen: setWatchlistOpen } = useWatchlist();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border z-50",
          isMobile
            ? cn(
                "fixed left-0 w-[280px] transition-transform duration-300 ease-in-out",
                "top-[2rem] bottom-0",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
              )
            : cn(
                "sticky top-8 h-[calc(100vh-2rem)] transition-all duration-300",
                collapsed ? "w-[60px]" : "w-[240px]"
              )
        )}
      >
        <div className={cn(
          "flex items-center h-14 border-b border-sidebar-border px-4 shrink-0",
          collapsed && !isMobile && "justify-center px-0"
        )}>
          {(!collapsed || isMobile) && (
            <span className="font-display text-lg font-bold text-sidebar-foreground tracking-tight truncate">MII Engine</span>
          )}
          {collapsed && !isMobile && (
            <span className="font-display text-lg font-bold text-sidebar-foreground">M</span>
          )}
          {isMobile && (
            <button onClick={() => setMobileOpen(false)} className="ml-auto p-2 text-sidebar-foreground/50 hover:text-sidebar-foreground">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto sidebar-scroll">
          {NAV_ITEMS.map((item, idx) => {
            const num = String(idx + 1).padStart(2, "0");
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSectionClick?.(item.id);
                  if (isMobile) setMobileOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2.5 text-[13px] font-medium transition-colors touch-target",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent",
                  activeSection === item.id
                    ? "bg-sidebar-accent text-sidebar-primary border-r-2 border-sidebar-primary"
                    : "text-sidebar-foreground/70",
                  collapsed && !isMobile && "justify-center px-0"
                )}
                title={`${num}. ${item.label}`}
              >
                {collapsed && !isMobile ? (
                  <span className="font-mono text-[10px] text-sidebar-foreground/50">{num}</span>
                ) : (
                  <>
                    <span className="font-mono text-[10px] text-sidebar-foreground/40 w-5 shrink-0">{num}</span>
                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </button>
            );
          })}

          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition-colors text-sidebar-foreground/50 hover:text-sidebar-foreground",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronLeft className="h-4 w-4 shrink-0" />}
              {!collapsed && <span className="truncate">Collapse</span>}
            </button>
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-3 sm:px-6 shrink-0 sticky top-8 z-30">
          <div className="flex items-center gap-2 min-w-0">
            {isMobile && (
              <button
                onClick={() => setMobileOpen(true)}
                className="p-2 hover:bg-accent rounded-md transition-colors touch-target"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5 text-foreground" />
              </button>
            )}
            {companyName && (
              <h2 className="font-mono text-[10px] sm:text-xs tracking-widest uppercase text-muted-foreground truncate">
                {companyName}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-accent rounded-md transition-colors touch-target"
              title="Back to Home"
            >
              <Home className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={onSearchOpen}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors text-xs font-mono touch-target"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search stock…</span>
            </button>
            {user ? (
              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="p-2 hover:bg-accent rounded-md transition-colors touch-target"
                  title="Account"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                </button>
                {accountMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl z-50 min-w-[180px] py-1 animate-in fade-in-0 zoom-in-95">
                    <button
                      onClick={() => { navigate("/dashboard"); setAccountMenuOpen(false); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs font-mono text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <User className="h-3.5 w-3.5" /> Account
                    </button>
                    <button
                      onClick={() => { navigate("/dashboard"); setAccountMenuOpen(false); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs font-mono text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <BookOpen className="h-3.5 w-3.5" /> Saved Searches
                    </button>
                    <button
                      onClick={() => { setWatchlistOpen(true); setAccountMenuOpen(false); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs font-mono text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" /> Watchlist
                    </button>
                    <div className="h-px bg-border mx-2 my-1" />
                    <button
                      onClick={() => { signOut(); setAccountMenuOpen(false); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs font-mono text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate("/auth")}
                className="flex items-center gap-1.5 px-3 py-2 bg-sidebar-primary text-sidebar-primary-foreground font-mono text-[10px] tracking-[1px] uppercase hover:opacity-90 transition-opacity rounded-md touch-target"
              >
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
