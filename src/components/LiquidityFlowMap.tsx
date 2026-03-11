import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Activity, TrendingUp, TrendingDown, RefreshCw, ArrowRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AssetDetail {
  label: string;
  score: number;
  change: number;
}

interface Flow {
  source: string;
  target: string;
  sourceLabel: string;
  targetLabel: string;
  magnitude: number;
  shift: number;
}

interface LiquidityData {
  assets: Record<string, AssetDetail>;
  flows: Flow[];
  regime: { regime: string; confidence: number };
  timestamp: string;
}

const ASSET_ORDER = ["equities", "crypto", "commodities", "bonds", "currencies", "defensive"];

const ASSET_ICONS: Record<string, string> = {
  equities: "📈",
  crypto: "₿",
  commodities: "🛢",
  bonds: "🏛",
  currencies: "💱",
  defensive: "🛡",
};

const LiquidityFlowMap = () => {
  const [data, setData] = useState<LiquidityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredFlow, setHoveredFlow] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data: result, error: err } = await supabase.functions.invoke("fetch-liquidity-flows");
      if (err) throw new Error(err.message);
      if (result?.success) {
        setData(result as LiquidityData);
        setError(null);
      } else {
        throw new Error(result?.error || "Failed to fetch");
      }
    } catch (e: any) {
      console.error("Liquidity flow fetch error:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  const scoreColor = (score: number) => {
    if (score > 0.3) return "text-[hsl(142,60%,45%)]";
    if (score > 0.05) return "text-[hsl(142,40%,55%)]";
    if (score < -0.3) return "text-destructive";
    if (score < -0.05) return "text-[hsl(0,60%,60%)]";
    return "text-muted-foreground";
  };

  const scoreBg = (score: number) => {
    if (score > 0.3) return "bg-[hsl(142,60%,45%)]/10 border-[hsl(142,60%,45%)]/30";
    if (score > 0.05) return "bg-[hsl(142,40%,55%)]/10 border-[hsl(142,40%,55%)]/20";
    if (score < -0.3) return "bg-destructive/10 border-destructive/30";
    if (score < -0.05) return "bg-[hsl(0,60%,60%)]/10 border-[hsl(0,60%,60%)]/20";
    return "bg-muted/30 border-border";
  };

  const flowColor = (shift: number) => {
    if (shift > 0.5) return "hsl(142, 60%, 45%)";
    if (shift > 0) return "hsl(142, 40%, 55%)";
    return "hsl(var(--primary))";
  };

  const regimeColor = (regime: string) => {
    if (regime === "Risk-On") return "text-[hsl(142,60%,45%)]";
    if (regime === "Defensive Rotation") return "text-destructive";
    if (regime === "Inflation Hedge") return "text-primary";
    return "text-muted-foreground";
  };

  if (loading) {
    return (
      <div className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            <h2 className="font-mono text-xs tracking-[3px] uppercase text-muted-foreground">
              Global Liquidity Flow
            </h2>
          </div>
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
            <span className="ml-3 text-sm text-muted-foreground font-mono">Loading liquidity data…</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="font-mono text-xs tracking-[3px] uppercase text-muted-foreground">
              Global Liquidity Flow
            </h2>
          </div>
          <p className="text-sm text-muted-foreground font-mono text-center py-10">
            Liquidity data temporarily unavailable
          </p>
        </div>
      </div>
    );
  }

  const sortedAssets = ASSET_ORDER.filter((k) => data.assets[k]).map((k) => ({
    key: k,
    ...data.assets[k],
  }));

  return (
    <div className="border-t border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="font-mono text-xs tracking-[3px] uppercase text-muted-foreground">
              Global Liquidity Flow
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground">
              {new Date(data.timestamp).toLocaleTimeString()}
            </span>
            <button
              onClick={fetchData}
              className="p-1.5 rounded border border-border hover:border-primary/50 transition-colors"
            >
              <RefreshCw className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Asset Score Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {sortedAssets.map((asset) => (
            <TooltipProvider key={asset.key} delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "rounded-lg border p-3 sm:p-4 transition-all cursor-default",
                      scoreBg(asset.score)
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{ASSET_ICONS[asset.key]}</span>
                      <span className="text-[10px] font-mono tracking-wide uppercase text-muted-foreground truncate">
                        {asset.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={cn("text-lg font-bold font-mono", scoreColor(asset.score))}>
                        {asset.score > 0 ? "+" : ""}
                        {asset.score.toFixed(2)}
                      </span>
                      {asset.score > 0.05 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-[hsl(142,60%,45%)]" />
                      ) : asset.score < -0.05 ? (
                        <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                      ) : null}
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {asset.change > 0 ? "+" : ""}
                      {asset.change.toFixed(2)}% daily
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs font-mono">
                    {asset.label}: Liquidity score {asset.score > 0 ? "+" : ""}{asset.score.toFixed(2)}
                    <br />
                    Daily change: {asset.change > 0 ? "+" : ""}{asset.change.toFixed(2)}%
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        {/* Flow Arrows */}
        {data.flows.length > 0 && (
          <div className="mb-8">
            <p className="text-[10px] font-mono tracking-[3px] uppercase text-muted-foreground mb-4">
              Capital Rotation Flows
            </p>
            <div className="space-y-2">
              {data.flows.map((flow, i) => {
                const isHovered = hoveredFlow === i;
                const barWidth = Math.max(15, flow.magnitude * 100);
                return (
                  <TooltipProvider key={i} delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg border transition-all cursor-default",
                            isHovered
                              ? "border-primary/50 bg-primary/5"
                              : "border-border bg-background/50 hover:border-primary/30"
                          )}
                          onMouseEnter={() => setHoveredFlow(i)}
                          onMouseLeave={() => setHoveredFlow(null)}
                        >
                          {/* Source */}
                          <div className="flex items-center gap-1.5 min-w-[100px] sm:min-w-[130px]">
                            <span className="text-sm">{ASSET_ICONS[flow.source] || "•"}</span>
                            <span className="text-xs font-mono text-muted-foreground truncate">
                              {flow.sourceLabel}
                            </span>
                          </div>

                          {/* Flow bar */}
                          <div className="flex-1 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{
                                  width: `${barWidth}%`,
                                  background: `linear-gradient(90deg, ${flowColor(flow.shift)}, hsl(var(--primary)))`,
                                  opacity: isHovered ? 1 : 0.7,
                                }}
                              />
                            </div>
                            <ArrowRight
                              className={cn(
                                "h-3.5 w-3.5 flex-shrink-0 transition-colors",
                                isHovered ? "text-primary" : "text-muted-foreground"
                              )}
                            />
                          </div>

                          {/* Target */}
                          <div className="flex items-center gap-1.5 min-w-[100px] sm:min-w-[130px]">
                            <span className="text-sm">{ASSET_ICONS[flow.target] || "•"}</span>
                            <span className="text-xs font-mono text-muted-foreground truncate">
                              {flow.targetLabel}
                            </span>
                          </div>

                          {/* Shift score */}
                          <span
                            className={cn(
                              "text-xs font-mono font-semibold min-w-[50px] text-right",
                              flow.shift > 0 ? "text-[hsl(142,60%,45%)]" : "text-destructive"
                            )}
                          >
                            {flow.shift > 0 ? "+" : ""}
                            {flow.shift.toFixed(2)}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="text-xs font-mono space-y-1">
                          <p className="font-semibold">
                            Flow: {flow.sourceLabel} → {flow.targetLabel}
                          </p>
                          <p>
                            Liquidity shift: {flow.shift > 0 ? "+" : ""}
                            {flow.shift.toFixed(2)}
                          </p>
                          <p className="text-muted-foreground">
                            {flow.shift > 0.5
                              ? "Strong rotation into risk assets"
                              : flow.shift > 0
                              ? "Moderate capital movement"
                              : "Defensive repositioning"}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        )}

        {/* Regime Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 rounded-lg border border-border bg-background/50">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono tracking-[2px] uppercase text-muted-foreground">
              Liquidity Regime:
            </span>
            <span className={cn("text-sm font-bold font-mono", regimeColor(data.regime.regime))}>
              {data.regime.regime}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground">Confidence:</span>
            <div className="w-24 h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${data.regime.confidence}%` }}
              />
            </div>
            <span className="text-xs font-mono text-primary font-semibold">
              {data.regime.confidence}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidityFlowMap;
