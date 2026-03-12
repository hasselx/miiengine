import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AssetData {
  symbol: string;
  name: string;
  category: string;
  price: number;
  change: number;
  changePct: number;
  chartData: { t: number; v: number }[];
}

const CATEGORY_LABELS: Record<string, string> = {
  etfs: "ETFs / Commodities",
  crypto: "Cryptocurrencies",
  bonds: "Bonds",
};

// Relative weight for tile sizing (importance)
const ASSET_WEIGHTS: Record<string, number> = {
  "BTC-USD": 10,
  "ETH-USD": 5,
  "SOL-USD": 2,
  "BNB-USD": 2,
  "XRP-USD": 1.5,
  GLD: 6,
  SLV: 3,
  USO: 4,
  CPER: 2,
  UNG: 2,
  "^TNX": 6,
  "^IRX": 3,
  "BUND-DE": 2.5,
  "GILT-UK": 2,
  "JGB-JP": 2,
};

const FALLBACK_DATA: AssetData[] = [
  { symbol: "GLD", name: "Gold ETF", category: "etfs", price: 2320, change: 19.72, changePct: 0.85, chartData: [] },
  { symbol: "SLV", name: "Silver ETF", category: "etfs", price: 27.4, change: -0.22, changePct: -0.8, chartData: [] },
  { symbol: "USO", name: "Oil ETF", category: "etfs", price: 74.1, change: 1.11, changePct: 1.52, chartData: [] },
  { symbol: "CPER", name: "Copper ETF", category: "etfs", price: 25.8, change: 0.13, changePct: 0.5, chartData: [] },
  { symbol: "UNG", name: "Natural Gas ETF", category: "etfs", price: 13.2, change: -0.4, changePct: -2.94, chartData: [] },
  { symbol: "BTC-USD", name: "Bitcoin", category: "crypto", price: 67500, change: 1350, changePct: 2.04, chartData: [] },
  { symbol: "ETH-USD", name: "Ethereum", category: "crypto", price: 3520, change: -35.2, changePct: -0.99, chartData: [] },
  { symbol: "SOL-USD", name: "Solana", category: "crypto", price: 172, change: 5.16, changePct: 3.09, chartData: [] },
  { symbol: "BNB-USD", name: "BNB", category: "crypto", price: 605, change: 3.03, changePct: 0.5, chartData: [] },
  { symbol: "XRP-USD", name: "XRP", category: "crypto", price: 0.52, change: -0.01, changePct: -1.89, chartData: [] },
  { symbol: "^TNX", name: "US 10Y Treasury", category: "bonds", price: 4.25, change: -0.03, changePct: -0.7, chartData: [] },
  { symbol: "^IRX", name: "US 2Y Treasury", category: "bonds", price: 4.72, change: 0.02, changePct: 0.42, chartData: [] },
  { symbol: "BUND-DE", name: "Germany 10Y Bund", category: "bonds", price: 2.35, change: -0.01, changePct: -0.42, chartData: [] },
  { symbol: "GILT-UK", name: "UK 10Y Gilt", category: "bonds", price: 4.05, change: 0.03, changePct: 0.74, chartData: [] },
  { symbol: "JGB-JP", name: "Japan 10Y Bond", category: "bonds", price: 0.88, change: 0.0, changePct: 0.0, chartData: [] },
];

function getHeatBg(pct: number): string {
  if (pct >= 3) return "bg-[hsl(142,60%,25%)]";
  if (pct >= 1) return "bg-[hsl(142,45%,32%)]";
  if (pct >= 0.2) return "bg-[hsl(142,30%,38%)]";
  if (pct > -0.2) return "bg-muted";
  if (pct > -1) return "bg-[hsl(0,35%,38%)]";
  if (pct > -3) return "bg-[hsl(0,50%,32%)]";
  return "bg-[hsl(0,60%,25%)]";
}

function getHeatBorder(pct: number): string {
  if (pct >= 1) return "border-[hsl(142,50%,40%)]/30";
  if (pct > -1) return "border-border/30";
  return "border-[hsl(0,40%,40%)]/30";
}

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
}

