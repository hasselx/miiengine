import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { X, TrendingUp, TrendingDown, BarChart3, Activity } from "lucide-react";

/* ── Types ── */
interface IndexData {
  symbol: string;
  name: string;
  exchange: string;
  region: string;
  price: number;
  change: number;
  changePct: number;
  isOpen: boolean;
  chartData: { t: number; v: number }[];
  dayHigh: number;
  dayLow: number;
  volume: number;
}

const CACHE_KEY = "mii-heatmap";
const CACHE_TTL = 30_000;
const POLL_INTERVAL = 60_000;

const REGION_ORDER = ["India", "United States", "Europe", "Asia", "Middle East"];
const REGION_FLAGS: Record<string, string> = {
  India: "🇮🇳",
  "United States": "🇺🇸",
  Europe: "🇪🇺",
  Asia: "🌏",
  "Middle East": "🇸🇦",
};

/* ── Color scale — maps changePct to heatmap bg + text ── */
function heatColor(pct: number): { bg: string; text: string } {
  const abs = Math.abs(pct);
  if (abs < 0.05) return { bg: "bg-muted", text: "text-muted-foreground" };
  if (pct > 0) {
    if (abs < 0.5) return { bg: "bg-[hsl(142,40%,88%)] dark:bg-[hsl(142,30%,18%)]", text: "text-[hsl(142,55%,30%)] dark:text-[hsl(142,50%,55%)]" };
    if (abs < 1.5) return { bg: "bg-[hsl(142,45%,78%)] dark:bg-[hsl(142,35%,22%)]", text: "text-[hsl(142,60%,25%)] dark:text-[hsl(142,55%,50%)]" };
    if (abs < 3) return { bg: "bg-[hsl(142,50%,65%)] dark:bg-[hsl(142,40%,28%)]", text: "text-[hsl(142,70%,18%)] dark:text-[hsl(142,60%,70%)]" };
    return { bg: "bg-[hsl(142,55%,50%)] dark:bg-[hsl(142,45%,32%)]", text: "text-[hsl(0,0%,100%)] dark:text-[hsl(142,65%,75%)]" };
  }
  // Negative
  if (abs < 0.5) return { bg: "bg-[hsl(0,40%,92%)] dark:bg-[hsl(0,30%,18%)]", text: "text-[hsl(0,55%,40%)] dark:text-[hsl(0,50%,55%)]" };
  if (abs < 1.5) return { bg: "bg-[hsl(0,45%,82%)] dark:bg-[hsl(0,35%,22%)]", text: "text-[hsl(0,60%,35%)] dark:text-[hsl(0,55%,50%)]" };
  if (abs < 3) return { bg: "bg-[hsl(0,50%,70%)] dark:bg-[hsl(0,40%,28%)]", text: "text-[hsl(0,70%,20%)] dark:text-[hsl(0,60%,70%)]" };
  return { bg: "bg-[hsl(0,55%,55%)] dark:bg-[hsl(0,45%,32%)]", text: "text-[hsl(0,0%,100%)] dark:text-[hsl(0,65%,75%)]" };
}

