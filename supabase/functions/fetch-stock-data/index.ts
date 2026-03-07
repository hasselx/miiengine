const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TWELVE_DATA_BASE = 'https://api.twelvedata.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('TWELVE_DATA_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'TWELVE_DATA_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { symbol, exchange } = await req.json();
    if (!symbol) {
      return new Response(JSON.stringify({ error: 'Symbol is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const symbolParam = exchange ? `${symbol}:${exchange}` : symbol;

    // Fetch quote, profile, and statistics in parallel
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

    // Check for API errors
    if (quote.code && quote.code !== 200) {
      return new Response(JSON.stringify({ error: quote.message || 'Failed to fetch stock data', code: quote.code }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = {
      quote,
      profile,
      statistics: stats,
      timeSeries: timeSeries.values || [],
    };

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
