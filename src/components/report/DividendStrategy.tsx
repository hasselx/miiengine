import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const colorMap = { green: "text-green-data", red: "text-red-data", gold: "text-gold", muted: "text-muted-foreground" };

const DividendStrategy = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="25" title="Harvard Endowment — Dividend Strategy">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {data.dividendMetrics.map((m, i) => (
        <div key={i} className="bg-accent-area border border-border p-3 rounded-sm">
          <p className="font-mono text-[10px] tracking-[2px] uppercase text-muted-foreground mb-1">{m.label}</p>
          <p className={`font-mono text-base sm:text-lg font-medium ${colorMap[m.color]}`}>{m.value}</p>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">{m.note}</p>
        </div>
      ))}
    </div>
    <div className="mt-3 p-2.5 bg-accent-area text-[11px] sm:text-[12px] text-muted-foreground border-l-[3px] border-gold rounded-sm">
      {data.dividendNote}
    </div>
  </SectionWrapper>
);

export default DividendStrategy;
