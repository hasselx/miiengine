import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";
import { cn } from "@/lib/utils";

const barColor = (v: number) =>
  v >= 0.7 ? "bg-green-data" : v >= 0.3 ? "bg-gold" : v >= 0 ? "bg-muted-foreground" : "bg-destructive";

const CorrelationAnalyzer = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="16" title="Correlation Analyzer">
    <div className="space-y-3">
      {data.correlations.map((c, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-[12px] text-foreground w-28 sm:w-32 truncate shrink-0">{c.asset}</span>
          <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden relative">
            {/* center line at 0 */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />
            {c.correlation >= 0 ? (
              <div className={cn("h-full rounded-full absolute left-1/2", barColor(c.correlation))}
                style={{ width: `${c.correlation * 50}%` }} />
            ) : (
              <div className={cn("h-full rounded-full absolute right-1/2", barColor(c.correlation))}
                style={{ width: `${Math.abs(c.correlation) * 50}%` }} />
            )}
          </div>
          <span className={cn("font-mono text-[13px] font-bold w-12 text-right",
            c.correlation >= 0.5 ? "text-green-data" : c.correlation <= -0.3 ? "text-destructive" : "text-foreground"
          )}>
            {c.correlation >= 0 ? "+" : ""}{c.correlation.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
    <p className="mt-3 text-[10px] text-muted-foreground font-mono">
      Positive values = moves together · Negative values = moves inversely · Based on 1-year daily returns
    </p>
  </SectionWrapper>
);

export default CorrelationAnalyzer;