/* ── Mini sparkline ── */
const Sparkline = ({ data, positive }: { data: { t: number; v: number }[]; positive: boolean }) => {
  if (!data || data.length < 2) return null;
  const values = data.map((d) => d.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 140;
  const h = 50;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12" preserveAspectRatio="none">
      <polyline
        points={pts}
        fill="none"
        stroke={positive ? "hsl(var(--green-light))" : "hsl(var(--destructive))"}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

/* ── Detail Modal ── */
const DetailModal = ({ idx, onClose }: { idx: IndexData; onClose: () => void }) => {
  const positive = idx.changePct >= 0;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-5 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">{idx.name}</h3>
            <p className="text-xs text-muted-foreground font-mono">{idx.exchange} · {idx.region}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-md touch-target">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="mb-4 flex items-baseline gap-3">
          <span className="text-2xl font-bold font-mono text-foreground">{idx.price.toLocaleString()}</span>
          <span className={cn("text-sm font-mono font-semibold", positive ? "text-green-data" : "text-destructive")}>
            {positive ? "+" : ""}{idx.changePct.toFixed(2)}%
          </span>
        </div>

        {/* Chart */}
        <div className="bg-background rounded-lg p-3 border border-border mb-4">
          {idx.chartData.length > 2 ? (
            <Sparkline data={idx.chartData} positive={positive} />
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">Chart data unavailable</p>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background rounded-lg p-3 border border-border">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Day High</p>
            <p className="text-sm font-mono font-semibold text-foreground">{idx.dayHigh.toLocaleString()}</p>
          </div>
          <div className="bg-background rounded-lg p-3 border border-border">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Day Low</p>
            <p className="text-sm font-mono font-semibold text-foreground">{idx.dayLow.toLocaleString()}</p>
          </div>
          <div className="bg-background rounded-lg p-3 border border-border">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Volume</p>
            <p className="text-sm font-mono font-semibold text-foreground">
              {idx.volume > 1e9 ? `${(idx.volume / 1e9).toFixed(1)}B` : idx.volume > 1e6 ? `${(idx.volume / 1e6).toFixed(1)}M` : idx.volume > 1e3 ? `${(idx.volume / 1e3).toFixed(0)}K` : idx.volume || "—"}
            </p>
          </div>
          <div className="bg-background rounded-lg p-3 border border-border">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Status</p>
            <p className={cn("text-sm font-mono font-semibold", idx.isOpen ? "text-green-data" : "text-muted-foreground")}>
              {idx.isOpen ? "Open" : "Closed"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Heatmap Tile ── */
const HeatmapTile = ({ idx, onClick }: { idx: IndexData; onClick: () => void }) => {
  const positive = idx.changePct >= 0;
  const colors = heatColor(idx.changePct);

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-xl p-3 sm:p-4 transition-all duration-200 border border-transparent",
        "hover:scale-[1.03] hover:shadow-lg hover:border-border active:scale-[0.98]",
        "touch-target text-left w-full",
        colors.bg
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className={cn("text-xs sm:text-sm font-bold font-mono truncate", colors.text)}>
          {idx.name}
        </span>
        {!idx.isOpen && (
          <span className="text-[8px] sm:text-[9px] font-mono bg-foreground/10 dark:bg-foreground/5 px-1.5 py-0.5 rounded text-muted-foreground shrink-0 ml-1">
            CLOSED
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={cn("text-lg sm:text-xl font-bold font-mono", colors.text)}>
          {positive ? "+" : ""}{idx.changePct.toFixed(2)}%
        </span>
      </div>
      <div className="mt-1">
        <span className={cn("text-[10px] sm:text-xs font-mono opacity-70", colors.text)}>
          {idx.price.toLocaleString()}
        </span>
      </div>
      {/* Trend icon */}
      <div className="absolute top-3 right-3 opacity-20">
        {positive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
      </div>
    </button>
  );
};

/* ── Main Component ── */
const GlobalHeatmap = () => {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [selected, setSelected] = useState<IndexData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    // Check cache
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.fetchedAt < CACHE_TTL && parsed.indices?.length > 0) {
          setIndices(parsed.indices);
          setLoading(false);
          return;
        }
      }
    } catch {}

    try {
      const { data, error } = await supabase.functions.invoke("fetch-market-indices");
      if (error) throw error;
      if (data?.indices?.length) {
        setIndices(data.indices);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ indices: data.indices, fetchedAt: Date.now() }));
      }
    } catch (err) {
      console.error("Heatmap fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Group by region
  const grouped = REGION_ORDER.reduce<Record<string, IndexData[]>>((acc, region) => {
    const items = indices.filter((i) => i.region === region);
    if (items.length) acc[region] = items;
    return acc;
  }, {});

  if (loading && indices.length === 0) {
    return (
      <div className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-8">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Global Market Heatmap</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 sm:h-28 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (indices.length === 0) return null;

  // Overall sentiment
  const avgChange = indices.reduce((s, i) => s + i.changePct, 0) / indices.length;
  const positiveCount = indices.filter((i) => i.changePct > 0).length;

  return (
    <>
      <div className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                  Global Market Heatmap
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Real-time performance of major global indices
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className={cn("px-2.5 py-1 rounded-full font-semibold", avgChange >= 0 ? "bg-[hsl(142,40%,88%)] dark:bg-[hsl(142,30%,18%)] text-[hsl(142,55%,30%)] dark:text-[hsl(142,50%,55%)]" : "bg-[hsl(0,40%,92%)] dark:bg-[hsl(0,30%,18%)] text-[hsl(0,55%,40%)] dark:text-[hsl(0,50%,55%)]")}>
                Avg {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}%
              </span>
              <span className="text-muted-foreground">
                {positiveCount}/{indices.length} ↑
              </span>
            </div>
          </div>

          {/* Region groups */}
          <div className="space-y-6">
            {Object.entries(grouped).map(([region, items]) => (
              <div key={region}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">{REGION_FLAGS[region] || "🌐"}</span>
                  <h3 className="font-mono text-[11px] sm:text-xs tracking-[3px] uppercase text-muted-foreground font-semibold">
                    {region}
                  </h3>
                  <div className="flex-1 h-px bg-border ml-2" />
                </div>
                <div className={cn(
                  "grid gap-2.5 sm:gap-3",
                  items.length <= 2
                    ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4"
                    : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                )}>
                  {items.map((idx) => (
                    <HeatmapTile key={idx.symbol} idx={idx} onClick={() => setSelected(idx)} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono text-muted-foreground">
            <span>Strong ↓</span>
            <div className="flex gap-0.5">
              <div className="w-5 h-3 rounded-sm bg-[hsl(0,55%,55%)] dark:bg-[hsl(0,45%,32%)]" />
              <div className="w-5 h-3 rounded-sm bg-[hsl(0,50%,70%)] dark:bg-[hsl(0,40%,28%)]" />
              <div className="w-5 h-3 rounded-sm bg-[hsl(0,45%,82%)] dark:bg-[hsl(0,35%,22%)]" />
              <div className="w-5 h-3 rounded-sm bg-[hsl(0,40%,92%)] dark:bg-[hsl(0,30%,18%)]" />
              <div className="w-5 h-3 rounded-sm bg-muted" />
              <div className="w-5 h-3 rounded-sm bg-[hsl(142,40%,88%)] dark:bg-[hsl(142,30%,18%)]" />
              <div className="w-5 h-3 rounded-sm bg-[hsl(142,45%,78%)] dark:bg-[hsl(142,35%,22%)]" />
              <div className="w-5 h-3 rounded-sm bg-[hsl(142,50%,65%)] dark:bg-[hsl(142,40%,28%)]" />
              <div className="w-5 h-3 rounded-sm bg-[hsl(142,55%,50%)] dark:bg-[hsl(142,45%,32%)]" />
            </div>
            <span>Strong ↑</span>
          </div>
        </div>
      </div>

      {selected && <DetailModal idx={selected} onClose={() => setSelected(null)} />}
    </>
  );
};

export default GlobalHeatmap;
