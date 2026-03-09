const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Capital flow proxy ETFs for each category
const FLOW_ETFS: Record<string, { symbol: string; label: string; category: 'region' | 'asset' | 'sector' }> = {
  // Regions
  'SPY':   { symbol: 'SPY',  label: 'United States',    category: 'region' },
  'VGK':   { symbol: 'VGK',  label: 'Europe',           category: 'region' },
  'VPL':   { symbol: 'VPL',  label: 'Asia-Pacific',     category: 'region' },
  'VWO':   { symbol: 'VWO',  label: 'Emerging Markets', category: 'region' },
// Asset classes
  'VTI':   { symbol: 'VTI',  label: 'Equities',         category: 'asset' },
  'AGG':   { symbol: 'AGG',  label: 'Bonds',            category: 'asset' },
  'DBC':   { symbol: 'DBC',  label: 'Commodities',      category: 'asset' },
  'GLD':   { symbol: 'GLD',  label: 'Gold',             category: 'asset' },
  'BITO':  { symbol: 'BITO', label: 'Cryptocurrency',   category: 'asset' },
  // Sectors
  'XLK':   { symbol: 'XLK',  label: 'Technology',       category: 'sector' },
  'XLE':   { symbol: 'XLE',  label: 'Energy',           category: 'sector' },
  'XLI':   { symbol: 'XLI',  label: 'Industrials',      category: 'sector' },
  'XLV':   { symbol: 'XLV',  label: 'Healthcare',       category: 'sector' },
  'XLF':   { symbol: 'XLF',  label: 'Financials',       category: 'sector' },
  'XLY':   { symbol: 'XLY',  label: 'Consumer',         category: 'sector' },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('TWELVE_DATA_API_KEY');
    const symbols = Object.keys(FLOW_ETFS).join(',');

    // Fetch quotes for all ETFs in one batch call
    const url = `https://api.twelvedata.com/quote?symbol=${symbols}&apikey=${apiKey}`;
    console.log('Fetching capital flows for:', symbols);
    const resp = await fetch(url);
    const raw = await resp.json();
    console.log('Raw response keys:', Object.keys(raw));

    const flows: any[] = [];

    for (const [sym, meta] of Object.entries(FLOW_ETFS)) {
      const q = raw[sym] || (Object.keys(FLOW_ETFS).length === 1 ? raw : null);
      if (!q || q.code || q.status === 'error') {
        console.log(`Skipping ${sym}: no data or error`, q?.code || q?.status);
        continue;
      }

      const price = parseFloat(q.close || q.price || '0');
      const prevClose = parseFloat(q.previous_close || '0');
      const pctChange = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;
      const volume = parseInt(q.volume || '0', 10);

      // Estimate net flow: positive price change + volume → inflow proxy
      // This is a simplified proxy; real fund flow data requires premium sources
      const avgPrice = (price + prevClose) / 2;
      const dollarVolume = avgPrice * volume;
      const netFlowEstimate = pctChange >= 0 ? dollarVolume : -dollarVolume;

      flows.push({
        symbol: sym,
        label: meta.label,
        category: meta.category,
        price,
        change: pctChange,
        volume,
        netFlow: netFlowEstimate,
        direction: pctChange > 0.2 ? 'inflow' : pctChange < -0.2 ? 'outflow' : 'neutral',
      });
    }

    return new Response(JSON.stringify({ success: true, flows, timestamp: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Capital flow fetch error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
