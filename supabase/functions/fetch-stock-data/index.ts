const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TWELVE_DATA_BASE = 'https://api.twelvedata.com';

function isIndianExchange(exchange?: string): boolean {
  return ['NSE', 'BSE'].includes((exchange || '').toUpperCase());
}

// ─── Yahoo Finance with crumb/cookie auth ───
async function getYahooCrumb(): Promise<{ crumb: string; cookie: string }> {
  // Step 1: Get consent cookie
  const consentRes = await fetch('https://fc.yahoo.com/', { redirect: 'manual' });
  await consentRes.text();
  const setCookie = consentRes.headers.get('set-cookie') || '';

  // Step 2: Get crumb
  const crumbRes = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Cookie': setCookie,
    },
  });
  const crumb = await crumbRes.text();

  return { crumb, cookie: setCookie };
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

// ─── Provider 2: Yahoo Finance (REST with crumb auth) ───
async function fetchFromYahooFinance(symbol: string, exchange: string) {
  const candidates: string[] = isIndianExchange(exchange)
    ? [`${symbol}.NS`, `${symbol}.BO`]
    : [symbol];

  // Get auth crumb
  let crumb = '';
  let cookie = '';
  try {
    const auth = await getYahooCrumb();
    crumb = auth.crumb;
    cookie = auth.cookie;
    console.log(`Yahoo crumb obtained: ${crumb ? 'yes' : 'no'}`);
  } catch (e) {
    console.warn(`Failed to get Yahoo crumb: ${e}`);
  }

  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
  };
  if (cookie) headers['Cookie'] = cookie;

  let chartResult: any = null;
  let yahooSymbol = candidates[0];

  for (const candidate of candidates) {
    // Try multiple Yahoo domains/endpoints
    const urls = [
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(candidate)}?range=1y&interval=1d${crumb ? `&crumb=${encodeURIComponent(crumb)}` : ''}`,
      `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(candidate)}?range=1y&interval=1d${crumb ? `&crumb=${encodeURIComponent(crumb)}` : ''}`,
    ];
    
    for (const url of urls) {
      try {
        console.log(`Yahoo: trying ${candidate} via ${url.includes('query1') ? 'query1' : 'query2'}`);
        const res = await fetch(url, { headers });
        console.log(`Yahoo ${candidate}: status ${res.status}`);
        
        if (!res.ok) {
          await res.text();
          continue;
        }
        
        const json = await res.json();
        const result = json?.chart?.result?.[0];
        if (result && result.meta?.regularMarketPrice) {
          chartResult = result;
          yahooSymbol = candidate;
          console.log(`Yahoo SUCCESS: ${candidate}, price=${result.meta.regularMarketPrice}`);
          break;
        }
      } catch (e) {
        console.warn(`Yahoo ${candidate} error: ${e}`);
      }
    }
    if (chartResult) break;
  }

  if (!chartResult) {
    throw new Error(`No Yahoo data for ${symbol} (tried: ${candidates.join(', ')})`);
  }

  const meta = chartResult.meta || {};
  const indicators = chartResult.indicators?.quote?.[0] || {};
  const timestamps = chartResult.timestamp || [];

  const price = meta.regularMarketPrice ?? 0;
  const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? 0;
  const change = price - prevClose;
  const pctChange = prevClose ? (change / prevClose) * 100 : 0;

  const quote = {
    symbol,
    name: meta.longName || meta.shortName || meta.symbol || symbol,
    exchange: exchange || meta.exchangeName || '',
    close: price,
    price,
    previous_close: prevClose,
    change: parseFloat(change.toFixed(2)),
    percent_change: parseFloat(pctChange.toFixed(2)),
    volume: String(meta.regularMarketVolume ?? '0'),
    average_volume: 'N/A',
    pe: 0,
    eps: 0,
    fifty_two_week: {
      high: meta.fiftyTwoWeekHigh ?? 0,
      low: meta.fiftyTwoWeekLow ?? 0,
    },
  };

  const profile = {
    name: quote.name,
    sector: 'N/A',
    industry: 'N/A',
    country: isIndianExchange(exchange) ? 'India' : 'N/A',
    employees: 'N/A',
    description: '',
  };

  const statistics = {
    valuations_metrics: { market_capitalization: 0 },
  };

  const timeSeries = timestamps.map((ts: number, i: number) => {
    const d = new Date(ts * 1000);
    return {
      datetime: d.toISOString().split('T')[0],
      open: String(indicators.open?.[i] ?? 0),
      high: String(indicators.high?.[i] ?? 0),
      low: String(indicators.low?.[i] ?? 0),
      close: String(indicators.close?.[i] ?? 0),
      volume: String(indicators.volume?.[i] ?? 0),
    };
  });

  return { quote, profile, statistics, timeSeries };
}

// ─── Provider 3: Alpha Vantage ───
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

// ─── Cascading fetch ───
async function fetchWithFallbacks(symbol: string, exchange: string | undefined) {
  const errors: string[] = [];

  if (isIndianExchange(exchange)) {
    try {
      console.log(`[Indian] Trying Yahoo Finance for ${symbol}`);
      return await fetchFromYahooFinance(symbol, exchange!);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Yahoo: ${msg}`);
      console.warn(`Yahoo failed: ${msg}`);
    }

    // 2. Twelve Data (works for Indian stocks too)
    const tdKey = Deno.env.get('TWELVE_DATA_API_KEY');
    if (tdKey) {
      try {
        console.log(`[Indian] Trying Twelve Data for ${symbol}`);
        return await fetchFromTwelveData(symbol, exchange, tdKey);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`TwelveData: ${msg}`);
        console.warn(`Twelve Data failed: ${msg}`);
      }
    }

    // 3. Alpha Vantage
    const avKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    if (avKey) {
      try {
        console.log(`[Indian] Trying Alpha Vantage for ${symbol}`);
        return await fetchFromAlphaVantage(symbol, exchange!, avKey);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`AlphaVantage: ${msg}`);
        console.warn(`Alpha Vantage failed: ${msg}`);
      }
    }
  } else {
    // Global: Twelve Data → Yahoo Finance
    const tdKey = Deno.env.get('TWELVE_DATA_API_KEY');
    if (tdKey) {
      try {
        console.log(`[Global] Trying Twelve Data for ${symbol}`);
        return await fetchFromTwelveData(symbol, exchange, tdKey);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`TwelveData: ${msg}`);
        console.warn(`Twelve Data failed: ${msg}`);
      }
    }

    try {
      console.log(`[Global] Trying Yahoo Finance for ${symbol}`);
      return await fetchFromYahooFinance(symbol, exchange || '');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Yahoo: ${msg}`);
      console.warn(`Yahoo failed: ${msg}`);
    }
  }

  throw new Error(`All providers failed for ${symbol}. ${errors.join(' | ')}`);
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
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
