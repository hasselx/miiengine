export interface ScoreCategory {
  step: number;
  name: string;
  subtitle: string;
  score: number;
  maxScore: number;
  weight: string;
}

export interface MetricCard {
  label: string;
  value: string;
  note: string;
  color: 'green' | 'red' | 'gold' | 'muted';
}

export interface PriceScenario {
  label: string;
  price: string;
  probability: string;
  change: string;
  description: string;
  type: 'bull' | 'base' | 'bear';
}

export interface TradingCell {
  label: string;
  value: string;
  note: string;
  color?: 'green' | 'red' | 'default';
}

export interface TechnicalSignal {
  name: string;
  value: string;
  status: 'positive' | 'negative' | 'neutral';
}

export interface MoatItem {
  name: string;
  score: number;
  maxScore: number;
}

export interface RiskItem {
  name: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  filled: number;
}

export interface MacroItem {
  icon: string;
  title: string;
  detail: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentLabel: string;
}

export interface DividendMetric {
  label: string;
  value: string;
  note: string;
  color: 'green' | 'red' | 'gold' | 'muted';
}

export interface PatternSignal {
  name: string;
  signal: string;
  confidence: number;
  type: 'bullish' | 'bearish' | 'neutral';
}

export interface EarningsItem {
  label: string;
  value: string;
  change?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface EarningsSurprise {
  quarter: string;
  estimate: string;
  actual: string;
  result: 'Beat' | 'Miss' | 'Inline';
}

export interface InsiderTransaction {
  role: string;
  action: 'Buy' | 'Sell';
  shares: string;
  date: string;
}

export interface CorrelationItem {
  asset: string;
  correlation: number;
}

export interface SectorRotationItem {
  sector: string;
  direction: 'up' | 'down' | 'neutral';
  performance: string;
}

export interface SentimentFactor {
  name: string;
  value: string;
  signal: 'bullish' | 'bearish' | 'neutral';
}

export interface HeaderMetric {
  label: string;
  value: string;
  change: string;
}

export interface ModelSummary {
  num: string;
  model: string;
  firm: string;
  abstract: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export type InvestmentStyle = 'long_term' | 'swing_trader' | 'short_term' | 'intraday' | 'value' | 'growth' | null;

export const INVESTMENT_STYLES: { value: InvestmentStyle; label: string; description: string }[] = [
  { value: 'long_term', label: 'Long-Term Investor', description: 'Fundamentals, moat, institutional ownership' },
  { value: 'swing_trader', label: 'Swing Trader', description: 'Technicals, support/resistance, momentum' },
  { value: 'short_term', label: 'Short-Term Trader', description: 'Momentum, volume, short-term patterns' },
  { value: 'intraday', label: 'Intraday Trader', description: 'Volatility, volume spikes, real-time signals' },
  { value: 'value', label: 'Value Investor', description: 'P/E, DCF valuation, balance sheet' },
  { value: 'growth', label: 'Growth Investor', description: 'Revenue growth, earnings growth, sector momentum' },
];

export interface StockAnalysis {
  company: string;
  investmentStyle?: InvestmentStyle;
  subtitle: string;
  verdictBadge: string;
  reportType: string;
  headerMetrics: HeaderMetric[];
  totalScore: number;
  verdict: string;
  verdictNote: string;
  scoreRange: string;
  scores: ScoreCategory[];
  executiveSummary: string[];
  modelSummaries: ModelSummary[];
  tags: { label: string; highlighted: boolean }[];
  fundamentalMetrics: MetricCard[];
  fundamentalNote: string;
  dcfAssumptions: { label: string; value: string }[];
  revenueProjections: { label: string; value: string; highlight?: boolean }[];
  dcfScenarios: { label: string; price: string; note: string; type: 'bull' | 'base' | 'bear' }[];
  valuationNote: string;
  priceScenarios: PriceScenario[];
  expectedPrice: string;
  expectedFormula: string;
  expectedUpside: string;
  expectedUpsideNote: string;
  priceNote: string;
  macroItems: MacroItem[];
  tradingCells: TradingCell[];
  riskReward: { ratio: string; detail: string };
  technicalSignals: TechnicalSignal[];
  technicalNote: string;
  moatItems: MoatItem[];
  riskItems: RiskItem[];
  dividendMetrics: DividendMetric[];
  dividendNote: string;
  patternSignals: PatternSignal[];
  patternNote: string;
  earningsBreakdown: EarningsItem[];
  earningsNote: string;
  earningsSurprises: EarningsSurprise[];
  nextEarningsDate: string;
  nextEarningsEstimate: string;
  supportLevels: string[];
  resistanceLevels: string[];
  insiderTransactions: InsiderTransaction[];
  insiderSummary: { totalBuying: string; totalSelling: string; netSignal: string };
  institutionalOwnership: number;
  topHolders: { name: string; percentage: number }[];
  sentimentScore: number;
  sentimentLabel: 'Bullish' | 'Neutral' | 'Bearish';
  sentimentFactors: SentimentFactor[];
  correlations: CorrelationItem[];
  sectorRotation: SectorRotationItem[];
  finalVerdict: string;
  finalVerdictText: string;
  finalAction: string;
  finalFooter: { label: string; value: string }[];
  priceExtremes: {
    ath: number;
    athChange: string;
    athDate: string;
    atl: number;
    atlChange: string;
    atlDate: string;
    yearHigh: number;
    yearHighChange: string;
    yearHighDate: string;
    yearLow: number;
    yearLowChange: string;
    yearLowDate: string;
    currency: string;
  };
  watermark: string;
  disclaimer: string;
}
