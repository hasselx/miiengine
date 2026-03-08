import { StockAnalysis } from "@/lib/stockData";

const ScoreBanner = ({ data }: { data: StockAnalysis }) => (
  <div className="bg-gold px-4 sm:px-8 lg:px-[60px] py-4 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-10">
    {/* Score */}
    <div className="flex items-center gap-4 sm:gap-0 sm:flex-col sm:items-start">
      <div>
        <p className="font-mono text-[10px] tracking-[3px] uppercase text-ink/60 mb-1">Final Investment Score</p>
        <p className="font-display text-[48px] sm:text-[72px] font-black text-ink leading-none">{data.totalScore}</p>
      </div>
    </div>

    {/* Divider — hidden on mobile */}
    <div className="hidden sm:block w-px h-20 bg-ink/20" />

    {/* Verdict + progress bar */}
    <div className="flex-1 w-full">
      <p className="font-mono text-[10px] tracking-[3px] uppercase text-ink/60 mb-1">Verdict</p>
      <p className="font-display text-xl sm:text-[28px] font-bold text-ink">{data.verdict}</p>
      <div className="mt-2">
        <div className="h-2 bg-ink/15 rounded overflow-hidden">
          <div className="h-full bg-ink rounded" style={{ width: `${data.totalScore}%`, animation: 'fillBar 1.5s ease-out forwards' }} />
        </div>
        <div className="flex justify-between font-mono text-[8px] sm:text-[9px] text-ink/50 mt-1">
          <span>0 — Sell</span>
          <span className="hidden sm:inline">45 — Hold</span>
          <span>60 — Accumulate</span>
          <span>75 — Buy</span>
          <span>90 — Strong Buy</span>
        </div>
      </div>
    </div>

    {/* Score range */}
    <div className="sm:text-right">
      <p className="font-mono text-[10px] tracking-[3px] uppercase text-ink/60 mb-1">Score Range</p>
      <p className="font-mono text-[13px] text-ink">{data.scoreRange}</p>
      <p className="font-mono text-[11px] text-ink/55 mt-1">{data.verdictNote}</p>
    </div>
  </div>
);

export default ScoreBanner;
