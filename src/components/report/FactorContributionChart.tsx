import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const FactorContributionChart = ({ data }: { data: StockAnalysis }) => {
  const maxAbs = Math.max(...data.factorContributions.map(f => Math.abs(f.contribution)), 1);

  return (
    <SectionWrapper num="" title="Factor Contribution" score={`${data.totalScore} / 100`}>
      <div className="space-y-2">
        {data.factorContributions.map((f, i) => {
          const isPositive = f.contribution >= 0;
          const barWidth = Math.round((Math.abs(f.contribution) / maxAbs) * 100);
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="font-mono text-[10px] sm:text-[11px] text-muted-foreground w-28 sm:w-32 shrink-0 text-right truncate">{f.name}</span>
              <div className="flex-1 flex items-center h-5">
                {/* Center-aligned bar */}
                <div className="relative w-full h-full flex items-center">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />
                  {isPositive ? (
                    <div className="absolute left-1/2 h-3 bg-green-data/80 rounded-r-sm" style={{ width: `${barWidth / 2}%` }} />
                  ) : (
                    <div className="absolute h-3 bg-red-data/80 rounded-l-sm" style={{ width: `${barWidth / 2}%`, right: '50%' }} />
                  )}
                </div>
              </div>
              <span className={`font-mono text-[11px] font-semibold w-10 text-right shrink-0 ${isPositive ? 'text-green-data' : 'text-red-data'}`}>
                {isPositive ? '+' : ''}{f.contribution}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
        <span className="font-mono text-[9px] tracking-[2px] text-muted-foreground uppercase">Total Score</span>
        <span className="font-mono text-sm font-bold text-foreground">{data.totalScore} / 100</span>
      </div>
    </SectionWrapper>
  );
};

export default FactorContributionChart;
