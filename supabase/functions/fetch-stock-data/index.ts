import YahooFinance from "npm:yahoo-finance2";
const yahooFinance = new YahooFinance();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TWELVE_DATA_BASE = 'https://api.twelvedata.com';

function isIndianExchange(exchange?: string): boolean {
  return ['NSE', 'BSE'].includes((exchange || '').toUpperCase());
}

function getYahooSymbol(symbol: string, exchange?: string): string {
  if (isIndianExchange(exchange)) return `${symbol}.NS`;
  return symbol;
}

// ─── Provider 1: Twelve Data ───
async function fetchFromTwelveData(symbol: string, exchange: string | undefined, apiKey: string) {
  const symbolParam = exchange ? `${symbol}:${exchange}` : symbol;

  const [quoteRes, profileRes, statsRes, timeSeriesRes] = await Promise.all([
    fetch(`${TWELVE_DATA_BASE}/quote?symbol=${encodeURIComponent(symbolParam)}&apikey=${apiKey}`),
    fetch(`${TWELVE_DATA_BASE}/profile?symbol=${encodeURIComponent(symbolParam)}&apikey=${apiKey}`),
    fetch(`${TWELVE_DATA_BASE}/statistics?symbol=${encodeURIComponent(symbolParam)}&apikey=${apiKey}`),
    fetch(`${TWELVE_DATA_BASE}/time_series?symbol=${encodeURIComponent(symbolParam)}&interval=1day&outputsize=250&apikey=${apiKey}`),
  ]);

  const [quote, profile, stats, timeSeries] = await Promise.all([
    quoteRes.json(), profileRes.json(), statsRes.json(), timeSeriesRes.json(),
  ]);

  if (quote.code && quote.code !== 200) {
    throw new Error(quote.message || 'Twelve Data error');
  }

  return { quote, profile, statistics: stats, timeSeries: timeSeries.values || [] };
}

// ─── Provider 2: Yahoo Finance ───
async function fetchFromYahooFinance(symbol: string, exchange: string) {
  const yahooSymbol = getYahooSymbol(symbol, exchange);

  // quote() in v3 can return an array or single object
  const rawQuote = await yahooFinance.quote(yahooSymbol);
  const quoteData = Array.isArray(rawQuote) ? rawQuote[0] : rawQuote;

  if (!quoteData || !quoteData.regularMarketPrice) {
    throw new Error(`No quote data found for ${yahooSymbol}`);
  }

  const summaryData = await yahooFinance.quoteSummary(yahooSymbol, {
    modules: ['assetProfile', 'defaultKeyStatistics', 'financialData'],
  }).catch(() => null);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);

  const historical = await yahooFinance.historical(yahooSymbol, {
    period1: startDate, period2: endDate, interval: '1d',
  }).catch(() => []);

  const ap = summaryData?.assetProfile || {};

  const quote = {
    symbol,
    name: quoteData.longName || quoteData.shortName || quoteData.displayName || symbol,
    exchange: exchange || quoteData.exchange || '',
    close: quoteData.regularMarketPrice ?? 0,
    price: quoteData.regularMarketPrice ?? 0,
    previous_close: quoteData.regularMarketPreviousClose ?? 0,
    change: quoteData.regularMarketChange ?? 0,
    percent_change: quoteData.regularMarketChangePercent ?? 0,
    volume: String(quoteData.regularMarketVolume ?? '0'),
    average_volume: String(quoteData.averageDailyVolume3Month ?? 'N/A'),
    pe: quoteData.trailingPE ?? 0,
    eps: quoteData.epsTrailingTwelveMonths ?? 0,
    fifty_two_week: {
      high: quoteData.fiftyTwoWeekHigh ?? 0,
      low: quoteData.fiftyTwoWeekLow ?? 0,
    },
  };

  const profile = {
    name: quoteData.longName || quoteData.shortName || symbol,
    sector: ap.sector || 'N/A',
    industry: ap.industry || 'N/A',
    country: ap.country || (isIndianExchange(exchange) ? 'India' : 'N/A'),
    employees: ap.fullTimeEmployees || 'N/A',
    description: ap.longBusinessSummary || '',
  };

  const statistics = {
    valuations_metrics: { market_capitalization: quoteData.marketCap ?? 0 },
  };

  const timeSeries = (historical || []).slice(0, 250).map((item: any) => ({
    datetime: item.date instanceof Date ? item.date.toISOString().split('T')[0] : String(item.date),
    open: String(item.open ?? 0), high: String(item.high ?? 0),
    low: String(item.low ?? 0), close: String(item.close ?? 0),
    volume: String(item.volume ?? 0),
  }));

  return { quote, profile, statistics, timeSeries };
}

// ─── Provider 3: Alpha Vantage (Indian stocks backup) ───
const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';

