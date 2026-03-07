import { StockAnalysis } from "@/lib/stockData";

const FinalVerdict = ({ data }: { data: StockAnalysis }) => (
  <div className="bg-ink p-4 sm:p-6 text-cream rounded-md">
    <p className="font-mono text-[9px] tracking-[3px] text-gold uppercase mb-2">Final Institutional Verdict</p>
    <div className="gold-line mb-3.5" />
    <p className="font-display text-lg sm:text-[22px] font-bold mb-3">{data.finalVerdict}</p>
    <p className="text-[11px] sm:text-[12px] text-[hsl(0,0%,67%)] leading-[1.7] mb-2" dangerouslySetInnerHTML={{ __html: data.finalVerdictText }} />
    <p className="text-[11px] sm:text-[12px] text-[hsl(0,0%,67%)] leading-[1.7]" dangerouslySetInnerHTML={{ __html: data.finalAction }} />
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
