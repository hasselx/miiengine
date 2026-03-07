import { ReactNode, useState } from "react";
import { Search, BarChart3, TrendingUp, Shield, Target, Activity, ChevronLeft, ChevronRight, LineChart, Layers, AlertTriangle, FileText, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

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
        <div className="fixed inset-0 bg-foreground/40 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border transition-all duration-300 z-50",
          isMobile
            ? cn("fixed inset-y-0 left-0", mobileOpen ? "w-[240px]" : "w-0 overflow-hidden")
            : collapsed ? "w-[60px]" : "w-[220px]"
        )}
      >
        {/* Logo area */}
        <div className={cn("flex items-center h-14 border-b border-sidebar-border px-4", collapsed && !isMobile && "justify-center px-0")}>
          {(!collapsed || isMobile) && (
            <span className="font-display text-lg font-bold text-sidebar-foreground tracking-tight truncate">MII Engine</span>
          )}
          {collapsed && !isMobile && (
            <span className="font-display text-lg font-bold text-sidebar-foreground">M</span>
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
                "flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-medium transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
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
        </nav>

        {/* Collapse toggle (desktop) */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center h-10 border-t border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header bar */}
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setMobileOpen(true)}
                className="p-1.5 hover:bg-accent rounded transition-colors"
              >
                <BarChart3 className="h-5 w-5 text-foreground" />
              </button>
            )}
            {companyName && (
              <h2 className="font-mono text-xs tracking-widest uppercase text-muted-foreground truncate">
                {companyName} — Analysis Report
              </h2>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ExpandableSearch onSearch={onSearchOpen} />
            {user ? (
              <div className="flex items-center gap-2">
                <button onClick={() => navigate("/dashboard")} className="p-1.5 hover:bg-accent rounded transition-colors" title="My Account">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button onClick={signOut} className="p-1.5 hover:bg-accent rounded transition-colors" title="Sign out">
                  <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/auth")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sidebar-primary text-sidebar-primary-foreground font-mono text-[10px] tracking-[1px] uppercase hover:opacity-90 transition-opacity"
              >
                <User className="h-3 w-3" />
                Sign In
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

/* Expandable search icon in the header */
function ExpandableSearch({ onSearch }: { onSearch: () => void }) {
  return (
    <button
      onClick={onSearch}
      className="flex items-center gap-2 px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors text-xs font-mono"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Search stock…</span>
    </button>
  );
}

export default DashboardLayout;
