import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Eye, X, Plus, Trash2, Bell, BellOff, TrendingUp, TrendingDown,
  AlertTriangle, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

/* ── Types ── */
interface WatchlistItem {
  id: string;
  ticker: string;
  company_name: string;
  exchange: string | null;
  added_at: string;
  // live data (fetched client-side)
  price?: number;
  changePct?: number;
  change?: number;
}

interface WatchlistAlert {
  id: string;
  watchlist_id: string;
  alert_type: string;
  threshold: number | null;
  is_active: boolean;
}

interface TriggeredAlert {
  ticker: string;
  company_name: string;
  reason: string;
  price: number;
  timestamp: number;
}

const ALERT_TYPES = [
  { value: "price_above", label: "Price Above" },
  { value: "price_below", label: "Price Below" },
  { value: "pct_change", label: "% Change >" },
];

const POLL_INTERVAL = 45_000;

/* ── Watchlist Panel ── */
const WatchlistPanel = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [alerts, setAlerts] = useState<WatchlistAlert[]>([]);
  const [triggered, setTriggered] = useState<TriggeredAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [addTicker, setAddTicker] = useState("");
  const [addName, setAddName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [alertForm, setAlertForm] = useState<{ watchlistId: string; type: string; threshold: string } | null>(null);
  const [expandedAlerts, setExpandedAlerts] = useState<string | null>(null);

  // Fetch watchlist
  const fetchWatchlist = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("watchlist")
      .select("*")
      .order("added_at", { ascending: false });
    if (!error && data) setItems(data as WatchlistItem[]);
    
    const { data: alertData } = await supabase
      .from("watchlist_alerts")
      .select("*")
      .eq("is_active", true);
    if (alertData) setAlerts(alertData as WatchlistAlert[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (open && user) fetchWatchlist();
  }, [open, user, fetchWatchlist]);

  // Fetch live prices for watchlist items
  const fetchPrices = useCallback(async () => {
    if (items.length === 0) return;
    try {
      const { data, error } = await supabase.functions.invoke("fetch-stock-data", {
        body: { tickers: items.map(i => i.ticker) }
      });
      if (!error && data?.prices) {
        setItems(prev => prev.map(item => {
          const live = data.prices[item.ticker];
          if (live) {
            return { ...item, price: live.price, changePct: live.changePct, change: live.change };
          }
          return item;
        }));

        // Check alerts
        checkAlerts(data.prices);
      }
    } catch {}
  }, [items, alerts]);

  // Check if any alerts trigger
  const checkAlerts = (prices: Record<string, { price: number; changePct: number }>) => {
    const newTriggered: TriggeredAlert[] = [];
    for (const alert of alerts) {
      const item = items.find(i => i.id === alert.watchlist_id);
      if (!item) continue;
      const live = prices[item.ticker];
      if (!live || alert.threshold == null) continue;

      let reason = "";
      if (alert.alert_type === "price_above" && live.price > alert.threshold) {
        reason = `Price crossed above ${alert.threshold}`;
      } else if (alert.alert_type === "price_below" && live.price < alert.threshold) {
        reason = `Price dropped below ${alert.threshold}`;
      } else if (alert.alert_type === "pct_change" && Math.abs(live.changePct) > alert.threshold) {
        reason = `${live.changePct > 0 ? "+" : ""}${live.changePct.toFixed(2)}% change exceeds ${alert.threshold}% threshold`;
      }

      if (reason) {
        newTriggered.push({ ticker: item.ticker, company_name: item.company_name, reason, price: live.price, timestamp: Date.now() });
      }
    }
    if (newTriggered.length > 0) {
      setTriggered(prev => [...newTriggered, ...prev].slice(0, 20));
      // Show toast for first alert
      toast({ title: `🔔 ${newTriggered[0].ticker}`, description: newTriggered[0].reason });
    }
  };

  useEffect(() => {
    if (!open || items.length === 0) return;
    fetchPrices();
    const interval = setInterval(fetchPrices, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [open, items.length, fetchPrices]);

  // Add stock
  const handleAdd = async () => {
    if (!user || !addTicker.trim()) return;
    const val = addTicker.trim();
    const isUpperTicker = val === val.toUpperCase() && val.length <= 6 && !val.includes(" ");
    const ticker = isUpperTicker ? val : val.toUpperCase().replace(/\s+/g, "").slice(0, 10);
    const companyName = val;

    const { error } = await supabase.from("watchlist").insert({
      user_id: user.id,
      ticker,
      company_name: companyName,
    });
    if (error) {
      toast({ title: "Error", description: error.message.includes("duplicate") ? "Already in watchlist" : error.message, variant: "destructive" });
    } else {
      setAddTicker("");
      setShowAddForm(false);
      fetchWatchlist();
      toast({ title: "Added", description: `${ticker} added to watchlist` });
    }
  };

  // Remove stock
  const handleRemove = async (id: string) => {
    await supabase.from("watchlist").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Add alert
  const handleAddAlert = async () => {
    if (!user || !alertForm) return;
    const { error } = await supabase.from("watchlist_alerts").insert({
      user_id: user.id,
      watchlist_id: alertForm.watchlistId,
      alert_type: alertForm.type,
      threshold: parseFloat(alertForm.threshold),
    });
    if (!error) {
      setAlertForm(null);
      fetchWatchlist();
      toast({ title: "Alert set" });
    }
  };

  // Remove alert
  const handleRemoveAlert = async (id: string) => {
    await supabase.from("watchlist_alerts").delete().eq("id", id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
      
      {/* Panel */}
      <div
        className="relative w-full max-w-sm sm:max-w-md bg-card border-l border-border h-full overflow-y-auto animate-slide-in-right shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-bold text-foreground">Watchlist</h2>
            {items.length > 0 && (
              <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{items.length}</span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-md">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Triggered Alerts */}
        {triggered.length > 0 && (
          <div className="px-4 py-3 border-b border-border bg-destructive/5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-destructive mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3" />
              Active Alerts ({triggered.length})
            </p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {triggered.slice(0, 5).map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-foreground">{t.ticker}</span>
                  <span className="text-muted-foreground truncate flex-1">{t.reason}</span>
                  <span className="font-mono text-foreground">${t.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!user ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">Sign in to use the watchlist</p>
          </div>
        ) : (
          <>
            {/* Add Stock */}
            <div className="px-4 py-3 border-b border-border">
            {showAddForm ? (
                <div className="space-y-2">
                  <input
                    placeholder="Ticker or company name (e.g. AAPL or Apple)"
                    value={addTicker}
                    onChange={(e) => setAddTicker(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAdd}
                      disabled={!addTicker.trim()}
                      className="flex-1 bg-primary text-primary-foreground text-xs font-mono py-2 rounded-md hover:bg-primary/90 disabled:opacity-40"
                    >
                      Add to Watchlist
                    </button>
                    <button onClick={() => setShowAddForm(false)} className="px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-border rounded-md text-xs font-mono text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Stock
                </button>
              )}
            </div>

            {/* Stock List */}
            <div className="divide-y divide-border">
              {loading && items.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Loading watchlist...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <Eye className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Your watchlist is empty</p>
                  <p className="text-xs text-muted-foreground mt-1">Add stocks to track them here</p>
                </div>
              ) : (
                items.map((item) => {
                  const positive = (item.changePct ?? 0) >= 0;
                  const itemAlerts = alerts.filter(a => a.watchlist_id === item.id);
                  const isExpanded = expandedAlerts === item.id;

                  return (
                    <div key={item.id} className="px-4 py-3 hover:bg-accent/30 transition-colors">
                      <div className="flex items-center gap-3">
                        {/* Ticker + Name */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-foreground">{item.ticker}</span>
                            {itemAlerts.length > 0 && (
                              <Bell className="h-3 w-3 text-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{item.company_name}</p>
                        </div>

                        {/* Price + Change */}
                        <div className="text-right shrink-0">
                          {item.price != null ? (
                            <>
                              <p className="font-mono text-sm font-semibold text-foreground">{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              <p className={cn("font-mono text-xs font-semibold", positive ? "text-green-data" : "text-destructive")}>
                                {positive ? "+" : ""}{(item.changePct ?? 0).toFixed(2)}%
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground font-mono">—</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setExpandedAlerts(isExpanded ? null : item.id)}
                            className="p-1.5 hover:bg-accent rounded-md"
                            title="Alerts"
                          >
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <Bell className="h-3.5 w-3.5 text-muted-foreground" />}
                          </button>
                          <button
                            onClick={() => handleRemove(item.id)}
                            className="p-1.5 hover:bg-destructive/10 rounded-md"
                            title="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Alerts Section */}
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
                                {ALERT_TYPES.map(t => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
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
                              <Plus className="h-3 w-3" />
                              Add Alert
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WatchlistPanel;
