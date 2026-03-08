import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const impactColor = {
  High: "bg-red-data/15 text-red-data border-red-data/30",
  Moderate: "bg-gold/15 text-gold border-gold/30",
  Low: "bg-green-data/15 text-green-data border-green-data/30",
};

const categoryIcon: Record<string, string> = {
  earnings: "📊",
  corporate: "🏢",
  industry: "🏭",
  product: "🚀",
  macro: "🌍",
};

const categoryLabel: Record<string, string> = {
  earnings: "Earnings",
  corporate: "Corporate Action",
  industry: "Industry",
  product: "Product / Strategy",
  macro: "Macro Event",
};

const CatalystTimeline = ({ data }: { data: StockAnalysis }) => {
  const catalysts = data.catalystTimeline;

  return (
    <SectionWrapper num="10" title="Catalyst Timeline">
      <p className="text-[12px] text-muted-foreground mb-4 leading-relaxed">
        Key upcoming events that could drive price movement toward the projected valuation over the next 12 months.
      </p>

      {/* Timeline */}
      <div className="relative pl-6 sm:pl-8 space-y-0">
        {/* Vertical line */}
        <div className="absolute left-2.5 sm:left-3.5 top-2 bottom-2 w-px bg-border" />

        {catalysts.map((c, i) => (
          <div key={i} className="relative pb-5 last:pb-0">
            {/* Dot */}
            <div className={`absolute -left-[15px] sm:-left-[17px] top-1.5 w-3 h-3 rounded-full border-2 ${
              c.impact === 'High' ? 'bg-red-data border-red-data/50' : c.impact === 'Moderate' ? 'bg-gold border-gold/50' : 'bg-green-data border-green-data/50'
            }`} />

            {/* Content */}
            <div className="bg-accent-area border border-border rounded-sm p-3 sm:p-4">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="font-mono text-[10px] tracking-[2px] uppercase text-muted-foreground">{c.date}</span>
                <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${impactColor[c.impact]}`}>
                  {c.impact} Impact
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-sm">{categoryIcon[c.category] || '📌'}</span>
                <div>
                  <p className="text-[12px] sm:text-[13px] font-medium">{c.event}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{categoryLabel[c.category] || c.category}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-[12px] text-muted-foreground p-3 border-l-[3px] border-gold bg-accent-area leading-[1.7] rounded-sm">
        <strong>Note:</strong> Catalyst dates are estimated based on historical patterns and sector cycles. Positive catalysts increase bull case probability; negative outcomes may shift weight toward bear scenarios.
      </div>
    </SectionWrapper>
  );
};

export default CatalystTimeline;
