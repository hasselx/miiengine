import { StockAnalysis } from "@/lib/stockData";

const ConfidenceMeter = ({ data }: { data: StockAnalysis }) => {
  const { score, level } = data.modelConfidence;
  const segments = [
    { label: 'Low', range: [0, 55], color: 'bg-red-data' },
    { label: 'Moderate', range: [55, 70], color: 'bg-gold' },
    { label: 'High', range: [70, 100], color: 'bg-green-data' },
  ];

  return (
    <div className="border border-border rounded-sm p-3 sm:p-4 bg-card">
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono text-[9px] tracking-[3px] text-muted-foreground uppercase">Model Confidence</p>
        <p className="font-mono text-sm font-semibold text-foreground">{score}%</p>
      </div>
      {/* Gauge bar */}
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${level === 'High' ? 'bg-green-data' : level === 'Moderate' ? 'bg-gold' : 'bg-red-data'}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {/* Labels */}
      <div className="flex justify-between mt-1.5">
        {segments.map((s) => (
          <span
            key={s.label}
            className={`font-mono text-[9px] ${level === s.label ? 'text-foreground font-semibold' : 'text-muted-foreground/60'}`}
          >
            {s.label}
          </span>
        ))}
      </div>
      {/* Factors */}
      {data.modelConfidence.factors.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-border space-y-0.5">
          {data.modelConfidence.factors.map((f, i) => (
            <p key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
              <span className="text-gold mt-px">•</span> {f}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConfidenceMeter;
