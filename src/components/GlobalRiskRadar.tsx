import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Indicator {
  symbol: string;
  name: string;
  category: string;
  price: number;
  change: number;
  changePct: number;
  score: number;
  interpretation: string;
}

interface RadarData {
  indicators: Indicator[];
  regime: string;
  confidence: number;
  normalizedScore: number;
  fetchedAt: number;
}

const CATEGORY_ORDER = ["Equities", "Volatility", "Commodities", "Crypto", "Bonds", "Currency"];

const FALLBACK: RadarData = {
  indicators: [
    { symbol: "^GSPC", name: "S&P 500", category: "Equities", price: 5200, change: 25, changePct: 0.48, score: 0.4, interpretation: "S&P 500 rising — supports risk-on." },
    { symbol: "^IXIC", name: "NASDAQ", category: "Equities", price: 16400, change: 80, changePct: 0.49, score: 0.4, interpretation: "NASDAQ rising — supports risk-on." },
    { symbol: "^VIX", name: "VIX", category: "Volatility", price: 14.2, change: -0.5, changePct: -3.4, score: 0.5, interpretation: "Declining volatility supports risk-on sentiment." },
    { symbol: "GC=F", name: "Gold", category: "Commodities", price: 2320, change: 5, changePct: 0.22, score: 0, interpretation: "Gold stable." },
    { symbol: "CL=F", name: "Oil (WTI)", category: "Commodities", price: 78.5, change: 1.2, changePct: 1.55, score: 0.4, interpretation: "Oil (WTI) rising — supports risk-on." },
    { symbol: "BTC-USD", name: "Bitcoin", category: "Crypto", price: 67500, change: 1350, changePct: 2.04, score: 0.8, interpretation: "Bitcoin rallying — strong risk-on signal." },
    { symbol: "^TNX", name: "US 10Y Yield", category: "Bonds", price: 4.25, change: -0.02, changePct: -0.47, score: 0, interpretation: "Bond yields stable." },
    { symbol: "DX-Y.NYB", name: "US Dollar (DXY)", category: "Currency", price: 104.2, change: -0.3, changePct: -0.29, score: 0, interpretation: "Dollar stable." },
  ],
  regime: "Risk-On",
  confidence: 38,
  normalizedScore: 0.31,
  fetchedAt: Date.now(),
};

function RadarChart({ indicators }: { indicators: Indicator[] }) {
  // Group by category, average scores
  const categoryScores = CATEGORY_ORDER.map((cat) => {
    const items = indicators.filter((i) => i.category === cat);
    if (items.length === 0) return { category: cat, score: 0 };
    const avg = items.reduce((s, i) => s + i.score, 0) / items.length;
    return { category: cat, score: avg };
  });

  const cx = 140, cy = 140, maxR = 100;
  const n = categoryScores.length;
  const angleStep = (2 * Math.PI) / n;

  const points = categoryScores.map((cs, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const r = maxR * ((cs.score + 1) / 2); // map -1..+1 to 0..maxR
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      labelX: cx + (maxR + 20) * Math.cos(angle),
      labelY: cy + (maxR + 20) * Math.sin(angle),
      ...cs,
    };
  });

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox="0 0 280 280" className="w-full max-w-[280px] mx-auto">
      {/* Grid */}
      {rings.map((r) => (
        <polygon
          key={r}
          points={Array.from({ length: n }, (_, i) => {
            const angle = -Math.PI / 2 + i * angleStep;
            return `${cx + maxR * r * Math.cos(angle)},${cy + maxR * r * Math.sin(angle)}`;
          }).join(" ")}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="0.5"
          opacity={0.4}
        />
      ))}
      {/* Axes */}
      {points.map((p, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={cx + maxR * Math.cos(-Math.PI / 2 + i * angleStep)}
          y2={cy + maxR * Math.sin(-Math.PI / 2 + i * angleStep)}
          stroke="hsl(var(--border))"
          strokeWidth="0.5"
          opacity={0.3}
        />
      ))}
      {/* Data polygon */}
      <polygon
        points={polygonPoints}
        fill="hsl(var(--primary) / 0.15)"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
      />
      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="hsl(var(--primary))" />
      ))}
      {/* Labels */}
      {points.map((p, i) => (
        <text
          key={i}
          x={p.labelX}
          y={p.labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground"
          fontSize="9"
          fontFamily="monospace"
        >
          {p.category}
        </text>
      ))}
    </svg>
  );
}

