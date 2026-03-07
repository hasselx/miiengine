const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TWELVE_DATA_BASE = 'https://api.twelvedata.com';
const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';

function isIndianExchange(exchange?: string): boolean {
  return ['NSE', 'BSE'].includes((exchange || '').toUpperCase());
}

async function fetchFromAlphaVantage(symbol: string, exchange: string, apiKey: string) {
  // Alpha Vantage uses BSE suffix for Indian stocks (NSE not directly supported for most endpoints)
  const avSymbol = `${symbol}.BSE`;

  console.log(`AV fetching symbol: ${avSymbol}`);

  const [quoteRes, overviewRes, dailyRes] = await Promise.all([
    fetch(`${ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(avSymbol)}&apikey=${apiKey}`),
    fetch(`${ALPHA_VANTAGE_BASE}?function=OVERVIEW&symbol=${encodeURIComponent(avSymbol)}&apikey=${apiKey}`),
    fetch(`${ALPHA_VANTAGE_BASE}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(avSymbol)}&outputsize=compact&apikey=${apiKey}`),
  ]);

  const [quoteData, overviewData, dailyData] = await Promise.all([
    quoteRes.json(),
    overviewRes.json(),
    dailyRes.json(),
  ]);

  console.log('AV Quote keys:', JSON.stringify(Object.keys(quoteData)));
  console.log('AV Global Quote:', JSON.stringify(quoteData['Global Quote'] || {}));
  console.log('AV Daily keys:', JSON.stringify(Object.keys(dailyData)));
  console.log('AV Quote Info:', quoteData['Information'] || 'none');
  console.log('AV Daily Info:', dailyData['Information'] || 'none');
  console.log('AV Overview Info:', overviewData['Information'] || 'none');

  // Check for API errors or rate limits
  if (quoteData['Information']) {
    throw new Error('Alpha Vantage rate limit reached: ' + quoteData['Information']);
  }
  if (quoteData['Error Message']) {
    throw new Error(quoteData['Error Message']);
  }
  if (dailyData['Error Message']) {
    throw new Error(dailyData['Error Message']);
  }
  if (dailyData['Information']) {
    console.warn('AV Daily rate limited, continuing with partial data');
  }

  const gq = quoteData['Global Quote'] || {};
  const ts = dailyData['Time Series (Daily)'] || {};

  // Transform Alpha Vantage data to match our expected format
  const quote = {
    symbol: symbol,
    name: overviewData['Name'] || symbol,
    exchange: exchange,
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
    valuations_metrics: {
      market_capitalization: parseFloat(overviewData['MarketCapitalization']) || 0,
    },
  };

  // Convert time series to array format
  const timeSeries = Object.entries(ts)
    .slice(0, 250)
    .map(([date, values]: [string, any]) => ({
      datetime: date,
      open: values['1. open'],
      high: values['2. high'],
      low: values['3. low'],
      close: values['4. close'],
      volume: values['5. volume'],
    }));

  return { quote, profile, statistics, timeSeries };
}

async function fetchFromTwelveData(symbol: string, exchange: string | undefined, apiKey: string) {
  const symbolParam = exchange ? `${symbol}:${exchange}` : symbol;

  const [quoteRes, profileRes, statsRes, timeSeriesRes] = await Promise.all([
    fetch(`${TWELVE_DATA_BASE}/quote?symbol=${encodeURIComponent(symbolParam)}&apikey=${apiKey}`),
    fetch(`${TWELVE_DATA_BASE}/profile?symbol=${encodeURIComponent(symbolParam)}&apikey=${apiKey}`),
    fetch(`${TWELVE_DATA_BASE}/statistics?symbol=${encodeURIComponent(symbolParam)}&apikey=${apiKey}`),
    fetch(`${TWELVE_DATA_BASE}/time_series?symbol=${encodeURIComponent(symbolParam)}&interval=1day&outputsize=250&apikey=${apiKey}`),
  ]);

  const [quote, profile, stats, timeSeries] = await Promise.all([
    quoteRes.json(),
    profileRes.json(),
    statsRes.json(),
    timeSeriesRes.json(),
  ]);

  if (quote.code && quote.code !== 200) {
    throw new Error(quote.message || 'Failed to fetch stock data from Twelve Data');
  }

  return {
    quote,
    profile,
    statistics: stats,
    timeSeries: timeSeries.values || [],
  };
}

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

    let result;

    if (isIndianExchange(exchange)) {
      const avKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
      if (!avKey) {
        return new Response(JSON.stringify({ error: 'ALPHA_VANTAGE_API_KEY not configured' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log(`Using Alpha Vantage for ${symbol}:${exchange}`);
      result = await fetchFromAlphaVantage(symbol, exchange, avKey);
    } else {
      const tdKey = Deno.env.get('TWELVE_DATA_API_KEY');
      if (!tdKey) {
        return new Response(JSON.stringify({ error: 'TWELVE_DATA_API_KEY not configured' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log(`Using Twelve Data for ${symbol}:${exchange || 'default'}`);
      result = await fetchFromTwelveData(symbol, exchange, tdKey);
    }

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
