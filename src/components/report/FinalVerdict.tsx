import { StockAnalysis } from "@/lib/stockData";

const FinalVerdict = ({ data }: { data: StockAnalysis }) => (
  <div className="bg-ink p-4 sm:p-6 text-cream rounded-md">
    <p className="font-mono text-[9px] tracking-[3px] text-gold uppercase mb-2">Final Institutional Verdict</p>
    <div className="gold-line mb-3.5" />
    <p className="font-display text-lg sm:text-[22px] font-bold mb-3">{data.finalVerdict}</p>
    <p className="text-[11px] sm:text-[12px] text-[hsl(0,0%,67%)] leading-[1.7] mb-2" dangerouslySetInnerHTML={{ __html: data.finalVerdictText }} />
    <p className="text-[11px] sm:text-[12px] text-[hsl(0,0%,67%)] leading-[1.7]" dangerouslySetInnerHTML={{ __html: data.finalAction }} />

    {/* Fair Value Range */}
    <div className="border-t border-[hsl(0,0%,20%)] pt-3 mt-4">
      <p className="font-mono text-[9px] tracking-[2px] text-[hsl(0,0%,33%)] uppercase mb-1.5">Fair Value Range</p>
      <p className="font-mono text-sm text-cream">{data.fairValueRange.low} — {data.fairValueRange.high}</p>
      <p className="font-mono text-[10px] text-gold mt-0.5">Midpoint: {data.fairValueRange.midpoint}</p>
    </div>

    {/* Accumulation Zone */}
    {data.accumulationZone.show && (
      <div className="mt-3">
        <p className="font-mono text-[9px] tracking-[2px] text-[hsl(0,0%,33%)] uppercase mb-1">Accumulation Zone</p>
        <p className="font-mono text-sm text-green-data">{data.accumulationZone.low} – {data.accumulationZone.high}</p>
      </div>
    )}

    {/* Optimal Entry Zone */}
    <div className="mt-3">
      <p className="font-mono text-[9px] tracking-[2px] text-[hsl(0,0%,33%)] uppercase mb-1">Optimal Entry Zone</p>
      <p className="font-mono text-sm text-gold">{data.optimalEntry.low} – {data.optimalEntry.high}</p>
      <p className="font-mono text-[10px] text-[hsl(0,0%,45%)] mt-0.5">{data.optimalEntry.basis}</p>
    </div>

    {/* Model Confidence */}
    <div className="mt-3">
      <p className="font-mono text-[9px] tracking-[2px] text-[hsl(0,0%,33%)] uppercase mb-1">Model Confidence</p>
      <div className="flex items-center gap-2">
        <p className="font-mono text-sm text-cream">{data.modelConfidence.score}%</p>
        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${data.modelConfidence.level === 'High' ? 'bg-green-data/20 text-green-data' : data.modelConfidence.level === 'Moderate' ? 'bg-gold/20 text-gold' : 'bg-red-data/20 text-red-data'}`}>
          {data.modelConfidence.level}
        </span>
      </div>
    </div>

    {/* Model Agreement */}
    <div className="mt-3">
      <p className="font-mono text-[9px] tracking-[2px] text-[hsl(0,0%,33%)] uppercase mb-1.5">Model Agreement: <span className={data.modelAgreement.level === 'High' ? 'text-green-data' : data.modelAgreement.level === 'Moderate' ? 'text-gold' : 'text-red-data'}>{data.modelAgreement.level}</span></p>
      <div className="space-y-1">
        {data.modelAgreement.models.map((m, i) => (
          <div key={i} className="flex justify-between font-mono text-[10px]">
            <span className="text-[hsl(0,0%,50%)]">{m.name}</span>
            <span className={m.signal === 'Bullish' ? 'text-green-data' : m.signal === 'Bearish' ? 'text-red-data' : 'text-gold'}>{m.signal}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Key Drivers */}
    <div className="mt-3">
      <p className="font-mono text-[9px] tracking-[2px] text-[hsl(0,0%,33%)] uppercase mb-1.5">Key Drivers</p>
      <ul className="space-y-0.5">
        {data.keyDrivers.map((d, i) => (
          <li key={i} className="text-[11px] text-[hsl(0,0%,60%)] flex items-start gap-1.5">
            <span className="text-gold mt-0.5">•</span> {d}
          </li>
        ))}
      </ul>
    </div>

    {/* Footer metrics */}
    <div className="flex flex-wrap justify-between gap-3 font-mono text-[11px] border-t border-[hsl(0,0%,20%)] pt-3 mt-4">
      {data.finalFooter.map((f, i) => (
        <div key={i}>
          <p className="text-[hsl(0,0%,33%)] text-[9px] tracking-wide">{f.label}</p>
          <p className={i === 0 ? 'text-gold' : 'text-cream'}>{f.value}</p>
        </div>
      ))}
    </div>
  </div>
);

export default FinalVerdict;
