import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const tagStyle = { LOW: "bg-[#e8f5e9] text-green-dark", MEDIUM: "bg-[#fff8e1] text-[#856404]", HIGH: "bg-[#fde8e8] text-red-dark" };
const dotColor = { LOW: "bg-green-data", MEDIUM: "bg-gold", HIGH: "bg-red-data" };

const RiskMatrix = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="07" title="Risk Matrix" score="7 / 10">
    <div className="divide-y divide-border">
      {data.riskItems.map((r, i) => (
        <div key={i} className="flex items-center gap-2.5 py-2.5">
          <span className="text-[12px] flex-1">{r.name}</span>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className={`w-2 h-2 rounded-full ${j < r.filled ? dotColor[r.level] : 'bg-border'}`} />
            ))}
          </div>
          <span className={`font-mono text-[9px] px-1.5 py-0.5 font-medium rounded-sm ${tagStyle[r.level]}`}>{r.level}</span>
        </div>
      ))}
    </div>
  </SectionWrapper>
);

export default RiskMatrix;
