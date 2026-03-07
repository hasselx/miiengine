import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const sentimentStyle = {
  positive: "bg-[hsl(120,40%,92%)] text-green-dark",
  neutral: "bg-[hsl(45,100%,93%)] text-[hsl(45,50%,33%)]",
  negative: "bg-[hsl(0,60%,95%)] text-red-dark",
};

const MacroSection = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="07" title="Macro & Sector Tailwinds" score="9 / 10">
    <div className="divide-y divide-border">
      {data.macroItems.map((m, i) => (
        <div key={i} className="flex items-start sm:items-center gap-3 py-3">
          <span className="text-lg shrink-0">{m.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold mb-0.5">{m.title}</p>
            <p className="text-[11px] sm:text-[12px] text-muted-foreground">{m.detail}</p>
          </div>
          <span className={`font-mono text-[10px] sm:text-[11px] px-2 py-0.5 font-medium shrink-0 rounded-sm ${sentimentStyle[m.sentiment]}`}>
            {m.sentimentLabel}
          </span>
        </div>
      ))}
    </div>
  </SectionWrapper>
);

export default MacroSection;
