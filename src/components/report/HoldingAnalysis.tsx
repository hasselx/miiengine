import { useState } from "react";
import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

interface HoldingResult {
  investedValue: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  holdingDays: number;
  predictedPrice12M: number;
  predictedReturn: number;
  predictedValue: number;
  verdict: string;
  verdictColor: string;
}

function parseCurrencyValue(val: string): number {
  const cleaned = val.replace(/[^0-9.\-]/g, '');
  return parseFloat(cleaned) || 0;
}

function computeHolding(
  data: StockAnalysis,
  buyDate: string,
  buyPrice: number,
  quantity: number
): HoldingResult | null {
  if (!buyDate || buyPrice <= 0 || quantity <= 0) return null;

  const currentPrice = parseCurrencyValue(data.headerMetrics[0]?.value || '0');
  if (currentPrice <= 0) return null;

  const buyDateObj = new Date(buyDate);
  const now = new Date();
  const holdingDays = Math.floor((now.getTime() - buyDateObj.getTime()) / (1000 * 60 * 60 * 24));

  const investedValue = buyPrice * quantity;
  const currentValue = currentPrice * quantity;
  const pnl = currentValue - investedValue;
  const pnlPercent = ((currentValue - investedValue) / investedValue) * 100;

  const predictedPrice = parseCurrencyValue(data.expectedPrice);
  const predictedValue = predictedPrice * quantity;
  const predictedReturn = ((predictedPrice - buyPrice) / buyPrice) * 100;

  let verdict = '';
  let verdictColor = '';
  if (pnlPercent > 20) { verdict = 'BOOK PARTIAL PROFITS'; verdictColor = 'text-green-data'; }
  else if (pnlPercent > 5) { verdict = 'HOLD — MOMENTUM INTACT'; verdictColor = 'text-green-data'; }
  else if (pnlPercent > -5) { verdict = 'HOLD — NEAR BREAKEVEN'; verdictColor = 'text-gold'; }
  else if (pnlPercent > -15) { verdict = 'ACCUMULATE ON DIPS'; verdictColor = 'text-gold'; }
  else { verdict = 'AVERAGE DOWN OR REVIEW'; verdictColor = 'text-red-data'; }

  return {
    investedValue,
    currentValue,
    pnl,
    pnlPercent,
    holdingDays,
    predictedPrice12M: predictedPrice,
    predictedReturn,
    predictedValue,
    verdict,
    verdictColor,
  };
}

const HoldingAnalysis = ({ data }: { data: StockAnalysis }) => {
  const [buyDate, setBuyDate] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [result, setResult] = useState<HoldingResult | null>(null);

  const handleAnalyze = () => {
    const res = computeHolding(data, buyDate, parseFloat(buyPrice), parseFloat(quantity));
    setResult(res);
  };

  const rawVal = data.headerMetrics[0]?.value || '';
  const currency = rawVal.match(/^[^\d\-\s]+/)?.[0] || '$';

  return (
    <SectionWrapper num="⊕" title="My Holding Analysis">
      <div className="space-y-4">
        {/* Input fields */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="font-mono text-[9px] tracking-[2px] uppercase text-muted-foreground block mb-1.5">
              Buy Date
            </label>
            <input
              type="date"
              value={buyDate}
              onChange={(e) => setBuyDate(e.target.value)}
              className="w-full bg-accent font-mono text-[12px] text-foreground px-3 py-2 border border-border focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="font-mono text-[9px] tracking-[2px] uppercase text-muted-foreground block mb-1.5">
              Buy Price
            </label>
            <input
              type="number"
              placeholder={`e.g. 500`}
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              className="w-full bg-accent font-mono text-[12px] text-foreground px-3 py-2 border border-border focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="font-mono text-[9px] tracking-[2px] uppercase text-muted-foreground block mb-1.5">
              Quantity
            </label>
            <input
              type="number"
              placeholder="e.g. 100"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-accent font-mono text-[12px] text-foreground px-3 py-2 border border-border focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!buyDate || !buyPrice || !quantity}
          className="w-full bg-sidebar text-sidebar-foreground font-mono text-[11px] tracking-[2px] uppercase py-2.5 hover:bg-sidebar/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Analyze My Position
        </button>

        {/* Results */}
        {result && (
          <div className="space-y-3 pt-2">
            {/* P&L Summary */}
            <div className="grid grid-cols-2 gap-px bg-border">
              <div className="bg-card p-3">
                <p className="font-mono text-[9px] tracking-[2px] uppercase text-muted-foreground mb-1">Invested</p>
                <p className="font-mono text-sm font-medium text-foreground">{currency}{result.investedValue.toLocaleString()}</p>
              </div>
              <div className="bg-card p-3">
                <p className="font-mono text-[9px] tracking-[2px] uppercase text-muted-foreground mb-1">Current Value</p>
                <p className="font-mono text-sm font-medium text-foreground">{currency}{result.currentValue.toLocaleString()}</p>
              </div>
              <div className="bg-card p-3">
                <p className="font-mono text-[9px] tracking-[2px] uppercase text-muted-foreground mb-1">P&L</p>
                <p className={`font-mono text-sm font-semibold ${result.pnl >= 0 ? 'text-green-data' : 'text-red-data'}`}>
                  {result.pnl >= 0 ? '+' : ''}{currency}{Math.abs(result.pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="bg-card p-3">
                <p className="font-mono text-[9px] tracking-[2px] uppercase text-muted-foreground mb-1">Return</p>
                <p className={`font-mono text-sm font-semibold ${result.pnlPercent >= 0 ? 'text-green-data' : 'text-red-data'}`}>
                  {result.pnlPercent >= 0 ? '+' : ''}{result.pnlPercent.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Holding Duration */}
            <div className="bg-accent p-3">
              <p className="font-mono text-[9px] tracking-[2px] uppercase text-muted-foreground mb-1">Holding Period</p>
              <p className="font-mono text-sm text-foreground">
                {result.holdingDays} days ({(result.holdingDays / 30).toFixed(1)} months)
              </p>
            </div>

            {/* Prediction */}
            <div className="border-l-[3px] border-primary bg-accent p-3">
              <p className="font-mono text-[9px] tracking-[2px] uppercase text-muted-foreground mb-1">
                MII 12-Month Prediction
              </p>
              <p className="font-mono text-lg font-semibold text-foreground">
                {currency}{result.predictedPrice12M.toLocaleString()}
              </p>
              <p className={`font-mono text-[11px] mt-0.5 ${result.predictedReturn >= 0 ? 'text-green-data' : 'text-red-data'}`}>
                {result.predictedReturn >= 0 ? '+' : ''}{result.predictedReturn.toFixed(1)}% from your buy price
              </p>
              <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
                Projected value: {currency}{result.predictedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>

            {/* Verdict */}
            <div className="bg-sidebar p-3 text-center">
              <p className="font-mono text-[9px] tracking-[2px] uppercase text-sidebar-foreground/50 mb-1">
                Position Recommendation
              </p>
              <p className={`font-mono text-[13px] font-bold tracking-[2px] ${result.verdictColor}`}>
                {result.verdict}
              </p>
            </div>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
};

export default HoldingAnalysis;
