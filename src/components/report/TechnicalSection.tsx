import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const statusColor = { positive: "text-green-data", negative: "text-red-data", neutral: "text-gold" };

const TechnicalSection = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="05" title="Technical Signals" score="8 / 15">
    <div className="divide-y divide-border">
      {data.technicalSignals.map((s, i) => (
        <div key={i} className="flex items-center gap-2.5 py-2.5">
          <span className="text-[13px] flex-1">{s.name}</span>
          <span className={`font-mono text-[12px] ${statusColor[s.status]}`}>{s.value}</span>
        </div>
      ))}
    </div>
    <div className="mt-3 p-2.5 bg-accent-area text-[12px] text-muted-foreground border-l-[3px] border-gold">
      {data.technicalNote}
    </div>
  </SectionWrapper>
);

export default TechnicalSection;
