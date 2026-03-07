import { StockAnalysis } from "@/lib/stockData";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface ComparisonBannerProps {
  savedData: StockAnalysis;
  currentData: StockAnalysis;
  savedDate: string;
}

const ComparisonBanner = ({ savedData, currentData, savedDate }: ComparisonBannerProps) => {
  const scoreDiff = (currentData.totalScore || 0) - (savedData.totalScore || 0);

  const savedPrice = savedData.headerMetrics?.find(m => m.label?.toLowerCase().includes('price'))?.value;
  const currentPrice = currentData.headerMetrics?.find(m => m.label?.toLowerCase().includes('price'))?.value;

  const parsePrice = (v?: string) => {
    if (!v) return null;
    return parseFloat(v.replace(/[^0-9.-]/g, ''));
  };
  const sp = parsePrice(savedPrice);
  const cp = parsePrice(currentPrice);
  const priceDiff = sp && cp ? cp - sp : null;
  const pricePct = sp && cp && sp > 0 ? ((priceDiff! / sp) * 100) : null;

  const DiffIcon = ({ val }: { val: number }) =>
    val > 0 ? <ArrowUp className="h-3 w-3" /> : val < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />;

  const diffColor = (val: number) => val > 0 ? 'text-green-data' : val < 0 ? 'text-red-data' : 'text-muted-foreground';

  return (
    <div className="bg-sidebar border-b border-sidebar-border px-3 sm:px-6 lg:px-8 py-4">
      <div className="max-w-[1400px] mx-auto">
        <p className="font-mono text-[9px] tracking-[3px] text-sidebar-primary uppercase mb-3">
          Comparison vs Saved Report · {new Date(savedDate).toLocaleDateString()}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <p className="font-mono text-[9px] tracking-[2px] text-sidebar-foreground/40 uppercase mb-1">MII Score</p>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="font-mono text-sm text-sidebar-foreground/50">{savedData.totalScore}</span>
              <span className="text-sidebar-foreground/30">→</span>
              <span className="font-mono text-sm font-semibold text-sidebar-foreground">{currentData.totalScore}</span>
              <span className={`flex items-center gap-0.5 font-mono text-[11px] font-semibold ${diffColor(scoreDiff)}`}>
                <DiffIcon val={scoreDiff} />
                {Math.abs(scoreDiff)}
              </span>
            </div>
          </div>

          {priceDiff !== null && (
            <div>
              <p className="font-mono text-[9px] tracking-[2px] text-sidebar-foreground/40 uppercase mb-1">Price</p>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="font-mono text-sm text-sidebar-foreground/50">{savedPrice}</span>
                <span className="text-sidebar-foreground/30">→</span>
                <span className="font-mono text-sm font-semibold text-sidebar-foreground">{currentPrice}</span>
                <span className={`flex items-center gap-0.5 font-mono text-[11px] font-semibold ${diffColor(priceDiff)}`}>
                  <DiffIcon val={priceDiff} />
                  {pricePct !== null ? `${Math.abs(pricePct).toFixed(1)}%` : ''}
                </span>
              </div>
            </div>
          )}

          <div>
            <p className="font-mono text-[9px] tracking-[2px] text-sidebar-foreground/40 uppercase mb-1">Verdict</p>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="font-mono text-[10px] text-sidebar-foreground/50 uppercase">{savedData.verdict}</span>
              <span className="text-sidebar-foreground/30">→</span>
              <span className="font-mono text-[10px] font-semibold text-sidebar-primary uppercase">{currentData.verdict}</span>
            </div>
          </div>

          <div>
            <p className="font-mono text-[9px] tracking-[2px] text-sidebar-foreground/40 uppercase mb-1">Rating</p>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="font-mono text-[10px] text-sidebar-foreground/50 uppercase">{savedData.verdictBadge}</span>
              <span className="text-sidebar-foreground/30">→</span>
              <span className="font-mono text-[10px] font-semibold text-sidebar-primary uppercase">{currentData.verdictBadge}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonBanner;
