import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const PriceProjectionSection = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="08" title="12-Month Price Projection">
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
          </div>
        );
      })}
    </div>

    {/* Expected Price Box */}
    <div className="bg-ink text-cream p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-sm">
      <div>
        <p className="font-mono text-[10px] tracking-[3px] uppercase text-gold mb-1">Expected Price (Probability-Weighted)</p>
        <p className="font-display text-3xl sm:text-[40px] font-bold">{data.expectedPrice}</p>
        <p className="font-mono text-[11px] text-cream/50 mt-1 break-all sm:break-normal">{data.expectedFormula}</p>
      </div>
      <div className="sm:text-right">
        <p className={`font-mono text-xl sm:text-[28px] font-medium ${data.expectedUpside.startsWith('-') ? 'text-red-data' : 'text-gold'}`}>{data.expectedUpside}</p>
        <p className="font-mono text-[9px] tracking-[2px] text-cream/50">{data.expectedUpsideNote}</p>
      </div>
    </div>

    {/* Fair Value Range */}
    <div className="mt-3 p-3 bg-accent-area border border-border rounded-sm flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="font-mono text-[9px] tracking-[2px] text-muted-foreground uppercase mb-1">Fair Value Range</p>
        <p className="font-mono text-sm font-semibold text-ink">{data.fairValueRange.low} — {data.fairValueRange.high}</p>
      </div>
      <div className="text-right">
        <p className="font-mono text-[9px] tracking-[2px] text-muted-foreground uppercase mb-1">Midpoint Target</p>
        <p className="font-mono text-sm font-semibold text-gold">{data.fairValueRange.midpoint}</p>
      </div>
    </div>

    {/* Accumulation Zone */}
    {data.accumulationZone.show && (
      <div className="mt-2 p-2.5 bg-bull-light border-l-[3px] border-green-dark rounded-sm">
        <p className="font-mono text-[9px] tracking-[2px] text-green-dark uppercase mb-0.5">Accumulation Zone</p>
        <p className="font-mono text-sm font-semibold text-green-dark">{data.accumulationZone.low} – {data.accumulationZone.high}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">Better risk-reward entry range below current price</p>
      </div>
    )}

    <div className="mt-3.5 text-[12px] text-muted-foreground p-3 border-l-[3px] border-ink bg-accent-area leading-[1.7] rounded-sm">
      <strong>Conservative Note:</strong> {data.priceNote}
    </div>
  </SectionWrapper>
);

export default PriceProjectionSection;
