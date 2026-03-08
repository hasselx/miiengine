import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { X, BarChart3, Activity } from "lucide-react";

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

interface TreemapRect {
  x: number;
  y: number;
  w: number;
  h: number;
  data: IndexData;
}

const CACHE_KEY = "mii-heatmap";
const CACHE_TTL = 30_000;
const POLL_INTERVAL = 60_000;

const REGION_ORDER = ["United States", "Asia", "Europe", "India", "Oceania", "Americas", "Middle East"];

/* ══════════════════════════════════════════════
   Squarified Treemap Algorithm
   ══════════════════════════════════════════════ */
function squarify(
  items: { value: number; data: IndexData }[],
  x: number, y: number, w: number, h: number
): TreemapRect[] {
  if (items.length === 0) return [];
  if (items.length === 1) return [{ x, y, w, h, data: items[0].data }];

  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0) return [];

  const sorted = [...items].sort((a, b) => b.value - a.value);
  const rects: TreemapRect[] = [];

  let remaining = [...sorted];
  let cx = x, cy = y, cw = w, ch = h;

  while (remaining.length > 0) {
    const remTotal = remaining.reduce((s, i) => s + i.value, 0);
    const isVertical = cw >= ch;
    const side = isVertical ? ch : cw;

    // Find the best row
    let row: typeof remaining = [];
    let bestAspect = Infinity;

    for (let i = 1; i <= remaining.length; i++) {
      const candidate = remaining.slice(0, i);
      const rowSum = candidate.reduce((s, it) => s + it.value, 0);
      const rowWidth = (rowSum / remTotal) * (isVertical ? cw : ch);
      
      let worstAspect = 0;
      for (const item of candidate) {
        const itemH = (item.value / rowSum) * side;
        const aspect = Math.max(rowWidth / itemH, itemH / rowWidth);
        worstAspect = Math.max(worstAspect, aspect);
      }

      if (worstAspect <= bestAspect) {
        bestAspect = worstAspect;
        row = candidate;
      } else {
        break;
      }
    }

    // Layout the row
    const rowSum = row.reduce((s, it) => s + it.value, 0);
    const rowWidth = (rowSum / remTotal) * (isVertical ? cw : ch);

    let offset = 0;
    for (const item of row) {
      const itemSize = (item.value / rowSum) * side;
      if (isVertical) {
        rects.push({ x: cx, y: cy + offset, w: rowWidth, h: itemSize, data: item.data });
      } else {
        rects.push({ x: cx + offset, y: cy, w: itemSize, h: rowWidth, data: item.data });
      }
      offset += itemSize;
    }

    // Reduce remaining area
    if (isVertical) {
      cx += rowWidth;
      cw -= rowWidth;
    } else {
      cy += rowWidth;
      ch -= rowWidth;
    }

    remaining = remaining.slice(row.length);
  }

  return rects;
}

/* ── Inline HSL color (no Tailwind — used for absolute-positioned divs) ── */
function heatColorInline(pct: number, isDark: boolean): { bg: string; text: string; border: string } {
  const abs = Math.abs(pct);
  if (abs < 0.05) {
    return isDark
      ? { bg: "hsl(220,10%,16%)", text: "hsl(220,10%,55%)", border: "hsl(220,10%,22%)" }
      : { bg: "hsl(220,10%,92%)", text: "hsl(220,10%,40%)", border: "hsl(220,10%,82%)" };
  }
  if (pct > 0) {
    const sat = isDark ? 35 : 45;
    const l = isDark ? Math.max(14, 28 - abs * 4) : Math.min(92, 88 - abs * 10);
    const tl = isDark ? Math.min(75, 45 + abs * 8) : Math.max(18, 35 - abs * 5);
    return {
      bg: `hsl(142,${sat + abs * 3}%,${l}%)`,
      text: `hsl(142,${sat + 15}%,${tl}%)`,
      border: `hsl(142,${sat - 5}%,${isDark ? l + 6 : l - 8}%)`,
    };
  }
  const sat = isDark ? 35 : 45;
  const l = isDark ? Math.max(14, 28 - abs * 4) : Math.min(92, 92 - abs * 10);
  const tl = isDark ? Math.min(75, 45 + abs * 8) : Math.max(18, 40 - abs * 6);
  return {
    bg: `hsl(0,${sat + abs * 3}%,${l}%)`,
    text: `hsl(0,${sat + 15}%,${tl}%)`,
    border: `hsl(0,${sat - 5}%,${isDark ? l + 6 : l - 8}%)`,
  };
}

