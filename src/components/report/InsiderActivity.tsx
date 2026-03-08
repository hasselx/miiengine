import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";
import { cn } from "@/lib/utils";

const InsiderActivity = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="13" title="Insider Activity Monitor">
    <div className="overflow-x-auto">
      <table className="w-full text-left font-mono text-[12px] sm:text-[13px]">
        <thead>
          <tr className="border-b border-border text-muted-foreground text-[10px] uppercase tracking-wider">
            <th className="py-2 pr-3">Role</th>
            <th className="py-2 pr-3">Action</th>
            <th className="py-2 pr-3">Shares</th>
            <th className="py-2">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.insiderTransactions.map((t, i) => (
            <tr key={i}>
              <td className="py-2.5 pr-3 text-foreground font-semibold">{t.role}</td>
              <td className="py-2.5 pr-3">
                <span className={cn(
                  "px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase",
                  t.action === "Buy" ? "bg-[hsl(var(--green-light)/0.15)] text-green-data" : "bg-[hsl(var(--destructive)/0.12)] text-destructive"
                )}>
                  {t.action}
                </span>
              </td>
              <td className="py-2.5 pr-3 text-foreground">{t.shares}</td>
              <td className="py-2.5 text-muted-foreground">{t.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="mt-4 grid grid-cols-3 gap-2">
      {[
        { label: "Total Buying", value: data.insiderSummary.totalBuying, color: "text-green-data" },
        { label: "Total Selling", value: data.insiderSummary.totalSelling, color: "text-destructive" },
        { label: "Net Signal", value: data.insiderSummary.netSignal, color: "text-gold" },
      ].map(s => (
        <div key={s.label} className="bg-accent-area rounded-md p-2.5 border border-border text-center">
          <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
          <p className={cn("text-[12px] font-mono font-bold", s.color)}>{s.value}</p>
        </div>
      ))}
    </div>
  </SectionWrapper>
);

export default InsiderActivity;
