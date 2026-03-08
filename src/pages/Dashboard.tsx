import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { Trash2, Search, TrendingUp, ArrowLeft, User, LogOut, Sun, Moon, Eye, Bell, Plus, ChevronDown, ChevronUp, X, AlertTriangle } from "lucide-react";

interface SavedSearch {
  id: string;
  company_name: string;
  ticker: string | null;
  total_score: number | null;
  verdict: string | null;
  searched_at: string;
  report_data: any;
}

interface Holding {
  id: string;
  company_name: string;
  ticker: string | null;
  buy_date: string;
  buy_price: number;
  quantity: number;
  currency: string | null;
  current_price: number | null;
  predicted_price: number | null;
  verdict: string | null;
  created_at: string;
}

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [tab, setTab] = useState<"searches" | "holdings" | "watchlist">("searches");
  const [profile, setProfile] = useState<{ display_name: string | null } | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoadingData(true);
      const [searchRes, holdingRes, profileRes] = await Promise.all([
        supabase.from("saved_searches").select("*").eq("user_id", user.id).order("searched_at", { ascending: false }),
        supabase.from("holdings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("profiles").select("display_name").eq("id", user.id).single(),
      ]);
      if (searchRes.data) setSearches(searchRes.data);
      if (holdingRes.data) setHoldings(holdingRes.data);
      if (profileRes.data) setProfile(profileRes.data);
      setLoadingData(false);
    };
    fetchData();
  }, [user]);

  const deleteSearch = async (id: string) => {
    const { error } = await supabase.from("saved_searches").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setSearches((s) => s.filter((x) => x.id !== id));
    toast({ title: "Deleted", description: "Search removed." });
  };

  const deleteHolding = async (id: string) => {
    const { error } = await supabase.from("holdings").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setHoldings((h) => h.filter((x) => x.id !== id));
    toast({ title: "Deleted", description: "Holding removed." });
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-mono text-sm text-muted-foreground animate-pulse">Loading...</p>
      </div>
    );
  }

  const totalInvested = holdings.reduce((s, h) => s + h.buy_price * h.quantity, 0);
  const totalCurrent = holdings.reduce((s, h) => s + (h.current_price || h.buy_price) * h.quantity, 0);
  const totalPnl = totalCurrent - totalInvested;
  const currency = holdings[0]?.currency || "$";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-sidebar text-sidebar-foreground">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")} className="p-1.5 hover:bg-sidebar-accent rounded transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="font-mono text-[10px] tracking-[3px] text-sidebar-primary uppercase">My Account</p>
              <h1 className="font-display text-2xl font-black tracking-tight">
                {profile?.display_name || user?.email}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground/50 hover:text-sidebar-primary"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 font-mono text-[10px] tracking-[1px] uppercase text-sidebar-foreground/50 hover:text-sidebar-primary transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Portfolio summary */}
        {holdings.length > 0 && (
          <div className="max-w-5xl mx-auto px-4 sm:px-8 pb-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="font-mono text-[9px] tracking-[2px] text-sidebar-foreground/40 uppercase mb-1">Total Invested</p>
                <p className="font-mono text-lg font-medium">{currency}{totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <div>
                <p className="font-mono text-[9px] tracking-[2px] text-sidebar-foreground/40 uppercase mb-1">Current Value</p>
                <p className="font-mono text-lg font-medium">{currency}{totalCurrent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <div>
                <p className="font-mono text-[9px] tracking-[2px] text-sidebar-foreground/40 uppercase mb-1">Total P&L</p>
                <p className={`font-mono text-lg font-semibold ${totalPnl >= 0 ? 'text-green-data' : 'text-red-data'}`}>
                  {totalPnl >= 0 ? '+' : ''}{currency}{Math.abs(totalPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 sm:px-8 flex gap-0">
          <button
            onClick={() => setTab("searches")}
            className={`font-mono text-[11px] tracking-[2px] uppercase px-5 py-3 border-b-2 transition-colors ${
              tab === "searches" ? "border-sidebar-primary text-sidebar-primary" : "border-transparent text-sidebar-foreground/40 hover:text-sidebar-foreground/70"
            }`}
          >
            <Search className="h-3.5 w-3.5 inline mr-2" />
            Saved Searches ({searches.length})
          </button>
          <button
            onClick={() => setTab("holdings")}
            className={`font-mono text-[11px] tracking-[2px] uppercase px-5 py-3 border-b-2 transition-colors ${
              tab === "holdings" ? "border-sidebar-primary text-sidebar-primary" : "border-transparent text-sidebar-foreground/40 hover:text-sidebar-foreground/70"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5 inline mr-2" />
            My Holdings ({holdings.length})
          </button>
          <button
            onClick={() => setTab("watchlist")}
            className={`font-mono text-[11px] tracking-[2px] uppercase px-5 py-3 border-b-2 transition-colors ${
              tab === "watchlist" ? "border-sidebar-primary text-sidebar-primary" : "border-transparent text-sidebar-foreground/40 hover:text-sidebar-foreground/70"
            }`}
          >
            <Eye className="h-3.5 w-3.5 inline mr-2" />
            Watchlist
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        {tab === "searches" && (
          <div className="space-y-3">
            {searches.length === 0 ? (
              <EmptyState icon={Search} title="No saved searches" description="Search for a stock and click the bookmark icon to save it here." />
            ) : (
              searches.map((s) => (
                <div
                  key={s.id}
                  className="bg-card border border-border p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => navigate("/", { state: { savedSearch: s } })}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-display text-lg font-bold text-foreground truncate">{s.company_name}</h3>
                      {s.ticker && <span className="font-mono text-[10px] tracking-[1px] text-muted-foreground uppercase">{s.ticker}</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      {s.total_score != null && (
                        <span className="font-mono text-[11px] text-foreground">Score: <strong>{s.total_score}/100</strong></span>
                      )}
                      {s.verdict && (
                        <span className="font-mono text-[10px] tracking-[1px] uppercase text-primary">{s.verdict}</span>
                      )}
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {new Date(s.searched_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteSearch(s.id); }} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "holdings" && (
          <div className="space-y-3">
            {holdings.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No holdings saved" description="Analyze a stock, enter your position details, and save it to track here." />
            ) : (
              holdings.map((h) => {
                const invested = h.buy_price * h.quantity;
                const current = (h.current_price || h.buy_price) * h.quantity;
                const pnl = current - invested;
                const pnlPct = invested > 0 ? ((pnl / invested) * 100) : 0;
                const cur = h.currency || "$";

                return (
                  <div key={h.id} className="bg-card border border-border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-display text-lg font-bold text-foreground truncate">{h.company_name}</h3>
                          {h.verdict && (
                            <span className={`font-mono text-[9px] tracking-[1px] uppercase px-2 py-0.5 ${
                              h.verdict.includes('PROFIT') || h.verdict.includes('MOMENTUM') ? 'bg-green-data/10 text-green-data'
                              : h.verdict.includes('AVERAGE') || h.verdict.includes('REVIEW') ? 'bg-red-data/10 text-red-data'
                              : 'bg-primary/10 text-primary'
                            }`}>
                              {h.verdict}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <Stat label="Buy Date" value={new Date(h.buy_date).toLocaleDateString()} />
                          <Stat label="Buy Price" value={`${cur}${h.buy_price}`} />
                          <Stat label="Qty" value={`${h.quantity}`} />
                          <Stat label="Invested" value={`${cur}${invested.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                          <Stat
                            label="P&L"
                            value={`${pnl >= 0 ? '+' : ''}${cur}${Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%)`}
                            color={pnl >= 0 ? 'text-green-data' : 'text-red-data'}
                          />
                        </div>
                        {h.predicted_price && (
                          <p className="font-mono text-[10px] text-muted-foreground mt-2">
                            MII 12M Target: <span className="text-primary">{cur}{h.predicted_price}</span>
                          </p>
                        )}
                      </div>
                      <button onClick={() => deleteHolding(h.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "watchlist" && <WatchlistTab user={user} />}
      </div>
    </div>
  );
};

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="font-mono text-[9px] tracking-[2px] uppercase text-muted-foreground mb-0.5">{label}</p>
      <p className={`font-mono text-[12px] font-medium ${color || 'text-foreground'}`}>{value}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="text-center py-16">
      <Icon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
      <h3 className="font-display text-lg font-bold text-foreground mb-1">{title}</h3>
      <p className="font-mono text-[12px] text-muted-foreground max-w-sm mx-auto">{description}</p>
    </div>
  );
}

/* ── Watchlist Tab (inline in Dashboard) ── */
interface WatchlistAlert {
  id: string;
  watchlist_id: string;
  alert_type: string;
  threshold: number | null;
  is_active: boolean;
}

interface WatchlistEntry {
  id: string;
  ticker: string;
  company_name: string;
  exchange: string | null;
  added_at: string;
}

const ALERT_TYPES = [
  { value: "price_above", label: "Price Above" },
  { value: "price_below", label: "Price Below" },
  { value: "pct_change", label: "% Change >" },
];

function WatchlistTab({ user }: { user: any }) {
  const [items, setItems] = useState<WatchlistEntry[]>([]);
  const [alerts, setAlerts] = useState<WatchlistAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [addInput, setAddInput] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [alertForm, setAlertForm] = useState<{ watchlistId: string; type: string; threshold: string } | null>(null);
  const [expandedAlerts, setExpandedAlerts] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data }, { data: alertData }] = await Promise.all([
      supabase.from("watchlist").select("*").eq("user_id", user.id).order("added_at", { ascending: false }),
      supabase.from("watchlist_alerts").select("*").eq("user_id", user.id).eq("is_active", true),
    ]);
    if (data) setItems(data);
    if (alertData) setAlerts(alertData as WatchlistAlert[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleAdd = async () => {
    if (!user || !addInput.trim()) return;
    const val = addInput.trim();
    const isUpperTicker = val === val.toUpperCase() && val.length <= 6 && !val.includes(" ");
    const ticker = isUpperTicker ? val : val.toUpperCase().replace(/\s+/g, "").slice(0, 10);
    const companyName = isUpperTicker ? val : val;

    const { error } = await supabase.from("watchlist").insert({
      user_id: user.id,
      ticker,
      company_name: companyName,
    });
    if (error) {
      toast({ title: "Error", description: error.message.includes("duplicate") ? "Already in watchlist" : error.message, variant: "destructive" });
    } else {
      setAddInput("");
      setShowAdd(false);
      fetchData();
      toast({ title: "Added to watchlist" });
    }
  };

  const handleRemove = async (id: string) => {
    await supabase.from("watchlist").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
    toast({ title: "Removed from watchlist" });
  };

  const handleAddAlert = async () => {
    if (!user || !alertForm || !alertForm.threshold) return;
    await supabase.from("watchlist_alerts").insert({
      user_id: user.id,
      watchlist_id: alertForm.watchlistId,
      alert_type: alertForm.type,
      threshold: parseFloat(alertForm.threshold),
    });
    setAlertForm(null);
    fetchData();
    toast({ title: "Alert set" });
  };

  const handleRemoveAlert = async (id: string) => {
    await supabase.from("watchlist_alerts").delete().eq("id", id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (loading) {
    return <div className="py-12 text-center"><p className="text-sm text-muted-foreground animate-pulse">Loading watchlist...</p></div>;
  }

  return (
    <div className="space-y-3">
      {/* Add stock bar */}
      <div className="flex gap-2">
        {showAdd ? (
          <div className="flex gap-2 flex-1">
            <input
              placeholder="Ticker or company name (e.g. AAPL or Apple)"
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="flex-1 bg-card border border-border rounded-md px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              autoFocus
            />
            <button onClick={handleAdd} disabled={!addInput.trim()} className="bg-primary text-primary-foreground text-xs font-mono px-4 py-2.5 rounded-md hover:bg-primary/90 disabled:opacity-40">Add</button>
            <button onClick={() => setShowAdd(false)} className="px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-border rounded-md text-xs font-mono text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Stock
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Eye} title="No stocks in watchlist" description="Add stocks to monitor them and set price alerts." />
      ) : (
        items.map((item) => {
          const itemAlerts = alerts.filter(a => a.watchlist_id === item.id);
          const isExpanded = expandedAlerts === item.id;

          return (
            <div key={item.id} className="bg-card border border-border p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-mono text-sm font-bold text-foreground">{item.ticker}</h3>
                    {itemAlerts.length > 0 && <Bell className="h-3 w-3 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.company_name}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setExpandedAlerts(isExpanded ? null : item.id)} className="p-2 hover:bg-accent rounded-md" title="Alerts">
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <Bell className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                  <button onClick={() => handleRemove(item.id)} className="p-2 hover:bg-destructive/10 rounded-md" title="Remove">
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  {itemAlerts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-xs">
                      <span className="font-mono text-muted-foreground">
                        {ALERT_TYPES.find(t => t.value === a.alert_type)?.label}: {a.threshold}
                      </span>
                      <button onClick={() => handleRemoveAlert(a.id)} className="text-destructive/60 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {alertForm?.watchlistId === item.id ? (
                    <div className="flex gap-1.5">
                      <select
                        value={alertForm.type}
                        onChange={(e) => setAlertForm({ ...alertForm, type: e.target.value })}
                        className="bg-background border border-border rounded px-2 py-1.5 text-xs font-mono text-foreground flex-1"
                      >
                        {ALERT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <input
                        type="number"
                        placeholder="Value"
                        value={alertForm.threshold}
                        onChange={(e) => setAlertForm({ ...alertForm, threshold: e.target.value })}
                        className="bg-background border border-border rounded px-2 py-1.5 text-xs font-mono text-foreground w-20"
                      />
                      <button onClick={handleAddAlert} className="bg-primary text-primary-foreground px-2 py-1.5 rounded text-xs font-mono">Set</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAlertForm({ watchlistId: item.id, type: "price_above", threshold: "" })}
                      className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Alert
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default Dashboard;
