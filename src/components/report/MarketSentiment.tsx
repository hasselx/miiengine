import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const sentimentColors = {
  Bullish: { bg: "bg-[hsl(var(--green-light)/0.12)]", text: "text-green-data", ring: "stroke-[hsl(var(--green-light))]" },
  Neutral: { bg: "bg-[hsl(var(--gold)/0.12)]", text: "text-gold", ring: "stroke-gold" },
  Bearish: { bg: "bg-[hsl(var(--destructive)/0.12)]", text: "text-destructive", ring: "stroke-destructive" },
};

const factorTooltips: Record<string, string> = {
  "Analyst Consensus": "Aggregated buy/hold/sell ratings from covering analysts",
  "Short Interest": "Percentage of float sold short — low is bullish",
  "Options P/C Ratio": "Put/Call ratio below 0.7 is bullish, above 1.0 is bearish",
  "News Sentiment": "NLP-derived sentiment from recent news articles",
};

const MarketSentiment = ({ data }: { data: StockAnalysis }) => {
  const sc = sentimentColors[data.sentimentLabel];
  const score = Math.min(100, Math.max(0, data.sentimentScore));
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <SectionWrapper num="15" title="Market Sentiment">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Gauge */}
        <div className="relative w-28 h-28 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none" className={sc.ring} strokeWidth="8"
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-xl font-bold text-foreground">{score}</span>
            <span className={cn("text-[10px] font-mono font-bold uppercase", sc.text)}>{data.sentimentLabel}</span>
          </div>
        </div>
        {/* Factors */}
        <div className="flex-1 w-full space-y-2">
          <TooltipProvider>
            {data.sentimentFactors.map((f, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-between bg-accent-area rounded-md px-3 py-2 border border-border cursor-help">
                    <span className="text-[11px] text-muted-foreground">{f.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] font-semibold text-foreground">{f.value}</span>
                      <span className={cn("text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded",
                        f.signal === "bullish" ? "bg-[hsl(var(--green-light)/0.15)] text-green-data" :
                        f.signal === "bearish" ? "bg-[hsl(var(--destructive)/0.12)] text-destructive" :
                        "bg-muted text-muted-foreground"
                      )}>{f.signal}</span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px] text-xs">
                  {factorTooltips[f.name] || "Sentiment indicator"}
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default MarketSentiment;
