import { useMemo, useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Exchange {
  name: string;
  code: string;
  flag: string;
  timezone: string;
  utcOffset: number;
  openHour: number;
  openMin: number;
  closeHour: number;
  closeMin: number;
  currencyPair: string; // e.g. "USD/INR"
  currencyLabel: string; // e.g. "INR"
}

const EXCHANGES: Exchange[] = [
  { name: "NSE / BSE", code: "India", flag: "🇮🇳", timezone: "IST", utcOffset: 5.5, openHour: 9, openMin: 15, closeHour: 15, closeMin: 30, currencyPair: "USD/INR", currencyLabel: "INR" },
  { name: "NYSE", code: "US", flag: "🇺🇸", timezone: "ET", utcOffset: -4, openHour: 9, openMin: 30, closeHour: 16, closeMin: 0, currencyPair: "DXY", currencyLabel: "DXY" },
  { name: "NASDAQ", code: "US", flag: "🇺🇸", timezone: "ET", utcOffset: -4, openHour: 9, openMin: 30, closeHour: 16, closeMin: 0, currencyPair: "DXY", currencyLabel: "DXY" },
  { name: "LSE", code: "UK", flag: "🇬🇧", timezone: "GMT", utcOffset: 1, openHour: 8, openMin: 0, closeHour: 16, closeMin: 30, currencyPair: "GBP/USD", currencyLabel: "GBP" },
  { name: "TSE", code: "Japan", flag: "🇯🇵", timezone: "JST", utcOffset: 9, openHour: 9, openMin: 0, closeHour: 15, closeMin: 0, currencyPair: "USD/JPY", currencyLabel: "JPY" },
  { name: "SSE", code: "China", flag: "🇨🇳", timezone: "CST", utcOffset: 8, openHour: 9, openMin: 30, closeHour: 15, closeMin: 0, currencyPair: "USD/CNY", currencyLabel: "CNY" },
  { name: "HKEX", code: "HK", flag: "🇭🇰", timezone: "HKT", utcOffset: 8, openHour: 9, openMin: 30, closeHour: 16, closeMin: 0, currencyPair: "USD/HKD", currencyLabel: "HKD" },
  { name: "Xetra", code: "Germany", flag: "🇩🇪", timezone: "CET", utcOffset: 2, openHour: 9, openMin: 0, closeHour: 17, closeMin: 30, currencyPair: "EUR/USD", currencyLabel: "EUR" },
  { name: "Euronext", code: "France", flag: "🇫🇷", timezone: "CET", utcOffset: 2, openHour: 9, openMin: 0, closeHour: 17, closeMin: 30, currencyPair: "EUR/USD", currencyLabel: "EUR" },
  { name: "ASX", code: "Australia", flag: "🇦🇺", timezone: "AEST", utcOffset: 10, openHour: 10, openMin: 0, closeHour: 16, closeMin: 0, currencyPair: "AUD/USD", currencyLabel: "AUD" },
  { name: "KRX", code: "Korea", flag: "🇰🇷", timezone: "KST", utcOffset: 9, openHour: 9, openMin: 0, closeHour: 15, closeMin: 30, currencyPair: "USD/KRW", currencyLabel: "KRW" },
  { name: "TSX", code: "Canada", flag: "🇨🇦", timezone: "ET", utcOffset: -4, openHour: 9, openMin: 30, closeHour: 16, closeMin: 0, currencyPair: "USD/CAD", currencyLabel: "CAD" },
];

// Fallback rates (used if API fails)
const FALLBACK_RATES: Record<string, number> = {
  "USD/INR": 87.12,
  "DXY": 103.85,
  "GBP/USD": 1.29,
  "USD/JPY": 147.52,
  "USD/CNY": 7.24,
  "USD/HKD": 7.78,
  "EUR/USD": 1.09,
  "AUD/USD": 0.66,
  "USD/KRW": 1345.20,
  "USD/CAD": 1.36,
};

function getExchangeStatus(ex: Exchange): { status: "open" | "pre-market" | "closed"; localTime: string } {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const localMs = utcMs + ex.utcOffset * 3600000;
  const local = new Date(localMs);

  const day = local.getDay();
  const h = local.getHours();
  const m = local.getMinutes();
  const totalMin = h * 60 + m;
  const openMin = ex.openHour * 60 + ex.openMin;
  const closeMin = ex.closeHour * 60 + ex.closeMin;

  const localTime = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;

  if (day === 0 || day === 6) return { status: "closed", localTime };
  if (totalMin >= openMin && totalMin < closeMin) return { status: "open", localTime };
  if (totalMin >= openMin - 90 && totalMin < openMin) return { status: "pre-market", localTime };
  return { status: "closed", localTime };
}

async function fetchCurrencyRates(): Promise<Record<string, number>> {
  try {
    // Fetch major currency pairs from Yahoo Finance
    const symbols = ["USDINR=X", "DX-Y.NYB", "GBPUSD=X", "USDJPY=X", "USDCNY=X", "USDHKD=X", "EURUSD=X", "AUDUSD=X", "USDKRW=X", "USDCAD=X"];
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error("Failed to fetch");
    const json = await res.json();
    const results = json.quoteResponse?.result || [];
    
    const rates: Record<string, number> = { ...FALLBACK_RATES };
    for (const r of results) {
      const price = r.regularMarketPrice;
      if (!price) continue;
      if (r.symbol === "USDINR=X") rates["USD/INR"] = price;
      if (r.symbol === "DX-Y.NYB") rates["DXY"] = price;
      if (r.symbol === "GBPUSD=X") rates["GBP/USD"] = price;
      if (r.symbol === "USDJPY=X") rates["USD/JPY"] = price;
      if (r.symbol === "USDCNY=X") rates["USD/CNY"] = price;
      if (r.symbol === "USDHKD=X") rates["USD/HKD"] = price;
      if (r.symbol === "EURUSD=X") rates["EUR/USD"] = price;
      if (r.symbol === "AUDUSD=X") rates["AUD/USD"] = price;
      if (r.symbol === "USDKRW=X") rates["USD/KRW"] = price;
      if (r.symbol === "USDCAD=X") rates["USD/CAD"] = price;
    }
    return rates;
  } catch {
    return FALLBACK_RATES;
  }
}

const MarketTimings = () => {
  const [tick, setTick] = useState(0);
  const [currencyRates, setCurrencyRates] = useState<Record<string, number>>(FALLBACK_RATES);

  useEffect(() => {
    // Fetch currency rates on mount and every 6 hours
    fetchCurrencyRates().then(setCurrencyRates);
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      fetchCurrencyRates().then(setCurrencyRates);
    }, 6 * 60 * 60_000);
    return () => clearInterval(interval);
  }, []);

  const exchangeStatuses = useMemo(() => {
    return EXCHANGES.map((ex) => ({
      ...ex,
      ...getExchangeStatus(ex),
      currencyValue: currencyRates[ex.currencyPair] || 0,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, currencyRates]);

  const formatCurrency = (pair: string, value: number) => {
    if (pair === "DXY") return value.toFixed(2);
    if (pair.includes("JPY") || pair.includes("KRW")) return value.toFixed(0);
    return value.toFixed(2);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-primary" />
        <p className="font-mono text-[10px] tracking-[3px] uppercase text-muted-foreground font-semibold">Exchange Hours</p>
      </div>
      <div className="space-y-1">
        {exchangeStatuses.map((ex) => (
          <div
            key={ex.name}
            className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 px-3 py-2 rounded-md border border-border bg-background hover:border-foreground/10 transition-colors"
          >
            <span className="text-sm">{ex.flag}</span>
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-semibold text-foreground truncate">{ex.name}</p>
              <p className="font-mono text-[9px] text-muted-foreground">
                {ex.openHour.toString().padStart(2, "0")}:{ex.openMin.toString().padStart(2, "0")}–{ex.closeHour.toString().padStart(2, "0")}:{ex.closeMin.toString().padStart(2, "0")} {ex.timezone}
              </p>
            </div>
            <div className="text-center min-w-[64px]">
              <p className="font-mono text-[10px] font-medium text-primary">{ex.currencyLabel}</p>
              <p className="font-mono text-[10px] text-foreground">{formatCurrency(ex.currencyPair, ex.currencyValue)}</p>
            </div>
            <div className="text-right min-w-[44px]">
              <p className="font-mono text-[8px] text-muted-foreground uppercase">Local</p>
              <p className="font-mono text-[10px] text-muted-foreground">{ex.localTime}</p>
            </div>
            <span
              className={cn(
                "font-mono text-[9px] font-semibold px-2 py-1 rounded-full text-center min-w-[48px]",
                ex.status === "open" && "bg-[hsl(142,30%,18%)] text-[hsl(142,50%,55%)]",
                ex.status === "pre-market" && "bg-[hsl(45,30%,18%)] text-[hsl(45,50%,55%)]",
                ex.status === "closed" && "bg-muted text-muted-foreground"
              )}
            >
              {ex.status === "open" ? "Open" : ex.status === "pre-market" ? "Pre" : "Closed"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketTimings;
