import { StockAnalysis } from "@/lib/stockData";

const ScoreBanner = ({ data }: { data: StockAnalysis }) => (
  <div className="bg-gold px-[60px] py-6 flex items-center gap-10">
    <div>
      <p className="font-mono text-[10px] tracking-[3px] uppercase text-ink/60 mb-1">Final Investment Score</p>
      <p className="font-display text-[72px] font-black text-ink leading-none">{data.totalScore}</p>
    </div>
    <div className="w-px h-20 bg-ink/20" />
    <div className="flex-1">
      <p className="font-mono text-[10px] tracking-[3px] uppercase text-ink/60 mb-1">Verdict</p>
      <p className="font-display text-[28px] font-bold text-ink">{data.verdict}</p>
      <div className="mt-2">
        <div className="h-2 bg-ink/15 rounded overflow-hidden">
          <div className="h-full bg-ink rounded" style={{ width: `${data.totalScore}%`, animation: 'fillBar 1.5s ease-out forwards' }} />
        </div>
        <div className="flex justify-between font-mono text-[9px] text-ink/50 mt-1">
          <span>0 — Avoid</span>
          <span>50 — Weak Hold</span>
          <span>70 — Buy</span>
          <span>90 — Exceptional</span>
        </div>
      </div>
    </div>
    <div className="text-right">
      <p className="font-mono text-[10px] tracking-[3px] uppercase text-ink/60 mb-1">Score Range</p>
      <p className="font-mono text-[13px] text-ink">{data.scoreRange}</p>
      <p className="font-mono text-[11px] text-ink/55 mt-1">{data.verdictNote}</p>
    </div>
  </div>
);

export default ScoreBanner;
