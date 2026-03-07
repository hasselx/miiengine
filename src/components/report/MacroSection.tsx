import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const sentimentStyle = {
  positive: "bg-[#e8f5e9] text-green-dark",
  neutral: "bg-[#fff8e1] text-[#856404]",
  negative: "bg-[#fde8e8] text-red-dark",
};

const MacroSection = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="07" title="Macro & Sector Tailwinds" score="9 / 10">
    <div className="divide-y divide-border">
      {data.macroItems.map((m, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5">
          <span className="text-lg">{m.icon}</span>
          <div className="flex-1">
            <p className="text-[12px] font-semibold mb-0.5">{m.title}</p>
            <p className="text-[11px] text-muted-foreground">{m.detail}</p>
          </div>
          <span className={`font-mono text-[10px] px-2 py-0.5 font-medium ${sentimentStyle[m.sentiment]}`}>
            {m.sentimentLabel}
          </span>
        </div>
      ))}
    </div>
  </SectionWrapper>
);

export default MacroSection;
