import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const InstitutionalOwnership = ({ data }: { data: StockAnalysis }) => {
  const pct = data.institutionalOwnership;
  return (
    <SectionWrapper num="15" title="Institutional Ownership" score={`${pct}%`}>
      {/* Gauge bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1.5">
          <span>0%</span><span>Institutional Ownership</span><span>100%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {/* Top holders */}
      <h4 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Top Holders</h4>
      <div className="space-y-2">
        {data.topHolders.map((h, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-muted-foreground w-4">{i + 1}</span>
            <span className="text-[12px] text-foreground flex-1 truncate">{h.name}</span>
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary/60 rounded-full" style={{ width: `${h.percentage * 8}%` }} />
            </div>
            <span className="font-mono text-[12px] font-semibold text-foreground w-12 text-right">{h.percentage}%</span>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
};

export default InstitutionalOwnership;