async function fetchFromAlphaVantage(symbol: string, exchange: string, apiKey: string) {
  const avSymbol = `${symbol}.BSE`;

  const [quoteRes, overviewRes, dailyRes] = await Promise.all([
    fetch(`${ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(avSymbol)}&apikey=${apiKey}`),
    fetch(`${ALPHA_VANTAGE_BASE}?function=OVERVIEW&symbol=${encodeURIComponent(avSymbol)}&apikey=${apiKey}`),
    fetch(`${ALPHA_VANTAGE_BASE}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(avSymbol)}&outputsize=compact&apikey=${apiKey}`),
  ]);

  const [quoteData, overviewData, dailyData] = await Promise.all([
    quoteRes.json(), overviewRes.json(), dailyRes.json(),
  ]);

  if (quoteData['Information'] || quoteData['Note']) {
    throw new Error('Alpha Vantage rate limit reached');
  }
  if (quoteData['Error Message']) {
    throw new Error(quoteData['Error Message']);
  }

  const gq = quoteData['Global Quote'] || {};
  const ts = dailyData['Time Series (Daily)'] || {};

  const quote = {
    symbol, name: overviewData['Name'] || symbol, exchange,
    close: parseFloat(gq['05. price']) || 0,
    price: parseFloat(gq['05. price']) || 0,
    previous_close: parseFloat(gq['08. previous close']) || 0,
    change: parseFloat(gq['09. change']) || 0,
    percent_change: parseFloat((gq['10. change percent'] || '0').replace('%', '')) || 0,
    volume: gq['06. volume'] || '0',
    average_volume: overviewData['AverageVolume'] || 'N/A',
    pe: parseFloat(overviewData['PERatio']) || 0,
    eps: parseFloat(overviewData['EPS']) || 0,
    fifty_two_week: {
      high: parseFloat(overviewData['52WeekHigh']) || 0,
      low: parseFloat(overviewData['52WeekLow']) || 0,
    },
  };

  const profile = {
    name: overviewData['Name'] || symbol,
    sector: overviewData['Sector'] || 'N/A',
    industry: overviewData['Industry'] || 'N/A',
    country: overviewData['Country'] || 'India',
    employees: overviewData['FullTimeEmployees'] || 'N/A',
    description: overviewData['Description'] || '',
  };

  const statistics = {
    valuations_metrics: { market_capitalization: parseFloat(overviewData['MarketCapitalization']) || 0 },
  };

  const timeSeries = Object.entries(ts).slice(0, 250).map(([date, values]: [string, any]) => ({
    datetime: date, open: values['1. open'], high: values['2. high'],
    low: values['3. low'], close: values['4. close'], volume: values['5. volume'],
  }));

  return { quote, profile, statistics, timeSeries };
}

// ─── Cascading fetch with automatic fallback ───
async function fetchWithFallbacks(symbol: string, exchange: string | undefined) {
  const errors: string[] = [];

  if (isIndianExchange(exchange)) {
    // Indian stocks: Yahoo Finance → Alpha Vantage
    // 1. Yahoo Finance (no API key needed)
    try {
      console.log(`[Indian] Trying Yahoo Finance for ${symbol}`);
      return await fetchFromYahooFinance(symbol, exchange!);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Yahoo Finance: ${msg}`);
      console.warn(`Yahoo Finance failed: ${msg}`);
    }

    // 2. Alpha Vantage fallback
    const avKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    if (avKey) {
      try {
        console.log(`[Indian] Trying Alpha Vantage for ${symbol}`);
        return await fetchFromAlphaVantage(symbol, exchange!, avKey);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`Alpha Vantage: ${msg}`);
        console.warn(`Alpha Vantage failed: ${msg}`);
      }
    }
  } else {
    // Global stocks: Twelve Data → Yahoo Finance
    // 1. Twelve Data
    const tdKey = Deno.env.get('TWELVE_DATA_API_KEY');
    if (tdKey) {
      try {
        console.log(`[Global] Trying Twelve Data for ${symbol}`);
        return await fetchFromTwelveData(symbol, exchange, tdKey);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`Twelve Data: ${msg}`);
        console.warn(`Twelve Data failed: ${msg}`);
      }
    }

    // 2. Yahoo Finance fallback
    try {
      console.log(`[Global] Trying Yahoo Finance for ${symbol}`);
      return await fetchFromYahooFinance(symbol, exchange || '');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Yahoo Finance: ${msg}`);
      console.warn(`Yahoo Finance failed: ${msg}`);
    }
  }

  throw new Error(`All data providers failed for ${symbol}. Errors: ${errors.join(' | ')}`);
}

// ─── Main handler ───
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, exchange } = await req.json();
    if (!symbol) {
      return new Response(JSON.stringify({ error: 'Symbol is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await fetchWithFallbacks(symbol, exchange);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
