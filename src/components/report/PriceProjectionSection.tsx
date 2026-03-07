import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const PriceProjectionSection = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="08" title="12-Month Price Projection">
    {/* Scenarios */}
    <div className="grid grid-cols-3 gap-px bg-border mb-5">
      {data.priceScenarios.map((s) => {
        const bg = s.type === 'bull' ? 'bg-bull-light' : s.type === 'bear' ? 'bg-bear-light' : 'bg-accent-area';
        const labelColor = s.type === 'bull' ? 'text-green-dark' : s.type === 'bear' ? 'text-red-dark' : 'text-gold';
        const priceColor = s.type === 'bull' ? 'text-green-dark' : s.type === 'bear' ? 'text-red-dark' : 'text-ink';
        return (
          <div key={s.type} className={`${bg} p-5 text-center`}>
            <p className={`font-mono text-[9px] tracking-[3px] uppercase mb-2 ${labelColor}`}>{s.label}</p>
            <p className={`font-display text-[32px] font-bold mb-1 ${priceColor}`}>{s.price}</p>
            <p className="font-mono text-[11px] text-muted-foreground mb-1">{s.probability}</p>
            <p className={`text-[11px] font-semibold ${s.type === 'bull' ? 'text-green-dark' : s.type === 'bear' ? 'text-red-dark' : 'text-gold'}`}>{s.change}</p>
            <p className="text-[11px] text-muted-foreground mt-1.5">{s.description}</p>
          </div>
        );
      })}
    </div>

    {/* Expected Price Box */}
    <div className="bg-ink text-cream p-5 flex items-center justify-between">
      <div>
        <p className="font-mono text-[10px] tracking-[3px] uppercase text-gold mb-1">Expected Price (Probability-Weighted)</p>
        <p className="font-display text-[40px] font-bold">{data.expectedPrice}</p>
        <p className="font-mono text-[11px] text-cream/50 mt-1">{data.expectedFormula}</p>
      </div>
      <div className="text-right">
        <p className="font-mono text-[28px] font-medium text-gold">{data.expectedUpside}</p>
        <p className="font-mono text-[9px] tracking-[2px] text-cream/50">{data.expectedUpsideNote}</p>
      </div>
    </div>

    <div className="mt-3.5 text-[12px] text-[#555] p-3 border-l-[3px] border-ink bg-accent-area leading-[1.7]">
      <strong>Conservative Note:</strong> {data.priceNote}
    </div>
  </SectionWrapper>
);

export default PriceProjectionSection;
