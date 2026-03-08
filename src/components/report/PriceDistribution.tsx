import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const PriceDistribution = ({ data }: { data: StockAnalysis }) => {
  const { bear, base, bull, expectedPrice } = data.priceDistribution;

  const scenarios = [
    { ...bear, label: 'Bear Case', type: 'bear' as const },
    { ...base, label: 'Base Case', type: 'base' as const },
    { ...bull, label: 'Bull Case', type: 'bull' as const },
  ];

  const colorMap = {
    bear: { bg: 'bg-bear-light', text: 'text-red-dark', bar: 'bg-red-data' },
    base: { bg: 'bg-accent-area', text: 'text-foreground', bar: 'bg-gold' },
    bull: { bg: 'bg-bull-light', text: 'text-green-dark', bar: 'bg-green-data' },
  };

  return (
    <SectionWrapper num="" title="12-Month Price Distribution">
      {/* Probability bar */}
      <div className="flex h-6 rounded-sm overflow-hidden mb-4">
        <div className="bg-red-data/70 flex items-center justify-center" style={{ width: `${bear.probability}%` }}>
          <span className="font-mono text-[9px] text-white font-semibold">{bear.probability}%</span>
        </div>
        <div className="bg-gold/70 flex items-center justify-center" style={{ width: `${base.probability}%` }}>
          <span className="font-mono text-[9px] text-ink font-semibold">{base.probability}%</span>
        </div>
        <div className="bg-green-data/70 flex items-center justify-center" style={{ width: `${bull.probability}%` }}>
          <span className="font-mono text-[9px] text-white font-semibold">{bull.probability}%</span>
        </div>
      </div>

      {/* Scenario cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {scenarios.map((s) => {
          const c = colorMap[s.type];
          return (
            <div key={s.type} className={`${c.bg} p-3 sm:p-4 rounded-sm`}>
              <p className={`font-mono text-[9px] tracking-[3px] uppercase mb-1.5 ${c.text}`}>{s.label}</p>
              <p className={`font-display text-xl sm:text-2xl font-bold mb-1 ${c.text}`}>{s.price}</p>
              <p className="font-mono text-[10px] text-muted-foreground mb-2">Probability: {s.probability}%</p>
              <div className="space-y-0.5">
                <p className="font-mono text-[8px] tracking-[2px] uppercase text-muted-foreground/70">Drivers</p>
                {s.drivers.map((d, i) => (
                  <p key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
                    <span className={`mt-0.5 ${c.text}`}>•</span> {d}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expected price */}
      <div className="bg-ink text-cream p-3 sm:p-4 rounded-sm flex items-center justify-between">
        <div>
          <p className="font-mono text-[9px] tracking-[3px] uppercase text-gold mb-0.5">Probability-Weighted Expected Price</p>
          <p className="font-mono text-[10px] text-cream/50">
            ({bear.price}×{bear.probability}%) + ({base.price}×{base.probability}%) + ({bull.price}×{bull.probability}%)
          </p>
        </div>
        <p className="font-display text-2xl sm:text-3xl font-bold text-gold">{expectedPrice}</p>
      </div>
    </SectionWrapper>
  );
};

export default PriceDistribution;
