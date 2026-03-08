import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Yahoo Finance symbols for major indices — grouped by region
const INDICES = [
  // India
  { symbol: "^NSEI", name: "NIFTY 50", exchange: "NSE", region: "India", tz: "Asia/Kolkata", openH: 9, openM: 15, closeH: 15, closeM: 30 },
  { symbol: "^BSESN", name: "SENSEX", exchange: "BSE", region: "India", tz: "Asia/Kolkata", openH: 9, openM: 15, closeH: 15, closeM: 30 },
  // United States
  { symbol: "^GSPC", name: "S&P 500", exchange: "NYSE", region: "United States", tz: "America/New_York", openH: 9, openM: 30, closeH: 16, closeM: 0 },
  { symbol: "^IXIC", name: "NASDAQ", exchange: "NASDAQ", region: "United States", tz: "America/New_York", openH: 9, openM: 30, closeH: 16, closeM: 0 },
  { symbol: "^DJI", name: "DOW JONES", exchange: "NYSE", region: "United States", tz: "America/New_York", openH: 9, openM: 30, closeH: 16, closeM: 0 },
  // Europe
  { symbol: "^FTSE", name: "FTSE 100", exchange: "LSE", region: "Europe", tz: "Europe/London", openH: 8, openM: 0, closeH: 16, closeM: 30 },
  { symbol: "^GDAXI", name: "DAX", exchange: "XETRA", region: "Europe", tz: "Europe/Berlin", openH: 9, openM: 0, closeH: 17, closeM: 30 },
  { symbol: "^FCHI", name: "CAC 40", exchange: "EPA", region: "Europe", tz: "Europe/Paris", openH: 9, openM: 0, closeH: 17, closeM: 30 },
  // Asia
  { symbol: "^N225", name: "NIKKEI 225", exchange: "TSE", region: "Asia", tz: "Asia/Tokyo", openH: 9, openM: 0, closeH: 15, closeM: 0 },
  { symbol: "^HSI", name: "HANG SENG", exchange: "HKEX", region: "Asia", tz: "Asia/Hong_Kong", openH: 9, openM: 30, closeH: 16, closeM: 0 },
  { symbol: "000001.SS", name: "SHANGHAI", exchange: "SSE", region: "Asia", tz: "Asia/Shanghai", openH: 9, openM: 30, closeH: 15, closeM: 0 },
  // Middle East
  { symbol: "^TASI", name: "TADAWUL", exchange: "SAU", region: "Middle East", tz: "Asia/Riyadh", openH: 10, openM: 0, closeH: 15, closeM: 0 },
];

function isMarketOpen(idx: typeof INDICES[0]): boolean {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: idx.tz,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    weekday: "short",
  });
  const parts = formatter.formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value || "";
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0");
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0");

  // Friday is a weekend day for Saudi market
  if (idx.region === "Middle East") {
    if (["Fri", "Sat"].includes(weekday)) return false;
  } else {
    if (["Sat", "Sun"].includes(weekday)) return false;
  }

  const nowMins = hour * 60 + minute;
  const openMins = idx.openH * 60 + idx.openM;
  const closeMins = idx.closeH * 60 + idx.closeM;
  return nowMins >= openMins && nowMins < closeMins;
}

async function fetchFromYahoo(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
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
  const highs = quote.high || [];
  const lows = quote.low || [];
  const volumes = quote.volume || [];
  const timestamps = result.timestamp || [];

  const chartData: { t: number; v: number }[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (closes[i] != null) {
      chartData.push({ t: timestamps[i], v: Number(closes[i].toFixed(2)) });
    }
  }

  // Calculate daily high, low, volume
  const validHighs = highs.filter((h: number | null) => h != null) as number[];
  const validLows = lows.filter((l: number | null) => l != null) as number[];
  const validVols = volumes.filter((v: number | null) => v != null) as number[];

  const dayHigh = validHighs.length ? Math.max(...validHighs) : price;
  const dayLow = validLows.length ? Math.min(...validLows) : price;
  const totalVolume = validVols.reduce((a: number, b: number) => a + b, 0);

  return { price, change, changePct, chartData, dayHigh, dayLow, volume: totalVolume };
}

async function fetchFromFinnhub(symbol: string) {
  const apiKey = Deno.env.get("FINNHUB_API_KEY");
  if (!apiKey) throw new Error("No Finnhub key");

  const finnhubMap: Record<string, string> = {
    "^GSPC": "SPY",
    "^DJI": "DIA",
    "^IXIC": "QQQ",
  };
  const fSymbol = finnhubMap[symbol];
  if (!fSymbol) throw new Error("Not supported on Finnhub");

  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${fSymbol}&token=${apiKey}`
  );
  if (!res.ok) throw new Error(`Finnhub ${res.status}`);
  const data = await res.json();
  if (!data.c) throw new Error("No Finnhub data");

  return {
    price: data.c,
    change: data.d,
    changePct: data.dp,
    chartData: [] as { t: number; v: number }[],
    dayHigh: data.h || data.c,
    dayLow: data.l || data.c,
    volume: 0,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const results = await Promise.allSettled(
      INDICES.map(async (idx) => {
        let data;
        try {
          data = await fetchFromYahoo(idx.symbol);
        } catch {
          data = await fetchFromFinnhub(idx.symbol);
        }
        return {
          symbol: idx.symbol,
          name: idx.name,
          exchange: idx.exchange,
          region: idx.region,
          price: Number(data.price.toFixed(2)),
          change: Number(data.change.toFixed(2)),
          changePct: Number(data.changePct.toFixed(2)),
          isOpen: isMarketOpen(idx),
          chartData: data.chartData.slice(-78),
          dayHigh: Number(data.dayHigh.toFixed(2)),
          dayLow: Number(data.dayLow.toFixed(2)),
          volume: data.volume,
        };
      })
    );

    const indices = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<any>).value);

    return new Response(JSON.stringify({ indices, fetchedAt: Date.now() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
