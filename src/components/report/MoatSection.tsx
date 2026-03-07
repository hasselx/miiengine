import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const MoatSection = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="06" title="Competitive Moat" score="8 / 10">
    <div className="divide-y divide-border">
      {data.moatItems.map((m, i) => (
        <div key={i} className="flex items-center gap-2.5 py-2">
          <span className="text-[12px] flex-1">{m.name}</span>
          <div className="w-20">
            <div className="h-1 bg-border rounded-sm overflow-hidden">
              <div className="h-full bg-gold rounded-sm" style={{ width: `${(m.score / m.maxScore) * 100}%` }} />
            </div>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground w-7 text-right">{m.score}</span>
        </div>
      ))}
    </div>
  </SectionWrapper>
);

export default MoatSection;
