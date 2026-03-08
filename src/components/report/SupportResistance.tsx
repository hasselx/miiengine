import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";
import { ArrowDown, ArrowUp } from "lucide-react";

const SupportResistance = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="13" title="Support / Resistance Levels">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <ArrowDown className="h-3.5 w-3.5 text-green-data" />
          <h4 className="font-mono text-[11px] uppercase tracking-wider text-green-data font-semibold">Support</h4>
        </div>
        <div className="space-y-2">
          {data.supportLevels.map((level, i) => (
            <div key={i} className="flex items-center gap-2 bg-[hsl(var(--green-light)/0.08)] border border-[hsl(var(--green-light)/0.15)] rounded-md px-3 py-2">
              <span className="font-mono text-[13px] font-bold text-green-data">{level}</span>
              <span className="text-[9px] text-muted-foreground font-mono">S{i + 1}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <ArrowUp className="h-3.5 w-3.5 text-destructive" />
          <h4 className="font-mono text-[11px] uppercase tracking-wider text-destructive font-semibold">Resistance</h4>
        </div>
        <div className="space-y-2">
          {data.resistanceLevels.map((level, i) => (
            <div key={i} className="flex items-center gap-2 bg-[hsl(var(--destructive)/0.08)] border border-[hsl(var(--destructive)/0.15)] rounded-md px-3 py-2">
              <span className="font-mono text-[13px] font-bold text-destructive">{level}</span>
              <span className="text-[9px] text-muted-foreground font-mono">R{i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </SectionWrapper>
);

export default SupportResistance;
