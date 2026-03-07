import { PriceScenario } from "@/lib/stockData";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PriceProjectionProps {
  scenarios: PriceScenario[];
  expectedPrice: number;
  expectedReturn: string;
  currentPrice: number;
  currency: string;
}

const PriceProjection = ({ scenarios, expectedPrice, expectedReturn, currentPrice, currency }: PriceProjectionProps) => {
  const icon = { bull: TrendingUp, base: Minus, bear: TrendingDown };
  const colorClass = { bull: "text-bull", base: "text-neutral-data", bear: "text-bear" };
  const bgClass = { bull: "bg-bull/10 border-bull/20", base: "bg-neutral-data/10 border-neutral/20", bear: "bg-bear/10 border-bear/20" };

  return (
    <div className="bg-card border border-border rounded-sm">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-mono text-xs font-semibold tracking-widest uppercase text-muted-foreground">12-Month Price Projection</h3>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {scenarios.map((s) => {
            const Icon = icon[s.type];
            return (
              <div key={s.label} className={`p-3 rounded-sm border ${bgClass[s.type]}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className={`w-3.5 h-3.5 ${colorClass[s.type]}`} />
                  <span className="text-xs font-mono text-muted-foreground">{s.label}</span>
                </div>
                <div className={`font-mono text-xl font-bold ${colorClass[s.type]}`}>
                  {currency === "USD" ? "$" : currency}{s.price.toFixed(0)}
                </div>
                <div className="text-xs font-mono text-muted-foreground mt-1">
                  P({(s.probability * 100).toFixed(0)}%)
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-secondary rounded-sm border border-border glow-primary">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-mono text-muted-foreground mb-1">EXPECTED PRICE</div>
              <div className="font-mono text-2xl font-bold text-primary">
                {currency === "USD" ? "$" : currency}{expectedPrice.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono text-muted-foreground mb-1">EXPECTED RETURN</div>
              <div className={`font-mono text-2xl font-bold ${expectedReturn.startsWith("+") ? "text-bull" : "text-bear"}`}>
                {expectedReturn}
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs font-mono text-muted-foreground">
            Current: {currency === "USD" ? "$" : currency}{currentPrice.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceProjection;
