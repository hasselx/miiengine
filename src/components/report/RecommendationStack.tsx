import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const signalColor = (signal: string) => {
  if (signal === 'Bullish') return 'text-green-data bg-green-data/10';
  if (signal === 'Bearish') return 'text-red-data bg-red-data/10';
  if (signal === 'Adjustment') return 'text-muted-foreground bg-muted/50';
  return 'text-gold bg-gold/10';
};

const signalIcon = (signal: string) => {
  if (signal === 'Bullish') return '▲';
  if (signal === 'Bearish') return '▼';
  if (signal === 'Adjustment') return '◆';
  return '●';
};

const RecommendationStack = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="" title="Decision Stack">
    <div className="space-y-1.5">
      {data.decisionStack.map((item, i) => (
        <div key={i} className="flex items-center justify-between py-2 px-3 border border-border rounded-sm bg-card">
          <div className="flex items-center gap-2.5">
            <span className={`font-mono text-[10px] w-5 text-center ${signalColor(item.signal)} rounded px-0.5`}>
              {signalIcon(item.signal)}
            </span>
            <span className="font-mono text-[11px] sm:text-[12px] text-foreground font-medium">{item.factor}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground hidden sm:inline">{item.detail}</span>
            <span className={`font-mono text-[10px] px-2 py-0.5 rounded-sm font-semibold ${signalColor(item.signal)}`}>
              {item.signal}
            </span>
          </div>
        </div>
      ))}
    </div>

    {/* Final decision */}
    <div className="mt-3 bg-ink text-cream p-3 sm:p-4 rounded-sm flex items-center justify-between">
      <span className="font-mono text-[10px] tracking-[3px] uppercase text-gold">Final Decision</span>
      <span className="font-display text-lg sm:text-xl font-bold">{data.verdict}</span>
    </div>
  </SectionWrapper>
);

export default RecommendationStack;
