import { StockAnalysis, MoatItem, RiskItem, PatternSignal, SentimentFactor, InvestmentStyle } from "./stockData";

// Weight multipliers per investment style (keyed by score category index 0-7)
// Categories: 0=Fundamental, 1=Valuation, 2=Moat, 3=Momentum, 4=Technical, 5=Quant, 6=Risk, 7=Macro
function getStyleWeights(style: InvestmentStyle): number[] {
  switch (style) {
    case 'long_term':    return [1.3, 1.2, 1.3, 0.8, 0.7, 1.0, 1.0, 1.0];
    case 'swing_trader': return [0.8, 0.8, 0.7, 1.3, 1.4, 1.0, 1.0, 0.8];
    case 'short_term':   return [0.7, 0.7, 0.6, 1.4, 1.3, 1.1, 1.0, 0.7];
    case 'intraday':     return [0.5, 0.5, 0.5, 1.5, 1.5, 1.2, 1.0, 0.5];
    case 'value':        return [1.4, 1.5, 1.2, 0.7, 0.6, 0.9, 1.2, 0.8];
    case 'growth':       return [1.1, 0.9, 0.9, 1.3, 1.0, 1.0, 0.8, 1.3];
    default:             return [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
  }
}
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
  const ex = (exchange || '').toUpperCase();
  if (['NSE', 'BSE', 'NSE/BSE', 'NATIONAL STOCK EXCHANGE OF INDIA'].includes(ex)) return '₹';
  if (['LSE', 'LON', 'LONDON STOCK EXCHANGE'].includes(ex)) return '£';
  if (['TSE', 'JPX', 'TOKYO STOCK EXCHANGE'].includes(ex)) return '¥';
  if (['XETR', 'FRA', 'ETR', 'EURONEXT'].includes(ex)) return '€';
  if (['HKEX', 'HKG'].includes(ex)) return 'HK$';
  if (['KRX', 'KOSDAQ'].includes(ex)) return '₩';
  if (['SSE', 'SZSE'].includes(ex)) return '¥';
  if (['ASX'].includes(ex)) return 'A$';
  if (['TSX'].includes(ex)) return 'C$';
  return '$';
}

function getCurrencyFromData(quote: any, exchange: string): string {
  const cur = (quote?.currency || '').toUpperCase();
  if (cur === 'INR') return '₹';
  if (cur === 'GBP' || cur === 'GBX') return '£';
  if (cur === 'JPY') return '¥';
  if (cur === 'EUR') return '€';
  if (cur === 'HKD') return 'HK$';
  if (cur === 'KRW') return '₩';
  if (cur === 'CNY' || cur === 'CNH') return '¥';
  if (cur === 'AUD') return 'A$';
  if (cur === 'CAD') return 'C$';
  if (cur === 'USD') return '$';
  const apiExchange = (quote?.exchange || '').toUpperCase();
  if (apiExchange) return getCurrency(apiExchange);
  return getCurrency(exchange);
}

function computeTechnicals(timeSeries: any[]) {
  if (!timeSeries || timeSeries.length === 0) return null;
  const closes = timeSeries.map((d: any) => num(d.close)).reverse();
  const currentPrice = closes[closes.length - 1];

  const sma = (period: number) => {
    if (closes.length < period) return null;
    const slice = closes.slice(-period);
    return slice.reduce((a: number, b: number) => a + b, 0) / period;
  };

  const sma50 = sma(50);
  const sma100 = sma(100);
  const sma200 = sma(200);

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

  const yearData = closes.slice(-252);
  const high52 = Math.max(...yearData);
  const low52 = Math.min(...yearData);

  const tsReversed = [...timeSeries].reverse();
  let allHigh = closes[0], allLow = closes[0], allHighDate = '', allLowDate = '';
  for (const d of tsReversed as any[]) {
    const c = num(d.close);
    const dt = d.datetime || d.date || '';
    if (c >= allHigh) { allHigh = c; allHighDate = dt; }
    if (c <= allLow) { allLow = c; allLowDate = dt; }
  }

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

  const volumes = timeSeries.slice(0, 3).map((d: any) => num(d.volume));
  const avgVol3 = volumes.reduce((a: number, b: number) => a + b, 0) / 3;

  return { currentPrice, sma50, sma100, sma200, rsi, high52, low52, allHigh, allLow, allHighDate: fmtDate(allHighDate), allLowDate: fmtDate(allLowDate), ytdHigh, ytdLow, ytdHighDate: fmtDate(ytdHighDate), ytdLowDate: fmtDate(ytdLowDate), avgVol3 };
}

function scoreFundamentals(quote: any, stats: any): { score: number; subtitle: string } {
  let score = 10;
  const pe = num(quote.pe);
  const eps = num(quote.eps);
  if (pe > 0 && pe < 15) score += 4;
  else if (pe >= 15 && pe < 25) score += 3;
  else if (pe >= 25 && pe < 40) score += 2;
  if (eps > 0) score += 2;
  const fiftyTwoChange = num(quote.percent_change);
  if (fiftyTwoChange > 10) score += 2;
  else if (fiftyTwoChange > 0) score += 1;
  score = Math.min(20, Math.max(0, score));
  return { score, subtitle: `P/E: ${pe > 0 ? fmt(pe, 1) + 'x' : 'N/A'}; EPS: ${eps > 0 ? fmt(eps) : 'N/A'}` };
}

function scoreValuation(quote: any, techs: any): { score: number; subtitle: string } {
  let score = 7;
  const pe = num(quote.pe);
  if (pe > 0 && pe < 20) score += 4;
  else if (pe < 30) score += 2;
  else if (pe > 50) score -= 2;
  score = Math.min(15, Math.max(0, score));
  return { score, subtitle: `P/E based valuation; current P/E: ${pe > 0 ? fmt(pe, 1) + 'x' : 'N/A'}` };
}

function scoreMoat(profile: any): { score: number; subtitle: string } {
  let score = 5;
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
  else if (techs.rsi <= 30) score += 1;
  score = Math.min(15, Math.max(0, score));
  const smaStatus = techs.sma200 ? (techs.currentPrice > techs.sma200 ? 'Above' : 'Below') + ' 200 DMA' : 'N/A';
  return { score, subtitle: `RSI: ${fmt(techs.rsi, 0)}; ${smaStatus}` };
}