const GlobalRiskRadar = () => {
  const [data, setData] = useState<RadarData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { data: res, error } = await supabase.functions.invoke("fetch-risk-radar");
      if (error) throw error;
      if (res?.indicators?.length > 0) {
        setData(res);
      } else {
        setData(FALLBACK);
      }
    } catch {
      setData(FALLBACK);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <span className="font-mono text-[10px] tracking-[4px] uppercase text-muted-foreground">
            Global Risk Radar
          </span>
          <div className="mt-6 h-64 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const regimeColor =
    data.regime === "Risk-On"
      ? "text-[hsl(142,60%,45%)]"
      : data.regime === "Risk-Off"
      ? "text-destructive"
      : "text-[hsl(45,80%,55%)]";

  const regimeBg =
    data.regime === "Risk-On"
      ? "bg-[hsl(142,60%,35%)] text-[hsl(0,0%,95%)]"
      : data.regime === "Risk-Off"
      ? "bg-destructive text-destructive-foreground"
      : "bg-[hsl(45,70%,40%)] text-[hsl(0,0%,95%)]";

  return (
    <TooltipProvider delayDuration={200}>
      <div className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex items-center justify-between mb-6">
            <span className="font-mono text-[10px] sm:text-[11px] tracking-[4px] uppercase text-muted-foreground">
              Global Risk Radar
            </span>
            {data.fetchedAt && (
              <span className="font-mono text-[10px] text-muted-foreground">
                {new Date(data.fetchedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 items-start">
            {/* Radar Chart + Summary */}
            <div className="flex flex-col items-center gap-4">
              <RadarChart indicators={data.indicators} />
              <div className="text-center space-y-1">
                <p className="font-mono text-[10px] tracking-[2px] uppercase text-muted-foreground">
                  Market Regime
                </p>
                <span className={cn("inline-block px-4 py-1.5 rounded-full font-mono text-xs font-semibold tracking-wide", regimeBg)}>
                  {data.regime}
                </span>
                <p className="font-mono text-[11px] text-muted-foreground mt-1">
                  Confidence: <span className={cn("font-semibold", regimeColor)}>{data.confidence}%</span>
                </p>
              </div>
            </div>

            {/* Indicator list */}
            <div className="space-y-1.5">
              {data.indicators.map((ind) => {
                const scoreColor =
                  ind.score > 0.2
                    ? "text-[hsl(142,60%,45%)]"
                    : ind.score < -0.2
                    ? "text-destructive"
                    : "text-muted-foreground";

                const barWidth = Math.abs(ind.score) * 100;
                const barColor =
                  ind.score > 0
                    ? "bg-[hsl(142,50%,40%)]"
                    : ind.score < 0
                    ? "bg-[hsl(0,50%,45%)]"
                    : "bg-muted";

                return (
                  <Tooltip key={ind.symbol}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-3 px-3 py-2 rounded border border-border/50 hover:border-border transition-colors cursor-default">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-medium text-foreground truncate">
                              {ind.name}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">{ind.category}</span>
                          </div>
                          <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden w-full max-w-[120px]">
                            <div
                              className={cn("h-full rounded-full transition-all", barColor)}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono text-[11px] text-foreground">
                            {ind.price >= 1000
                              ? ind.price.toLocaleString("en-US", { maximumFractionDigits: 0 })
                              : ind.price.toFixed(2)}
                          </p>
                          <p className={cn("font-mono text-[10px] font-medium", ind.changePct >= 0 ? "text-[hsl(142,60%,45%)]" : "text-destructive")}>
                            {ind.changePct >= 0 ? "+" : ""}{ind.changePct.toFixed(2)}%
                          </p>
                        </div>
                        <span className={cn("font-mono text-[11px] font-semibold w-8 text-right", scoreColor)}>
                          {ind.score > 0 ? "+" : ""}{ind.score.toFixed(1)}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[240px] font-mono text-[11px]">
                      <p className="font-semibold">{ind.name}</p>
                      <p>Price: {ind.price.toLocaleString()}</p>
                      <p>Change: {ind.change >= 0 ? "+" : ""}{ind.change.toFixed(2)} ({ind.changePct >= 0 ? "+" : ""}{ind.changePct.toFixed(2)}%)</p>
                      <p className="mt-1 text-muted-foreground">{ind.interpretation}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default GlobalRiskRadar;
