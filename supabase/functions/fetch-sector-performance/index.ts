import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Sector ETFs — widely tracked proxies for global sector performance
const SECTOR_ETFS = [
  { symbol: "XLK", sector: "Technology", icon: "💻" },
  { symbol: "XLE", sector: "Energy", icon: "⛽" },
  { symbol: "ITA", sector: "Defense & Aerospace", icon: "🛡️" },
  { symbol: "PAVE", sector: "Infrastructure", icon: "🏗️" },
  { symbol: "XLF", sector: "Financial Services", icon: "🏦" },
  { symbol: "XLV", sector: "Healthcare", icon: "🏥" },
  { symbol: "XLP", sector: "Consumer Goods", icon: "🛒" },
  { symbol: "CARZ", sector: "Automotive", icon: "🚗" },
  { symbol: "SOXX", sector: "Semiconductors", icon: "🔌" },
  { symbol: "XLC", sector: "Telecom", icon: "📡" },
  { symbol: "XLU", sector: "Utilities", icon: "💡" },
  { symbol: "XLB", sector: "Materials & Mining", icon: "⛏️" },
];

interface SectorResult {
  sector: string;
  symbol: string;
  icon: string;
  price: number;
  change: number;
  changePct: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  topHoldings: { name: string; symbol: string; changePct: number }[];
}

async function fetchETFData(etf: typeof SECTOR_ETFS[0]): Promise<SectorResult> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${etf.symbol}?range=1d&interval=5m`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`Yahoo ${res.status} for ${etf.symbol}`);
  const json = await res.json();
  const result = json.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${etf.symbol}`);

  const meta = result.meta;
  const price = meta.regularMarketPrice ?? 0;
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = price - prevClose;
  const changePct = prevClose ? (change / prevClose) * 100 : 0;

  const quote = result.indicators?.quote?.[0] || {};
  const highs = (quote.high || []).filter((h: number | null) => h != null) as number[];
  const lows = (quote.low || []).filter((l: number | null) => l != null) as number[];
  const volumes = (quote.volume || []).filter((v: number | null) => v != null) as number[];

  return {
    sector: etf.sector,
    symbol: etf.symbol,
    icon: etf.icon,
    price: Number(price.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePct: Number(changePct.toFixed(2)),
    dayHigh: highs.length ? Number(Math.max(...highs).toFixed(2)) : price,
    dayLow: lows.length ? Number(Math.min(...lows).toFixed(2)) : price,
    volume: volumes.reduce((a: number, b: number) => a + b, 0),
    topHoldings: [],
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const results = await Promise.allSettled(
      SECTOR_ETFS.map((etf) => fetchETFData(etf))
    );

    const sectors = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<SectorResult>).value);

    return new Response(
      JSON.stringify({ sectors, fetchedAt: Date.now() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
