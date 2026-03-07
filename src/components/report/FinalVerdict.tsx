import { StockAnalysis } from "@/lib/stockData";

const FinalVerdict = ({ data }: { data: StockAnalysis }) => (
  <div className="bg-ink p-6 text-cream">
    <p className="font-mono text-[9px] tracking-[3px] text-gold uppercase mb-2">Final Institutional Verdict</p>
    <div className="gold-line mb-3.5" />
    <p className="font-display text-[22px] font-bold mb-3">{data.finalVerdict}</p>
    <p className="text-[12px] text-[#aaa] leading-[1.7] mb-2" dangerouslySetInnerHTML={{ __html: data.finalVerdictText }} />
    <p className="text-[12px] text-[#aaa] leading-[1.7]" dangerouslySetInnerHTML={{ __html: data.finalAction }} />
    <div className="flex justify-between font-mono text-[11px] border-t border-[#333] pt-3 mt-4">
      {data.finalFooter.map((f, i) => (
        <div key={i}>
          <p className="text-[#555] text-[9px] tracking-wide">{f.label}</p>
          <p className={i === 0 ? 'text-gold' : 'text-cream'}>{f.value}</p>
        </div>
      ))}
    </div>
  </div>
);

export default FinalVerdict;
