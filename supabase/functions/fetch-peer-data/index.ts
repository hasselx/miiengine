const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Sector → peer ticker mapping (common Indian + US stocks)
const SECTOR_PEERS: Record<string, string[]> = {
  // Indian Defence
  'aerospace & defense': ['HAL.NS', 'BDL.NS', 'DATAPATTNS.NS', 'PARAS.NS', 'COCHINSHIP.NS'],
  // Indian IT
  'information technology services': ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'TECHM.NS'],
  'software—infrastructure': ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'TECHM.NS'],
  // Indian Banks
  'banks—regional': ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS'],
  'banks—diversified': ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS'],
  // Indian Auto
  'auto manufacturers': ['TATAMOTORS.NS', 'MARUTI.NS', 'M&M.NS', 'BAJAJ-AUTO.NS', 'HEROMOTOCO.NS'],
  // Indian Pharma
  'drug manufacturers—general': ['SUNPHARMA.NS', 'DRREDDY.NS', 'CIPLA.NS', 'DIVISLAB.NS', 'LUPIN.NS'],
  // Indian Energy
  'oil & gas integrated': ['RELIANCE.NS', 'ONGC.NS', 'IOC.NS', 'BPCL.NS', 'GAIL.NS'],
  // US Tech
  'consumer electronics': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'],
  'semiconductors': ['NVDA', 'AMD', 'INTC', 'AVGO', 'QCOM'],
  'internet retail': ['AMZN', 'BABA', 'JD', 'MELI', 'SE'],
  'software—application': ['MSFT', 'CRM', 'ADBE', 'NOW', 'ORCL'],
  // US Finance
  'banks—money center': ['JPM', 'BAC', 'WFC', 'C', 'GS'],
  // US Healthcare
  'drug manufacturers—major': ['JNJ', 'PFE', 'MRK', 'ABBV', 'LLY'],
  // Generic fallbacks by broad sector
  'technology': ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA'],
  'financial services': ['JPM', 'BAC', 'GS', 'MS', 'BLK'],
  'healthcare': ['JNJ', 'PFE', 'UNH', 'MRK', 'ABBV'],
  'consumer cyclical': ['AMZN', 'TSLA', 'HD', 'NKE', 'MCD'],
  'industrials': ['HON', 'UNP', 'CAT', 'GE', 'MMM'],
  'energy': ['XOM', 'CVX', 'COP', 'SLB', 'EOG'],
  'basic materials': ['LIN', 'APD', 'ECL', 'SHW', 'DD'],
  'communication services': ['GOOGL', 'META', 'DIS', 'NFLX', 'CMCSA'],
  'utilities': ['NEE', 'DUK', 'SO', 'D', 'AEP'],
  'real estate': ['PLD', 'AMT', 'CCI', 'EQIX', 'SPG'],
  'consumer defensive': ['PG', 'KO', 'PEP', 'WMT', 'COST'],
};

function findPeerSymbols(industry: string, sector: string, currentSymbol: string): string[] {
  const industryLower = (industry || '').toLowerCase();
  const sectorLower = (sector || '').toLowerCase();
  
  // Try industry first, then sector
  let peers = SECTOR_PEERS[industryLower] || SECTOR_PEERS[sectorLower] || [];
  
  // Fuzzy match if exact not found
  if (peers.length === 0) {
    for (const [key, syms] of Object.entries(SECTOR_PEERS)) {
      if (industryLower.includes(key) || key.includes(industryLower) ||
          sectorLower.includes(key) || key.includes(sectorLower)) {
        peers = syms;
        break;
      }
    }
  }
  
  // Remove the current stock from peers
  const currentNorm = currentSymbol.toUpperCase().replace(/\.(NS|BO)$/, '');
  return peers
    .filter(p => !p.toUpperCase().replace(/\.(NS|BO)$/, '').includes(currentNorm))
    .slice(0, 4);
}

async function fetchYahooCrumb(): Promise<{ crumb: string; cookie: string }> {
  const consentRes = await fetch('https://fc.yahoo.com/', { redirect: 'manual' });
  await consentRes.text();
  const setCookie = consentRes.headers.get('set-cookie') || '';
  const crumbRes = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Cookie': setCookie,
    },
  });
  const crumb = await crumbRes.text();
  return { crumb, cookie: setCookie };
}

interface PeerMetrics {
  symbol: string;
  name: string;
  price: number;
  pe: number;
  marketCap: number;
  revenueGrowth: number | null;
  operatingMargin: number | null;
  profitMargin: number | null;
  roe: number | null;
  debtToEquity: number | null;
  eps: number;
  error?: string;
}

async function fetchPeerMetrics(symbol: string, crumb: string, cookie: string): Promise<PeerMetrics | null> {
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
  };
  if (cookie) headers['Cookie'] = cookie;

  const modules = 'summaryDetail,defaultKeyStatistics,financialData,assetProfile';
  const urls = [
    `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}${crumb ? `&crumb=${encodeURIComponent(crumb)}` : ''}`,
    `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}${crumb ? `&crumb=${encodeURIComponent(crumb)}` : ''}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) { await res.text(); continue; }
      const json = await res.json();
      const result = json?.quoteSummary?.result?.[0];
      if (!result) continue;

      const sd = result.summaryDetail || {};
      const ks = result.defaultKeyStatistics || {};
      const fd = result.financialData || {};
      const ap = result.assetProfile || {};

      return {
        symbol: symbol.replace(/\.(NS|BO)$/, ''),
        name: ap.name || sd.shortName || symbol.replace(/\.(NS|BO)$/, ''),
        price: fd.currentPrice?.raw ?? sd.regularMarketPrice?.raw ?? 0,
        pe: sd.trailingPE?.raw ?? ks.trailingPE?.raw ?? 0,
        marketCap: sd.marketCap?.raw ?? 0,
        revenueGrowth: fd.revenueGrowth?.raw ?? null,
        operatingMargin: fd.operatingMargins?.raw ?? null,
        profitMargin: fd.profitMargins?.raw ?? null,
        roe: fd.returnOnEquity?.raw ?? null,
        debtToEquity: fd.debtToEquity?.raw ?? null,
        eps: ks.trailingEps?.raw ?? 0,
      };
    } catch (e) {
      console.warn(`Failed to fetch peer ${symbol}: ${e}`);
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, industry, sector } = await req.json();
    if (!symbol) {
      return new Response(JSON.stringify({ error: 'Symbol required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const peerSymbols = findPeerSymbols(industry || '', sector || '', symbol);
    if (peerSymbols.length === 0) {
      return new Response(JSON.stringify({ peers: [], message: 'No peers found for this sector' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let crumb = '', cookie = '';
    try {
      const auth = await fetchYahooCrumb();
      crumb = auth.crumb;
      cookie = auth.cookie;
    } catch (e) {
      console.warn(`Failed to get Yahoo crumb: ${e}`);
    }

    // Fetch all peers in parallel
    const results = await Promise.all(
      peerSymbols.map(s => fetchPeerMetrics(s, crumb, cookie))
    );

    const peers = results.filter((r): r is PeerMetrics => r !== null && r.price > 0);

    return new Response(JSON.stringify({ peers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Peer fetch error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', peers: [] }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
