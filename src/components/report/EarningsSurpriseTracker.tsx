import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";

const EarningsSurpriseTracker = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="11" title="Earnings Surprise Tracker">
    <div className="overflow-x-auto">
      <table className="w-full text-left font-mono text-[12px] sm:text-[13px]">
        <thead>
          <tr className="border-b border-border text-muted-foreground text-[10px] uppercase tracking-wider">
            <th className="py-2 pr-3">Quarter</th>
            <th className="py-2 pr-3">Estimate</th>
            <th className="py-2 pr-3">Actual</th>
            <th className="py-2">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.earningsSurprises.map((e, i) => (
            <tr key={i}>
              <td className="py-2.5 pr-3 font-semibold text-foreground">{e.quarter}</td>
              <td className="py-2.5 pr-3 text-muted-foreground">{e.estimate}</td>
              <td className="py-2.5 pr-3 text-foreground font-semibold">{e.actual}</td>
              <td className="py-2.5">
                <span className={cn(
                  "px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase",
                  e.result === "Beat" ? "bg-[hsl(var(--green-light)/0.15)] text-green-data" : "bg-[hsl(var(--destructive)/0.12)] text-destructive"
                )}>
                  {e.result}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="mt-4 flex flex-col sm:flex-row gap-3">
      <div className="flex items-center gap-2 bg-accent-area rounded-md px-3 py-2 flex-1 border border-border">
        <CalendarDays className="h-3.5 w-3.5 text-gold shrink-0" />
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Next Earnings</p>
          <p className="text-[12px] font-mono font-semibold text-foreground">{data.nextEarningsDate}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-accent-area rounded-md px-3 py-2 flex-1 border border-border">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Consensus EPS Est.</p>
          <p className="text-[12px] font-mono font-semibold text-foreground">{data.nextEarningsEstimate}</p>
        </div>
      </div>
    </div>
  </SectionWrapper>
);

export default EarningsSurpriseTracker;
