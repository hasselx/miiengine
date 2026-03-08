import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const MoatSection = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="21" title="Competitive Moat" score="8 / 10">
    <div className="divide-y divide-border">
      {data.moatItems.map((m, i) => (
        <div key={i} className="flex items-center gap-2.5 py-3">
          <span className="text-[12px] sm:text-[13px] flex-1 min-w-0">{m.name}</span>
          <div className="w-16 sm:w-20 shrink-0">
            <div className="h-1.5 bg-border rounded-sm overflow-hidden">
              <div className="h-full bg-gold rounded-sm" style={{ width: `${(m.score / m.maxScore) * 100}%` }} />
            </div>
          </div>
          <span className="font-mono text-[12px] text-muted-foreground w-7 text-right shrink-0">{m.score}</span>
        </div>
      ))}
    </div>
  </SectionWrapper>
);

export default MoatSection;
