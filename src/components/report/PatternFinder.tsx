import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const typeColor = { bullish: "text-green-data", bearish: "text-red-data", neutral: "text-gold" };
const typeBg = { bullish: "bg-[#e8f5e9]", bearish: "bg-[#fde8e8]", neutral: "bg-[#fff8e1]" };

const PatternFinder = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="10" title="Renaissance — Pattern Finder">
    <div className="divide-y divide-border">
      {data.patternSignals.map((p, i) => (
        <div key={i} className="flex items-center gap-2.5 py-2.5">
          <span className="text-[13px] font-medium flex-1">{p.name}</span>
          <span className={`font-mono text-[12px] ${typeColor[p.type]}`}>{p.signal}</span>
          <div className="w-16">
            <div className="h-1.5 bg-border rounded-sm overflow-hidden">
              <div className={`h-full rounded-sm ${typeBg[p.type]} ${p.type === 'bullish' ? 'bg-green-data' : p.type === 'bearish' ? 'bg-red-data' : 'bg-gold'}`} style={{ width: `${p.confidence}%` }} />
            </div>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground w-10 text-right">{p.confidence}%</span>
        </div>
      ))}
    </div>
    <div className="mt-3 p-2.5 bg-accent-area text-[12px] text-muted-foreground border-l-[3px] border-gold">
      {data.patternNote}
    </div>
  </SectionWrapper>
);

export default PatternFinder;
