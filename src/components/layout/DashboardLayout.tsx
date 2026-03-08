import { ReactNode, useState, useRef, useEffect } from "react";
import { Search, BarChart3, TrendingUp, Shield, Target, Activity, ChevronLeft, ChevronRight, LineChart, Layers, AlertTriangle, FileText, User, LogOut, Menu, X, Eye, BookOpen } from "lucide-react";
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
  { id: "summary", label: "Summary", icon: FileText },
  { id: "scores", label: "Score Matrix", icon: BarChart3 },
  { id: "fundamentals", label: "Fundamentals", icon: Layers },
  { id: "valuation", label: "Valuation", icon: TrendingUp },
  { id: "price", label: "Price Targets", icon: Target },
  { id: "macro", label: "Macro", icon: Activity },
  { id: "technical", label: "Technicals", icon: LineChart },
  { id: "moat", label: "Moat", icon: Shield },
  { id: "risk", label: "Risk Matrix", icon: AlertTriangle },
];

const DashboardLayout = ({ children, activeSection, onSectionClick, onSearchOpen, companyName }: DashboardLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — sliding drawer on mobile */}
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border z-50",
          isMobile
            ? cn(
                "fixed inset-y-0 left-0 w-[280px] transition-transform duration-300 ease-in-out",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
              )
            : cn(
                "sticky top-8 h-[calc(100vh-2rem)] transition-all duration-300",
                collapsed ? "w-[60px]" : "w-[220px]"
              )
        )}
      >
        {/* Logo area */}
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
          {/* Close button on mobile */}
          {isMobile && (
            <button onClick={() => setMobileOpen(false)} className="ml-auto p-2 text-sidebar-foreground/50 hover:text-sidebar-foreground">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSectionClick?.(item.id);
                if (isMobile) setMobileOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition-colors touch-target",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent",
                activeSection === item.id
                  ? "bg-sidebar-accent text-sidebar-primary border-r-2 border-sidebar-primary"
                  : "text-sidebar-foreground/70",
                collapsed && !isMobile && "justify-center px-0"
              )}
              title={item.label}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
            </button>
          ))}

          {/* Collapse toggle right after nav items (desktop only) */}
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

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky top header bar */}
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
            {/* Search — icon only on mobile, expanded on desktop */}
            <button
              onClick={onSearchOpen}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors text-xs font-mono touch-target"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search stock…</span>
            </button>
            {user ? (
              <div className="flex items-center gap-1">
                <button onClick={() => navigate("/dashboard")} className="p-2 hover:bg-accent rounded-md transition-colors touch-target" title="My Account">
                  <User className="h-4 w-4 text-muted-foreground" />
                </button>
                <button onClick={signOut} className="p-2 hover:bg-accent rounded-md transition-colors touch-target" title="Sign out">
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                </button>
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

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
