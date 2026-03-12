import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ASSETS = {
  etfs: [
    { symbol: "GLD", name: "Gold ETF", yahoo: "GLD" },
    { symbol: "SLV", name: "Silver ETF", yahoo: "SLV" },
    { symbol: "USO", name: "Oil ETF", yahoo: "USO" },
    { symbol: "CPER", name: "Copper ETF", yahoo: "CPER" },
    { symbol: "UNG", name: "Natural Gas ETF", yahoo: "UNG" },
  ],
  crypto: [
    { symbol: "BTC-USD", name: "Bitcoin", yahoo: "BTC-USD" },
    { symbol: "ETH-USD", name: "Ethereum", yahoo: "ETH-USD" },
    { symbol: "SOL-USD", name: "Solana", yahoo: "SOL-USD" },
    { symbol: "BNB-USD", name: "BNB", yahoo: "BNB-USD" },
    { symbol: "XRP-USD", name: "XRP", yahoo: "XRP-USD" },
  ],
  bonds: [
    { symbol: "^TNX", name: "US 10Y Treasury", yahoo: "^TNX" },
    { symbol: "^IRX", name: "US 2Y Treasury", yahoo: "^IRX" },
    { symbol: "BUND-DE", name: "Germany 10Y Bund", yahoo: "TLT" },
    { symbol: "GILT-UK", name: "UK 10Y Gilt", yahoo: "IGLT.L" },
    { symbol: "JGB-JP", name: "Japan 10Y Bond", yahoo: "1321.T" },
  ],
  currencies: [
    { symbol: "DX-Y.NYB", name: "US Dollar (DXY)", yahoo: "DX-Y.NYB" },
    { symbol: "EURUSD=X", name: "Euro", yahoo: "EURUSD=X" },
    { symbol: "INR=X", name: "Indian Rupee", yahoo: "INR=X" },
    { symbol: "CNY=X", name: "Chinese Yuan", yahoo: "CNY=X" },
    { symbol: "JPY=X", name: "Japanese Yen", yahoo: "JPY=X" },
    { symbol: "AED=X", name: "UAE Dirham", yahoo: "AED=X" },
    { symbol: "RUB=X", name: "Russian Ruble", yahoo: "RUB=X" },
  ],
};

async function fetchYahooQuote(yahooSymbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1d&interval=5m`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Yahoo ${res.status}`);
  const json = await res.json();
  const result = json.chart?.result?.[0];
  if (!result) throw new Error("No data");

  const meta = result.meta;
  const price = meta.regularMarketPrice ?? 0;
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = price - prevClose;
  const changePct = prevClose ? (change / prevClose) * 100 : 0;

  const quote = result.indicators?.quote?.[0] || {};
  const closes = quote.close || [];
  const timestamps = result.timestamp || [];
  const chartData: { t: number; v: number }[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (closes[i] != null) {
      chartData.push({ t: timestamps[i], v: Number(closes[i].toFixed(2)) });
    }
  }

  return {
    price: Number(price.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePct: Number(changePct.toFixed(2)),
    chartData: chartData.slice(-78),
  };
}

async function fetchTwelveData(symbol: string) {
  const apiKey = Deno.env.get("TWELVE_DATA_API_KEY");
  if (!apiKey) throw new Error("No Twelve Data key");
  const cleanSymbol = symbol.replace("-USD", "/USD");
  const res = await fetch(
    `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(cleanSymbol)}&apikey=${apiKey}`
  );
  if (!res.ok) throw new Error(`TwelveData ${res.status}`);
  const data = await res.json();
  if (data.status === "error") throw new Error(data.message);
  const price = parseFloat(data.close || "0");
  const prevClose = parseFloat(data.previous_close || "0");
  const change = price - prevClose;
  const changePct = prevClose ? (change / prevClose) * 100 : 0;
  return {
    price: Number(price.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePct: Number(changePct.toFixed(2)),
    chartData: [] as { t: number; v: number }[],
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const allAssets = [
      ...ASSETS.etfs.map((a) => ({ ...a, category: "etfs" })),
      ...ASSETS.crypto.map((a) => ({ ...a, category: "crypto" })),
      ...ASSETS.bonds.map((a) => ({ ...a, category: "bonds" })),
    ];

    const results = await Promise.allSettled(
      allAssets.map(async (asset) => {
        let data;
        try {
          data = await fetchYahooQuote(asset.yahoo);
        } catch {
          data = await fetchTwelveData(asset.symbol);
        }
        return {
          symbol: asset.symbol,
          name: asset.name,
          category: asset.category,
          price: data.price,
          change: data.change,
          changePct: data.changePct,
          chartData: data.chartData,
        };
      })
    );

    const assets = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<any>).value);

    return new Response(
      JSON.stringify({ assets, fetchedAt: Date.now() }),
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
