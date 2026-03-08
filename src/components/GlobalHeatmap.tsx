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
  country: string;
  flag: string;
  weight: number;
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

/* ── Color scale ── */
function heatColor(pct: number): { bg: string; text: string; border: string } {
  const abs = Math.abs(pct);
  if (abs < 0.05) return { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" };
  if (pct > 0) {
    if (abs < 0.5) return { bg: "bg-[hsl(142,40%,88%)] dark:bg-[hsl(142,30%,16%)]", text: "text-[hsl(142,55%,30%)] dark:text-[hsl(142,50%,55%)]", border: "border-[hsl(142,35%,75%)] dark:border-[hsl(142,25%,22%)]" };
    if (abs < 1.5) return { bg: "bg-[hsl(142,45%,78%)] dark:bg-[hsl(142,35%,20%)]", text: "text-[hsl(142,60%,25%)] dark:text-[hsl(142,55%,50%)]", border: "border-[hsl(142,40%,65%)] dark:border-[hsl(142,30%,26%)]" };
    if (abs < 3) return { bg: "bg-[hsl(142,50%,65%)] dark:bg-[hsl(142,40%,26%)]", text: "text-[hsl(142,70%,18%)] dark:text-[hsl(142,60%,70%)]", border: "border-[hsl(142,45%,55%)] dark:border-[hsl(142,35%,32%)]" };
    return { bg: "bg-[hsl(142,55%,50%)] dark:bg-[hsl(142,45%,30%)]", text: "text-[hsl(0,0%,100%)] dark:text-[hsl(142,65%,75%)]", border: "border-[hsl(142,50%,42%)] dark:border-[hsl(142,40%,36%)]" };
  }
  if (abs < 0.5) return { bg: "bg-[hsl(0,40%,92%)] dark:bg-[hsl(0,30%,16%)]", text: "text-[hsl(0,55%,40%)] dark:text-[hsl(0,50%,55%)]", border: "border-[hsl(0,35%,82%)] dark:border-[hsl(0,25%,22%)]" };
  if (abs < 1.5) return { bg: "bg-[hsl(0,45%,82%)] dark:bg-[hsl(0,35%,20%)]", text: "text-[hsl(0,60%,35%)] dark:text-[hsl(0,55%,50%)]", border: "border-[hsl(0,40%,72%)] dark:border-[hsl(0,30%,26%)]" };
  if (abs < 3) return { bg: "bg-[hsl(0,50%,70%)] dark:bg-[hsl(0,40%,26%)]", text: "text-[hsl(0,70%,20%)] dark:text-[hsl(0,60%,70%)]", border: "border-[hsl(0,45%,60%)] dark:border-[hsl(0,35%,32%)]" };
  return { bg: "bg-[hsl(0,55%,55%)] dark:bg-[hsl(0,45%,30%)]", text: "text-[hsl(0,0%,100%)] dark:text-[hsl(0,65%,75%)]", border: "border-[hsl(0,50%,47%)] dark:border-[hsl(0,40%,36%)]" };
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
          <div className="flex items-center gap-2">
            <span className="text-2xl">{idx.flag}</span>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">{idx.name}</h3>
              <p className="text-xs text-muted-foreground font-mono">{idx.exchange} · {idx.country}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-md">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="mb-4 flex items-baseline gap-3">
          <span className="text-2xl font-bold font-mono text-foreground">{idx.price.toLocaleString()}</span>
          <span className={cn("text-sm font-mono font-semibold", positive ? "text-green-data" : "text-destructive")}>
            {positive ? "+" : ""}{idx.changePct.toFixed(2)}%
          </span>
        </div>

        <div className="bg-background rounded-lg p-3 border border-border mb-4">
          {idx.chartData.length > 2 ? (
            <Sparkline data={idx.chartData} positive={positive} />
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">Chart data unavailable</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Day High", value: idx.dayHigh.toLocaleString() },
            { label: "Day Low", value: idx.dayLow.toLocaleString() },
            { label: "Volume", value: idx.volume > 1e9 ? `${(idx.volume / 1e9).toFixed(1)}B` : idx.volume > 1e6 ? `${(idx.volume / 1e6).toFixed(1)}M` : idx.volume > 1e3 ? `${(idx.volume / 1e3).toFixed(0)}K` : idx.volume || "—" },
            { label: "Status", value: idx.isOpen ? "Open" : "Closed", isStatus: true },
          ].map((stat) => (
            <div key={stat.label} className="bg-background rounded-lg p-3 border border-border">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
              <p className={cn("text-sm font-mono font-semibold", stat.isStatus ? (idx.isOpen ? "text-green-data" : "text-muted-foreground") : "text-foreground")}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Treemap Tile ── */
const TreemapTile = ({ idx, onClick, size }: { idx: IndexData; onClick: () => void; size: "xl" | "lg" | "md" | "sm" }) => {
  const positive = idx.changePct >= 0;
  const colors = heatColor(idx.changePct);

  const sizeClasses = {
    xl: "col-span-2 row-span-2 p-4 sm:p-5",
    lg: "col-span-2 row-span-1 p-3 sm:p-4",
    md: "col-span-1 row-span-1 p-3 sm:p-4",
    sm: "col-span-1 row-span-1 p-2.5 sm:p-3",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-lg transition-all duration-200 border overflow-hidden group",
        "hover:scale-[1.02] hover:shadow-lg hover:z-10 active:scale-[0.98]",
        "text-left w-full h-full min-h-[80px]",
        sizeClasses[size],
        colors.bg,
        colors.border
      )}
    >
      {/* Background trend icon */}
      <div className="absolute bottom-2 right-2 opacity-[0.08] transition-opacity group-hover:opacity-[0.15]">
        {positive ? <TrendingUp className={cn("h-10 w-10", size === "xl" && "h-16 w-16", size === "lg" && "h-12 w-12")} /> : <TrendingDown className={cn("h-10 w-10", size === "xl" && "h-16 w-16", size === "lg" && "h-12 w-12")} />}
      </div>

      {/* Flag + Country */}
      <div className="flex items-center gap-1.5 mb-1">
        <span className={cn("text-sm", size === "xl" && "text-xl", size === "lg" && "text-base")}>{idx.flag}</span>
        <span className={cn("text-[9px] sm:text-[10px] font-mono uppercase tracking-wider opacity-70", colors.text, size === "xl" && "text-[11px] sm:text-xs")}>
          {idx.country}
        </span>
        {!idx.isOpen && (
          <span className="text-[7px] sm:text-[8px] font-mono bg-foreground/10 dark:bg-foreground/5 px-1 py-0.5 rounded text-muted-foreground ml-auto">
            CLOSED
          </span>
        )}
      </div>

      {/* Index name */}
      <div className={cn("font-bold font-mono truncate", colors.text, size === "xl" ? "text-sm sm:text-base mb-1.5" : size === "lg" ? "text-xs sm:text-sm mb-1" : "text-[11px] sm:text-xs mb-0.5")}>
        {idx.name}
      </div>

      {/* Percentage */}
      <div className={cn("font-bold font-mono", colors.text, size === "xl" ? "text-2xl sm:text-3xl" : size === "lg" ? "text-lg sm:text-xl" : "text-base sm:text-lg")}>
        {positive ? "+" : ""}{idx.changePct.toFixed(2)}%
      </div>

      {/* Price - hidden on small tiles on mobile */}
      <div className={cn("font-mono opacity-60 mt-0.5", colors.text, size === "xl" ? "text-xs sm:text-sm" : size === "lg" ? "text-[10px] sm:text-xs" : "text-[9px] sm:text-[10px] hidden sm:block")}>
        {idx.price.toLocaleString()}
      </div>
    </button>
  );
};

/* ── Weight → tile size mapping ── */
function getTileSize(weight: number): "xl" | "lg" | "md" | "sm" {
  if (weight >= 5) return "xl";
  if (weight >= 4) return "lg";
  if (weight >= 3) return "md";
  return "sm";
}

/* ── Main Component ── */
const GlobalHeatmap = () => {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [selected, setSelected] = useState<IndexData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
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

  if (loading && indices.length === 0) {
    return (
      <div className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-8">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Global Stock Exchange Heatmap</h2>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={cn("rounded-lg bg-muted animate-pulse", i < 3 ? "col-span-2 row-span-2 h-40" : i < 6 ? "col-span-2 h-20" : "col-span-1 h-20")} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (indices.length === 0) return null;

  const avgChange = indices.reduce((s, i) => s + i.changePct, 0) / indices.length;
  const positiveCount = indices.filter((i) => i.changePct > 0).length;

  // Sort by weight descending for treemap-like placement
  const sorted = [...indices].sort((a, b) => b.weight - a.weight);

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
                  Global Stock Exchange Heatmap
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Real-time performance · tile size reflects market weight
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

          {/* Treemap Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1.5 sm:gap-2 auto-rows-[minmax(80px,auto)]">
            {sorted.map((idx) => (
              <TreemapTile
                key={idx.symbol}
                idx={idx}
                size={getTileSize(idx.weight)}
                onClick={() => setSelected(idx)}
              />
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
