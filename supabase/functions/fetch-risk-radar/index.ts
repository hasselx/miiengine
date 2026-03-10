import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INDICATORS = [
  { symbol: "^GSPC", name: "S&P 500", category: "Equities", yahoo: "^GSPC" },
  { symbol: "^IXIC", name: "NASDAQ", category: "Equities", yahoo: "^IXIC" },
  { symbol: "^VIX", name: "VIX", category: "Volatility", yahoo: "^VIX" },
  { symbol: "GC=F", name: "Gold", category: "Commodities", yahoo: "GC=F" },
  { symbol: "CL=F", name: "Oil (WTI)", category: "Commodities", yahoo: "CL=F" },
  { symbol: "BTC-USD", name: "Bitcoin", category: "Crypto", yahoo: "BTC-USD" },
  { symbol: "^TNX", name: "US 10Y Yield", category: "Bonds", yahoo: "^TNX" },
  { symbol: "DX-Y.NYB", name: "US Dollar (DXY)", category: "Currency", yahoo: "DX-Y.NYB" },
];

async function fetchYahooQuote(yahooSymbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=5d&interval=1d`;
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

  return {
    price: Number(price.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePct: Number(changePct.toFixed(2)),
  };
}

async function fetchTwelveData(symbol: string) {
  const apiKey = Deno.env.get("TWELVE_DATA_API_KEY");
  if (!apiKey) throw new Error("No key");
  const cleanSymbol = symbol.replace("-USD", "/USD");
  const res = await fetch(
    `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(cleanSymbol)}&apikey=${apiKey}`
  );
  if (!res.ok) throw new Error(`TD ${res.status}`);
  const data = await res.json();
  if (data.status === "error") throw new Error(data.message);
  const price = parseFloat(data.close || "0");
  const prevClose = parseFloat(data.previous_close || "0");
  const change = price - prevClose;
  const changePct = prevClose ? (change / prevClose) * 100 : 0;
  return { price: Number(price.toFixed(2)), change: Number(change.toFixed(2)), changePct: Number(changePct.toFixed(2)) };
}

function computeSignal(name: string, category: string, changePct: number, price: number): { score: number; interpretation: string } {
  // VIX: inverse — rising VIX = risk-off
  if (name === "VIX") {
    if (price > 30) return { score: -1, interpretation: "Elevated fear — strong risk-off signal." };
    if (price > 20) return { score: -0.5, interpretation: "Above-average volatility — cautious sentiment." };
    if (changePct > 5) return { score: -0.7, interpretation: "VIX spiking — risk-off pressure." };
    if (changePct > 0) return { score: -0.3, interpretation: "Rising volatility — mild risk-off." };
    if (changePct < -5) return { score: 0.8, interpretation: "Sharp VIX decline — strong risk-on." };
    if (changePct < 0) return { score: 0.5, interpretation: "Declining volatility supports risk-on sentiment." };
    return { score: 0, interpretation: "Volatility stable." };
  }

  // Gold: rising gold = risk-off (safe haven)
  if (name === "Gold") {
    if (changePct > 2) return { score: -0.7, interpretation: "Gold surging — flight to safety." };
    if (changePct > 0.5) return { score: -0.3, interpretation: "Gold rising — mild safe-haven demand." };
    if (changePct < -1) return { score: 0.5, interpretation: "Gold declining — risk appetite improving." };
    return { score: 0, interpretation: "Gold stable." };
  }

  // DXY: rising dollar = risk-off
  if (category === "Currency") {
    if (changePct > 0.5) return { score: -0.5, interpretation: "Dollar strengthening — risk-off lean." };
    if (changePct < -0.5) return { score: 0.5, interpretation: "Dollar weakening — supports risk assets." };
    return { score: 0, interpretation: "Dollar stable." };
  }

  // Bonds (yield): rising yields = risk-on (money leaving bonds)
  if (category === "Bonds") {
    if (changePct > 2) return { score: 0.5, interpretation: "Yields rising — capital rotating to risk assets." };
    if (changePct < -2) return { score: -0.5, interpretation: "Yields falling — flight to safety." };
    return { score: 0, interpretation: "Bond yields stable." };
  }

  // Equities, Crypto, Oil: rising = risk-on
  if (changePct > 2) return { score: 0.8, interpretation: `${name} rallying — strong risk-on signal.` };
  if (changePct > 0.5) return { score: 0.4, interpretation: `${name} rising — supports risk-on.` };
  if (changePct < -2) return { score: -0.8, interpretation: `${name} selling off — risk-off pressure.` };
  if (changePct < -0.5) return { score: -0.4, interpretation: `${name} declining — risk-off lean.` };
  return { score: 0, interpretation: `${name} flat.` };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const results = await Promise.allSettled(
      INDICATORS.map(async (ind) => {
        let data;
        try {
          data = await fetchYahooQuote(ind.yahoo);
        } catch {
          data = await fetchTwelveData(ind.symbol);
        }
        const signal = computeSignal(ind.name, ind.category, data.changePct, data.price);
        return {
          symbol: ind.symbol,
          name: ind.name,
          category: ind.category,
          price: data.price,
          change: data.change,
          changePct: data.changePct,
          score: signal.score,
          interpretation: signal.interpretation,
        };
      })
    );

    const indicators = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<any>).value);

    // Aggregate score
    const totalScore = indicators.reduce((sum: number, i: any) => sum + i.score, 0);
    const maxScore = indicators.length; // each can be ±1
    const normalizedScore = maxScore > 0 ? totalScore / maxScore : 0; // -1 to +1
    const confidence = Math.min(100, Math.round(Math.abs(normalizedScore) * 100));

    let regime: string;
    if (normalizedScore > 0.2) regime = "Risk-On";
    else if (normalizedScore < -0.2) regime = "Risk-Off";
    else regime = "Neutral";

    return new Response(
      JSON.stringify({ indicators, regime, confidence, normalizedScore: Number(normalizedScore.toFixed(2)), fetchedAt: Date.now() }),
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
