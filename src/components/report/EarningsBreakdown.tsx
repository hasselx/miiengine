import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const sentColor = { positive: "text-green-data", negative: "text-red-data", neutral: "text-gold" };
const sentBg = { positive: "bg-[#e8f5e9] text-green-dark", negative: "bg-[#fde8e8] text-red-dark", neutral: "bg-[#fff8e1] text-[#856404]" };

const EarningsBreakdown = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="04" title="JPMorgan — Earnings Breakdown">
    <div className="divide-y divide-border">
      {data.earningsBreakdown.map((e, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5">
          <span className="text-[13px] flex-1">{e.label}</span>
          <span className={`font-mono text-[13px] font-semibold ${sentColor[e.sentiment]}`}>{e.value}</span>
          {e.change && (
            <span className={`font-mono text-[10px] px-1.5 py-0.5 ${sentBg[e.sentiment]}`}>{e.change}</span>
          )}
        </div>
      ))}
    </div>
    <div className="mt-3 p-2.5 bg-accent-area text-[12px] text-muted-foreground border-l-[3px] border-gold">
      {data.earningsNote}
    </div>
  </SectionWrapper>
);

export default EarningsBreakdown;
