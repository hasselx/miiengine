import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const PriceProjectionSection = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="09" title="12-Month Price Projection">
    {/* Scenarios — stack on mobile */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border mb-4 sm:mb-5 rounded-sm overflow-hidden">
      {data.priceScenarios.map((s) => {
        const bg = s.type === 'bull' ? 'bg-bull-light' : s.type === 'bear' ? 'bg-bear-light' : 'bg-accent-area';
        const labelColor = s.type === 'bull' ? 'text-green-dark' : s.type === 'bear' ? 'text-red-dark' : 'text-gold';
        const priceColor = s.type === 'bull' ? 'text-green-dark' : s.type === 'bear' ? 'text-red-dark' : 'text-ink';
        return (
          <div key={s.type} className={`${bg} p-4 sm:p-5 text-center`}>
            <p className={`font-mono text-[9px] tracking-[3px] uppercase mb-2 ${labelColor}`}>{s.label}</p>
            <p className={`font-display text-2xl sm:text-[32px] font-bold mb-1 ${priceColor}`}>{s.price}</p>
            <p className="font-mono text-[11px] text-muted-foreground mb-1">{s.probability}</p>
            <p className={`text-[11px] font-semibold ${s.type === 'bull' ? 'text-green-dark' : s.type === 'bear' ? 'text-red-dark' : 'text-gold'}`}>{s.change}</p>
            <p className="text-[11px] text-muted-foreground mt-1.5">{s.description}</p>
            {/* Scenario Assumptions */}
            <div className="mt-3 pt-2.5 border-t border-border/50 space-y-1">
              <p className="font-mono text-[8px] tracking-[2px] uppercase text-muted-foreground/70 mb-1">Assumptions</p>
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-muted-foreground">Rev Growth</span>
                <span className={`${s.type === 'bull' ? 'text-green-dark' : s.type === 'bear' ? 'text-red-dark' : 'text-ink'}`}>{s.assumptions.revenueGrowth}</span>
              </div>
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-muted-foreground">Op. Margin</span>
                <span className={`${s.type === 'bull' ? 'text-green-dark' : s.type === 'bear' ? 'text-red-dark' : 'text-ink'}`}>{s.assumptions.operatingMargin}</span>
              </div>
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-muted-foreground">P/E Multiple</span>
                <span className={`${s.type === 'bull' ? 'text-green-dark' : s.type === 'bear' ? 'text-red-dark' : 'text-ink'}`}>{s.assumptions.peMultiple}</span>
              </div>
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-muted-foreground">Proj. EPS</span>
                <span className={`font-semibold ${s.type === 'bull' ? 'text-green-dark' : s.type === 'bear' ? 'text-red-dark' : 'text-ink'}`}>{s.assumptions.projectedEps}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>

    {/* Target Price Box */}
    <div className="bg-ink text-cream p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-sm">
      <div>
        <p className="font-mono text-[10px] tracking-[3px] uppercase text-gold mb-1">Target Price (Fair Value Midpoint)</p>
        <p className="font-display text-3xl sm:text-[40px] font-bold">{data.fairValueRange.midpoint}</p>
        <p className="font-mono text-[11px] text-cream/50 mt-1">Prob-Weighted: {data.expectedPrice} · {data.expectedFormula}</p>
      </div>
      <div className="sm:text-right">
        <p className={`font-mono text-xl sm:text-[28px] font-medium ${data.expectedUpside.startsWith('-') ? 'text-red-data' : 'text-gold'}`}>{data.expectedUpside}</p>
        <p className="font-mono text-[9px] tracking-[2px] text-cream/50">{data.expectedUpsideNote}</p>
      </div>
    </div>

    {/* === Valuation Block === */}
    <div className="mt-4 border border-border rounded-sm overflow-hidden">
      <div className="bg-accent-area px-3 sm:px-4 py-2 border-b border-border">
        <p className="font-mono text-[9px] tracking-[3px] text-muted-foreground uppercase">Valuation</p>
      </div>
      <div className="p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-[9px] tracking-[2px] text-muted-foreground uppercase mb-1">Fair Value Range</p>
          <p className="font-mono text-sm font-semibold text-ink">{data.fairValueRange.low} — {data.fairValueRange.high}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[9px] tracking-[2px] text-muted-foreground uppercase mb-1">Target Price</p>
          <p className="font-mono text-sm font-semibold text-gold">{data.fairValueRange.midpoint}</p>
        </div>
      </div>
    </div>

    {/* === Trading Guidance Block === */}
    <div className="mt-3 border border-border rounded-sm overflow-hidden">
      <div className="bg-accent-area px-3 sm:px-4 py-2 border-b border-border">
        <p className="font-mono text-[9px] tracking-[3px] text-muted-foreground uppercase">Trading Guidance</p>
      </div>
      <div className="p-3 sm:p-4 space-y-2.5">
        {data.accumulationZone.show && (
          <div className="p-2.5 bg-bull-light border-l-[3px] border-green-dark rounded-sm">
            <p className="font-mono text-[9px] tracking-[2px] text-green-dark uppercase mb-0.5">Accumulation Zone</p>
            <p className="font-mono text-sm font-semibold text-green-dark">{data.accumulationZone.low} – {data.accumulationZone.high}</p>
          </div>
        )}
        <div className="p-2.5 bg-accent-area border-l-[3px] border-gold rounded-sm">
          <p className="font-mono text-[9px] tracking-[2px] text-gold uppercase mb-0.5">Optimal Entry Zone</p>
          <p className="font-mono text-sm font-semibold text-ink">{data.optimalEntry.low} – {data.optimalEntry.high}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{data.optimalEntry.basis}</p>
        </div>
      </div>
    </div>

    <div className="mt-3.5 text-[12px] text-muted-foreground p-3 border-l-[3px] border-ink bg-accent-area leading-[1.7] rounded-sm">
      <strong>Conservative Note:</strong> {data.priceNote}
    </div>
  </SectionWrapper>
);

export default PriceProjectionSection;
