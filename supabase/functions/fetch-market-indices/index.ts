import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Yahoo Finance symbols for major indices
const INDICES = [
  { symbol: "^NSEI", name: "NIFTY 50", exchange: "NSE", tz: "Asia/Kolkata", openH: 9, openM: 15, closeH: 15, closeM: 30 },
  { symbol: "^BSESN", name: "SENSEX", exchange: "BSE", tz: "Asia/Kolkata", openH: 9, openM: 15, closeH: 15, closeM: 30 },
  { symbol: "^IXIC", name: "NASDAQ", exchange: "NASDAQ", tz: "America/New_York", openH: 9, openM: 30, closeH: 16, closeM: 0 },
  { symbol: "^GSPC", name: "S&P 500", exchange: "NYSE", tz: "America/New_York", openH: 9, openM: 30, closeH: 16, closeM: 0 },
  { symbol: "^DJI", name: "DOW JONES", exchange: "NYSE", tz: "America/New_York", openH: 9, openM: 30, closeH: 16, closeM: 0 },
  { symbol: "^FTSE", name: "FTSE 100", exchange: "LSE", tz: "Europe/London", openH: 8, openM: 0, closeH: 16, closeM: 30 },
  { symbol: "^GDAXI", name: "DAX", exchange: "XETRA", tz: "Europe/Berlin", openH: 9, openM: 0, closeH: 17, closeM: 30 },
  { symbol: "^N225", name: "NIKKEI 225", exchange: "TSE", tz: "Asia/Tokyo", openH: 9, openM: 0, closeH: 15, closeM: 0 },
  { symbol: "^HSI", name: "HANG SENG", exchange: "HKEX", tz: "Asia/Hong_Kong", openH: 9, openM: 30, closeH: 16, closeM: 0 },
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

  if (["Sat", "Sun"].includes(weekday)) return false;

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

  // Get mini chart data (last ~78 5-min candles = 1 day)
  const closes = result.indicators?.quote?.[0]?.close || [];
  const timestamps = result.timestamp || [];
  const chartData: { t: number; v: number }[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (closes[i] != null) {
      chartData.push({ t: timestamps[i], v: Number(closes[i].toFixed(2)) });
    }
  }

  return { price, change, changePct, chartData };
}

async function fetchFromFinnhub(symbol: string) {
  const apiKey = Deno.env.get("FINNHUB_API_KEY");
  if (!apiKey) throw new Error("No Finnhub key");

  // Finnhub doesn't support ^ symbols for indices, try mapped symbols
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
          // Fallback to Finnhub for US indices
          data = await fetchFromFinnhub(idx.symbol);
        }
        return {
          symbol: idx.symbol,
          name: idx.name,
          exchange: idx.exchange,
          price: Number(data.price.toFixed(2)),
          change: Number(data.change.toFixed(2)),
          changePct: Number(data.changePct.toFixed(2)),
          isOpen: isMarketOpen(idx),
          chartData: data.chartData.slice(-78), // Last day of 5-min candles
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
