import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const colorMap = { green: "text-green-data", red: "text-red-data", default: "text-ink" };

const TradingPlanSection = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="12" title="Trading Plan">
    <div className="grid grid-cols-2 gap-px bg-border -mx-3 sm:-mx-5 -mt-3 sm:-mt-5 mb-0 rounded-sm overflow-hidden">
      {data.tradingCells.map((c, i) => (
        <div key={i} className="bg-card p-3 sm:p-3.5">
          <p className="font-mono text-[9px] sm:text-[10px] tracking-[2px] uppercase text-muted-foreground mb-1.5">{c.label}</p>
          <p className={`font-mono text-sm sm:text-base font-medium ${colorMap[c.color || 'default']}`}>{c.value}</p>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">{c.note}</p>
        </div>
      ))}
    </div>
    <div className="bg-accent-area -mx-3 sm:-mx-5 -mb-3 sm:-mb-5 p-3 sm:p-3.5 mt-0">
      <p className="font-mono text-[10px] tracking-[2px] text-muted-foreground uppercase mb-1.5">Risk / Reward</p>
      <p className="font-mono text-lg sm:text-xl font-semibold text-ink">{data.riskReward.ratio}</p>
      <p className="text-[11px] sm:text-[12px] text-muted-foreground mt-1">{data.riskReward.detail}</p>
    </div>
  </SectionWrapper>
);

export default TradingPlanSection;
