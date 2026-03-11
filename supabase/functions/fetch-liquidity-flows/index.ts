const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Proxy symbols for each asset class
const ASSET_PROXIES: Record<string, { symbols: string[]; label: string }> = {
  equities:     { symbols: ['SPY', 'QQQ'],   label: 'Equities' },
  crypto:       { symbols: ['BITO'],          label: 'Cryptocurrencies' },
  commodities:  { symbols: ['GLD', 'USO'],    label: 'Commodities' },
  bonds:        { symbols: ['TLT', 'AGG'],    label: 'Bonds' },
  currencies:   { symbols: ['UUP'],           label: 'Currencies' },
  defensive:    { symbols: ['SHV', 'BIL'],    label: 'Cash / Defensive' },
};

async function fetchQuote(symbol: string, apiKey: string) {
  // Try Yahoo first
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=5d&interval=1d`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const json = await res.json();
      const result = json.chart?.result?.[0];
      if (result) {
        const meta = result.meta;
        const price = meta.regularMarketPrice ?? 0;
        const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
        const change = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
        const volume = meta.regularMarketVolume ?? 0;
        return { price, change, volume };
      }
    }
  } catch { /* fallback */ }

  // Fallback to Twelve Data
  const res = await fetch(`https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${apiKey}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  if (data.status === 'error') throw new Error(data.message);
  const price = parseFloat(data.close || '0');
  const prevClose = parseFloat(data.previous_close || '0');
  const change = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
  const volume = parseInt(data.volume || '0', 10);
  return { price, change, volume };
}

function computeLiquidityScore(changes: number[]): number {
  if (changes.length === 0) return 0;
  const avg = changes.reduce((a, b) => a + b, 0) / changes.length;
  // Normalize to roughly -1 to 1 range (3% move = ±1.0)
  return Math.max(-1, Math.min(1, avg / 3));
}

function determineFlows(scores: Record<string, number>) {
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const flows: Array<{
    source: string;
    target: string;
    sourceLabel: string;
    targetLabel: string;
    magnitude: number;
    shift: number;
  }> = [];

  // Capital flows from negative-score assets to positive-score assets
  const positive = entries.filter(([, s]) => s > 0.05);
  const negative = entries.filter(([, s]) => s < -0.05);

  for (const [negKey, negScore] of negative) {
    for (const [posKey, posScore] of positive) {
      const shift = posScore - negScore;
      const magnitude = Math.min(1, Math.abs(shift) / 1.5);
      flows.push({
        source: negKey,
        target: posKey,
        sourceLabel: ASSET_PROXIES[negKey]?.label || negKey,
        targetLabel: ASSET_PROXIES[posKey]?.label || posKey,
        magnitude,
        shift: Number(shift.toFixed(2)),
      });
    }
  }

  // If no clear flows, show top two relative movements
  if (flows.length === 0 && entries.length >= 2) {
    const [top] = entries;
    const bottom = entries[entries.length - 1];
    const shift = top[1] - bottom[1];
    if (Math.abs(shift) > 0.02) {
      flows.push({
        source: bottom[0],
        target: top[0],
        sourceLabel: ASSET_PROXIES[bottom[0]]?.label || bottom[0],
        targetLabel: ASSET_PROXIES[top[0]]?.label || top[0],
        magnitude: Math.min(1, Math.abs(shift) / 1.5),
        shift: Number(shift.toFixed(2)),
      });
    }
  }

  return flows.sort((a, b) => b.magnitude - a.magnitude).slice(0, 8);
}

function detectRegime(scores: Record<string, number>): { regime: string; confidence: number } {
  const eq = scores.equities || 0;
  const cr = scores.crypto || 0;
  const bo = scores.bonds || 0;
  const de = scores.defensive || 0;
  const co = scores.commodities || 0;

  const riskOnSignal = eq + cr - bo - de;
  const confidence = Math.min(95, Math.round(Math.abs(riskOnSignal) * 40 + 30));

  if (riskOnSignal > 0.3) return { regime: 'Risk-On', confidence };
  if (riskOnSignal < -0.3) return { regime: 'Defensive Rotation', confidence };
  if (co > 0.3 && eq < 0) return { regime: 'Inflation Hedge', confidence };
  return { regime: 'Neutral / Transitional', confidence };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('TWELVE_DATA_API_KEY') || '';
    const allSymbols = Object.values(ASSET_PROXIES).flatMap(a => a.symbols);

    const results = await Promise.allSettled(
      allSymbols.map(sym => fetchQuote(sym, apiKey))
    );

    // Map results back to asset classes
    const assetScores: Record<string, number> = {};
    const assetDetails: Record<string, { label: string; score: number; change: number }> = {};
    let idx = 0;

    for (const [key, meta] of Object.entries(ASSET_PROXIES)) {
      const changes: number[] = [];
      for (const _sym of meta.symbols) {
        const r = results[idx];
        if (r.status === 'fulfilled') {
          changes.push(r.value.change);
        }
        idx++;
      }
      const score = computeLiquidityScore(changes);
      assetScores[key] = score;
      assetDetails[key] = {
        label: meta.label,
        score: Number(score.toFixed(2)),
        change: changes.length > 0 ? Number((changes.reduce((a, b) => a + b, 0) / changes.length).toFixed(2)) : 0,
      };
    }

    const flows = determineFlows(assetScores);
    const regime = detectRegime(assetScores);

    return new Response(JSON.stringify({
      success: true,
      assets: assetDetails,
      flows,
      regime,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Liquidity flow error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
