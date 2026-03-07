import yahooFinance from "npm:yahoo-finance2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TWELVE_DATA_BASE = 'https://api.twelvedata.com';

function isIndianExchange(exchange?: string): boolean {
  return ['NSE', 'BSE'].includes((exchange || '').toUpperCase());
}

function getYahooSymbol(symbol: string, exchange?: string): string {
  if (isIndianExchange(exchange)) {
    return `${symbol}.NS`;
  }
  return symbol;
}

async function fetchFromYahooFinance(symbol: string, exchange: string) {
  const yahooSymbol = getYahooSymbol(symbol, exchange);

  const [quoteData, summaryData] = await Promise.all([
    yahooFinance.quote(yahooSymbol),
    yahooFinance.quoteSummary(yahooSymbol, { modules: ['assetProfile', 'defaultKeyStatistics', 'financialData'] }).catch(() => null),
  ]);

  // Fetch historical data
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);

  const historical = await yahooFinance.historical(yahooSymbol, {
    period1: startDate,
    period2: endDate,
    interval: '1d',
  }).catch(() => []);

  const profile = summaryData?.assetProfile || {};
  const keyStats = summaryData?.defaultKeyStatistics || {};
  const financialData = summaryData?.financialData || {};

  const quote = {
    symbol: symbol,
    name: quoteData.longName || quoteData.shortName || symbol,
    exchange: exchange || quoteData.exchange || '',
    close: quoteData.regularMarketPrice || 0,
    price: quoteData.regularMarketPrice || 0,
    previous_close: quoteData.regularMarketPreviousClose || 0,
    change: quoteData.regularMarketChange || 0,
    percent_change: quoteData.regularMarketChangePercent || 0,
    volume: String(quoteData.regularMarketVolume || '0'),
    average_volume: String(quoteData.averageDailyVolume3Month || 'N/A'),
    pe: quoteData.trailingPE || 0,
    eps: quoteData.epsTrailingTwelveMonths || 0,
    fifty_two_week: {
      high: quoteData.fiftyTwoWeekHigh || 0,
      low: quoteData.fiftyTwoWeekLow || 0,
    },
  };

  const profileData = {
    name: quoteData.longName || quoteData.shortName || symbol,
    sector: profile.sector || 'N/A',
    industry: profile.industry || 'N/A',
    country: profile.country || (isIndianExchange(exchange) ? 'India' : 'N/A'),
    employees: profile.fullTimeEmployees || 'N/A',
    description: profile.longBusinessSummary || '',
  };

  const statistics = {
    valuations_metrics: {
      market_capitalization: quoteData.marketCap || 0,
    },
  };

  const timeSeries = (historical || []).slice(0, 250).map((item: any) => ({
    datetime: item.date instanceof Date ? item.date.toISOString().split('T')[0] : String(item.date),
    open: String(item.open || 0),
    high: String(item.high || 0),
    low: String(item.low || 0),
    close: String(item.close || 0),
    volume: String(item.volume || 0),
  }));

  return { quote, profile: profileData, statistics, timeSeries };
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
      // For Indian stocks, use Yahoo Finance directly (no API key needed)
      try {
        result = await fetchFromYahooFinance(symbol, exchange);
      } catch (yahooError) {
        console.error('Yahoo Finance error:', yahooError);
        throw new Error(`Failed to fetch data for ${symbol}: ${yahooError instanceof Error ? yahooError.message : 'Unknown error'}`);
      }
    } else {
      // For other markets, try Twelve Data first, fall back to Yahoo Finance
      const tdKey = Deno.env.get('TWELVE_DATA_API_KEY');
      if (tdKey) {
        try {
          result = await fetchFromTwelveData(symbol, exchange, tdKey);
        } catch (tdError) {
          console.warn('Twelve Data failed, falling back to Yahoo Finance:', tdError);
          result = await fetchFromYahooFinance(symbol, exchange);
        }
      } else {
        result = await fetchFromYahooFinance(symbol, exchange);
      }
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
