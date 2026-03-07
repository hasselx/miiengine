import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Trash2, Search, TrendingUp, ArrowLeft, User, LogOut } from "lucide-react";

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
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [tab, setTab] = useState<"searches" | "holdings">("searches");
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
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 font-mono text-[10px] tracking-[1px] uppercase text-sidebar-foreground/50 hover:text-sidebar-primary transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
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

export default Dashboard;
