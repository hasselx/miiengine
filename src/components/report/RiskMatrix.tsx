import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const tagStyle = { LOW: "bg-[hsl(120,40%,92%)] text-green-dark", MEDIUM: "bg-[hsl(45,100%,93%)] text-[hsl(45,50%,33%)]", HIGH: "bg-[hsl(0,60%,95%)] text-red-dark" };
const dotColor = { LOW: "bg-green-data", MEDIUM: "bg-gold", HIGH: "bg-red-data" };

const RiskMatrix = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="24" title="Risk Matrix" score="7 / 10">
    <div className="divide-y divide-border">
      {data.riskItems.map((r, i) => (
        <div key={i} className="flex items-center gap-2.5 py-3">
          <span className="text-[12px] sm:text-[13px] flex-1 min-w-0">{r.name}</span>
          <div className="flex gap-1 shrink-0">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className={`w-2 h-2 rounded-full ${j < r.filled ? dotColor[r.level] : 'bg-border'}`} />
            ))}
          </div>
          <span className={`font-mono text-[9px] px-1.5 py-0.5 font-medium rounded-sm shrink-0 ${tagStyle[r.level]}`}>{r.level}</span>
        </div>
      ))}
    </div>
  </SectionWrapper>
);

export default RiskMatrix;
