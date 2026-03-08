import { useState } from "react";
import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

/* ── Risk score derivation from existing riskItems ── */
const LEVEL_SCORE: Record<string, number> = { LOW: 20, MEDIUM: 50, HIGH: 85 };

function computeRiskScore(data: StockAnalysis) {
  const items = data.riskItems;
  if (!items || items.length === 0) return { score: 50, factors: [] };

  const factors = items.map((r) => ({
    name: r.name,
    level: r.level,
    score: LEVEL_SCORE[r.level] ?? 50,
    filled: r.filled,
    tooltip: getTooltip(r.name, r.level),
  }));

  const avg = Math.round(factors.reduce((s, f) => s + f.score, 0) / factors.length);
  return { score: avg, factors };
}

function getTooltip(name: string, level: string): string {
  const n = name.toLowerCase();
  if (n.includes("volatil")) return `Price volatility is ${level.toLowerCase()}, measuring historical price swings and beta relative to benchmark.`;
  if (n.includes("debt") || n.includes("financ") || n.includes("leverage")) return `Financial leverage risk is ${level.toLowerCase()}, based on debt-to-equity and interest coverage.`;
  if (n.includes("sector") || n.includes("cycl") || n.includes("business")) return `Sector cyclicality risk is ${level.toLowerCase()}, reflecting revenue stability and industry sensitivity.`;
  if (n.includes("macro") || n.includes("rate") || n.includes("geo")) return `Macro exposure is ${level.toLowerCase()}, driven by interest rate and geopolitical sensitivity.`;
  if (n.includes("liquid") || n.includes("volume")) return `Liquidity risk is ${level.toLowerCase()}, based on average trading volume and market cap.`;
  if (n.includes("govern") || n.includes("esg")) return `Governance/ESG risk is ${level.toLowerCase()}, evaluating corporate governance quality.`;
  if (n.includes("regulat")) return `Regulatory risk is ${level.toLowerCase()}, reflecting exposure to policy changes.`;
  if (n.includes("concentr")) return `Concentration risk is ${level.toLowerCase()}, measuring revenue/client dependency.`;
  return `${name} risk is ${level.toLowerCase()}.`;
}

function getRiskLabel(score: number) {
  if (score <= 20) return { label: "Very Low", color: "text-green-data" };
  if (score <= 40) return { label: "Low", color: "text-green-data" };
  if (score <= 60) return { label: "Moderate", color: "text-primary" };
  if (score <= 80) return { label: "High", color: "text-red-data" };
  return { label: "Very High", color: "text-destructive" };
}

/* ── Gauge colors (5 segments) ── */
const GAUGE_SEGMENTS = [
  { from: 0, to: 20, color: "hsl(142, 60%, 40%)" },
  { from: 20, to: 40, color: "hsl(142, 40%, 55%)" },
  { from: 40, to: 60, color: "hsl(45, 80%, 50%)" },
  { from: 60, to: 80, color: "hsl(25, 80%, 50%)" },
  { from: 80, to: 100, color: "hsl(0, 65%, 50%)" },
];

/* ── Semicircle Gauge SVG ── */
function Gauge({ score, size = 180 }: { score: number; size?: number }) {
  const cx = size / 2;
  const cy = size / 2 + 4;
  const r = size / 2 - 16;
  const strokeWidth = 14;

  // Arc helper: angle 0 = left (180deg), angle 180 = right (0deg)
  const arcPath = (startAngle: number, endAngle: number) => {
    const toRad = (a: number) => ((180 + a) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));
    const largeArc = endAngle - startAngle > 90 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Needle angle
  const needleAngle = (score / 100) * 180;
  const needleRad = ((180 + needleAngle) * Math.PI) / 180;
  const needleLen = r - 8;
  const nx = cx + needleLen * Math.cos(needleRad);
  const ny = cy + needleLen * Math.sin(needleRad);

  return (
    <svg width={size} height={size / 2 + 24} viewBox={`0 0 ${size} ${size / 2 + 24}`} className="mx-auto">
      {/* Background track */}
      <path d={arcPath(0, 180)} fill="none" stroke="hsl(var(--border))" strokeWidth={strokeWidth} strokeLinecap="round" />

      {/* Colored segments */}
      {GAUGE_SEGMENTS.map((seg, i) => {
        const start = (seg.from / 100) * 180;
        const end = (seg.to / 100) * 180;
        return (
          <path
            key={i}
            d={arcPath(start, end)}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            opacity={0.85}
          />
        );
      })}

      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke="hsl(var(--foreground))"
        strokeWidth={2.5}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
      <circle cx={cx} cy={cy} r={4} fill="hsl(var(--foreground))" />

      {/* Labels */}
      <text x={16} y={cy + 18} className="fill-muted-foreground" fontSize="9" fontFamily="monospace">0</text>
      <text x={size - 24} y={cy + 18} className="fill-muted-foreground" fontSize="9" fontFamily="monospace">100</text>
    </svg>
  );
}

/* ── Component ── */
const RiskMeter = ({ data }: { data: StockAnalysis }) => {
  const { score, factors } = computeRiskScore(data);
  const { label, color } = getRiskLabel(score);
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(!isMobile);
  const [hoveredFactor, setHoveredFactor] = useState<string | null>(null);

  const levelColor: Record<string, string> = {
    LOW: "text-green-data",
    MEDIUM: "text-primary",
    HIGH: "text-red-data",
  };

  const levelBg: Record<string, string> = {
    LOW: "bg-green-data/10",
    MEDIUM: "bg-primary/10",
    HIGH: "bg-red-data/10",
  };

  return (
    <SectionWrapper num="24" title="Risk Meter" score={`${score}/100`}>
      {/* Gauge */}
      <div className="flex flex-col items-center pb-3">
        <Gauge score={score} size={isMobile ? 160 : 200} />
        <div className="text-center -mt-1">
          <p className={cn("font-mono text-2xl font-bold", color)}>{score}</p>
          <p className={cn("font-mono text-xs tracking-widest uppercase", color)}>{label} Risk</p>
        </div>
      </div>

      {/* Breakdown toggle on mobile */}
      {isMobile && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-center py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? "Hide Details ▲" : "Show Details ▼"}
        </button>
      )}

      {/* Factor breakdown */}
      {expanded && (
        <div className="space-y-1.5 pt-2 border-t border-border">
          <p className="font-mono text-[9px] tracking-[2px] uppercase text-muted-foreground mb-2">Risk Contributors</p>
          {factors.map((f) => (
            <div
              key={f.name}
              className="relative flex items-center justify-between py-2 px-2 rounded-md hover:bg-accent/40 transition-colors cursor-default"
              onMouseEnter={() => setHoveredFactor(f.name)}
              onMouseLeave={() => setHoveredFactor(null)}
            >
              <span className="text-[12px] text-foreground flex-1 min-w-0 truncate">{f.name}</span>
              <span className={cn("font-mono text-[10px] font-semibold px-2 py-0.5 rounded-sm", levelBg[f.level], levelColor[f.level])}>
                {f.level === "LOW" ? "Low" : f.level === "MEDIUM" ? "Medium" : "High"}
              </span>

              {/* Tooltip */}
              {hoveredFactor === f.name && (
                <div className="absolute bottom-full left-0 right-0 mb-1 px-3 py-2 bg-popover border border-border rounded-md shadow-lg z-20 text-[10px] text-muted-foreground font-mono leading-relaxed animate-in fade-in-0 zoom-in-95">
                  {f.tooltip}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionWrapper>
  );
};

export default RiskMeter;
