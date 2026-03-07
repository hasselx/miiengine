import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const ExecutiveSummary = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="01" title="Executive Summary">
    <div className="space-y-4">
      {data.executiveSummary.map((p, i) => (
        <p key={i} className="text-[13.5px] leading-[1.75] text-[#222]" dangerouslySetInnerHTML={{ __html: p }} />
      ))}
    </div>
    <div className="flex gap-2 flex-wrap mt-4">
      {data.tags.map((t, i) => (
        <span key={i} className={`font-mono text-[10px] px-2.5 py-1 border tracking-wide ${t.highlighted ? 'bg-ink text-gold border-ink' : 'border-border text-muted-foreground'}`}>
          {t.label}
        </span>
      ))}
    </div>
  </SectionWrapper>
);

export default ExecutiveSummary;
