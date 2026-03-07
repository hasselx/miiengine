import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const DCFValuation = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="04" title="Intrinsic Valuation — DCF Model" score="8 / 15">
    <div className="grid grid-cols-2 gap-5 mb-4">
      <div>
        <p className="font-mono text-[10px] text-muted-foreground tracking-[2px] uppercase mb-2.5">DCF Assumptions</p>
        <table className="w-full font-mono text-[11px] border-collapse">
          <tbody>
            {data.dcfAssumptions.map((r, i) => (
              <tr key={i} className="border-b border-border last:border-b-0">
                <td className="py-2 text-muted-foreground">{r.label}</td>
                <td className="py-2 text-right text-ink">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <p className="font-mono text-[10px] text-muted-foreground tracking-[2px] uppercase mb-2.5">Revenue Projections (₹ Cr)</p>
        <table className="w-full font-mono text-[11px] border-collapse">
          <tbody>
            {data.revenueProjections.map((r, i) => (
              <tr key={i} className="border-b border-border last:border-b-0">
                <td className={`py-2 ${r.highlight ? 'text-gold font-semibold' : 'text-muted-foreground'}`}>{r.label}</td>
                <td className={`py-2 text-right ${r.highlight ? 'text-gold font-semibold' : 'text-ink'}`}>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* DCF Scenarios */}
    <div className="grid grid-cols-3 gap-px bg-border">
      {data.dcfScenarios.map((s) => {
        const bg = s.type === 'bear' ? 'bg-bear-light' : s.type === 'bull' ? 'bg-bull-light' : 'bg-accent-area';
        const labelColor = s.type === 'bear' ? 'text-red-dark' : s.type === 'bull' ? 'text-green-dark' : 'text-gold';
        const priceColor = s.type === 'bear' ? 'text-red-dark' : s.type === 'bull' ? 'text-green-dark' : 'text-ink';
        return (
          <div key={s.type} className={`${bg} p-4 text-center`}>
            <p className={`font-mono text-[9px] tracking-[2px] uppercase mb-2 ${labelColor}`}>{s.label}</p>
            <p className={`font-display text-[28px] font-bold mb-1 ${priceColor}`}>{s.price}</p>
            <p className="text-[11px] text-muted-foreground">{s.note}</p>
          </div>
        );
      })}
    </div>

    <div className="mt-3 text-[12px] text-[#555] p-3 border-l-[3px] border-gold bg-accent-area leading-[1.7]">
      <strong>Valuation Summary:</strong> {data.valuationNote}
    </div>
  </SectionWrapper>
);

export default DCFValuation;