export function buildAnalysisFromRealData(raw: StockRawData, company: string, country: string, exchange: string, investmentStyle?: InvestmentStyle): StockAnalysis {
  const { quote, profile, statistics, timeSeries, fundamentals } = raw;
  const techs = computeTechnicals(timeSeries);
  const currency = getCurrencyFromData(quote, exchange);
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

  // Real financial data from API
  const fin = statistics?.financials || {};
  const divData = statistics?.dividends_and_splits || {};
  const fundData = fundamentals || {};
  const earningsHist = fundData?.earningsHistory || [];
  const insiderTxnData = fundData?.insiderTransactions || [];
  const instData = fundData?.institutionalOwnership || {};
  const recData = fundData?.recommendation || null;
  const beta = num(quote?.beta);
  const debtToEquity: number | null = fin?.debtToEquity ?? null;
  const returnOnEquity: number | null = fin?.returnOnEquity ?? null;
  const revenueGrowth: number | null = fin?.revenueGrowth ?? null;
  const profitMargins: number | null = fin?.profitMargins ?? null;
  const grossMargins: number | null = fin?.grossMargins ?? null;

  // Scores
  const fund = scoreFundamentals(quote, statistics);
  const val = scoreValuation(quote, techs);
  const moat = scoreMoat(profile);

  const momentum = (() => {
    let score = 5;
    if (earningsHist.length > 0) {
      const beats = earningsHist.filter((e: any) => e.epsActual != null && e.epsEstimate != null && e.epsActual > e.epsEstimate).length;
      score = Math.min(10, 3 + Math.round(beats * 2));
      return { score, subtitle: `${beats}/${earningsHist.length} earnings beats` };
    }
    if (pctChange > 2) score = 7; else if (pctChange < -2) score = 4;
    return { score, subtitle: 'Based on recent price action' };
  })();

  const tech = scoreTechnical(techs);

  const quant = (() => {
    let score = 5;
    const instPct = num(instData?.percentage);
    if (instPct > 60) score += 3; else if (instPct > 30) score += 2; else if (instPct > 10) score += 1;
    if (recData) {
      const buySignals = (recData.strongBuy || 0) + (recData.buy || 0);
      const sellSignals = (recData.sell || 0) + (recData.strongSell || 0);
      if (buySignals > sellSignals * 2) score += 2; else if (buySignals > sellSignals) score += 1;
    }
    return { score: Math.min(10, Math.max(0, score)), subtitle: num(instData?.percentage) > 0 ? `Institutional ownership: ${num(instData?.percentage).toFixed(1)}%` : 'Institutional data limited' };
  })();

  const risk = (() => {
    let score = 7;
    if (debtToEquity != null) { if (debtToEquity < 30) score += 2; else if (debtToEquity > 100) score -= 2; }
    const vol52 = high52 > 0 && low52 > 0 ? (high52 - low52) / low52 : 0;
    if (vol52 > 0.6) score -= 1;
    if (beta > 0) { if (beta > 1.5) score -= 1; else if (beta < 0.8) score += 1; }
    score = Math.min(10, Math.max(0, score));
    return { score, subtitle: `${debtToEquity != null ? `D/E: ${debtToEquity.toFixed(1)}` : 'D/E: N/A'}; 52W range: ${(vol52 * 100).toFixed(0)}%` };
  })();

  const macro = (() => {
    let score = 6;
    if (revenueGrowth != null && revenueGrowth > 0.1) score += 2; else if (revenueGrowth != null && revenueGrowth > 0) score += 1;
    if (profitMargins != null && profitMargins > 0.15) score += 1;
    if (pctChange >= 0) score += 1;
    return { score: Math.min(10, Math.max(0, score)), subtitle: revenueGrowth != null ? `Revenue growth: ${(revenueGrowth * 100).toFixed(1)}%` : 'Revenue growth data unavailable' };
  })();

  // Apply investment style weights
  const weights = getStyleWeights(investmentStyle || null);
  const rawScores = [fund.score, val.score, moat.score, momentum.score, tech.score, quant.score, risk.score, macro.score];
  const maxScores = [20, 15, 10, 10, 15, 10, 10, 10];
  const weightedScores = rawScores.map((s, i) => Math.min(maxScores[i], Math.round(s * weights[i])));
  let totalScore = weightedScores.reduce((a, b) => a + b, 0);

  // === Momentum Bias Correction ===
  // If technical score is strong but fundamentals are weak, penalize
  const techPct = (weightedScores[4] / maxScores[4]) * 100;
  const fundPct = (weightedScores[0] / maxScores[0]) * 100;
  if (techPct > 80 && fundPct < 50) {
    totalScore = Math.round(totalScore * 0.88); // reduce by ~12%
  }

  // Preliminary volatility for guardrails (full vol52 computed later with fair value)
  const vol52Prelim = high52 > 0 && low52 > 0 ? (high52 - low52) / low52 : 0;

  // === Valuation Guardrail ===
  // Prevent inflated scores when price is well above fair value

  // Score-to-verdict mapping (used later after all adjustments)
  const getScoreVerdict = (s: number) => {
    if (s >= 90) return { badge: "⬛ STRONG BUY", range: "90–100 = STRONG BUY" };
    if (s >= 75) return { badge: "⬛ BUY", range: "75–89 = BUY" };
    if (s >= 60) return { badge: "⬛ ACCUMULATE", range: "60–74 = ACCUMULATE" };
    if (s >= 45) return { badge: "⬛ HOLD", range: "45–59 = HOLD" };
    if (s >= 30) return { badge: "⬛ REDUCE", range: "30–44 = REDUCE" };
    return { badge: "⬛ SELL", range: "Below 30 = SELL" };
  };

  // === Scenario-Based Price Projection Engine ===
  // Derive base financial assumptions from real data
  const eps = num(quote?.eps);
  const baseRevGrowth = revenueGrowth != null ? revenueGrowth : 0.10;
  const baseOpMargin = profitMargins != null ? profitMargins : 0.12;
  const basePE = pe > 0 ? pe : 20;
  const revenue = marketCap > 0 && profitMargins != null && eps > 0
    ? (eps * (marketCap / price)) / (profitMargins || 0.1)
    : price * 100; // fallback

  // Scenario assumptions: each modifies growth, margin, and multiple independently
  const scenarios = {
    bull: {
      revGrowth: Math.min(baseRevGrowth + 0.08, 0.50),
      opMargin: Math.min(baseOpMargin + 0.03, 0.40),
      peMultiple: Math.round(basePE * 1.25),
    },
    base: {
      revGrowth: baseRevGrowth,
      opMargin: baseOpMargin,
      peMultiple: Math.round(basePE),
    },
    bear: {
      revGrowth: Math.max(baseRevGrowth - 0.08, -0.10),
      opMargin: Math.max(baseOpMargin - 0.03, 0.02),
      peMultiple: Math.max(Math.round(basePE * 0.75), 5),
    },
  };

  // Calculate projected EPS and target price for each scenario
  const calcScenarioPrice = (s: typeof scenarios.bull) => {
    const projRevenue = revenue * (1 + s.revGrowth);
    const projEarnings = projRevenue * s.opMargin;
    const sharesOutstanding = marketCap > 0 ? marketCap / price : 1;
    const projEps = sharesOutstanding > 0 ? projEarnings / sharesOutstanding : eps * (1 + s.revGrowth);
    const targetPrice = projEps * s.peMultiple;
    return { targetPrice: Math.round(targetPrice), projEps: parseFloat(projEps.toFixed(2)) };
  };

  let bullCalc = calcScenarioPrice(scenarios.bull);
  let baseCalc = calcScenarioPrice(scenarios.base);
  let bearCalc = calcScenarioPrice(scenarios.bear);

  // Use analyst targets as anchors/overrides when available
  if (fin?.targetHighPrice && fin?.targetMeanPrice && fin?.targetLowPrice) {
    // Blend: 60% model + 40% analyst
    bullCalc.targetPrice = Math.round(bullCalc.targetPrice * 0.6 + fin.targetHighPrice * 0.4);
    baseCalc.targetPrice = Math.round(baseCalc.targetPrice * 0.6 + fin.targetMeanPrice * 0.4);
    bearCalc.targetPrice = Math.round(bearCalc.targetPrice * 0.6 + fin.targetLowPrice * 0.4);
  }

  // Enforce separation: bull > base > bear, and all must be distinct
  const sorted = [
    { key: 'bull', calc: bullCalc },
    { key: 'base', calc: baseCalc },
    { key: 'bear', calc: bearCalc },
  ].sort((a, b) => b.calc.targetPrice - a.calc.targetPrice);

  let adjBull = sorted[0].calc.targetPrice;
  let adjBase = sorted[1].calc.targetPrice;
  let adjBear = sorted[2].calc.targetPrice;

  // If any are identical, force separation
  if (adjBull === adjBase) adjBull = Math.round(adjBase * 1.15);
  if (adjBase === adjBear) adjBear = Math.round(adjBase * 0.85);
  if (adjBull === adjBear) { adjBull = Math.round(price * 1.25); adjBear = Math.round(price * 0.80); }

  const bullProjEps = sorted[0].calc.projEps;
  const baseProjEps = sorted[1].calc.projEps;
  const bearProjEps = sorted[2].calc.projEps;

  const expectedPrice = Math.round(adjBull * 0.25 + adjBase * 0.50 + adjBear * 0.25);
  const expectedReturnPct = ((expectedPrice - price) / price) * 100;
  const expectedReturnAbs = Math.abs(expectedReturnPct).toFixed(1);
  const isUpside = expectedReturnPct >= 0;

  // === Valuation Triangle: 3 independent models with weighted composite ===
  const dcfWeight = 0.40, relWeight = 0.35, momWeight = 0.25;

  // 1. DCF Valuation: projected EPS × base P/E
  const dcfTarget = Math.round(baseCalc.targetPrice > 0 ? baseCalc.targetPrice : price);
  const dcfSignalTri: 'Bullish' | 'Bearish' | 'Neutral' = dcfTarget > price * 1.05 ? 'Bullish' : dcfTarget < price * 0.95 ? 'Bearish' : 'Neutral';

  // 2. Relative Valuation: sector P/E comparison
  const sectorPE = fin?.targetMeanPrice && eps > 0
    ? Math.round(fin.targetMeanPrice / eps)
    : basePE > 0 ? Math.round(basePE * 0.9) : 18;
  const relativeTarget = eps > 0 ? Math.round(eps * sectorPE) : Math.round(price * 0.95);
  const relSignal: 'Bullish' | 'Bearish' | 'Neutral' = relativeTarget > price * 1.05 ? 'Bullish' : relativeTarget < price * 0.95 ? 'Bearish' : 'Neutral';

  // 3. Momentum Valuation: price trend extrapolation using SMA trajectory
  const momentumTarget = (() => {
    if (techs && techs.sma50 && techs.sma200) {
      const trendStrength = (techs.sma50 - techs.sma200) / techs.sma200;
      return Math.round(price * (1 + trendStrength));
    }
    const mid52 = (high52 + low52) / 2;
    const reversion = (mid52 - price) * 0.5;
    return Math.round(price + reversion);
  })();
  const momSignal: 'Bullish' | 'Bearish' | 'Neutral' = momentumTarget > price * 1.05 ? 'Bullish' : momentumTarget < price * 0.95 ? 'Bearish' : 'Neutral';

  // Weighted composite: DCF 40%, Relative 35%, Momentum 25%
  const compositeTarget = Math.round(dcfTarget * dcfWeight + relativeTarget * relWeight + momentumTarget * momWeight);
  const compositeReturnPct = ((compositeTarget - price) / price) * 100;
  const compositeIsUpside = compositeReturnPct >= 0;

  // === Fair Value Range with market-cap-aware band compression ===
  let fvLow = adjBear;
  let fvHigh = adjBull;
  const fvMidRaw = Math.round((fvLow + fvHigh) / 2);

  // Determine max allowed band width as % of midpoint based on company profile
  const isSmallCap = marketCap > 0 && marketCap < 5e9;
  const isMidCapVolatile = marketCap >= 5e9 && marketCap < 50e9 && vol52Prelim > 0.4;
  const maxBandPct = isSmallCap ? 0.70 : isMidCapVolatile ? 0.60 : 0.50;

  const bandWidth = fvMidRaw > 0 ? (fvHigh - fvLow) / fvMidRaw : 0;
  if (bandWidth > maxBandPct) {
    // Compress symmetrically around midpoint
    const halfBand = fvMidRaw * (maxBandPct / 2);
    fvLow = Math.round(fvMidRaw - halfBand);
    fvHigh = Math.round(fvMidRaw + halfBand);
  }
  // If range is too narrow (<10% of midpoint), widen slightly
  if (fvMidRaw > 0 && bandWidth < 0.10) {
    fvLow = Math.round(fvMidRaw * 0.93);
    fvHigh = Math.round(fvMidRaw * 1.07);
  }
  const fvMid = fvMidRaw;

  // === Market Regime Detection ===
  const detectMarketRegime = (): { regime: 'Bull Market' | 'Bear Market' | 'Sideways Market'; signals: string[]; adjustment: string } => {
    const signals: string[] = [];
    let bullSignals = 0, bearSignals = 0;

    // Index trend via SMA
    if (techs) {
      if (techs.sma50 && techs.sma200 && techs.sma50 > techs.sma200) { bullSignals++; signals.push("Golden cross (SMA50 > SMA200)"); }
      else if (techs.sma50 && techs.sma200) { bearSignals++; signals.push("Death cross (SMA50 < SMA200)"); }
      // Volatility
      const vol = (high52 - low52) / low52;
      if (vol > 0.50) { bearSignals++; signals.push("High 52W volatility"); }
      else { signals.push("Moderate volatility"); }
      // Breadth proxy: price position in 52W range
      const posIn52W = (price - low52) / (high52 - low52);
      if (posIn52W > 0.65) { bullSignals++; signals.push("Price in upper 52W range"); }
      else if (posIn52W < 0.35) { bearSignals++; signals.push("Price in lower 52W range"); }
      else { signals.push("Price in mid 52W range"); }
    }
    if (pctChange > 1) { bullSignals++; } else if (pctChange < -1) { bearSignals++; }

    if (bullSignals >= 2) return { regime: 'Bull Market', signals, adjustment: 'Momentum weighted higher' };
    if (bearSignals >= 2) return { regime: 'Bear Market', signals, adjustment: 'Risk and valuation weighted higher' };
    return { regime: 'Sideways Market', signals, adjustment: 'Balanced weighting applied' };
  };
  const marketRegime = detectMarketRegime();

  // === Factor Exposure Map (0-10 each) ===
  const factorExposure = [
    { name: "Growth", score: Math.min(10, Math.max(0, revenueGrowth != null ? Math.round(revenueGrowth * 40) : 4)) },
    { name: "Value", score: Math.min(10, Math.max(0, pe > 0 ? Math.round(10 - Math.min(pe / 6, 10)) : 5)) },
    { name: "Momentum", score: Math.min(10, Math.max(0, techs ? Math.round((techs.rsi / 10) * (price > (techs.sma50 || price) ? 1.1 : 0.8)) : 5)) },
    { name: "Quality", score: Math.min(10, Math.max(0, Math.round((profitMargins != null ? profitMargins * 30 : 4) + (returnOnEquity != null ? returnOnEquity * 15 : 2)))) },
    { name: "Volatility", score: Math.min(10, Math.max(0, Math.round(10 - (beta > 0 ? beta * 3 : 5)))) },
    { name: "Macro Sensitivity", score: Math.min(10, Math.max(0, Math.round((macro.score / 10) * 10))) },
  ];


  // === Target Price = Fair Value Midpoint ===
  const targetPrice = fvMid;
  const targetReturnPct = ((targetPrice - price) / price) * 100;
  const targetReturnAbs = Math.abs(targetReturnPct).toFixed(1);
  const targetIsUpside = targetReturnPct >= 0;
  const targetReturnStr = `${targetIsUpside ? '+' : '-'}${targetReturnAbs}%`;
  const targetReturnLabel = targetIsUpside ? "Expected Upside" : "Expected Downside";

  // === Valuation Guardrail: cap recommendation if price >> fair value ===
  const priceAboveFV = fvMid > 0 ? (price - fvMid) / fvMid : 0;
  const maxVerdictIfOvervalued = priceAboveFV > 0.15; // price > 115% of fair value

  // === Recommendation based on score thresholds ===
  const VERDICT_LEVELS = ["Sell", "Reduce", "Hold", "Accumulate", "Buy", "Strong Buy"];
  const getScoreBasedVerdict = (score: number): string => {
    if (score >= 90) return "Strong Buy";
    if (score >= 75) return "Buy";
    if (score >= 60) return "Accumulate";
    if (score >= 45) return "Hold";
    if (score >= 30) return "Reduce";
    return "Sell";
  };

  const downgradeVerdict = (v: string): string => {
    const idx = VERDICT_LEVELS.indexOf(v);
    return idx > 0 ? VERDICT_LEVELS[idx - 1] : v;
  };

  let verdict = getScoreBasedVerdict(totalScore);

  // === Market Regime Adjustment: Bear market downgrades by one level ===
  // (marketRegime computed later, so we do a preliminary check here)
  const prelimBull = techs?.sma50 && techs?.sma200 && techs.sma50 > techs.sma200 ? 1 : 0;
  const prelimBear = (techs?.sma50 && techs?.sma200 && techs.sma50 < techs.sma200 ? 1 : 0)
    + (vol52Prelim > 0.50 ? 1 : 0)
    + (pctChange < -1 ? 1 : 0);
  const isBearRegime = prelimBear >= 2 && prelimBull === 0;
  if (isBearRegime) {
    verdict = downgradeVerdict(verdict);
  }

  // === Valuation Guardrail: if price > 115% of fair value, max = Hold ===
  if (maxVerdictIfOvervalued) {
    const maxIdx = VERDICT_LEVELS.indexOf("Hold");
    const curIdx = VERDICT_LEVELS.indexOf(verdict);
    if (curIdx > maxIdx) verdict = "Hold";
  }

  // === High Volatility Downgrade ===
  if (vol52Prelim > 0.60 && (verdict === "Strong Buy" || verdict === "Buy")) {
    verdict = downgradeVerdict(verdict);
  }

  // === Accumulation Zone: relative to CMP ===
  // For Buy recs: zone includes/slightly below CMP using nearest support
  // For Hold/Reduce: zone is a lower entry range
  const support1 = techs ? Math.round(Math.min(price, low52 + (price - low52) * 0.7)) : Math.round(price * 0.95);
  const isBuyVerdict = verdict === 'Strong Buy' || verdict === 'Buy' || verdict === 'Accumulate';
  const accZoneLow = isBuyVerdict ? Math.round(Math.min(price * 0.97, support1)) : Math.round(fvMid * 0.94);
  const accZoneHigh = isBuyVerdict ? Math.round(price * 1.02) : Math.round(fvMid * 1.0);
  const showAccZone = true; // Always show — entry guidance is always useful

  // === Optimal Entry Zone: support-based ===
  const support2 = techs ? Math.round(low52 + (price - low52) * 0.4) : Math.round(price * 0.90);
  const optEntryLow = Math.round(Math.max(support1, support2));
  const optEntryHigh = Math.round(price);
  const optEntryBasis = techs ? "Based on nearest support levels and recent price structure" : "Based on estimated support range";

  // Model confidence — capped at 85%, adjusted for volatility and sector risk
  const confidenceFactors: string[] = [];
  let confidenceScore = 50;
  if (earningsHist.length >= 3) { confidenceScore += 10; confidenceFactors.push("Earnings history available"); }
  const vol52 = high52 > 0 && low52 > 0 ? (high52 - low52) / low52 : 0;
  if (vol52 < 0.4) { confidenceScore += 10; confidenceFactors.push("Low volatility"); } else { confidenceFactors.push("High volatility reduces confidence"); }
  if (pe > 0) confidenceScore += 5;
  if (profitMargins != null) confidenceScore += 5;
  if (revenueGrowth != null) confidenceScore += 5;
  if (fin?.targetMeanPrice) { confidenceScore += 10; confidenceFactors.push("Analyst targets available"); }
  if (debtToEquity != null) confidenceScore += 3;
  if (returnOnEquity != null) confidenceScore += 2;

  // Sector/volatility confidence penalty
  const sectorLower = sector.toLowerCase();
  const isHighVolSector = ['financial services', 'banks', 'financial', 'banking'].some(s => sectorLower.includes(s))
    || (debtToEquity != null && debtToEquity > 200)
    || beta > 1.5
    || vol52 > 0.6;
  if (isHighVolSector) {
    confidenceScore -= 8;
    confidenceFactors.push("High-volatility sector reduces confidence");
  }

  // Cap at 85% per spec
  confidenceScore = Math.min(85, Math.max(40, confidenceScore));
  const confidenceLevel: 'Low' | 'Moderate' | 'High' = confidenceScore >= 70 ? 'High' : confidenceScore >= 55 ? 'Moderate' : 'Low';

  // Model agreement
  const dcfSignal: 'Bullish' | 'Bearish' | 'Neutral' = price < adjBase ? 'Bullish' : price > adjBull ? 'Bearish' : 'Neutral';
  const relValSignal: 'Bullish' | 'Bearish' | 'Neutral' = pe > 0 ? (pe < 20 ? 'Bullish' : pe > 40 ? 'Bearish' : 'Neutral') : 'Neutral';
  const techTrendSignal: 'Bullish' | 'Bearish' | 'Neutral' = techs ? (price > (techs.sma200 || 0) && techs.rsi > 40 ? 'Bullish' : price < (techs.sma200 || 0) && techs.rsi < 60 ? 'Bearish' : 'Neutral') : 'Neutral';
  const sectorMomSignal: 'Bullish' | 'Bearish' | 'Neutral' = pctChange > 1 ? 'Bullish' : pctChange < -1 ? 'Bearish' : 'Neutral';
  const agreementModels = [
    { name: "DCF Valuation", signal: dcfSignal },
    { name: "Relative Valuation", signal: relValSignal },
    { name: "Technical Trend", signal: techTrendSignal },
    { name: "Sector Momentum", signal: sectorMomSignal },
  ];
  const bullCount = agreementModels.filter(m => m.signal === 'Bullish').length;
  const bearCount = agreementModels.filter(m => m.signal === 'Bearish').length;
  // Model agreement: equal = Neutral, diff 1 = Moderate, diff 2+ = High
  const agreementDiff = Math.abs(bullCount - bearCount);
  const agreementLevel: 'Low' | 'Moderate' | 'High' = agreementDiff >= 2 ? 'High' : agreementDiff === 1 ? 'Moderate' : 'Low';
  if (agreementLevel === 'High' && bullCount > bearCount) confidenceScore = Math.min(85, confidenceScore + 5);

  // === Final Consistency Validation ===
  // If model agreement is bearish-dominant but verdict is Buy+, downgrade
  if (bearCount > bullCount && (verdict === 'Strong Buy' || verdict === 'Buy')) {
    verdict = downgradeVerdict(verdict);
  }

  // Key drivers — sector-aware
  const keyDrivers: string[] = [];
  const isBanking = ['financial services', 'banks', 'financial', 'banking'].some(s => sectorLower.includes(s));
  const isTech = ['technology', 'software', 'internet', 'semiconductor'].some(s => sectorLower.includes(s));
  const isIndustrial = ['industrials', 'manufacturing', 'industrial', 'materials', 'basic materials'].some(s => sectorLower.includes(s));

  if (isBanking) {
    if (revenueGrowth != null) keyDrivers.push(revenueGrowth > 0 ? "Loan growth and interest income expansion" : "Declining interest income");
    if (profitMargins != null) keyDrivers.push(profitMargins > 0.15 ? "Strong net interest margin" : "Net interest margin under pressure");
    if (debtToEquity != null) keyDrivers.push("Capital adequacy and asset quality");
    keyDrivers.push("NPA trends and provisioning outlook");
  } else if (isTech) {
    if (revenueGrowth != null) keyDrivers.push(revenueGrowth > 0.15 ? "Strong earnings growth trajectory" : revenueGrowth > 0 ? "Moderate growth momentum" : "Revenue growth stalling");
    if (profitMargins != null) keyDrivers.push(profitMargins > 0.20 ? "Margin expansion from scale" : "Margin pressure from R&D intensity");
    keyDrivers.push("Cloud / product adoption trends");
    if (pe > 30) keyDrivers.push("Premium valuation — growth expectations priced in");
  } else if (isIndustrial) {
    if (revenueGrowth != null) keyDrivers.push(revenueGrowth > 0 ? "Revenue growth from order backlog" : "Declining order pipeline");
    if (profitMargins != null) keyDrivers.push(profitMargins > 0.10 ? "Healthy operating margins" : "Margin compression from input costs");
    keyDrivers.push("Sector demand and capex cycle outlook");
  } else {
    // Generic drivers
    if (revenueGrowth != null) keyDrivers.push(revenueGrowth > 0 ? "Revenue growth expectations" : "Revenue contraction risk");
    if (pe > 0) keyDrivers.push(pe > 30 ? "Valuation premium vs sector" : "Reasonable valuation");
    if (profitMargins != null && profitMargins < 0.08) keyDrivers.push("Margin compression risk");
    else if (profitMargins != null && profitMargins > 0.15) keyDrivers.push("Strong profit margins");
  }
  if (pctChange > 2 || pctChange < -2) keyDrivers.push("Sector rotation trends");
  if (beta > 1.3) keyDrivers.push("High beta amplifies market moves");
  if (keyDrivers.length === 0) keyDrivers.push("Limited fundamental drivers available");
  const finalKeyDrivers = keyDrivers.slice(0, 4);

  // Keep scenario-level return for display (expectedPrice is probability-weighted)
  // But the primary "target" and "return" shown to user = fair value midpoint
  const expectedReturnStr = `${isUpside ? '+' : '-'}${expectedReturnAbs}%`;
  const expectedReturnLabel = isUpside ? "Expected Upside" : "Expected Downside";

  const entryLow = Math.round(price * 0.95);
  const entryHigh = Math.round(price * 1.0);
  const stopLoss = Math.round(price * 0.88);
  const t1 = Math.round(price * 1.15);
  const t2 = Math.round(price * 1.25);
  const t3 = adjBull;
  const riskAmt = entryLow - stopLoss;
  const rewardAmt = t2 - entryLow;
  const rrRatio = riskAmt > 0 ? `1 : ${(rewardAmt / riskAmt).toFixed(1)}` : '1 : N/A';

  const changeSign = change >= 0 ? '+' : '';
  const pctSign = pctChange >= 0 ? '+' : '';

  const techSignals = techs ? [
    { name: "50-Day SMA", value: techs.sma50 ? (price > techs.sma50 ? "ABOVE ✓" : "BELOW ✗") : "N/A", status: (techs.sma50 && price > techs.sma50 ? "positive" : techs.sma50 ? "negative" : "neutral") as 'positive' | 'negative' | 'neutral' },
    { name: "100-Day SMA", value: techs.sma100 ? (price > techs.sma100 ? "ABOVE ✓" : "BELOW ✗") : "N/A", status: (techs.sma100 && price > techs.sma100 ? "positive" : techs.sma100 ? "negative" : "neutral") as 'positive' | 'negative' | 'neutral' },
    { name: "200-Day SMA", value: techs.sma200 ? (price > techs.sma200 ? "ABOVE ✓" : "BELOW ✗") : "N/A", status: (techs.sma200 && price > techs.sma200 ? "positive" : techs.sma200 ? "negative" : "neutral") as 'positive' | 'negative' | 'neutral' },
    { name: "RSI (14)", value: `${fmt(techs.rsi, 0)} ${techs.rsi > 70 ? 'OVERBOUGHT' : techs.rsi < 30 ? 'OVERSOLD' : 'NEUTRAL'}`, status: (techs.rsi > 70 ? "negative" : techs.rsi < 30 ? "positive" : "neutral") as 'positive' | 'negative' | 'neutral' },
    { name: "Key Support", value: `${currency}${Math.round(low52)}`, status: "neutral" as const },
    { name: "Key Resistance", value: `${currency}${Math.round(high52)}`, status: "neutral" as const },
    { name: "52W from Peak", value: `${((price - high52) / high52 * 100).toFixed(1)}%`, status: (price > high52 * 0.9 ? "positive" : "negative") as 'positive' | 'negative' },
    { name: "Avg Volume (3D)", value: techs.avgVol3 > 0 ? fmtLarge(techs.avgVol3) : "N/A", status: "neutral" as const },
  ] : [{ name: "Technical Data", value: "Insufficient historical data", status: "neutral" as const }];

  const dividendYieldStr = (() => {
    const dy = divData?.yield;
    if (dy != null && dy > 0) return `${(dy * 100).toFixed(2)}%`;
    return 'N/A';
  })();

  return {
    company: companyName,
    investmentStyle: investmentStyle || null,
    subtitle: `${companyName} · ${safe(quote?.exchange, exchange)} · ${ticker}`,
    verdictBadge: v.badge,
    reportType: `Institutional Equity Research · 12-Month Horizon · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    headerMetrics: [
      { label: "CMP", value: `${currency}${fmt(price)}`, change: `${pctSign}${fmt(pctChange)}% today` },
      { label: "Market Cap", value: marketCap > 0 ? `${currency}${fmtLarge(marketCap)}` : 'N/A', change: sector },
      { label: "52W Range", value: `${currency}${fmt(high52, 0)} / ${currency}${fmt(low52, 0)}`, change: `${((price - high52) / high52 * 100).toFixed(1)}% from peak` },
      { label: "P/E (TTM)", value: pe > 0 ? `${fmt(pe, 1)}x` : 'N/A', change: `EPS: ${num(quote?.eps) > 0 ? currency + fmt(num(quote?.eps)) : 'N/A'}` },
      { label: "Prev Close", value: `${currency}${fmt(prevClose)}`, change: `Change: ${changeSign}${fmt(change)}` },
      { label: "Volume", value: safe(quote?.volume, 'N/A'), change: `Avg: ${safe(quote?.average_volume, 'N/A')}` },
    ],
    totalScore,
    verdict,
    verdictNote: isBuyVerdict ? 'Strong conviction — accumulate at current levels' : targetReturnPct < 0 ? `Wait for pullback to ${currency}${accZoneLow}–${currency}${accZoneHigh}` : 'Fair value — hold existing positions',
    scoreRange: v.range,
    scores: [
      { step: 1, name: "Fundamental Quality", subtitle: fund.subtitle, score: weightedScores[0], maxScore: 20, weight: `${Math.round(weights[0] * 100 / weights.reduce((a, b) => a + b, 0) * 8)}% wt` },
      { step: 2, name: "Intrinsic Valuation", subtitle: val.subtitle, score: weightedScores[1], maxScore: 15, weight: `${Math.round(weights[1] * 100 / weights.reduce((a, b) => a + b, 0) * 8)}% wt` },
      { step: 3, name: "Competitive Moat", subtitle: moat.subtitle, score: weightedScores[2], maxScore: 10, weight: `${Math.round(weights[2] * 100 / weights.reduce((a, b) => a + b, 0) * 8)}% wt` },
      { step: 4, name: "Earnings Momentum", subtitle: momentum.subtitle, score: weightedScores[3], maxScore: 10, weight: `${Math.round(weights[3] * 100 / weights.reduce((a, b) => a + b, 0) * 8)}% wt` },
      { step: 5, name: "Technical Strength", subtitle: tech.subtitle, score: weightedScores[4], maxScore: 15, weight: `${Math.round(weights[4] * 100 / weights.reduce((a, b) => a + b, 0) * 8)}% wt` },
      { step: 6, name: "Quantitative Signals", subtitle: quant.subtitle, score: weightedScores[5], maxScore: 10, weight: `${Math.round(weights[5] * 100 / weights.reduce((a, b) => a + b, 0) * 8)}% wt` },
      { step: 7, name: "Risk Stability", subtitle: risk.subtitle, score: weightedScores[6], maxScore: 10, weight: `${Math.round(weights[6] * 100 / weights.reduce((a, b) => a + b, 0) * 8)}% wt` },
      { step: 8, name: "Macro Tailwinds", subtitle: macro.subtitle, score: weightedScores[7], maxScore: 10, weight: `${Math.round(weights[7] * 100 / weights.reduce((a, b) => a + b, 0) * 8)}% wt` },
    ],
    executiveSummary: [
      `<strong>${companyName}</strong> is currently trading at <strong>${currency}${fmt(price)}</strong> with a ${pctSign}${fmt(pctChange)}% change today. The stock operates in the <strong>${sector}</strong> sector${profile?.country ? ` based in <strong>${profile.country}</strong>` : ''}.`,
      `From a valuation perspective, the stock trades at <strong>${pe > 0 ? fmt(pe, 1) + 'x P/E' : 'N/A P/E'}</strong>. ${profitMargins != null ? `Net profit margin is <strong>${(profitMargins * 100).toFixed(1)}%</strong>.` : ''} ${revenueGrowth != null ? `Revenue growth stands at <strong>${(revenueGrowth * 100).toFixed(1)}%</strong> YoY.` : ''} The 52-week range of ${currency}${fmt(high52, 0)} to ${currency}${fmt(low52, 0)} suggests the stock is <strong>${((price - low52) / (high52 - low52) * 100).toFixed(0)}% through its annual range</strong>.`,
      `Our multi-factor analysis yields a total score of <strong>${totalScore}/100</strong>, resulting in a <strong>${verdict}</strong> recommendation. The 12-month target price is <strong>${currency}${targetPrice}</strong> (fair value midpoint), representing a <strong>${targetReturnStr} ${targetReturnLabel.toLowerCase()}</strong> from current levels.`,
    ],
    modelSummaries: [
      { num: "01", model: "Stock Screener", firm: "Goldman Sachs", abstract: `P/E at ${pe > 0 ? fmt(pe, 1) + 'x' : 'N/A'}, ${pctChange >= 0 ? 'positive' : 'negative'} momentum. Fundamental score: ${fund.score}/20.`, sentiment: fund.score >= 14 ? "positive" : fund.score >= 10 ? "neutral" : "negative" },
      { num: "02", model: "DCF Valuation", firm: "Morgan Stanley", abstract: `Intrinsic value range ${currency}${adjBear}–${currency}${adjBull}. Current price ${price > adjBase ? 'above' : 'below'} base estimate of ${currency}${adjBase}.`, sentiment: price <= adjBase ? "positive" : "negative" },
      { num: "03", model: "Risk Analysis", firm: "Bridgewater", abstract: `${debtToEquity != null ? `D/E: ${debtToEquity.toFixed(1)}.` : ''} 52W range spread: ${((high52 - low52) / low52 * 100).toFixed(0)}%. Risk score: ${risk.score}/10.`, sentiment: risk.score >= 7 ? "positive" : risk.score >= 5 ? "neutral" : "negative" },
      { num: "04", model: "Earnings Breakdown", firm: "JPMorgan", abstract: `EPS: ${num(quote?.eps) > 0 ? currency + fmt(num(quote?.eps)) : 'N/A'}. ${pctChange >= 0 ? 'Positive price action' : 'Negative momentum'} today at ${pctSign}${fmt(pctChange)}%.`, sentiment: pctChange >= 0 ? "positive" : "negative" },
      { num: "05", model: "Portfolio Construction", firm: "BlackRock", abstract: `Expected return: ${expectedReturnStr}. Risk/Reward: ${rrRatio}. ${totalScore >= 70 ? 'Portfolio-worthy' : 'Position sizing caution advised'}.`, sentiment: totalScore >= 70 ? "positive" : "neutral" },
      { num: "06", model: "Technical Analysis", firm: "Citadel", abstract: `${techs ? `RSI: ${fmt(techs.rsi, 0)}. ${price > (techs.sma200 || 0) ? 'Above' : 'Below'} 200 DMA. ${price > (techs.sma50 || 0) ? 'Short-term bullish' : 'Short-term bearish'}.` : 'Insufficient data.'}`, sentiment: tech.score >= 10 ? "positive" : tech.score >= 7 ? "neutral" : "negative" },
      { num: "07", model: "Dividend Strategy", firm: "Harvard Endowment", abstract: `Yield: ${dividendYieldStr}. ${divData?.yield != null && divData.yield > 0.02 ? 'Income-grade yield' : 'Capital appreciation focus'}.`, sentiment: divData?.yield != null && divData.yield > 0.02 ? "positive" : "neutral" },
      { num: "08", model: "Competitive Advantage", firm: "Bain & Company", abstract: `Moat score: ${moat.score}/10. Sector: ${sector}. ${moat.score >= 7 ? 'Strong competitive position' : 'Moderate competitive standing'}.`, sentiment: moat.score >= 7 ? "positive" : "neutral" },
      { num: "09", model: "Pattern Finder", firm: "Renaissance", abstract: `${techs ? `${techs.sma50 && techs.sma200 ? (techs.sma50 > techs.sma200 ? 'Golden cross — bullish' : 'Death cross — bearish') : 'SMA data limited'}. Price ${((price - high52) / high52 * 100).toFixed(1)}% from 52W high.` : 'Insufficient data.'}`, sentiment: techs?.sma50 && techs?.sma200 && techs.sma50 > techs.sma200 ? "positive" : "negative" },
      { num: "10", model: "Macro Impact", firm: "McKinsey", abstract: `${revenueGrowth != null ? `Revenue growth: ${(revenueGrowth * 100).toFixed(1)}%.` : ''} ${pe > 40 ? 'Premium valuation in current cycle' : 'Reasonable valuation for macro environment'}. Macro score: ${macro.score}/10.`, sentiment: macro.score >= 7 ? "positive" : "neutral" },
    ],
    tags: [
      { label: sector, highlighted: true },
      { label: safe(profile?.country || country), highlighted: true },
      { label: pe > 40 ? 'Premium Valuation' : pe > 20 ? 'Fair Valuation' : 'Value', highlighted: false },
      { label: pctChange > 0 ? 'Positive Momentum' : 'Negative Momentum', highlighted: false },
      { label: verdict, highlighted: false },
    ],
    fundamentalMetrics: (() => {
      const metrics: any[] = [
        { label: "P/E Ratio (TTM)", value: pe > 0 ? `${fmt(pe, 1)}x` : 'N/A', note: `EPS: ${num(quote?.eps) > 0 ? currency + fmt(num(quote?.eps)) : 'N/A'}`, color: (pe > 40 ? 'red' : pe > 20 ? 'gold' : pe > 0 ? 'green' : 'muted') as any },
        { label: "Current Price", value: `${currency}${fmt(price)}`, note: `${pctSign}${fmt(pctChange)}% today`, color: (pctChange >= 0 ? 'green' : 'red') as any },
        { label: "Market Cap", value: marketCap > 0 ? `${currency}${fmtLarge(marketCap)}` : 'N/A', note: sector !== 'N/A' ? sector : '', color: 'muted' as any },
      ];
      if (returnOnEquity != null) metrics.push({ label: "ROE", value: `${(returnOnEquity * 100).toFixed(1)}%`, note: "Return on equity", color: (returnOnEquity > 0.15 ? 'green' : returnOnEquity > 0.08 ? 'gold' : 'red') as any });
      if (debtToEquity != null) metrics.push({ label: "Debt/Equity", value: `${debtToEquity.toFixed(1)}`, note: debtToEquity < 50 ? "Conservative leverage" : "High leverage", color: (debtToEquity < 50 ? 'green' : debtToEquity < 100 ? 'gold' : 'red') as any });
      if (profitMargins != null) metrics.push({ label: "Profit Margin", value: `${(profitMargins * 100).toFixed(1)}%`, note: "Net profit margin", color: (profitMargins > 0.15 ? 'green' : profitMargins > 0.05 ? 'gold' : 'red') as any });
      if (revenueGrowth != null) metrics.push({ label: "Revenue Growth", value: `${(revenueGrowth * 100).toFixed(1)}%`, note: "Year-over-year", color: (revenueGrowth > 0.1 ? 'green' : revenueGrowth > 0 ? 'gold' : 'red') as any });
      metrics.push({ label: "52-Week Range", value: `${currency}${fmt(low52, 0)} – ${currency}${fmt(high52, 0)}`, note: `${((price - high52) / high52 * 100).toFixed(1)}% from peak`, color: 'muted' as any });
      return metrics;
    })(),
    fundamentalNote: `${companyName} is currently priced at ${currency}${fmt(price)} with a P/E ratio of ${pe > 0 ? fmt(pe, 1) + 'x' : 'N/A'}. ${profitMargins != null ? `Net profit margin stands at ${(profitMargins * 100).toFixed(1)}%.` : ''} ${revenueGrowth != null ? `Revenue growth is ${(revenueGrowth * 100).toFixed(1)}% YoY.` : ''} The stock is trading ${((price - low52) / (high52 - low52) * 100).toFixed(0)}% through its 52-week range.`,
    dcfAssumptions: (() => {
      const items = [
        { label: "Current Price", value: `${currency}${fmt(price)}` },
        { label: "P/E (TTM)", value: pe > 0 ? `${fmt(pe, 1)}x` : 'N/A' },
        { label: "EPS (TTM)", value: num(quote?.eps) > 0 ? `${currency}${fmt(num(quote?.eps))}` : 'N/A' },
        { label: "52W High", value: `${currency}${fmt(high52, 0)}` },
        { label: "52W Low", value: `${currency}${fmt(low52, 0)}` },
      ];
      if (fin?.targetMeanPrice) items.push({ label: "Analyst Target", value: `${currency}${fmt(fin.targetMeanPrice)}` });
      if (beta > 0) items.push({ label: "Beta", value: fmt(beta, 2) });
      return items;
    })(),
    revenueProjections: [
      { label: "Bear Estimate", value: `${currency}${adjBear}` },
      { label: "Base Estimate", value: `${currency}${adjBase}` },
      { label: "Bull Estimate", value: `${currency}${adjBull}` },
      { label: "Expected Value", value: `${currency}${expectedPrice}`, highlight: true },
    ],
    dcfScenarios: [
      { label: "Bear Case", price: `${currency}${adjBear}`, note: "Margin compression, sector downturn", type: "bear" },
      { label: "Base Case", price: `${currency}${adjBase}`, note: "Steady growth, stable margins", type: "base" },
      { label: "Bull Case", price: `${currency}${adjBull}`, note: "Expansion, re-rating catalyst", type: "bull" },
    ],
    valuationNote: `At ${currency}${fmt(price)}, the stock trades at ${pe > 0 ? fmt(pe, 1) + 'x earnings' : 'an undetermined P/E'}. ${fin?.targetMeanPrice ? `Analyst consensus target is ${currency}${fmt(fin.targetMeanPrice)}${fin.numberOfAnalystOpinions ? ` (${fin.numberOfAnalystOpinions} analysts)` : ''}.` : ''} Our target price of ${currency}${targetPrice} (fair value midpoint) represents a ${targetReturnStr} potential ${targetIsUpside ? 'return' : 'decline'}.`,
    priceScenarios: [
      { label: "▲ Bull Case", price: `${currency}${adjBull}`, probability: "Probability: 25%", change: `${((adjBull - price) / price * 100) >= 0 ? '+' : ''}${((adjBull - price) / price * 100).toFixed(0)}% ${(adjBull >= price) ? 'upside' : 'downside'}`, description: "Strong earnings growth, sector re-rating, expansion catalysts", type: "bull", assumptions: { revenueGrowth: `${(scenarios.bull.revGrowth * 100).toFixed(1)}%`, operatingMargin: `${(scenarios.bull.opMargin * 100).toFixed(1)}%`, peMultiple: `${scenarios.bull.peMultiple}x`, projectedEps: `${currency}${bullProjEps}` } },
      { label: "◆ Base Case", price: `${currency}${adjBase}`, probability: "Probability: 50%", change: `${((adjBase - price) / price * 100) >= 0 ? '+' : ''}${((adjBase - price) / price * 100).toFixed(0)}% ${(adjBase >= price) ? 'upside' : 'downside'}`, description: "Steady revenue growth, stable margins, modest multiple expansion", type: "base", assumptions: { revenueGrowth: `${(scenarios.base.revGrowth * 100).toFixed(1)}%`, operatingMargin: `${(scenarios.base.opMargin * 100).toFixed(1)}%`, peMultiple: `${scenarios.base.peMultiple}x`, projectedEps: `${currency}${baseProjEps}` } },
      { label: "▼ Bear Case", price: `${currency}${adjBear}`, probability: "Probability: 25%", change: `${((adjBear - price) / price * 100).toFixed(0)}% downside`, description: "Margin compression, macro headwinds, sector rotation", type: "bear", assumptions: { revenueGrowth: `${(scenarios.bear.revGrowth * 100).toFixed(1)}%`, operatingMargin: `${(scenarios.bear.opMargin * 100).toFixed(1)}%`, peMultiple: `${scenarios.bear.peMultiple}x`, projectedEps: `${currency}${bearProjEps}` } },
    ],
    expectedPrice: `${currency}${expectedPrice}`,
    expectedFormula: `(${currency}${adjBull}×25%) + (${currency}${adjBase}×50%) + (${currency}${adjBear}×25%)`,
    expectedUpside: targetReturnStr,
    expectedUpsideNote: `${targetReturnLabel} from ${currency}${fmt(price)}`,
    priceNote: `Target price of ${currency}${targetPrice} equals the fair value midpoint (${currency}${fvLow}–${currency}${fvHigh}). Probability-weighted expected price: ${currency}${expectedPrice}. ${fin?.targetMeanPrice ? `Analyst consensus: ${currency}${fmt(fin.targetMeanPrice)}.` : ''} Optimal entry zone: ${currency}${optEntryLow}–${currency}${optEntryHigh}.`,
    macroItems: [
      { icon: "📈", title: "Market Trend", detail: `Stock is ${pctChange >= 0 ? 'up' : 'down'} ${fmt(Math.abs(pctChange))}% today. ${price > (techs?.sma200 || 0) ? 'Trading above 200 DMA — bullish trend.' : 'Trading below 200 DMA — caution.'}`, sentiment: pctChange >= 0 ? "positive" : "negative", sentimentLabel: pctChange >= 0 ? "POSITIVE" : "HEADWIND" },
      { icon: "📊", title: "Valuation Context", detail: pe > 40 ? 'Premium valuation at current P/E — growth expectations priced in' : pe > 20 ? 'Fair valuation relative to broader market' : pe > 0 ? 'Attractive valuation on P/E basis' : 'P/E data unavailable', sentiment: pe > 40 ? "negative" : pe > 20 ? "neutral" : "positive", sentimentLabel: pe > 40 ? "RICH" : pe > 20 ? "FAIR" : pe > 0 ? "ATTRACTIVE" : "N/A" },
      { icon: "🔄", title: "52-Week Position", detail: `Currently ${((price - low52) / (high52 - low52) * 100).toFixed(0)}% through the 52-week range.`, sentiment: price > high52 * 0.9 ? "positive" : "neutral", sentimentLabel: price > high52 * 0.9 ? "STRONG" : "NEUTRAL" },
      { icon: "📉", title: "Volatility Assessment", detail: `${beta > 0 ? `Beta: ${fmt(beta, 2)}. ` : ''}52-week range spread: ${((high52 - low52) / low52 * 100).toFixed(0)}%.`, sentiment: (high52 - low52) / low52 > 0.5 ? "negative" : "neutral", sentimentLabel: (high52 - low52) / low52 > 0.5 ? "HIGH VOL" : "MODERATE" },
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
    moatItems: (() => {
      const items: MoatItem[] = [];
      const brandScore = num(profile?.employees) > 10000 ? 8 : num(profile?.employees) > 1000 ? 6.5 : 5;
      const marginScore = grossMargins != null ? Math.min(9, Math.round(grossMargins * 100) / 10) : 5;
      const scaleScore = marketCap > 100e9 ? 8 : marketCap > 10e9 ? 6.5 : marketCap > 1e9 ? 5 : 4;
      items.push({ name: "Brand Recognition", score: brandScore, maxScore: 10 });
      items.push({ name: "Market Position", score: scaleScore, maxScore: 10 });
      items.push({ name: "Profit Margins", score: marginScore, maxScore: 10 });
      items.push({ name: "Scale Advantage", score: scaleScore > 6 ? 7 : 5, maxScore: 10 });
      if (returnOnEquity != null) items.push({ name: "Capital Efficiency", score: Math.min(9, Math.round(returnOnEquity * 300) / 10), maxScore: 10 });
      return items;
    })(),
    riskItems: (() => {
      const items: RiskItem[] = [
        { name: "Valuation Risk", level: pe > 40 ? "HIGH" : pe > 20 ? "MEDIUM" : pe > 0 ? "LOW" : "MEDIUM", filled: pe > 40 ? 4 : pe > 20 ? 3 : 2 },
        { name: "Volatility Risk", level: ((high52 - low52) / low52 > 0.5 ? "HIGH" : "MEDIUM") as any, filled: (high52 - low52) / low52 > 0.5 ? 4 : 3 },
        { name: "Technical Risk", level: price < (techs?.sma200 || price) ? "HIGH" : "MEDIUM", filled: price < (techs?.sma200 || price) ? 4 : 2 },
      ];
      if (debtToEquity != null) items.push({ name: "Debt Risk", level: debtToEquity > 100 ? "HIGH" : debtToEquity > 50 ? "MEDIUM" : "LOW", filled: debtToEquity > 100 ? 4 : debtToEquity > 50 ? 3 : 1 });
      if (beta > 0) items.push({ name: "Beta Risk", level: beta > 1.5 ? "HIGH" : beta > 1 ? "MEDIUM" : "LOW", filled: beta > 1.5 ? 4 : beta > 1 ? 3 : 2 });
      items.push({ name: "Momentum Risk", level: pctChange < -3 ? "HIGH" : pctChange < 0 ? "MEDIUM" : "LOW", filled: pctChange < -3 ? 4 : pctChange < 0 ? 3 : 1 });
      return items;
    })(),
    dividendMetrics: (() => {
      const dy = divData?.yield != null ? divData.yield : null;
      const pr = divData?.payoutRatio != null ? divData.payoutRatio : null;
      const exDate = divData?.exDate || null;
      const rate = divData?.rate != null ? divData.rate : null;
      return [
        { label: "Dividend Yield", value: dy != null ? `${(dy * 100).toFixed(2)}%` : 'N/A', note: rate != null ? `${currency}${fmt(rate)}/share` : 'No dividend data', color: (dy != null && dy > 0.02 ? 'green' as const : 'muted' as const) },
        { label: "Payout Ratio", value: pr != null ? `${(pr * 100).toFixed(1)}%` : 'N/A', note: pe > 0 ? `Earnings coverage: ${fmt(pe, 1)}x P/E` : 'N/A', color: 'muted' as const },
        { label: "Ex-Dividend Date", value: exDate || 'N/A', note: "Most recent ex-date", color: 'muted' as const },
        { label: "Dividend Sustainability", value: dy != null && dy > 0.03 ? 'Strong' : dy != null && dy > 0.01 ? 'Moderate' : 'Minimal', note: "Based on payout and earnings", color: (dy != null && dy > 0.02 ? 'green' as const : 'gold' as const) },
      ];
    })(),
    dividendNote: (() => {
      const dy = divData?.yield;
      if (dy != null && dy > 0.02) return `${companyName} offers a meaningful dividend yield of ${(dy * 100).toFixed(2)}%, suitable for income strategies.`;
      if (dy != null && dy > 0) return `${companyName} pays a modest dividend yield of ${(dy * 100).toFixed(2)}% — primarily a capital appreciation play.`;
      return `${companyName} has minimal or no dividend yield — primarily a capital appreciation play.`;
    })(),
    patternSignals: (() => {
      const signals: PatternSignal[] = [];
      if (techs) {
        const fromHigh = (price - high52) / high52;
        signals.push({ name: "Mean Reversion", signal: fromHigh < -0.3 ? "Deep Discount" : fromHigh < -0.1 ? "Below Mean" : "Near Fair Value", confidence: Math.round(Math.abs(fromHigh) > 0.2 ? 70 : 50), type: fromHigh < -0.2 ? "bullish" : "neutral" });
        signals.push({ name: "Momentum Score", signal: techs.rsi > 60 ? "Positive" : techs.rsi < 40 ? "Negative" : "Neutral", confidence: Math.round(Math.min(99, Math.abs(techs.rsi - 50) + 50)), type: techs.rsi > 60 ? "bullish" : techs.rsi < 40 ? "bearish" : "neutral" });
        if (techs.sma50 && techs.sma200) {
          const golden = techs.sma50 > techs.sma200;
          signals.push({ name: "SMA Crossover", signal: golden ? "Golden Cross" : "Death Cross", confidence: golden ? 72 : 68, type: golden ? "bullish" : "bearish" });
        }
        signals.push({ name: "Volume Pattern", signal: techs.avgVol3 > 0 ? "Active Trading" : "Low Volume", confidence: 55, type: "neutral" });
      } else {
        signals.push({ name: "Pattern Analysis", signal: "Insufficient Data", confidence: 0, type: "neutral" });
      }
      return signals;
    })(),
    patternNote: techs ? `Quantitative analysis based on ${timeSeries.length} data points. RSI at ${fmt(techs.rsi, 0)} with price ${((price - high52) / high52 * 100).toFixed(1)}% from 52-week high. ${techs.sma50 && techs.sma200 ? (techs.sma50 > techs.sma200 ? 'Golden cross detected — bullish signal.' : 'Death cross active — bearish pressure.') : ''}` : 'Insufficient historical data for pattern analysis.',
    earningsBreakdown: [
      { label: "Current Price", value: `${currency}${fmt(price)}`, change: `${pctSign}${fmt(pctChange)}% today`, sentiment: (pctChange >= 0 ? "positive" : "negative") as 'positive' | 'negative' },
      { label: "P/E Ratio", value: pe > 0 ? `${fmt(pe, 1)}x` : 'N/A', sentiment: (pe > 40 ? "negative" : pe > 20 ? "neutral" : pe > 0 ? "positive" : "neutral") as any },
      { label: "EPS (TTM)", value: num(quote?.eps) > 0 ? `${currency}${fmt(num(quote?.eps))}` : 'N/A', sentiment: num(quote?.eps) > 0 ? "positive" : "neutral" },
      { label: "52W Performance", value: `${((price - low52) / low52 * 100).toFixed(1)}% from low`, change: `${((price - high52) / high52 * 100).toFixed(1)}% from high`, sentiment: price > (high52 + low52) / 2 ? "positive" : "negative" },
      { label: "Volume vs Avg", value: safe(quote?.volume, 'N/A'), change: `Avg: ${safe(quote?.average_volume, 'N/A')}`, sentiment: "neutral" },
    ],
    earningsNote: `${companyName} reports earnings at ${pe > 0 ? fmt(pe, 1) + 'x P/E' : 'N/A P/E'} with EPS of ${num(quote?.eps) > 0 ? currency + fmt(num(quote?.eps)) : 'N/A'}. ${pctChange >= 0 ? 'Positive price action today suggests market confidence.' : 'Negative price action today warrants monitoring.'}`,
    earningsSurprises: (() => {
      if (earningsHist.length > 0) {
        return earningsHist.slice(0, 4).map((e: any) => {
          const est = e.epsEstimate;
          const act = e.epsActual;
          const hasData = est != null && act != null;
          return {
            quarter: e.quarter || e.date || 'N/A',
            estimate: est != null ? `${currency}${fmt(est)}` : 'N/A',
            actual: act != null ? `${currency}${fmt(act)}` : 'N/A',
            result: (hasData ? (act > est ? 'Beat' : act < est ? 'Miss' : 'Inline') : 'Inline') as 'Beat' | 'Miss' | 'Inline',
          };
        });
      }
      return [{ quarter: 'N/A', estimate: 'Data unavailable', actual: 'Data unavailable', result: 'Inline' as const }];
    })(),
    nextEarningsDate: "Data unavailable",
    nextEarningsEstimate: num(quote?.eps) > 0 ? `${currency}${fmt(num(quote?.eps))}` : 'N/A',
    supportLevels: techs ? [
      `${currency}${Math.round(Math.min(price, low52 + (price - low52) * 0.7))}`,
      `${currency}${Math.round(low52 + (price - low52) * 0.4)}`,
      `${currency}${Math.round(low52)}`,
    ] : [`${currency}${Math.round(price * 0.95)}`, `${currency}${Math.round(price * 0.90)}`],
    resistanceLevels: techs ? [
      `${currency}${Math.round(price + (high52 - price) * 0.3)}`,
      `${currency}${Math.round(price + (high52 - price) * 0.65)}`,
      `${currency}${Math.round(high52)}`,
    ] : [`${currency}${Math.round(price * 1.05)}`, `${currency}${Math.round(price * 1.12)}`],
    insiderTransactions: (() => {
      if (insiderTxnData.length > 0) {
        return insiderTxnData.slice(0, 5).map((t: any) => ({
          role: t.relation || t.name || 'N/A',
          action: (t.action?.toLowerCase().includes('purchase') || t.action?.toLowerCase().includes('buy') || t.shares > 0 ? 'Buy' : 'Sell') as 'Buy' | 'Sell',
          shares: Math.abs(t.shares).toLocaleString(),
          date: t.date || 'N/A',
        }));
      }
      return [{ role: 'N/A', action: 'Buy' as const, shares: 'Data unavailable', date: 'N/A' }];
    })(),
    insiderSummary: (() => {
      if (insiderTxnData.length > 0) {
        let buyValue = 0, sellValue = 0;
        for (const t of insiderTxnData) {
          if (t.action?.toLowerCase().includes('purchase') || t.action?.toLowerCase().includes('buy') || t.shares > 0) buyValue += Math.abs(t.value || 0);
          else sellValue += Math.abs(t.value || 0);
        }
        return { totalBuying: buyValue > 0 ? `${currency}${fmtLarge(buyValue)}` : 'N/A', totalSelling: sellValue > 0 ? `${currency}${fmtLarge(sellValue)}` : 'N/A', netSignal: buyValue > sellValue ? "Net Buying" : sellValue > buyValue ? "Net Selling" : "Balanced" };
      }
      return { totalBuying: 'Data unavailable', totalSelling: 'Data unavailable', netSignal: 'No data' };
    })(),
    institutionalOwnership: num(instData?.percentage),
    topHolders: (() => {
      const holders = instData?.holders;
      if (holders && Array.isArray(holders) && holders.length > 0) {
        return holders.slice(0, 5).map((h: any) => ({ name: h.name || 'Unknown', percentage: h.percentage || 0 }));
      }
      return [{ name: 'Data unavailable', percentage: 0 }];
    })(),
    sentimentScore: (() => {
      if (recData) {
        const total = recData.strongBuy + recData.buy + recData.hold + recData.sell + recData.strongSell;
        if (total > 0) return Math.round((recData.strongBuy * 100 + recData.buy * 80 + recData.hold * 50 + recData.sell * 20) / total);
      }
      return Math.round(30 + totalScore * 0.5);
    })(),
    sentimentLabel: (() => {
      if (recData) {
        const b = (recData.strongBuy || 0) + (recData.buy || 0);
        const s = (recData.sell || 0) + (recData.strongSell || 0);
        if (b > s * 2) return "Bullish" as const;
        if (s > b) return "Bearish" as const;
      }
      return (totalScore >= 65 ? "Bullish" : totalScore <= 45 ? "Bearish" : "Neutral") as 'Bullish' | 'Neutral' | 'Bearish';
    })(),
    sentimentFactors: (() => {
      const factors: SentimentFactor[] = [];
      if (recData) {
        const total = recData.strongBuy + recData.buy + recData.hold + recData.sell + recData.strongSell;
        if (total > 0) factors.push({ name: "Analyst Consensus", value: `${recData.strongBuy + recData.buy} Buy / ${recData.hold} Hold / ${recData.sell + recData.strongSell} Sell`, signal: ((recData.strongBuy + recData.buy) > (recData.sell + recData.strongSell) ? "bullish" : "bearish") as any });
      } else {
        factors.push({ name: "Analyst Consensus", value: "Data unavailable", signal: "neutral" });
      }
      if (quote?.short_ratio != null) factors.push({ name: "Short Ratio", value: `${fmt(quote.short_ratio, 1)} days`, signal: (quote.short_ratio < 3 ? "bullish" : "bearish") as any });
      if (quote?.short_percent_float != null) { const sp = quote.short_percent_float * 100; factors.push({ name: "Short Interest", value: `${fmt(sp, 1)}%`, signal: (sp < 5 ? "bullish" : sp < 15 ? "neutral" : "bearish") as any }); }
      if (fin?.recommendationKey) factors.push({ name: "Overall Rating", value: fin.recommendationKey.charAt(0).toUpperCase() + fin.recommendationKey.slice(1), signal: (fin.recommendationKey === 'buy' || fin.recommendationKey === 'strong_buy' ? "bullish" : fin.recommendationKey === 'sell' ? "bearish" : "neutral") as any });
      if (factors.length === 0) factors.push({ name: "Market Sentiment", value: "Data unavailable", signal: "neutral" });
      return factors;
    })(),
    correlations: [
      { asset: "S&P 500", correlation: beta > 0 ? parseFloat(Math.min(0.99, beta * 0.6).toFixed(2)) : 0 },
      { asset: "Sector", correlation: beta > 0 ? parseFloat(Math.min(0.99, beta * 0.7 + 0.2).toFixed(2)) : 0 },
    ],
    sectorRotation: sector && sector !== 'N/A'
      ? [{ sector, direction: (pctChange >= 0.5 ? "up" : pctChange <= -0.5 ? "down" : "neutral") as 'up' | 'down' | 'neutral', performance: `${pctChange >= 0 ? '+' : ''}${fmt(pctChange)}%` }]
      : [{ sector: "N/A", direction: "neutral" as const, performance: "Data unavailable" }],
    valuationTriangle: {
      dcf: { price: `${currency}${dcfTarget}`, weight: '40%', method: `Projected EPS (${currency}${baseProjEps}) × ${scenarios.base.peMultiple}x P/E`, signal: dcfSignalTri },
      relative: { price: `${currency}${relativeTarget}`, weight: '35%', method: `Current EPS × ${sectorPE}x sector-avg P/E`, signal: relSignal },
      momentum: { price: `${currency}${momentumTarget}`, weight: '25%', method: `SMA trend extrapolation over 12 months`, signal: momSignal },
      composite: `${currency}${compositeTarget}`,
      compositeReturn: `${compositeIsUpside ? '+' : '-'}${Math.abs(compositeReturnPct).toFixed(1)}%`,
      compositeLabel: `${compositeIsUpside ? 'Expected Upside' : 'Expected Downside'} from ${currency}${fmt(price)}`,
    },
    fairValueRange: { low: `${currency}${fvLow}`, high: `${currency}${fvHigh}`, midpoint: `${currency}${fvMid}` },
    accumulationZone: { low: `${currency}${accZoneLow}`, high: `${currency}${accZoneHigh}`, show: showAccZone },
    optimalEntry: { low: `${currency}${optEntryLow}`, high: `${currency}${optEntryHigh}`, basis: optEntryBasis },
    modelConfidence: { score: confidenceScore, level: confidenceLevel, factors: confidenceFactors },
    modelAgreement: { level: agreementLevel, models: agreementModels },
    keyDrivers: finalKeyDrivers,
    ratingChangeTriggers: (() => {
      const upgrades: string[] = [];
      const downgrades: string[] = [];
      const nextLevel = VERDICT_LEVELS[Math.min(VERDICT_LEVELS.indexOf(verdict) + 1, VERDICT_LEVELS.length - 1)];
      const prevLevel = VERDICT_LEVELS[Math.max(VERDICT_LEVELS.indexOf(verdict) - 1, 0)];

      // Upgrade triggers
      if (revenueGrowth != null && revenueGrowth < 0.25) upgrades.push("Revenue growth exceeds 25%");
      if (fvMid > price) upgrades.push(`Price declines below ${currency}${Math.round(fvMid * 0.85)} creating valuation discount`);
      else upgrades.push(`Earnings growth re-rates valuation higher`);
      if (profitMargins != null && profitMargins < 0.20) upgrades.push("Operating margins expand meaningfully");
      if (techs && techs.sma50 && techs.sma200 && techs.sma50 < techs.sma200) upgrades.push("Golden cross forms (SMA50 crosses above SMA200)");
      if (isBanking) upgrades.push("Asset quality improves with declining NPAs");
      else if (isTech) upgrades.push("Cloud/product adoption accelerates");
      else if (isIndustrial) upgrades.push("Order backlog expands significantly");

      // Downgrade triggers
      if (profitMargins != null) downgrades.push("Operating margins decline below sector average");
      downgrades.push("Sector momentum weakens materially");
      if (fvMid > 0) downgrades.push(`Price exceeds ${currency}${Math.round(fvMid * 1.15)} without earnings growth`);
      if (debtToEquity != null && debtToEquity < 100) downgrades.push("Leverage increases significantly");
      if (techs && techs.sma200) downgrades.push("Price breaks below 200-day moving average");
      if (isBanking) downgrades.push("NPA ratios deteriorate");

      return { upgrades: upgrades.slice(0, 4), downgrades: downgrades.slice(0, 4) };
    })(),
    factorExposure,
    marketRegime,
    catalystTimeline: (() => {
      const now = new Date();
      const catalysts: { date: string; event: string; category: 'earnings' | 'corporate' | 'industry' | 'product' | 'macro'; impact: 'High' | 'Moderate' | 'Low' }[] = [];
      const monthName = (m: number) => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m];

      // Next earnings (quarterly cycle — estimate next quarter)
      const nextQ = new Date(now);
      nextQ.setMonth(nextQ.getMonth() + Math.max(1, 3 - (nextQ.getMonth() % 3)));
      catalysts.push({ date: `${monthName(nextQ.getMonth())} ${nextQ.getFullYear()}`, event: `Q${Math.ceil((nextQ.getMonth() + 1) / 3)} Earnings Release`, category: 'earnings', impact: 'High' });

      // Following quarter earnings
      const followQ = new Date(nextQ);
      followQ.setMonth(followQ.getMonth() + 3);
      catalysts.push({ date: `${monthName(followQ.getMonth())} ${followQ.getFullYear()}`, event: `Q${Math.ceil((followQ.getMonth() + 1) / 3)} Earnings Release`, category: 'earnings', impact: 'High' });

      // Dividend event if applicable
      if (divData?.yield != null && divData.yield > 0) {
        const divMonth = new Date(now);
        divMonth.setMonth(divMonth.getMonth() + 2);
        catalysts.push({ date: `${monthName(divMonth.getMonth())} ${divMonth.getFullYear()}`, event: 'Dividend Declaration / Ex-Date', category: 'corporate', impact: 'Moderate' });
      }

      // Macro events based on regime
      const macroMonth = new Date(now);
      macroMonth.setMonth(macroMonth.getMonth() + 1);
      catalysts.push({ date: `${monthName(macroMonth.getMonth())} ${macroMonth.getFullYear()}`, event: 'Central Bank Interest Rate Decision', category: 'macro', impact: 'High' });

      // Industry catalyst
      const indMonth = new Date(now);
      indMonth.setMonth(indMonth.getMonth() + 4);
      catalysts.push({ date: `${monthName(indMonth.getMonth())} ${indMonth.getFullYear()}`, event: `${sector !== 'N/A' ? sector : 'Industry'} Sector Outlook Update`, category: 'industry', impact: 'Moderate' });

      // Product/strategic (based on company size)
      if (marketCap > 10e9) {
        const prodMonth = new Date(now);
        prodMonth.setMonth(prodMonth.getMonth() + 5);
        catalysts.push({ date: `${monthName(prodMonth.getMonth())} ${prodMonth.getFullYear()}`, event: 'Annual Strategy / Product Roadmap', category: 'product', impact: 'Moderate' });
      }

      // Government budget/policy
      const govMonth = new Date(now);
      govMonth.setMonth(govMonth.getMonth() + 3);
      catalysts.push({ date: `${monthName(govMonth.getMonth())} ${govMonth.getFullYear()}`, event: 'Government Budget / Policy Announcement', category: 'macro', impact: 'Moderate' });

      return catalysts;
    })(),
    finalVerdict: verdict,
    finalVerdictText: `<strong>${companyName}</strong> receives a multi-factor score of <strong>${totalScore}/100</strong>. The stock is currently at ${currency}${fmt(price)} with a 12-month target price of ${currency}${targetPrice} (${targetReturnStr} ${targetReturnLabel.toLowerCase()}). Market regime: <strong>${marketRegime.regime}</strong>.`,
    finalAction: `<strong>Recommendation:</strong> ${isBuyVerdict ? 'Initiate position within ' + currency + accZoneLow + '–' + currency + accZoneHigh + '. Targets: ' + currency + t1 + ' / ' + currency + t2 + '.' : targetReturnPct >= 0 ? 'Hold existing positions. Current price near fair value.' : 'Reduce exposure. Wait for pullback to ' + currency + optEntryLow + '–' + currency + optEntryHigh + ' for better risk-reward.'}`,
    finalFooter: [
      { label: "SCORE", value: `${totalScore} / 100` },
      { label: "TARGET", value: `${currency}${targetPrice}` },
      { label: "RETURN", value: targetReturnStr },
      { label: "FAIR VALUE", value: `${currency}${fvLow} – ${currency}${fvHigh}` },
      { label: "ENTRY ZONE", value: `${currency}${optEntryLow} – ${currency}${optEntryHigh}` },
      { label: "CONFIDENCE", value: `${confidenceScore}% (${confidenceLevel})` },
      { label: "REGIME", value: marketRegime.regime },
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
