import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const sentColor = { positive: "text-green-data", negative: "text-red-data", neutral: "text-gold" };
const sentBg = { positive: "bg-[hsl(120,40%,92%)] text-green-dark", negative: "bg-[hsl(0,60%,95%)] text-red-dark", neutral: "bg-[hsl(45,100%,93%)] text-[hsl(45,50%,33%)]" };

const EarningsBreakdown = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="04" title="JPMorgan — Earnings Breakdown">
    <div className="divide-y divide-border">
      {data.earningsBreakdown.map((e, i) => (
        <div key={i} className="flex items-center gap-2 sm:gap-3 py-3">
          <span className="text-[12px] sm:text-[13px] flex-1 min-w-0">{e.label}</span>
          <span className={`font-mono text-[12px] sm:text-[13px] font-semibold shrink-0 ${sentColor[e.sentiment]}`}>{e.value}</span>
          {e.change && (
            <span className={`font-mono text-[9px] sm:text-[10px] px-1.5 py-0.5 shrink-0 rounded-sm ${sentBg[e.sentiment]}`}>{e.change}</span>
          )}
        </div>
      ))}
    </div>
    <div className="mt-3 p-2.5 bg-accent-area text-[11px] sm:text-[12px] text-muted-foreground border-l-[3px] border-gold rounded-sm">
      {data.earningsNote}
    </div>
  </SectionWrapper>
);

export default EarningsBreakdown;
