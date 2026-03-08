import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { X, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface IndexData {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  changePct: number;
  isOpen: boolean;
  chartData: { t: number; v: number }[];
}

interface TickerCache {
  indices: IndexData[];
  fetchedAt: number;
}

const CACHE_KEY = "mii-market-ticker";
const CACHE_TTL = 30_000; // 30s
const POLL_INTERVAL = 45_000; // 45s

/* ── Mini sparkline chart ── */
const MiniChart = ({ data, positive }: { data: { t: number; v: number }[]; positive: boolean }) => {
  if (!data || data.length < 2) return null;
  const values = data.map((d) => d.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 120;
  const h = 48;
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "hsl(var(--green-light))" : "hsl(var(--destructive))"}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

/* ── Detail Modal ── */
const IndexModal = ({ idx, onClose }: { idx: IndexData; onClose: () => void }) => {
  const positive = idx.changePct >= 0;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-[90vw] max-w-sm p-5 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">{idx.name}</h3>
            <p className="text-xs text-muted-foreground font-mono">{idx.exchange} · {idx.symbol}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-md">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="mb-4">
          <span className="text-2xl font-bold font-mono text-foreground">{idx.price.toLocaleString()}</span>
          <span className={cn("ml-2 text-sm font-mono font-semibold", positive ? "text-green-data" : "text-destructive")}>
            {positive ? "+" : ""}{idx.changePct.toFixed(2)}%
          </span>
        </div>

        <div className="bg-background rounded-lg p-3 border border-border">
          {idx.chartData.length > 2 ? (
            <MiniChart data={idx.chartData} positive={positive} />
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">Chart data unavailable</p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <span>Intraday (5m)</span>
          <span className={cn("px-2 py-0.5 rounded-full", idx.isOpen ? "bg-green-data/15 text-green-data" : "bg-muted text-muted-foreground")}>
            {idx.isOpen ? "Live" : "Closed"}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ── Main Ticker ── */
const MarketTicker = () => {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<IndexData | null>(null);
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchIndices = useCallback(async () => {
    // Check cache
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: TickerCache = JSON.parse(cached);
        if (Date.now() - parsed.fetchedAt < CACHE_TTL && parsed.indices.length > 0) {
          setIndices(parsed.indices);
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
      console.error("Market ticker fetch failed:", err);
    }
  }, []);

  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchIndices]);

  if (indices.length === 0) return null;

  // Double items for seamless loop
  const items = [...indices, ...indices];

  return (
    <>
      <div
        className="bg-sidebar border-b border-sidebar-border overflow-hidden sticky top-0 z-[60] h-8"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          ref={scrollRef}
          className={cn("flex items-center h-full gap-6 ticker-scroll", paused && "ticker-paused")}
        >
          {items.map((idx, i) => {
            const positive = idx.changePct >= 0;
            const neutral = idx.changePct === 0;
            return (
              <button
                key={`${idx.symbol}-${i}`}
                onClick={() => setSelectedIdx(idx)}
                className="flex items-center gap-2.5 shrink-0 px-3 py-1 hover:bg-sidebar-accent/50 rounded transition-colors"
              >
                <span className="text-[11px] font-mono font-medium text-sidebar-foreground/70 whitespace-nowrap">
                  {idx.name}
                </span>
                {neutral ? (
                  <Minus className="h-3 w-3 text-muted-foreground" />
                ) : positive ? (
                  <TrendingUp className="h-3 w-3 text-green-data" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <span
                  className={cn(
                    "text-[11px] font-mono font-semibold whitespace-nowrap",
                    neutral
                      ? "text-muted-foreground"
                      : positive
                      ? "text-green-data"
                      : "text-destructive"
                  )}
                >
                  {positive ? "+" : ""}{idx.changePct.toFixed(2)}%
                </span>
                {!idx.isOpen && (
                  <span className="text-[9px] font-mono text-muted-foreground/60 ml-0.5">C</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedIdx && <IndexModal idx={selectedIdx} onClose={() => setSelectedIdx(null)} />}
    </>
  );
};

export default MarketTicker;
