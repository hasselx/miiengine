import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const colorMap = { green: "text-green-data", red: "text-red-data", gold: "text-gold", muted: "text-muted-foreground" };

const FundamentalAnalysis = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="03" title="Fundamental Analysis" score="13 / 20">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {data.fundamentalMetrics.map((m, i) => (
        <div key={i} className="bg-accent-area border border-border p-3 sm:p-3.5 rounded-sm">
          <p className="font-mono text-[10px] tracking-[2px] uppercase text-muted-foreground mb-1.5">{m.label}</p>
          <p className={`font-mono text-lg sm:text-xl font-medium ${colorMap[m.color]}`}>{m.value}</p>
          <p className="text-[11px] sm:text-[12px] text-muted-foreground mt-1">{m.note}</p>
        </div>
      ))}
    </div>
    <div className="mt-4 p-3 sm:p-3.5 bg-accent-area border border-border text-[12px] sm:text-[13px] text-muted-foreground leading-[1.7] rounded-sm">
      <strong>Analyst Note:</strong> {data.fundamentalNote}
    </div>
  </SectionWrapper>
);

export default FundamentalAnalysis;
