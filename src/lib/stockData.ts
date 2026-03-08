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

export interface StockAnalysis {
  company: string;
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

export function getAnalysis(company: string, country: string): StockAnalysis {
  return {
    company,
    subtitle: `${company} · ${country} · Multi-Institutional Intelligence Engine`,
    verdictBadge: "⬛ HOLD / ACCUMULATE",
    reportType: `Institutional Equity Research · 12-Month Horizon · Conservative Risk Profile · March 7, 2026`,
    headerMetrics: [
      { label: "CMP", value: "₹637", change: "−0.74% today" },
      { label: "Market Cap", value: "₹5,406 Cr", change: "Mid-cap" },
      { label: "52W Range", value: "₹972 / ₹405", change: "−34.5% from peak" },
      { label: "P/E (TTM)", value: "77x", change: "Sector: 59x" },
      { label: "Revenue FY25", value: "₹413 Cr", change: "+43% YoY" },
      { label: "Net Profit FY25", value: "₹71.4 Cr", change: "+90% YoY" },
    ],
    totalScore: 68,
    verdict: "Hold / Accumulate on Dips",
    verdictNote: "Entry below ₹600 upgrades to BUY",
    scoreRange: "60–69 = HOLD",
    scores: [
      { step: 1, name: "Fundamental Quality", subtitle: "P/E premium; strong growth; modest ROE; near zero-debt", score: 13, maxScore: 20, weight: "20% wt" },
      { step: 2, name: "Intrinsic Valuation", subtitle: "DCF implies overvaluation; growth priced in at 77x P/E", score: 8, maxScore: 15, weight: "15% wt" },
      { step: 3, name: "Competitive Moat", subtitle: "ISRO exclusivity; high switching costs; niche IP", score: 8, maxScore: 10, weight: "10% wt" },
      { step: 4, name: "Earnings Momentum", subtitle: "YoY positive but Q3 missed estimates; margin pressure", score: 6, maxScore: 10, weight: "10% wt" },
      { step: 5, name: "Technical Strength", subtitle: "Below 100/200 DMA; support ₹632; resistance ₹722", score: 8, maxScore: 15, weight: "15% wt" },
      { step: 6, name: "Quantitative Signals", subtitle: "Promoter steady at 53.2%; institutional interest building", score: 7, maxScore: 10, weight: "10% wt" },
      { step: 7, name: "Risk Stability", subtitle: "Very low D/E 0.08; govt revenue concentration risk", score: 7, maxScore: 10, weight: "10% wt" },
      { step: 8, name: "Macro Tailwinds", subtitle: "India defence budget growth; AoN approvals ₹3.3L Cr", score: 9, maxScore: 10, weight: "10% wt" },
    ],
    executiveSummary: [
      `${company} is India's most strategically important <strong>private-sector pure-play in defence optics, electronics, EMP protection, and space systems</strong>. As the <strong>exclusive domestic supplier of large-size optics and diffractive gratings to ISRO</strong>, and a critical vendor to DRDO and the Indian Armed Forces, it occupies a near-monopolistic niche protected by high technology barriers and deep government relationships.`,
      `Financially, the company delivered an exceptional FY25 — revenue up <strong>43% YoY to ₹413 Cr</strong> and net profit doubling (+90%) to ₹71.4 Cr — supported by a multi-year tailwind in India's Atmanirbhar Bharat defence indigenisation drive. The current order book stands at <strong>~₹1,000 Cr</strong> with a pipeline of ₹2,000–3,000 Cr expected over 18–24 months.`,
      `However, from a conservative investor's standpoint, the stock warrants caution: <strong>P/E at 77x vs sector 59x</strong> prices in significant growth already; Q3 FY26 EBITDA margins compressed to 24.7% vs 25.7% YoY due to low-margin engineering orders mixing into revenue; net profits sequentially fell 11.8%; and technical charts show the stock is still <strong>~31% below its 52-week high</strong> of ₹972 with meaningful overhead resistance. A decisive accumulation zone exists between <strong>₹580–620</strong>.`,
    ],
    modelSummaries: [
      { num: "01", model: "Stock Screener", firm: "Goldman Sachs", abstract: "P/E at 77x premium; strong growth; modest ROE; near zero-debt. Score: 13/20.", sentiment: "neutral" },
      { num: "02", model: "DCF Valuation", firm: "Morgan Stanley", abstract: "DCF implies overvaluation; growth priced in at 77x P/E. Score: 8/15.", sentiment: "negative" },
      { num: "03", model: "Risk Analysis", firm: "Bridgewater", abstract: "Very low D/E 0.08; govt revenue concentration risk. Score: 7/10.", sentiment: "neutral" },
      { num: "04", model: "Earnings Breakdown", firm: "JPMorgan", abstract: "Revenue +43% YoY; net profit +90% YoY; Q3 margin pressure. Score: 6/10.", sentiment: "positive" },
      { num: "05", model: "Portfolio Construction", firm: "BlackRock", abstract: "Expected upside 16.2%; R/R ratio 1:3.2. Accumulate on dips.", sentiment: "neutral" },
      { num: "06", model: "Technical Analysis", firm: "Citadel", abstract: "Below 100/200 DMA; RSI neutral; support ₹632. Score: 8/15.", sentiment: "neutral" },
      { num: "07", model: "Dividend Strategy", firm: "Harvard Endowment", abstract: "Yield 0.07%; capital appreciation focus. Not an income play.", sentiment: "neutral" },
      { num: "08", model: "Competitive Advantage", firm: "Bain & Company", abstract: "ISRO exclusivity; high switching costs; niche IP. Score: 8/10.", sentiment: "positive" },
      { num: "09", model: "Pattern Finder", firm: "Renaissance", abstract: "Falling wedge breakout pending; accumulation signals detected.", sentiment: "positive" },
      { num: "10", model: "Macro Impact", firm: "McKinsey", abstract: "Defence budget tailwind; AoN approvals ₹3.3L Cr. Score: 9/10.", sentiment: "positive" },
    ],
    tags: [
      { label: "Defence Indigenisation Play", highlighted: true },
      { label: "ISRO Exclusive Supplier", highlighted: true },
      { label: "Mid-Cap Growth", highlighted: false },
      { label: "Government Dependent", highlighted: false },
      { label: "Premium Valuation", highlighted: false },
      { label: "Conservative: Accumulate on Dips", highlighted: false },
    ],
    fundamentalMetrics: [
      { label: "P/E Ratio (TTM)", value: "77x", note: "Sector avg: 59x · Premium of 30%", color: "red" },
      { label: "Revenue CAGR (3Y)", value: "26%", note: "₹241 Cr (FY24) → ₹413 Cr (FY25)", color: "green" },
      { label: "Net Profit Margin", value: "17.3%", note: "FY25 · improving trend", color: "green" },
      { label: "ROE (3Y Avg)", value: "9.56%", note: "Below 15% ideal; expanding", color: "gold" },
      { label: "ROCE", value: "15.6%", note: "Improving capital efficiency", color: "gold" },
      { label: "Debt-to-Equity", value: "0.08x", note: "Virtually debt-free · conservative", color: "green" },
      { label: "Profit Growth CAGR", value: "32%", note: "3-year compounded", color: "green" },
      { label: "Dividend Yield", value: "0.07%", note: "₹0.50/share · growth-reinvestment focus", color: "muted" },
      { label: "Price / Book Value", value: "8.6x", note: "Premium to book · growth justified", color: "red" },
    ],
    fundamentalNote: "FY25 marked a breakthrough year for Paras — revenue jumped 43% and net profit nearly doubled to ₹71.4 Cr, driven by the high-margin optronics segment (57% EBITDA margin). The concern for conservative investors is that Q3 FY26 EBITDA margin compressed to 24.7% due to low-margin defence engineering orders mixing into revenue, and sequential net profit fell 11.8%. Monitoring margin trajectory will be critical over the next two quarters.",
    dcfAssumptions: [
      { label: "Revenue Growth (FY26E)", value: "28–32%" },
      { label: "Revenue Growth (FY27E)", value: "30–35%" },
      { label: "Revenue Growth (FY28–30E)", value: "22–26%" },
      { label: "EBITDA Margin (Base)", value: "24–26%" },
      { label: "WACC Estimate", value: "12.5%" },
      { label: "Terminal Growth Rate", value: "6.0%" },
      { label: "Terminal Value Multiple", value: "18x EBITDA" },
    ],
    revenueProjections: [
      { label: "FY25A", value: "413" },
      { label: "FY26E", value: "~540" },
      { label: "FY27E", value: "~705" },
      { label: "FY28E", value: "~878" },
      { label: "FY29E", value: "~1,072" },
      { label: "DCF Intrinsic Value", value: "₹480–560", highlight: true },
    ],
    dcfScenarios: [
      { label: "Bear DCF", price: "₹420", note: "Margin erosion scenario", type: "bear" },
      { label: "Base DCF", price: "₹520", note: "30% CAGR, stable margins", type: "base" },
      { label: "Bull DCF", price: "₹650", note: "Order ramp + margin recovery", type: "bull" },
    ],
    valuationNote: "At ₹637, the stock is trading at a ~22% premium to our base DCF intrinsic value of ₹520 and ~23% above Nirmal Bang's revised target of ₹820 only when applying elevated 44x FY27E P/E. The market assigns a significant growth premium — justified by ISRO exclusivity and sectoral tailwinds, but leaves limited margin of safety for conservative investors at current prices.",
    priceScenarios: [
      { label: "▲ Bull Case", price: "₹900", probability: "Probability: 25%", change: "+41% upside", description: "Order book ramp, margin recovery to 26%+, new subsidiary (Paras Avionics) traction, re-rating to 60x FY27E EPS", type: "bull" },
      { label: "◆ Base Case", price: "₹780", probability: "Probability: 50%", change: "+22% upside", description: "Steady 28–30% revenue growth, margins stabilise at 24–25%, order pipeline converts partially at 44x FY27E P/E", type: "base" },
      { label: "▼ Bear Case", price: "₹500", probability: "Probability: 25%", change: "−21% downside", description: "Defence budget cuts, order delays, margin compression continues, broader mid-cap de-rating", type: "bear" },
    ],
    expectedPrice: "₹740",
    expectedFormula: "(₹900×25%) + (₹780×50%) + (₹500×25%)",
    expectedUpside: "+16.2%",
    expectedUpsideNote: "Expected Upside from ₹637",
    priceNote: "For a conservative risk profile, the asymmetry at current prices (25% downside risk vs 22% base upside) is not compelling enough for aggressive entry. A patient accumulation strategy in the ₹580–620 zone would improve the risk-reward ratio materially, targeting ₹750–800 over 12 months.",
    macroItems: [
      { icon: "🛡️", title: "India Defence Budget & AoN Approvals", detail: "₹3.3 lakh crore in project approvals in YTDFY26; strong multi-year order visibility for private defence players", sentiment: "positive", sentimentLabel: "STRONG TAILWIND" },
      { icon: "🚀", title: "India Space Sector Liberalisation", detail: "ISRO commercialisation + IN-SPACe framework opening up ₹1,000+ Cr revenue opportunity for Paras by FY27E", sentiment: "positive", sentimentLabel: "STRONG TAILWIND" },
      { icon: "🏭", title: "Atmanirbhar Bharat / Make in India", detail: "Government mandating indigenisation; ~84% of orders from domestic contracts; policy continuity expected", sentiment: "positive", sentimentLabel: "TAILWIND" },
      { icon: "📈", title: "RBI Rate Environment", detail: "Easing cycle supports mid-cap valuation re-rating; lower WACC improves DCF intrinsic value", sentiment: "neutral", sentimentLabel: "MILDLY POSITIVE" },
      { icon: "⚠️", title: "Government Budget Dependency Risk", detail: "~84% domestic govt revenue; any policy or procurement delay directly impacts execution and cash flows", sentiment: "negative", sentimentLabel: "KEY RISK" },
      { icon: "🌍", title: "Geopolitical Tailwind", detail: "Indo-China border tensions and India's export push to 75+ countries sustain elevated defence spending priority", sentiment: "positive", sentimentLabel: "TAILWIND" },
    ],
    tradingCells: [
      { label: "Entry Zone", value: "₹580–620", note: "Ideal accumulation band", color: "green" },
      { label: "Current Price", value: "₹637", note: "Above ideal entry; wait", color: "default" },
      { label: "Stop Loss", value: "₹540", note: "Below 52W support zone", color: "red" },
      { label: "Target 1", value: "₹750", note: "Near-term resistance", color: "green" },
      { label: "Target 2", value: "₹820", note: "Nirmal Bang base target", color: "green" },
      { label: "Target 3", value: "₹900", note: "Bull case; 18-month", color: "green" },
    ],
    riskReward: { ratio: "1 : 3.2", detail: "Risk ₹60 · Reward ₹190 (to T2)" },
    technicalSignals: [
      { name: "50-Day SMA", value: "ABOVE ✓", status: "positive" },
      { name: "100-Day SMA", value: "BELOW ✗", status: "negative" },
      { name: "200-Day SMA", value: "BELOW ✗", status: "negative" },
      { name: "RSI (14)", value: "~50 NEUTRAL", status: "neutral" },
      { name: "Key Support", value: "₹632 / ₹580", status: "neutral" },
      { name: "Key Resistance", value: "₹722 / ₹820", status: "neutral" },
      { name: "Trend (Daily)", value: "RECOVERING", status: "neutral" },
      { name: "Volume (3-day)", value: "HIGH 1.78 Cr", status: "positive" },
    ],
    technicalNote: "A close above ₹688–722 with volume would signal recovery. The stock has rallied 7% in the last 3 sessions but remains in medium-term downtrend from ₹972 peak.",
    moatItems: [
      { name: "ISRO Exclusivity (Optics)", score: 9.5, maxScore: 10 },
      { name: "Switching Costs (Govt)", score: 8.5, maxScore: 10 },
      { name: "R&D / IP Depth", score: 7.5, maxScore: 10 },
      { name: "Brand / Certification", score: 7.5, maxScore: 10 },
      { name: "Cost Advantage", score: 5.5, maxScore: 10 },
      { name: "Scale / Network Effects", score: 5.0, maxScore: 10 },
    ],
    riskItems: [
      { name: "Balance Sheet Risk", level: "LOW", filled: 2 },
      { name: "Earnings Volatility", level: "MEDIUM", filled: 3 },
      { name: "Customer Concentration", level: "HIGH", filled: 4 },
      { name: "Valuation Risk", level: "HIGH", filled: 3 },
      { name: "Execution / Margin Risk", level: "MEDIUM", filled: 3 },
      { name: "Liquidity Risk", level: "LOW", filled: 2 },
    ],
    dividendMetrics: [
      { label: "Dividend Yield", value: "0.07%", note: "₹0.50/share annually", color: "muted" },
      { label: "Payout Ratio", value: "5.9%", note: "Growth reinvestment focused", color: "gold" },
      { label: "Dividend CAGR (3Y)", value: "N/A", note: "Irregular dividend history", color: "muted" },
      { label: "Yield on Cost (5Y)", value: "0.12%", note: "Minimal income generation", color: "muted" },
    ],
    dividendNote: "Paras Defence prioritises growth reinvestment over dividend payouts. With a negligible 0.07% yield and irregular history, this is not a dividend income play. Harvard Endowment methodology would classify this as a pure capital appreciation candidate.",
    patternSignals: [
      { name: "Falling Wedge", signal: "Breakout Pending", confidence: 72, type: "bullish" },
      { name: "Volume Divergence", signal: "Accumulation Detected", confidence: 65, type: "bullish" },
      { name: "Mean Reversion", signal: "Below 200 DMA", confidence: 58, type: "neutral" },
      { name: "Momentum Oscillation", signal: "Recovery Phase", confidence: 61, type: "neutral" },
    ],
    patternNote: "Renaissance-style pattern analysis detects a potential falling wedge breakout with institutional accumulation signals. Confidence levels are moderate — wait for volume confirmation above ₹688.",
    earningsBreakdown: [
      { label: "Revenue (FY25)", value: "₹413 Cr", change: "+43% YoY", sentiment: "positive" },
      { label: "Net Profit (FY25)", value: "₹71.4 Cr", change: "+90% YoY", sentiment: "positive" },
      { label: "EBITDA Margin (Q3)", value: "24.7%", change: "−1% QoQ", sentiment: "negative" },
      { label: "EPS (TTM)", value: "₹8.42", change: "+67% YoY", sentiment: "positive" },
      { label: "Order Book", value: "~₹1,000 Cr", change: "Pipeline: ₹2,000–3,000 Cr", sentiment: "positive" },
    ],
    earningsSurprises: [
      { quarter: "Q3 FY26", estimate: "₹2.25", actual: "₹2.10", result: "Miss" },
      { quarter: "Q2 FY26", estimate: "₹2.10", actual: "₹2.35", result: "Beat" },
      { quarter: "Q1 FY26", estimate: "₹1.95", actual: "₹2.12", result: "Beat" },
      { quarter: "Q4 FY25", estimate: "₹1.80", actual: "₹1.90", result: "Beat" },
    ],
    nextEarningsDate: "May 15, 2026",
    nextEarningsEstimate: "₹2.40",
    supportLevels: ["₹632", "₹580", "₹540"],
    resistanceLevels: ["₹722", "₹820", "₹900"],
    insiderTransactions: [
      { role: "Managing Director", action: "Buy", shares: "50,000", date: "Feb 20, 2026" },
      { role: "CFO", action: "Buy", shares: "15,000", date: "Jan 28, 2026" },
      { role: "Independent Director", action: "Sell", shares: "8,000", date: "Jan 10, 2026" },
      { role: "Promoter Entity", action: "Buy", shares: "1,20,000", date: "Dec 15, 2025" },
    ],
    insiderSummary: { totalBuying: "₹11.8 Cr", totalSelling: "₹0.5 Cr", netSignal: "Strong Net Buying" },
    institutionalOwnership: 28.5,
    topHolders: [
      { name: "SBI Mutual Fund", percentage: 4.2 },
      { name: "HDFC AMC", percentage: 3.8 },
      { name: "LIC of India", percentage: 3.1 },
      { name: "Nippon India MF", percentage: 2.4 },
      { name: "ICICI Prudential", percentage: 1.9 },
    ],
    sentimentScore: 62,
    sentimentLabel: "Bullish",
    sentimentFactors: [
      { name: "Analyst Consensus", value: "12 Buy / 3 Hold / 1 Sell", signal: "bullish" },
      { name: "Short Interest", value: "1.2%", signal: "bullish" },
      { name: "Options P/C Ratio", value: "0.68", signal: "bullish" },
      { name: "News Sentiment", value: "Positive", signal: "bullish" },
    ],
    correlations: [
      { asset: "Nifty 50", correlation: 0.72 },
      { asset: "Nifty Defence", correlation: 0.91 },
      { asset: "S&P 500", correlation: 0.35 },
      { asset: "Gold", correlation: -0.12 },
      { asset: "USD/INR", correlation: -0.28 },
    ],
    sectorRotation: [
      { sector: "Defence & Aerospace", direction: "up", performance: "+8.2%" },
      { sector: "Technology", direction: "up", performance: "+3.1%" },
      { sector: "Financials", direction: "neutral", performance: "+0.4%" },
      { sector: "Energy", direction: "down", performance: "-2.1%" },
      { sector: "Healthcare", direction: "neutral", performance: "+0.8%" },
      { sector: "Consumer Discretionary", direction: "down", performance: "-1.5%" },
    ],
    earningsNote: "JPMorgan-level earnings decomposition shows exceptional top-line growth but emerging margin pressure in Q3 FY26. The revenue mix shift toward lower-margin defence engineering orders is a near-term concern, though the robust order pipeline provides strong medium-term visibility.",
    finalVerdict: "Hold / Accumulate",
    finalVerdictText: `${company} is a <strong>high-quality structural compounder</strong> in India's defence indigenisation theme. For a conservative investor, the current price of ₹637 offers modest 16% expected upside with asymmetric downside risk at 77x P/E.`,
    finalAction: "<strong>Recommended action:</strong> Initiate a partial (30%) position now; build the remaining position aggressively in the ₹580–620 zone. Hold with a 12–18 month view.",
    finalFooter: [
      { label: "SCORE", value: "68 / 100" },
      { label: "TARGET", value: "₹740–780" },
      { label: "HORIZON", value: "12 Months" },
    ],
    priceExtremes: {
      ath: 972, athChange: "-34.5%", athDate: "15/09/25",
      atl: 405, atlChange: "+57.3%", atlDate: "22/03/23",
      yearHigh: 972, yearHighChange: "-34.5%", yearHighDate: "10/01/26",
      yearLow: 580, yearLowChange: "+9.8%", yearLowDate: "05/02/26",
      currency: "₹",
    },
    watermark: `${company} · ${country} · Multi-Institutional Intelligence Engine · March 2026`,
    disclaimer: "IMPORTANT DISCLAIMER: This report is generated by an AI-based multi-institutional analytical framework combining methodologies inspired by Goldman Sachs, Morgan Stanley, Bridgewater Associates, JPMorgan, BlackRock, Citadel, Harvard Endowment, Bain & Company, Renaissance Technologies, and McKinsey Global Institute. It is for educational and informational purposes only and does not constitute financial advice, investment recommendation, or solicitation to buy or sell any security. Past performance is not indicative of future results. All projections are probabilistic estimates and carry inherent uncertainty. Please consult a SEBI-registered investment advisor before making investment decisions.",
  };
}
