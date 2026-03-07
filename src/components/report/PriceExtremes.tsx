import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

interface Props {
  data: StockAnalysis;
}

const PriceExtremes = ({ data }: Props) => {
  const { priceExtremes: p } = data;
  const c = p.currency;

  const items = [
    { label: "All-Time High (ATH)", date: p.athDate, price: `${c}${p.ath.toFixed(2)}`, change: p.athChange, isNeg: parseFloat(p.athChange) < 0 },
    { label: "All-Time Low (ATL)", date: p.atlDate, price: `${c}${p.atl.toFixed(2)}`, change: p.atlChange, isNeg: false },
    { label: `${new Date().getFullYear()} High`, date: p.yearHighDate, price: `${c}${p.yearHigh.toFixed(2)}`, change: p.yearHighChange, isNeg: parseFloat(p.yearHighChange) < 0 },
    { label: `${new Date().getFullYear()} Low`, date: p.yearLowDate, price: `${c}${p.yearLow.toFixed(2)}`, change: p.yearLowChange, isNeg: false },
  ];

  return (
    <SectionWrapper num="09" title="Price Extremes vs CMP">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="bg-accent-area border border-border rounded px-4 py-3 text-center space-y-1"
          >
            <div className="font-mono text-[10px] tracking-[1.5px] uppercase text-muted-foreground">
              {item.label}
            </div>
            {item.date && (
              <div className="font-mono text-[9px] text-muted-foreground/70">{item.date}</div>
            )}
            <div className="font-mono text-lg font-bold text-foreground">
              {item.price}
            </div>
            <div
              className={`font-mono text-xs font-semibold ${
                item.isNeg ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {item.change} vs CMP
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
};

export default PriceExtremes;
