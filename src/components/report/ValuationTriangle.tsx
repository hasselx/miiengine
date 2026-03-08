import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const signalColor = {
  Bullish: "text-green-data",
  Bearish: "text-red-data",
  Neutral: "text-gold",
};

const signalBg = {
  Bullish: "bg-green-data/10",
  Bearish: "bg-red-data/10",
  Neutral: "bg-gold/10",
};

const ValuationTriangle = ({ data }: { data: StockAnalysis }) => {
  const { dcf, relative, momentum, composite, compositeReturn, compositeLabel } = data.valuationTriangle;
  const models = [
    { label: "DCF Valuation", icon: "📊", ...dcf },
    { label: "Relative Valuation", icon: "📈", ...relative },
    { label: "Momentum Valuation", icon: "⚡", ...momentum },
  ];

  return (
    <SectionWrapper num="08" title="Valuation Triangle">
      <p className="text-[12px] text-muted-foreground mb-4 leading-relaxed">
        Three independent valuation models converge to form a composite fair value target.
      </p>

      {/* Three model cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border rounded-sm overflow-hidden mb-4">
        {models.map((m) => (
          <div key={m.label} className={`${signalBg[m.signal]} p-4 text-center`}>
            <p className="text-lg mb-1">{m.icon}</p>
            <p className="font-mono text-[9px] tracking-[2px] uppercase text-muted-foreground mb-1">{m.label}</p>
            <p className="font-mono text-[8px] tracking-[1px] text-muted-foreground/60 mb-2">Weight: {m.weight}</p>
            <p className={`font-display text-xl sm:text-2xl font-bold mb-1 ${signalColor[m.signal]}`}>{m.price}</p>
            <span className={`inline-block font-mono text-[10px] px-2 py-0.5 rounded ${signalBg[m.signal]} ${signalColor[m.signal]}`}>
              {m.signal}
            </span>
            <p className="text-[10px] text-muted-foreground mt-2 leading-snug">{m.method}</p>
          </div>
        ))}
      </div>

      {/* Composite target */}
      <div className="bg-ink text-cream p-4 sm:p-5 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[3px] uppercase text-gold mb-1">Composite Fair Value</p>
          <p className="font-display text-3xl sm:text-[36px] font-bold">{composite}</p>
          <p className="font-mono text-[10px] text-cream/50 mt-1">DCF (40%) + Relative (35%) + Momentum (25%)</p>
        </div>
        <div className="sm:text-right">
          <p className={`font-mono text-lg sm:text-xl font-medium ${compositeReturn.startsWith('-') ? 'text-red-data' : 'text-gold'}`}>
            {compositeReturn}
          </p>
          <p className="font-mono text-[9px] tracking-[2px] text-cream/50">{compositeLabel}</p>
        </div>
      </div>

      <div className="mt-3 text-[12px] text-muted-foreground p-3 border-l-[3px] border-gold bg-accent-area leading-[1.7] rounded-sm">
        <strong>Methodology:</strong> The Valuation Triangle averages three independent approaches — discounted cash flow (earnings-based), relative valuation (sector P/E comparison), and momentum valuation (price trend extrapolation) — to reduce single-model bias and improve target reliability.
      </div>
    </SectionWrapper>
  );
};

export default ValuationTriangle;
