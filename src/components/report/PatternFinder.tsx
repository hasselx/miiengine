import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const typeColor = { bullish: "text-green-data", bearish: "text-red-data", neutral: "text-gold" };

const PatternFinder = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="14" title="Renaissance — Pattern Finder">
    <div className="divide-y divide-border">
      {data.patternSignals.map((p, i) => (
        <div key={i} className="py-3 space-y-2">
          {/* Mobile: stack; Desktop: inline */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium min-w-0 truncate">{p.name}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`font-mono text-[11px] ${typeColor[p.type]}`}>{p.signal}</span>
              <span className="font-mono text-[11px] text-muted-foreground">{Math.round(p.confidence)}%</span>
            </div>
          </div>
          <div className="h-2 bg-border rounded-sm overflow-hidden">
            <div className={`h-full rounded-sm ${p.type === 'bullish' ? 'bg-green-data' : p.type === 'bearish' ? 'bg-red-data' : 'bg-gold'}`} style={{ width: `${Math.round(p.confidence)}%` }} />
          </div>
        </div>
      ))}
    </div>
    <div className="mt-3 p-2.5 bg-accent-area text-[11px] sm:text-[12px] text-muted-foreground border-l-[3px] border-gold rounded-sm">
      {data.patternNote}
    </div>
  </SectionWrapper>
);

export default PatternFinder;
