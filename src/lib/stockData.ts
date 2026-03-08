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
  assumptions: {
    revenueGrowth: string;
    operatingMargin: string;
    peMultiple: string;
    projectedEps: string;
  };
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
  valuationTriangle: {
    dcf: { price: string; weight: string; method: string; signal: 'Bullish' | 'Bearish' | 'Neutral' };
    relative: { price: string; weight: string; method: string; signal: 'Bullish' | 'Bearish' | 'Neutral' };
    momentum: { price: string; weight: string; method: string; signal: 'Bullish' | 'Bearish' | 'Neutral' };
    composite: string;
    compositeReturn: string;
    compositeLabel: string;
  };
  fairValueRange: { low: string; high: string; midpoint: string };
  accumulationZone: { low: string; high: string; show: boolean };
  optimalEntry: { low: string; high: string; basis: string };
  modelConfidence: { score: number; level: 'Low' | 'Moderate' | 'High'; factors: string[] };
  modelAgreement: { level: 'Low' | 'Moderate' | 'High'; models: { name: string; signal: 'Bullish' | 'Bearish' | 'Neutral' }[] };
  keyDrivers: string[];
  ratingChangeTriggers: { upgrades: string[]; downgrades: string[] };
  factorExposure: { name: string; score: number }[];
  marketRegime: { regime: 'Bull Market' | 'Bear Market' | 'Sideways Market'; signals: string[]; adjustment: string };
  decisionStack: { factor: string; signal: 'Bullish' | 'Bearish' | 'Neutral' | 'Adjustment'; detail: string }[];
  factorContributions: { name: string; contribution: number }[];
  priceDistribution: { bear: { price: string; probability: number; drivers: string[] }; base: { price: string; probability: number; drivers: string[] }; bull: { price: string; probability: number; drivers: string[] }; expectedPrice: string };
  catalystTimeline: { date: string; event: string; category: 'earnings' | 'corporate' | 'industry' | 'product' | 'macro'; impact: 'High' | 'Moderate' | 'Low' }[];
  peerComparison: PeerComparisonData | null;
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

export interface PeerMetric {
  symbol: string;
  name: string;
  price: number;
  pe: number;
  marketCap: number;
  revenueGrowth: number | null;
  operatingMargin: number | null;
  profitMargin: number | null;
  roe: number | null;
  debtToEquity: number | null;
  eps: number;
}

export interface PeerComparisonData {
  peers: PeerMetric[];
  companyMetrics: PeerMetric;
  relativeScore: number; // 0-10
  ranking: { symbol: string; name: string; score: number }[];
  commentary: string;
  sectorAvg: {
    pe: number;
    revenueGrowth: number | null;
    operatingMargin: number | null;
    roe: number | null;
    debtToEquity: number | null;
  };
}
