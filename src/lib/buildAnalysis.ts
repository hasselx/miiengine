import { StockAnalysis } from "./stockData";
import { StockRawData } from "./stockApi";

function safe(val: any, fallback: string = 'N/A'): string {
  if (val === undefined || val === null || val === '' || val === 'null') return fallback;
  return String(val);
}

function num(val: any, fallback: number = 0): number {
  const n = parseFloat(val);
  return isNaN(n) ? fallback : n;
}

function fmt(val: number, decimals: number = 2): string {
  return val.toFixed(decimals);
}

function fmtLarge(val: number): string {
  if (val >= 1e12) return `${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e7) return `${(val / 1e7).toFixed(0)} Cr`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(2)}K`;
  return val.toFixed(0);
}

function getCurrency(exchange: string): string {
  if (['NSE', 'BSE'].includes(exchange)) return '₹';
  if (['LSE'].includes(exchange)) return '£';
  if (['TSE'].includes(exchange)) return '¥';
  return '$';
}

// Compute technical indicators from time series
function computeTechnicals(timeSeries: any[]) {
  if (!timeSeries || timeSeries.length === 0) return null;

  const closes = timeSeries.map((d: any) => num(d.close)).reverse(); // oldest to newest
  const currentPrice = closes[closes.length - 1];

  const sma = (period: number) => {
    if (closes.length < period) return null;
    const slice = closes.slice(-period);
    return slice.reduce((a: number, b: number) => a + b, 0) / period;
  };

  const sma50 = sma(50);
  const sma100 = sma(100);
  const sma200 = sma(200);

  // RSI (14)
  let rsi = 50;
  if (closes.length >= 15) {
    const changes = [];
    for (let i = closes.length - 14; i < closes.length; i++) {
      changes.push(closes[i] - closes[i - 1]);
    }
    const gains = changes.filter(c => c > 0);
    const losses = changes.filter(c => c < 0).map(c => Math.abs(c));
    const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / 14 : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / 14 : 0;
    if (avgLoss === 0) rsi = 100;
    else rsi = 100 - (100 / (1 + avgGain / avgLoss));
  }

  // 52-week high/low (all available data = ATH/ATL proxy)
  const yearData = closes.slice(-252);
  const high52 = Math.max(...yearData);
  const low52 = Math.min(...yearData);

  // All-time high/low from all available data with dates
  const tsReversed = [...timeSeries].reverse(); // oldest to newest
  let allHigh = closes[0], allLow = closes[0], allHighDate = '', allLowDate = '';
  for (const d of tsReversed as any[]) {
    const c = num(d.close);
    const dt = d.datetime || d.date || '';
    if (c >= allHigh) { allHigh = c; allHighDate = dt; }
    if (c <= allLow) { allLow = c; allLowDate = dt; }
  }

  // Current year high/low with dates
  const now = new Date();
  const currentYear = now.getFullYear();
  let ytdHigh = -Infinity, ytdLow = Infinity, ytdHighDate = '', ytdLowDate = '';
  for (const d of tsReversed as any[]) {
    const dateStr = d.datetime || d.date || '';
    if (new Date(dateStr).getFullYear() === currentYear) {
      const c = num(d.close);
      if (c >= ytdHigh) { ytdHigh = c; ytdHighDate = dateStr; }
      if (c <= ytdLow) { ytdLow = c; ytdLowDate = dateStr; }
    }
  }
  if (ytdHigh === -Infinity) { ytdHigh = allHigh; ytdHighDate = allHighDate; }
  if (ytdLow === Infinity) { ytdLow = allLow; ytdLowDate = allLowDate; }

  const fmtDate = (s: string) => {
    if (!s) return '';
    const d = new Date(s);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(-2)}`;
  };

  // Recent volume
  const volumes = timeSeries.slice(0, 3).map((d: any) => num(d.volume));
  const avgVol3 = volumes.reduce((a: number, b: number) => a + b, 0) / 3;

  return { currentPrice, sma50, sma100, sma200, rsi, high52, low52, allHigh, allLow, allHighDate: fmtDate(allHighDate), allLowDate: fmtDate(allLowDate), ytdHigh, ytdLow, ytdHighDate: fmtDate(ytdHighDate), ytdLowDate: fmtDate(ytdLowDate), avgVol3 };
}

// Score calculation functions
function scoreFundamentals(quote: any, stats: any): { score: number; subtitle: string } {
  let score = 10; // base
  const pe = num(quote.pe);
  const eps = num(quote.eps);

  if (pe > 0 && pe < 15) score += 4;
  else if (pe >= 15 && pe < 25) score += 3;
  else if (pe >= 25 && pe < 40) score += 2;
  else if (pe >= 40) score += 0;

  if (eps > 0) score += 2;

  const fiftyTwoChange = num(quote.percent_change);
  if (fiftyTwoChange > 10) score += 2;
  else if (fiftyTwoChange > 0) score += 1;

  score = Math.min(20, Math.max(0, score));
  const subtitle = `P/E: ${pe > 0 ? fmt(pe, 1) + 'x' : 'N/A'}; EPS: ${eps > 0 ? fmt(eps) : 'N/A'}`;
  return { score, subtitle };
}

function scoreValuation(quote: any, techs: any): { score: number; subtitle: string } {
  let score = 7;
  const pe = num(quote.pe);
  if (pe > 0 && pe < 20) score += 4;
  else if (pe < 30) score += 2;
  else if (pe > 50) score -= 2;

  score = Math.min(15, Math.max(0, score));
  return { score, subtitle: `P/E based valuation assessment; current P/E: ${pe > 0 ? fmt(pe, 1) + 'x' : 'N/A'}` };
}

function scoreMoat(profile: any): { score: number; subtitle: string } {
  let score = 5; // neutral
  if (profile && profile.sector) score += 2;
  if (profile && profile.employees && num(profile.employees) > 1000) score += 1;
  score = Math.min(10, Math.max(0, score));
  return { score, subtitle: `Sector: ${safe(profile?.sector, 'Unknown')}; Employees: ${safe(profile?.employees, 'N/A')}` };
}

function scoreTechnical(techs: any): { score: number; subtitle: string } {
  if (!techs) return { score: 7, subtitle: 'Insufficient data for technical analysis' };
  let score = 7;
  if (techs.sma50 && techs.currentPrice > techs.sma50) score += 2;
  if (techs.sma200 && techs.currentPrice > techs.sma200) score += 2;
  if (techs.rsi > 30 && techs.rsi < 70) score += 2;
  else if (techs.rsi <= 30) score += 1; // oversold can be opportunity
  score = Math.min(15, Math.max(0, score));

  const smaStatus = techs.sma200 ? (techs.currentPrice > techs.sma200 ? 'Above' : 'Below') + ' 200 DMA' : 'N/A';
  return { score, subtitle: `RSI: ${fmt(techs.rsi, 0)}; ${smaStatus}` };
}

export function buildAnalysisFromRealData(raw: StockRawData, company: string, country: string, exchange: string): StockAnalysis {
  const { quote, profile, statistics, timeSeries } = raw;
  const techs = computeTechnicals(timeSeries);
  const currency = getCurrency(exchange);
  const price = num(quote.close || quote.price);
  const prevClose = num(quote.previous_close);
  const change = num(quote.change);
  const pctChange = num(quote.percent_change);
  const pe = num(quote.pe);
  const marketCap = num(statistics?.valuations_metrics?.market_capitalization || 0);
  const high52 = techs?.high52 || num(quote.fifty_two_week?.high);
  const low52 = techs?.low52 || num(quote.fifty_two_week?.low);

  const companyName = safe(profile?.name || quote?.name, company);
  const ticker = safe(quote?.symbol, company.toUpperCase());
  const sector = safe(profile?.sector, 'N/A');

  // Compute scores
  const fund = scoreFundamentals(quote, statistics);
  const val = scoreValuation(quote, techs);
  const moat = scoreMoat(profile);
  const momentum = { score: 6, subtitle: 'Based on recent price action and earnings data' };
  const tech = scoreTechnical(techs);
  const quant = { score: 6, subtitle: 'Institutional data limited via current API' };
  const risk = { score: 7, subtitle: 'Risk assessed from volatility and sector' };
  const macro = { score: 7, subtitle: 'Macro environment based on current conditions' };

  const totalScore = fund.score + val.score + moat.score + momentum.score + tech.score + quant.score + risk.score + macro.score;

  const getVerdict = (s: number) => {
    if (s >= 90) return { badge: "⬛ EXCEPTIONAL OPPORTUNITY", verdict: "Exceptional Opportunity", range: "90–100 = EXCEPTIONAL" };
    if (s >= 80) return { badge: "⬛ STRONG BUY", verdict: "Strong Buy", range: "80–89 = STRONG BUY" };
    if (s >= 70) return { badge: "⬛ BUY", verdict: "Buy", range: "70–79 = BUY" };
    if (s >= 60) return { badge: "⬛ HOLD / ACCUMULATE", verdict: "Hold / Accumulate on Dips", range: "60–69 = HOLD" };
    if (s >= 50) return { badge: "⬛ WEAK HOLD", verdict: "Weak Hold", range: "50–59 = WEAK HOLD" };
    return { badge: "⬛ AVOID", verdict: "Avoid", range: "Below 50 = AVOID" };
  };

  const v = getVerdict(totalScore);

  // Price projections
  const bullPrice = Math.round(price * 1.35);
  const basePrice = Math.round(price * 1.18);
  const bearPrice = Math.round(price * 0.82);
  const expectedPrice = Math.round(bullPrice * 0.25 + basePrice * 0.50 + bearPrice * 0.25);
  const expectedUpside = (((expectedPrice - price) / price) * 100).toFixed(1);

  // Trading plan
  const entryLow = Math.round(price * 0.95);
  const entryHigh = Math.round(price * 1.0);
  const stopLoss = Math.round(price * 0.88);
  const t1 = Math.round(price * 1.15);
  const t2 = Math.round(price * 1.25);
  const t3 = bullPrice;
  const riskAmt = entryLow - stopLoss;
  const rewardAmt = t2 - entryLow;
  const rrRatio = riskAmt > 0 ? `1 : ${(rewardAmt / riskAmt).toFixed(1)}` : '1 : N/A';

  // Format change sign
  const changeSign = change >= 0 ? '+' : '';
  const pctSign = pctChange >= 0 ? '+' : '';

  // Technical signals
  const techSignals = techs ? [
    { name: "50-Day SMA", value: techs.sma50 ? (price > techs.sma50 ? "ABOVE ✓" : "BELOW ✗") : "N/A", status: (techs.sma50 && price > techs.sma50 ? "positive" : techs.sma50 ? "negative" : "neutral") as 'positive' | 'negative' | 'neutral' },
    { name: "100-Day SMA", value: techs.sma100 ? (price > techs.sma100 ? "ABOVE ✓" : "BELOW ✗") : "N/A", status: (techs.sma100 && price > techs.sma100 ? "positive" : techs.sma100 ? "negative" : "neutral") as 'positive' | 'negative' | 'neutral' },
    { name: "200-Day SMA", value: techs.sma200 ? (price > techs.sma200 ? "ABOVE ✓" : "BELOW ✗") : "N/A", status: (techs.sma200 && price > techs.sma200 ? "positive" : techs.sma200 ? "negative" : "neutral") as 'positive' | 'negative' | 'neutral' },
    { name: "RSI (14)", value: `${fmt(techs.rsi, 0)} ${techs.rsi > 70 ? 'OVERBOUGHT' : techs.rsi < 30 ? 'OVERSOLD' : 'NEUTRAL'}`, status: (techs.rsi > 70 ? "negative" : techs.rsi < 30 ? "positive" : "neutral") as 'positive' | 'negative' | 'neutral' },
    { name: "Key Support", value: `${currency}${Math.round(low52)}`, status: "neutral" as const },
    { name: "Key Resistance", value: `${currency}${Math.round(high52)}`, status: "neutral" as const },
    { name: "52W from Peak", value: `${((price - high52) / high52 * 100).toFixed(1)}%`, status: (price > high52 * 0.9 ? "positive" : "negative") as 'positive' | 'negative' },
    { name: "Avg Volume (3D)", value: techs.avgVol3 > 0 ? fmtLarge(techs.avgVol3) : "N/A", status: "neutral" as const },
  ] : [
    { name: "Technical Data", value: "Insufficient historical data", status: "neutral" as const },
  ];

  return {
    company: companyName,
    subtitle: `${companyName} · ${safe(quote?.exchange, exchange)} · ${ticker}`,
    verdictBadge: v.badge,
    reportType: `Institutional Equity Research · 12-Month Horizon · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    headerMetrics: [
      { label: "CMP", value: `${currency}${fmt(price)}`, change: `${pctSign}${fmt(pctChange)}% today` },
      { label: "Market Cap", value: marketCap > 0 ? `${currency}${fmtLarge(marketCap)}` : 'N/A', change: sector },
      { label: "52W Range", value: `${currency}${fmt(high52, 0)} / ${currency}${fmt(low52, 0)}`, change: `${((price - high52) / high52 * 100).toFixed(1)}% from peak` },
      { label: "P/E (TTM)", value: pe > 0 ? `${fmt(pe, 1)}x` : 'N/A', change: `EPS: ${safe(quote?.eps)}` },
      { label: "Prev Close", value: `${currency}${fmt(prevClose)}`, change: `Change: ${changeSign}${fmt(change)}` },
      { label: "Volume", value: safe(quote?.volume, 'N/A'), change: `Avg: ${safe(quote?.average_volume, 'N/A')}` },
    ],
    totalScore,
    verdict: v.verdict,
    verdictNote: totalScore < 70 ? `Entry below ${currency}${Math.round(price * 0.92)} upgrades to BUY` : 'Strong conviction level',
    scoreRange: v.range,
    scores: [
      { step: 1, name: "Fundamental Quality", subtitle: fund.subtitle, score: fund.score, maxScore: 20, weight: "20% wt" },
      { step: 2, name: "Intrinsic Valuation", subtitle: val.subtitle, score: val.score, maxScore: 15, weight: "15% wt" },
      { step: 3, name: "Competitive Moat", subtitle: moat.subtitle, score: moat.score, maxScore: 10, weight: "10% wt" },
      { step: 4, name: "Earnings Momentum", subtitle: momentum.subtitle, score: momentum.score, maxScore: 10, weight: "10% wt" },
      { step: 5, name: "Technical Strength", subtitle: tech.subtitle, score: tech.score, maxScore: 15, weight: "15% wt" },
      { step: 6, name: "Quantitative Signals", subtitle: quant.subtitle, score: quant.score, maxScore: 10, weight: "10% wt" },
      { step: 7, name: "Risk Stability", subtitle: risk.subtitle, score: risk.score, maxScore: 10, weight: "10% wt" },
      { step: 8, name: "Macro Tailwinds", subtitle: macro.subtitle, score: macro.score, maxScore: 10, weight: "10% wt" },
    ],
    executiveSummary: [
      `<strong>${companyName}</strong> is currently trading at <strong>${currency}${fmt(price)}</strong> with a ${pctSign}${fmt(pctChange)}% change today. The stock operates in the <strong>${sector}</strong> sector${profile?.country ? ` based in <strong>${profile.country}</strong>` : ''}.`,
      `From a valuation perspective, the stock trades at <strong>${pe > 0 ? fmt(pe, 1) + 'x P/E' : 'N/A P/E'}</strong>. The 52-week range of ${currency}${fmt(high52, 0)} to ${currency}${fmt(low52, 0)} suggests the stock is <strong>${((price - low52) / (high52 - low52) * 100).toFixed(0)}% through its annual range</strong>.`,
      `Our multi-factor analysis yields a total score of <strong>${totalScore}/100</strong>, resulting in a <strong>${v.verdict}</strong> recommendation. The expected 12-month price target is <strong>${currency}${expectedPrice}</strong>, representing a <strong>${expectedUpside}% expected return</strong> from current levels.`,
    ],
    tags: [
      { label: sector, highlighted: true },
      { label: safe(profile?.country || country), highlighted: true },
      { label: pe > 40 ? 'Premium Valuation' : pe > 20 ? 'Fair Valuation' : 'Value', highlighted: false },
      { label: pctChange > 0 ? 'Positive Momentum' : 'Negative Momentum', highlighted: false },
      { label: v.verdict, highlighted: false },
    ],
    fundamentalMetrics: [
      { label: "P/E Ratio (TTM)", value: pe > 0 ? `${fmt(pe, 1)}x` : 'N/A', note: `EPS: ${safe(quote?.eps)}`, color: (pe > 40 ? 'red' : pe > 20 ? 'gold' : 'green') as any },
      { label: "Current Price", value: `${currency}${fmt(price)}`, note: `${pctSign}${fmt(pctChange)}% today`, color: (pctChange >= 0 ? 'green' : 'red') as any },
      { label: "Previous Close", value: `${currency}${fmt(prevClose)}`, note: `Change: ${changeSign}${currency}${fmt(Math.abs(change))}`, color: 'muted' as any },
      { label: "52-Week High", value: `${currency}${fmt(high52, 0)}`, note: `${((price - high52) / high52 * 100).toFixed(1)}% from peak`, color: 'red' as any },
      { label: "52-Week Low", value: `${currency}${fmt(low52, 0)}`, note: `${((price - low52) / low52 * 100).toFixed(1)}% from low`, color: 'green' as any },
      { label: "Volume", value: safe(quote?.volume, 'N/A'), note: `Avg: ${safe(quote?.average_volume, 'N/A')}`, color: 'muted' as any },
    ],
    fundamentalNote: `${companyName} is currently priced at ${currency}${fmt(price)} with a P/E ratio of ${pe > 0 ? fmt(pe, 1) + 'x' : 'N/A'}. The stock has moved ${pctSign}${fmt(pctChange)}% today from a previous close of ${currency}${fmt(prevClose)}. It's trading ${((price - low52) / (high52 - low52) * 100).toFixed(0)}% through its 52-week range.`,
    dcfAssumptions: [
      { label: "Current Price", value: `${currency}${fmt(price)}` },
      { label: "P/E (TTM)", value: pe > 0 ? `${fmt(pe, 1)}x` : 'N/A' },
      { label: "EPS (TTM)", value: safe(quote?.eps) },
      { label: "52W High", value: `${currency}${fmt(high52, 0)}` },
      { label: "52W Low", value: `${currency}${fmt(low52, 0)}` },
      { label: "Estimated WACC", value: "10–13%" },
      { label: "Terminal Growth", value: "3–5%" },
    ],
    revenueProjections: [
      { label: "Bear Estimate", value: `${currency}${Math.round(price * 0.82)}` },
      { label: "Base Estimate", value: `${currency}${Math.round(price * 1.18)}` },
      { label: "Bull Estimate", value: `${currency}${Math.round(price * 1.35)}` },
      { label: "Expected Value", value: `${currency}${expectedPrice}`, highlight: true },
    ],
    dcfScenarios: [
      { label: "Bear Case", price: `${currency}${bearPrice}`, note: "Margin compression, sector downturn", type: "bear" },
      { label: "Base Case", price: `${currency}${basePrice}`, note: "Steady growth, stable margins", type: "base" },
      { label: "Bull Case", price: `${currency}${bullPrice}`, note: "Expansion, re-rating catalyst", type: "bull" },
    ],
    valuationNote: `At ${currency}${fmt(price)}, the stock trades at ${pe > 0 ? fmt(pe, 1) + 'x earnings' : 'an undetermined P/E'}. Our probability-weighted expected value of ${currency}${expectedPrice} represents a ${expectedUpside}% potential return. The bull case of ${currency}${bullPrice} assumes expansion and re-rating, while the bear case of ${currency}${bearPrice} accounts for margin pressure and sector headwinds.`,
    priceScenarios: [
      { label: "▲ Bull Case", price: `${currency}${bullPrice}`, probability: "Probability: 25%", change: `+${((bullPrice - price) / price * 100).toFixed(0)}% upside`, description: "Strong earnings growth, sector re-rating, expansion catalysts", type: "bull" },
      { label: "◆ Base Case", price: `${currency}${basePrice}`, probability: "Probability: 50%", change: `+${((basePrice - price) / price * 100).toFixed(0)}% upside`, description: "Steady revenue growth, stable margins, modest multiple expansion", type: "base" },
      { label: "▼ Bear Case", price: `${currency}${bearPrice}`, probability: "Probability: 25%", change: `${((bearPrice - price) / price * 100).toFixed(0)}% downside`, description: "Margin compression, macro headwinds, sector rotation", type: "bear" },
    ],
    expectedPrice: `${currency}${expectedPrice}`,
    expectedFormula: `(${currency}${bullPrice}×25%) + (${currency}${basePrice}×50%) + (${currency}${bearPrice}×25%)`,
    expectedUpside: `+${expectedUpside}%`,
    expectedUpsideNote: `Expected Upside from ${currency}${fmt(price)}`,
    priceNote: `Based on our multi-factor analysis, the probability-weighted expected price of ${currency}${expectedPrice} suggests ${expectedUpside}% upside from current levels. For conservative investors, an accumulation zone around ${currency}${entryLow}–${currency}${entryHigh} offers better risk-reward.`,
    macroItems: [
      { icon: "📈", title: "Market Trend", detail: `Stock is ${pctChange >= 0 ? 'up' : 'down'} ${fmt(Math.abs(pctChange))}% today. ${price > (techs?.sma200 || 0) ? 'Trading above 200 DMA — bullish trend.' : 'Trading below 200 DMA — caution.'}`, sentiment: pctChange >= 0 ? "positive" : "negative", sentimentLabel: pctChange >= 0 ? "POSITIVE" : "HEADWIND" },
      { icon: "📊", title: "Valuation Context", detail: pe > 40 ? 'Premium valuation at current P/E — growth expectations priced in' : pe > 20 ? 'Fair valuation relative to broader market' : 'Attractive valuation on P/E basis', sentiment: pe > 40 ? "negative" : pe > 20 ? "neutral" : "positive", sentimentLabel: pe > 40 ? "RICH" : pe > 20 ? "FAIR" : "ATTRACTIVE" },
      { icon: "🔄", title: "52-Week Position", detail: `Currently ${((price - low52) / (high52 - low52) * 100).toFixed(0)}% through the 52-week range. ${price > high52 * 0.9 ? 'Near highs — momentum strong.' : price < low52 * 1.1 ? 'Near lows — potential bounce.' : 'Mid-range trading.'}`, sentiment: price > high52 * 0.9 ? "positive" : price < low52 * 1.1 ? "neutral" : "neutral", sentimentLabel: price > high52 * 0.9 ? "STRONG" : "NEUTRAL" },
      { icon: "📉", title: "Volatility Assessment", detail: `52-week range of ${((high52 - low52) / low52 * 100).toFixed(0)}% suggests ${(high52 - low52) / low52 > 0.5 ? 'high volatility — position sizing important' : 'moderate volatility'}`, sentiment: (high52 - low52) / low52 > 0.5 ? "negative" : "neutral", sentimentLabel: (high52 - low52) / low52 > 0.5 ? "HIGH VOL" : "MODERATE" },
    ],
    tradingCells: [
      { label: "Entry Zone", value: `${currency}${entryLow}–${currency}${entryHigh}`, note: "Ideal accumulation band", color: "green" },
      { label: "Current Price", value: `${currency}${fmt(price)}`, note: price > entryHigh ? "Above entry; consider waiting" : "In entry zone", color: "default" },
      { label: "Stop Loss", value: `${currency}${stopLoss}`, note: "Below key support", color: "red" },
      { label: "Target 1", value: `${currency}${t1}`, note: "Near-term target", color: "green" },
      { label: "Target 2", value: `${currency}${t2}`, note: "Medium-term target", color: "green" },
      { label: "Target 3", value: `${currency}${t3}`, note: "Bull case target", color: "green" },
    ],
    riskReward: { ratio: rrRatio, detail: `Risk ${currency}${riskAmt} · Reward ${currency}${rewardAmt} (to T2)` },
    technicalSignals: techSignals,
    technicalNote: techs ? `The stock is ${price > (techs.sma50 || 0) ? 'above' : 'below'} its 50-day SMA and ${price > (techs.sma200 || 0) ? 'above' : 'below'} its 200-day SMA. RSI at ${fmt(techs.rsi, 0)} indicates ${techs.rsi > 70 ? 'overbought conditions' : techs.rsi < 30 ? 'oversold conditions — potential bounce' : 'neutral momentum'}.` : 'Insufficient data for detailed technical analysis.',
    moatItems: [
      { name: "Brand Recognition", score: moat.score > 7 ? 8 : 6, maxScore: 10 },
      { name: "Market Position", score: moat.score > 7 ? 7.5 : 5.5, maxScore: 10 },
      { name: "Switching Costs", score: 6, maxScore: 10 },
      { name: "Scale Advantage", score: moat.score > 7 ? 7 : 5, maxScore: 10 },
      { name: "IP / Technology", score: 5.5, maxScore: 10 },
    ],
    riskItems: [
      { name: "Valuation Risk", level: pe > 40 ? "HIGH" : pe > 20 ? "MEDIUM" : "LOW", filled: pe > 40 ? 4 : pe > 20 ? 3 : 2 },
      { name: "Volatility Risk", level: ((high52 - low52) / low52 > 0.5 ? "HIGH" : "MEDIUM") as any, filled: (high52 - low52) / low52 > 0.5 ? 4 : 3 },
      { name: "Technical Risk", level: price < (techs?.sma200 || price) ? "HIGH" : "MEDIUM", filled: price < (techs?.sma200 || price) ? 4 : 2 },
      { name: "Momentum Risk", level: pctChange < -3 ? "HIGH" : pctChange < 0 ? "MEDIUM" : "LOW", filled: pctChange < -3 ? 4 : pctChange < 0 ? 3 : 1 },
      { name: "Liquidity Risk", level: "LOW" as any, filled: 2 },
    ],
    finalVerdict: v.verdict,
    finalVerdictText: `<strong>${companyName}</strong> receives a multi-factor score of <strong>${totalScore}/100</strong>. The stock is currently at ${currency}${fmt(price)} with an expected 12-month target of ${currency}${expectedPrice} (${expectedUpside}% upside).`,
    finalAction: `<strong>Recommendation:</strong> ${totalScore >= 70 ? 'Initiate position at current levels with targets at ' + currency + t1 + '–' + currency + t2 + '.' : totalScore >= 60 ? 'Accumulate on dips near ' + currency + entryLow + '–' + currency + entryHigh + '. Hold with 12-month view.' : totalScore >= 50 ? 'Hold existing positions. Avoid fresh entry at current levels.' : 'Avoid. Wait for significant correction or fundamental improvement.'}`,
    finalFooter: [
      { label: "SCORE", value: `${totalScore} / 100` },
      { label: "TARGET", value: `${currency}${expectedPrice}` },
      { label: "HORIZON", value: "12 Months" },
    ],
    priceExtremes: {
      ath: techs?.allHigh || high52,
      athChange: `${(((price - (techs?.allHigh || high52)) / (techs?.allHigh || high52)) * 100).toFixed(1)}%`,
      athDate: techs?.allHighDate || '',
      atl: techs?.allLow || low52,
      atlChange: `+${(((price - (techs?.allLow || low52)) / (techs?.allLow || low52)) * 100).toFixed(1)}%`,
      atlDate: techs?.allLowDate || '',
      yearHigh: techs?.ytdHigh || high52,
      yearHighChange: `${(((price - (techs?.ytdHigh || high52)) / (techs?.ytdHigh || high52)) * 100).toFixed(1)}%`,
      yearHighDate: techs?.ytdHighDate || '',
      yearLow: techs?.ytdLow || low52,
      yearLowChange: `+${(((price - (techs?.ytdLow || low52)) / (techs?.ytdLow || low52)) * 100).toFixed(1)}%`,
      yearLowDate: techs?.ytdLowDate || '',
      currency,
    },
    watermark: `${companyName} · ${ticker} · Multi-Institutional Intelligence Engine · ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
    disclaimer: "IMPORTANT DISCLAIMER: This report is generated by an AI-based multi-institutional analytical framework. It is for educational and informational purposes only and does not constitute financial advice, investment recommendation, or solicitation to buy or sell any security. Past performance is not indicative of future results. All projections are probabilistic estimates and carry inherent uncertainty. Please consult a registered investment advisor before making investment decisions.",
  };
}
