import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const typeColor = { bullish: "text-green-data", bearish: "text-red-data", neutral: "text-gold" };
const typeBg = { bullish: "bg-[#e8f5e9]", bearish: "bg-[#fde8e8]", neutral: "bg-[#fff8e1]" };

const PatternFinder = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="10" title="Renaissance — Pattern Finder">
    <div className="divide-y divide-border">
      {data.patternSignals.map((p, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <span className="text-[14px] font-medium w-24 shrink-0">{p.name}</span>
          <span className={`font-mono text-[12px] shrink-0 w-20 ${typeColor[p.type]}`}>{p.signal}</span>
          <div className="flex-1 min-w-0">
            <div className="h-2 bg-border rounded-sm overflow-hidden">
              <div className={`h-full rounded-sm ${p.type === 'bullish' ? 'bg-green-data' : p.type === 'bearish' ? 'bg-red-data' : 'bg-gold'}`} style={{ width: `${Math.round(p.confidence)}%` }} />
            </div>
          </div>
          <span className="font-mono text-[12px] text-muted-foreground w-12 text-right shrink-0">{Math.round(p.confidence)}%</span>
        </div>
      ))}
    </div>
    <div className="mt-3 p-2.5 bg-accent-area text-[12px] text-muted-foreground border-l-[3px] border-gold">
      {data.patternNote}
    </div>
  </SectionWrapper>
);

export default PatternFinder;
