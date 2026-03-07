export interface ScoreCategory {
  name: string;
  score: number;
  maxScore: number;
  weight: string;
  details: string[];
}

export interface PriceScenario {
  label: string;
  price: number;
  probability: number;
  type: 'bull' | 'base' | 'bear';
}

export interface TradingPlan {
  entryZone: [number, number];
  stopLoss: number;
  targets: number[];
  riskReward: string;
}

export interface StockAnalysis {
  company: string;
  country: string;
  ticker: string;
  currentPrice: number;
  currency: string;
  sector: string;
  marketCap: string;
  scores: ScoreCategory[];
  totalScore: number;
  verdict: string;
  verdictColor: 'bull' | 'bear' | 'neutral';
  priceScenarios: PriceScenario[];
  expectedPrice: number;
  expectedReturn: string;
  tradingPlan: TradingPlan;
  executiveSummary: string;
  riskFactors: string[];
  catalysts: string[];
  competitivePosition: string;
  macroOutlook: string;
  technicalSummary: string;
  valuationSummary: string;
}

// Demo data generators
const sampleStocks: Record<string, StockAnalysis> = {
  default: {
    company: "Apple Inc.",
    country: "United States",
    ticker: "AAPL",
    currentPrice: 227.48,
    currency: "USD",
    sector: "Technology",
    marketCap: "$3.49T",
    scores: [
      { name: "Fundamental Quality", score: 17, maxScore: 20, weight: "20%", details: ["P/E: 33.2x vs sector 28.5x — slight premium", "5Y Revenue CAGR: 8.2%", "Net margin: 26.3% — best-in-class", "ROE: 160%+ (capital-light model)", "D/E: 1.87 — manageable", "FCF: $110B+ — rock solid", "Dividend: 0.44% yield, 12Y growth streak"] },
      { name: "Intrinsic Valuation", score: 11, maxScore: 15, weight: "15%", details: ["DCF fair value: $198–$215", "WACC: 9.2%", "Terminal growth: 3%", "Current price trades at 8–15% premium", "Services segment justifies premium multiple"] },
      { name: "Competitive Advantage", score: 9, maxScore: 10, weight: "10%", details: ["Brand: #1 global brand value", "Ecosystem lock-in: extremely high switching costs", "Network effects via App Store", "Services moat expanding", "Market share stable in premium segment"] },
      { name: "Earnings Momentum", score: 8, maxScore: 10, weight: "10%", details: ["Beat estimates 4/4 quarters", "Revenue guidance: cautiously optimistic", "Analyst revisions: +3.2% EPS in 90 days", "Services growth accelerating"] },
      { name: "Technical Strength", score: 12, maxScore: 15, weight: "15%", details: ["Above 50/100/200 DMA", "RSI: 58 — neutral-bullish", "MACD: positive crossover", "Volume: accumulation phase", "Cup-and-handle forming on weekly"] },
      { name: "Quantitative Signals", score: 7, maxScore: 10, weight: "10%", details: ["Institutional ownership: 60%+", "Insider sales: routine, not alarming", "Short interest: 0.7% — very low", "Options: bullish skew on 3M expiry", "Seasonal: strong Q4 historically"] },
      { name: "Risk Stability", score: 8, maxScore: 10, weight: "10%", details: ["Debt serviceable at current rates", "Earnings volatility: low (β = 1.2)", "Sector: defensive tech", "Liquidity: excellent"] },
      { name: "Macro Tailwind", score: 7, maxScore: 10, weight: "10%", details: ["Rate cuts anticipated — positive for growth", "Consumer spending resilient", "USD strength: minor headwind", "AI integration catalyst ahead"] },
    ],
    totalScore: 79,
    verdict: "Buy",
    verdictColor: "bull",
    priceScenarios: [
      { label: "Bull Case", price: 275, probability: 0.30, type: "bull" },
      { label: "Base Case", price: 245, probability: 0.50, type: "base" },
      { label: "Bear Case", price: 195, probability: 0.20, type: "bear" },
    ],
    expectedPrice: 248.5,
    expectedReturn: "+9.2%",
    tradingPlan: {
      entryZone: [220, 230],
      stopLoss: 205,
      targets: [245, 260, 275],
      riskReward: "1:2.3",
    },
    executiveSummary: "Apple represents a high-quality franchise with best-in-class profitability, an expanding services ecosystem, and a fortress balance sheet. While valuation is slightly above intrinsic estimates, the premium is justified by the durability of the competitive moat and accelerating services revenue. Technical setup is constructive. We rate AAPL a BUY with a 12-month expected price of $248.50, representing ~9.2% upside from current levels.",
    riskFactors: ["China revenue exposure (~18%)", "Regulatory risk (App Store fees)", "iPhone cycle dependency", "Premium valuation limits upside", "FX headwinds from strong USD"],
    catalysts: ["AI-powered Siri upgrade cycle", "Vision Pro ecosystem growth", "Services margin expansion", "India market penetration", "Potential rate cuts boosting multiples"],
    competitivePosition: "Apple maintains an unassailable position in the premium consumer electronics market. The ecosystem flywheel (iPhone → Services → Wearables → Vision Pro) creates compounding switching costs. Samsung competes on hardware but lacks ecosystem depth. Google's Pixel gains share but remains niche. Apple's services segment ($85B+ ARR) is now a standalone moat.",
    macroOutlook: "The macro environment is cautiously supportive. Anticipated rate cuts in 2025 should benefit growth multiples. Consumer spending remains resilient in the premium segment. However, China macro weakness and currency headwinds present moderate risks. Sector rotation into quality tech names favors AAPL.",
    technicalSummary: "AAPL is trading above all major moving averages with a constructive cup-and-handle pattern on the weekly chart. RSI at 58 suggests room for upside before overbought territory. MACD recently crossed bullish. Volume profile shows accumulation. Key resistance at $235; support at $215.",
    valuationSummary: "Our DCF model (WACC: 9.2%, terminal growth: 3%) yields a fair value range of $198–$215. The market premium of 8–15% is partially justified by the services mix shift (higher-margin, recurring revenue). On a relative basis, AAPL trades at 33.2x forward P/E vs. the tech sector median of 28.5x. We view the premium as sustainable but limit further upside compression.",
  },
};

export function getAnalysis(company: string, country: string): StockAnalysis {
  const analysis = { ...sampleStocks.default };
  if (company && country) {
    analysis.company = company;
    analysis.country = country;
  }
  return analysis;
}

export function getVerdictInfo(score: number): { verdict: string; color: 'bull' | 'bear' | 'neutral' } {
  if (score >= 90) return { verdict: "Exceptional Opportunity", color: "bull" };
  if (score >= 80) return { verdict: "Strong Buy", color: "bull" };
  if (score >= 70) return { verdict: "Buy", color: "bull" };
  if (score >= 60) return { verdict: "Hold", color: "neutral" };
  if (score >= 50) return { verdict: "Weak Hold", color: "neutral" };
  return { verdict: "Avoid", color: "bear" };
}