/* ── Sparkline ── */
const Sparkline = ({ data, positive }: { data: { t: number; v: number }[]; positive: boolean }) => {
  if (!data || data.length < 2) return null;
  const values = data.map((d) => d.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 140, h = 50;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={positive ? "hsl(var(--green-light))" : "hsl(var(--destructive))"} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
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
          <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-md"><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <div className="mb-4 flex items-baseline gap-3">
          <span className="text-2xl font-bold font-mono text-foreground">{idx.price.toLocaleString()}</span>
          <span className={cn("text-sm font-mono font-semibold", positive ? "text-green-data" : "text-destructive")}>
            {positive ? "+" : ""}{idx.changePct.toFixed(2)}%
          </span>
        </div>
        <div className="bg-background rounded-lg p-3 border border-border mb-4">
          {idx.chartData.length > 2 ? <Sparkline data={idx.chartData} positive={positive} /> : <p className="text-xs text-muted-foreground text-center py-4">Chart data unavailable</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Day High", value: idx.dayHigh.toLocaleString() },
            { label: "Day Low", value: idx.dayLow.toLocaleString() },
            { label: "Volume", value: idx.volume > 1e9 ? `${(idx.volume / 1e9).toFixed(1)}B` : idx.volume > 1e6 ? `${(idx.volume / 1e6).toFixed(1)}M` : idx.volume > 1e3 ? `${(idx.volume / 1e3).toFixed(0)}K` : idx.volume || "—" },
            { label: "Status", value: idx.isOpen ? "Open" : "Closed", isStatus: true },
          ].map((s) => (
            <div key={s.label} className="bg-background rounded-lg p-3 border border-border">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
              <p className={cn("text-sm font-mono font-semibold", s.isStatus ? (idx.isOpen ? "text-green-data" : "text-muted-foreground") : "text-foreground")}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Tooltip ── */
const Tooltip = ({ idx, mouseX, mouseY, containerRect }: { idx: IndexData; mouseX: number; mouseY: number; containerRect: DOMRect }) => {
  const positive = idx.changePct >= 0;
  const left = mouseX - containerRect.left + 12;
  const top = mouseY - containerRect.top - 10;
  return (
    <div
      className="absolute z-50 pointer-events-none bg-popover border border-border rounded-lg shadow-xl p-3 min-w-[180px]"
      style={{ left: Math.min(left, containerRect.width - 200), top: Math.max(0, top - 80) }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">{idx.flag}</span>
        <span className="font-mono text-xs font-bold text-foreground">{idx.country}</span>
      </div>
      <p className="font-mono text-[11px] text-muted-foreground mb-1">{idx.name} · {idx.exchange}</p>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-mono text-sm font-bold text-foreground">{idx.price.toLocaleString()}</span>
        <span className={cn("font-mono text-xs font-semibold", positive ? "text-green-data" : "text-destructive")}>
          {positive ? "+" : ""}{idx.changePct.toFixed(2)}%
        </span>
      </div>
      <span className={cn("font-mono text-[10px]", idx.isOpen ? "text-green-data" : "text-muted-foreground")}>
        {idx.isOpen ? "● Open" : "○ Closed"}
      </span>
    </div>
  );
};

/* ══════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════ */
const GlobalHeatmap = () => {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [selected, setSelected] = useState<IndexData | null>(null);
  const [hovered, setHovered] = useState<{ idx: IndexData; mx: number; my: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Observe container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      // Height proportional to width for a nice aspect ratio
      const h = Math.max(320, Math.min(width * 0.55, 560));
      setContainerSize({ w: width, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

  // Compute treemap layout
  const rects = useMemo(() => {
    if (!containerSize.w || indices.length === 0) return [];
    const items = indices
      .sort((a, b) => {
        const ai = REGION_ORDER.indexOf(a.region);
        const bi = REGION_ORDER.indexOf(b.region);
        if (ai !== bi) return ai - bi;
        return b.weight - a.weight;
      })
      .map((d) => ({ value: d.weight * d.weight, data: d })); // square the weight for more dramatic size difference
    return squarify(items, 0, 0, containerSize.w, containerSize.h);
  }, [indices, containerSize]);

  if (loading && indices.length === 0) {
    return (
      <div className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-8">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Global Stock Exchange Heatmap</h2>
          </div>
          <div className="w-full h-[400px] rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (indices.length === 0) return null;

  const avgChange = indices.reduce((s, i) => s + i.changePct, 0) / indices.length;
  const positiveCount = indices.filter((i) => i.changePct > 0).length;

  return (
    <>
      <div className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Global Stock Exchange Heatmap</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Real-time performance · tile size reflects market weight</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className={cn("px-2.5 py-1 rounded-full font-semibold", avgChange >= 0 ? "bg-[hsl(142,40%,88%)] dark:bg-[hsl(142,30%,18%)] text-[hsl(142,55%,30%)] dark:text-[hsl(142,50%,55%)]" : "bg-[hsl(0,40%,92%)] dark:bg-[hsl(0,30%,18%)] text-[hsl(0,55%,40%)] dark:text-[hsl(0,50%,55%)]")}>
                Avg {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}%
              </span>
              <span className="text-muted-foreground">{positiveCount}/{indices.length} ↑</span>
            </div>
          </div>

          {/* Treemap Container */}
          <div
            ref={containerRef}
            className="relative w-full rounded-xl overflow-hidden border border-border"
            style={{ height: containerSize.h || 400 }}
            onMouseLeave={() => setHovered(null)}
          >
            {rects.map((rect) => {
              const d = rect.data;
              const positive = d.changePct >= 0;
              const colors = heatColorInline(d.changePct, isDark);
              const isLarge = rect.w > 120 && rect.h > 90;
              const isMedium = rect.w > 80 && rect.h > 60;
              const isTiny = rect.w < 60 || rect.h < 45;

              return (
                <button
                  key={d.symbol}
                  className="absolute flex flex-col justify-center items-center overflow-hidden transition-all duration-150 hover:brightness-110 hover:z-20 cursor-pointer group"
                  style={{
                    left: rect.x,
                    top: rect.y,
                    width: rect.w,
                    height: rect.h,
                    backgroundColor: colors.bg,
                    borderRight: `1px solid ${colors.border}`,
                    borderBottom: `1px solid ${colors.border}`,
                    color: colors.text,
                  }}
                  onClick={() => setSelected(d)}
                  onMouseMove={(e) => setHovered({ idx: d, mx: e.clientX, my: e.clientY })}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Flag + Country */}
                  {!isTiny && (
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className={cn("leading-none", isLarge ? "text-lg" : "text-sm")}>{d.flag}</span>
                      {isMedium && (
                        <span className="font-mono uppercase tracking-wider opacity-70" style={{ fontSize: isLarge ? 10 : 8 }}>
                          {d.country}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Index Name */}
                  <div className="font-bold font-mono truncate max-w-full px-1" style={{ fontSize: isLarge ? 13 : isMedium ? 11 : 9 }}>
                    {d.name}
                  </div>

                  {/* Percentage */}
                  <div className="font-bold font-mono" style={{ fontSize: isLarge ? 22 : isMedium ? 16 : 12 }}>
                    {positive ? "+" : ""}{d.changePct.toFixed(2)}%
                  </div>

                  {/* Price (large tiles only) */}
                  {isLarge && (
                    <div className="font-mono opacity-50 mt-0.5" style={{ fontSize: 11 }}>
                      {d.price.toLocaleString()}
                    </div>
                  )}

                  {/* Closed badge */}
                  {!d.isOpen && isMedium && (
                    <div className="absolute top-1.5 right-1.5 font-mono px-1 py-0.5 rounded opacity-50" style={{ fontSize: 7, background: "rgba(0,0,0,0.15)" }}>
                      CLOSED
                    </div>
                  )}
                </button>
              );
            })}

            {/* Hover Tooltip */}
            {hovered && containerRef.current && (
              <Tooltip idx={hovered.idx} mouseX={hovered.mx} mouseY={hovered.my} containerRect={containerRef.current.getBoundingClientRect()} />
            )}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono text-muted-foreground">
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
