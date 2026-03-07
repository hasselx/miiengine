import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const sentDot = { positive: "bg-green-data", negative: "bg-red-data", neutral: "bg-gold" };

const ExecutiveSummary = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="01" title="Executive Summary">
    <div className="space-y-3 sm:space-y-4">
      {data.executiveSummary.map((p, i) => (
        <p key={i} className="text-[13px] sm:text-[14px] leading-[1.7] sm:leading-[1.8] text-foreground" dangerouslySetInnerHTML={{ __html: p }} />
      ))}
    </div>

    {/* 10-Model Research Abstract */}
    <div className="mt-5 sm:mt-6 border border-border rounded-sm overflow-hidden">
      <div className="px-3 sm:px-4 py-2.5 bg-accent-area border-b border-border">
        <p className="font-mono text-[10px] sm:text-[11px] tracking-[2px] uppercase text-muted-foreground font-semibold">10-Model Research Abstract</p>
      </div>
      <div className="divide-y divide-border">
        {data.modelSummaries.map((m, i) => (
          <div key={i} className="flex items-start gap-2 sm:gap-3 px-3 sm:px-4 py-2.5">
            <span className="font-mono text-[10px] text-gold mt-0.5 shrink-0">{m.num}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="font-mono text-[11px] sm:text-[12px] font-semibold text-foreground">{m.model}</span>
                <span className="font-mono text-[9px] sm:text-[10px] text-muted-foreground">— {m.firm}</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${sentDot[m.sentiment]}`} />
              </div>
              <p className="text-[11px] sm:text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{m.abstract}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="flex gap-2 flex-wrap mt-4">
      {data.tags.map((t, i) => (
        <span key={i} className={`font-mono text-[10px] px-2.5 py-1 border tracking-wide rounded-sm ${t.highlighted ? 'bg-ink text-gold border-ink' : 'border-border text-muted-foreground'}`}>
          {t.label}
        </span>
      ))}
    </div>
  </SectionWrapper>
);

export default ExecutiveSummary;
