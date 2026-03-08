import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Minus, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

interface SectorData {
  sector: string;
  symbol: string;
  icon: string;
  price: number;
  change: number;
  changePct: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
}

const formatVolume = (v: number) => {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toString();
};

const getBarColor = (pct: number) => {
  if (pct >= 2) return "bg-[hsl(142,55%,38%)]";
  if (pct >= 1) return "bg-[hsl(142,45%,42%)]";
  if (pct > 0.1) return "bg-[hsl(142,35%,48%)]";
  if (pct > -0.1) return "bg-muted-foreground/30";
  if (pct > -1) return "bg-[hsl(0,45%,48%)]";
  if (pct > -2) return "bg-[hsl(0,55%,42%)]";
  return "bg-[hsl(0,60%,38%)]";
};

const getTextColor = (pct: number) => {
  if (pct > 0.1) return "text-[hsl(142,50%,45%)]";
  if (pct < -0.1) return "text-[hsl(0,55%,50%)]";
  return "text-muted-foreground";
};

const SectorPerformanceTracker = () => {
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(false);

  const fetchSectors = useCallback(async () => {
    try {
      setError(null);
      const { data, error: fnError } = await supabase.functions.invoke("fetch-sector-performance");
      if (fnError) throw fnError;
      if (data?.sectors) {
        setSectors(data.sectors);
        setLastFetched(data.fetchedAt || Date.now());
      }
    } catch (e) {
      console.error("Sector fetch error:", e);
      setError("Unable to load sector data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSectors();
    const interval = setInterval(fetchSectors, 60_000);
    return () => clearInterval(interval);
  }, [fetchSectors]);

  const sorted = [...sectors].sort((a, b) =>
    sortAsc ? a.changePct - b.changePct : b.changePct - a.changePct
  );

  const maxAbsPct = Math.max(...sectors.map((s) => Math.abs(s.changePct)), 1);

  const gainers = sorted.filter((s) => s.changePct > 0.1);
  const losers = [...sorted].reverse().filter((s) => s.changePct < -0.1);

  if (loading) {
    return (
      <div className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-6">
            <RefreshCw className="h-4 w-4 text-primary animate-spin" />
            <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase">Loading sector data…</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-16 bg-accent/40 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || sectors.length === 0) {
    return (
      <div className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 text-center">
          <p className="font-mono text-xs text-muted-foreground">{error || "No sector data available"}</p>
          <button onClick={fetchSectors} className="mt-3 font-mono text-[10px] text-primary hover:underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <p className="font-mono text-[10px] tracking-[4px] uppercase text-primary mb-1.5">
              Sector Tracker
            </p>
            <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              Global Sector Performance
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-[10px] font-mono text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              {sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {sortAsc ? "Worst First" : "Best First"}
            </button>
            {lastFetched && (
              <span className="font-mono text-[10px] text-muted-foreground/60">
                {new Date(lastFetched).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>

        {/* Top / Bottom Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Top Gainers */}
          <div className="bg-background border border-border rounded-lg p-3 sm:p-4">
            <p className="font-mono text-[10px] tracking-[2px] uppercase text-[hsl(142,50%,45%)] mb-2 flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" /> Top Gainers
            </p>
            <div className="space-y-1.5">
              {gainers.slice(0, 3).map((s) => (
                <div key={s.symbol} className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{s.icon} {s.sector}</span>
                  <span className="font-mono text-xs font-semibold text-[hsl(142,50%,45%)]">+{s.changePct.toFixed(2)}%</span>
                </div>
              ))}
              {gainers.length === 0 && (
                <span className="text-[10px] text-muted-foreground font-mono">No gainers today</span>
              )}
            </div>
          </div>
          {/* Top Losers */}
          <div className="bg-background border border-border rounded-lg p-3 sm:p-4">
            <p className="font-mono text-[10px] tracking-[2px] uppercase text-[hsl(0,55%,50%)] mb-2 flex items-center gap-1.5">
              <TrendingDown className="h-3 w-3" /> Top Losers
            </p>
            <div className="space-y-1.5">
              {losers.slice(0, 3).map((s) => (
                <div key={s.symbol} className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{s.icon} {s.sector}</span>
                  <span className="font-mono text-xs font-semibold text-[hsl(0,55%,50%)]">{s.changePct.toFixed(2)}%</span>
                </div>
              ))}
              {losers.length === 0 && (
                <span className="text-[10px] text-muted-foreground font-mono">No losers today</span>
              )}
            </div>
          </div>
        </div>

        {/* Full Sector List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {sorted.map((s) => {
            const barWidth = Math.min((Math.abs(s.changePct) / maxAbsPct) * 100, 100);
            const isExpanded = expanded === s.symbol;

            return (
              <button
                key={s.symbol}
                onClick={() => setExpanded(isExpanded ? null : s.symbol)}
                className={cn(
                  "relative text-left bg-background border rounded-lg px-3.5 py-3 transition-all",
                  "hover:border-foreground/20 hover:shadow-md",
                  isExpanded ? "border-primary/40 shadow-md" : "border-border"
                )}
              >
                {/* Performance bar background */}
                <div
                  className={cn("absolute inset-y-0 left-0 rounded-l-lg opacity-[0.08] transition-all", getBarColor(s.changePct))}
                  style={{ width: `${barWidth}%` }}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{s.icon}</span>
                      <span className="text-xs font-semibold text-foreground truncate">{s.sector}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {s.changePct > 0.1 ? (
                        <TrendingUp className={cn("h-3.5 w-3.5", getTextColor(s.changePct))} />
                      ) : s.changePct < -0.1 ? (
                        <TrendingDown className={cn("h-3.5 w-3.5", getTextColor(s.changePct))} />
                      ) : (
                        <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span className={cn("font-mono text-sm font-bold tabular-nums", getTextColor(s.changePct))}>
                        {s.changePct > 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted-foreground/60">{s.symbol}</span>
                    <span className="font-mono text-[10px] text-muted-foreground/60">${s.price.toFixed(2)}</span>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="mt-2.5 pt-2.5 border-t border-border space-y-1.5 animate-fade-in">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-muted-foreground">Day Range</span>
                        <span className="text-foreground">${s.dayLow.toFixed(2)} – ${s.dayHigh.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-muted-foreground">Change</span>
                        <span className={getTextColor(s.changePct)}>{s.change > 0 ? "+" : ""}{s.change.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-muted-foreground">Volume</span>
                        <span className="text-foreground">{formatVolume(s.volume)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SectorPerformanceTracker;