function MiniChart({ data }: { data: { t: number; v: number }[] }) {
  if (data.length < 2) return <p className="text-xs text-muted-foreground text-center py-8">Chart data unavailable</p>;
  const vals = data.map((d) => d.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const w = 400;
  const h = 120;
  const points = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d.v - min) / range) * h}`).join(" ");
  const isUp = vals[vals.length - 1] >= vals[0];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
      <polyline fill="none" stroke={isUp ? "hsl(142,60%,45%)" : "hsl(0,60%,50%)"} strokeWidth="2" points={points} />
    </svg>
  );
}

// Squarified treemap layout algorithm
interface TreeRect {
  x: number;
  y: number;
  w: number;
  h: number;
  asset: AssetData;
}

function squarify(
  items: { asset: AssetData; weight: number }[],
  x: number,
  y: number,
  w: number,
  h: number
): TreeRect[] {
  if (items.length === 0) return [];
  if (items.length === 1) {
    return [{ x, y, w, h, asset: items[0].asset }];
  }

  const total = items.reduce((s, i) => s + i.weight, 0);
  const sorted = [...items].sort((a, b) => b.weight - a.weight);

  // Simple slice-and-dice based on aspect ratio
  const isWide = w >= h;
  const rects: TreeRect[] = [];
  let cx = x,
    cy = y;

  for (let i = 0; i < sorted.length; i++) {
    const ratio = sorted[i].weight / total;
    if (isWide) {
      const tileW = w * ratio;
      rects.push({ x: cx, y, w: tileW, h, asset: sorted[i].asset });
      cx += tileW;
    } else {
      const tileH = h * ratio;
      rects.push({ x, y: cy, w, h: tileH, asset: sorted[i].asset });
      cy += tileH;
    }
  }
  return rects;
}

const CrossAssetHeatmap = () => {
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetData | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("fetch-cross-assets");
      if (error) throw error;
      if (data?.assets?.length > 0) {
        setAssets(data.assets);
        setFetchedAt(data.fetchedAt);
      } else {
        setAssets(FALLBACK_DATA);
        setFetchedAt(Date.now());
      }
    } catch {
      setAssets(FALLBACK_DATA);
      setFetchedAt(Date.now());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const categories = ["etfs", "crypto", "bonds"];

  // Build treemap rects per category
  const categoryMaps = useMemo(() => {
    const maps: Record<string, TreeRect[]> = {};
    for (const cat of categories) {
      const items = assets
        .filter((a) => a.category === cat)
        .map((a) => ({ asset: a, weight: ASSET_WEIGHTS[a.symbol] || 1 }));
      maps[cat] = squarify(items, 0, 0, 100, 100);
    }
    return maps;
  }, [assets]);

  if (loading) {
    return (
      <div className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex items-center gap-2 mb-6">
            <span className="font-mono text-[10px] tracking-[4px] uppercase text-muted-foreground">
              Cross-Asset Market Heatmap
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex items-center justify-between mb-6">
            <span className="font-mono text-[10px] sm:text-[11px] tracking-[4px] uppercase text-muted-foreground">
              Cross-Asset Market Heatmap
            </span>
            {fetchedAt && (
              <span className="font-mono text-[10px] text-muted-foreground">
                {new Date(fetchedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const rects = categoryMaps[cat] || [];
              if (rects.length === 0) return null;
              return (
                <div key={cat}>
                  <p className="font-mono text-[10px] tracking-[2px] uppercase text-muted-foreground mb-2">
                    {CATEGORY_LABELS[cat]}
                  </p>
                  <div className="relative w-full" style={{ paddingBottom: "100%" }}>
                    <div className="absolute inset-0">
                      {rects.map((rect) => (
                        <Tooltip key={rect.asset.symbol}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setSelectedAsset(rect.asset)}
                              className={cn(
                                "absolute flex flex-col items-center justify-center border transition-all hover:brightness-125 hover:z-10 cursor-pointer overflow-hidden",
                                getHeatBg(rect.asset.changePct),
                                getHeatBorder(rect.asset.changePct)
                              )}
                              style={{
                                left: `${rect.x}%`,
                                top: `${rect.y}%`,
                                width: `${rect.w}%`,
                                height: `${rect.h}%`,
                              }}
                            >
                              <span className="font-mono text-[10px] sm:text-[11px] font-medium text-[hsl(0,0%,92%)] leading-tight text-center px-1 truncate max-w-full">
                                {rect.asset.name}
                              </span>
                              <span className="font-mono text-[10px] text-[hsl(0,0%,75%)]">
                                {formatPrice(rect.asset.price)}
                              </span>
                              <span
                                className={cn(
                                  "font-mono text-[10px] sm:text-[11px] font-semibold",
                                  rect.asset.changePct >= 0
                                    ? "text-[hsl(142,70%,65%)]"
                                    : "text-[hsl(0,70%,65%)]"
                                )}
                              >
                                {rect.asset.changePct >= 0 ? "+" : ""}
                                {rect.asset.changePct.toFixed(2)}%
                              </span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="font-mono text-[11px]">
                            <p className="font-semibold">{rect.asset.name}</p>
                            <p>Price: {formatPrice(rect.asset.price)}</p>
                            <p>
                              Change: {rect.asset.change >= 0 ? "+" : ""}
                              {rect.asset.change.toFixed(2)} ({rect.asset.changePct >= 0 ? "+" : ""}
                              {rect.asset.changePct.toFixed(2)}%)
                            </p>
                            <p>
                              Status:{" "}
                              {rect.asset.category === "crypto" ? "24/7" : "Market hours"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">
              {selectedAsset?.name} — 1D
            </DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-xl font-semibold">
                  {formatPrice(selectedAsset.price)}
                </span>
                <span
                  className={cn(
                    "font-mono text-sm font-medium",
                    selectedAsset.changePct >= 0
                      ? "text-[hsl(142,60%,45%)]"
                      : "text-destructive"
                  )}
                >
                  {selectedAsset.changePct >= 0 ? "+" : ""}
                  {selectedAsset.changePct.toFixed(2)}%
                </span>
              </div>
              <MiniChart data={selectedAsset.chartData} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default CrossAssetHeatmap;
