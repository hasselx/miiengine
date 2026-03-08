import { useMemo, useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Exchange {
  name: string;
  code: string;
  flag: string;
  timezone: string;
  utcOffset: number; // hours from UTC
  openHour: number;  // local hour
  openMin: number;
  closeHour: number;
  closeMin: number;
}

const EXCHANGES: Exchange[] = [
  { name: "NSE / BSE", code: "India", flag: "🇮🇳", timezone: "IST", utcOffset: 5.5, openHour: 9, openMin: 15, closeHour: 15, closeMin: 30 },
  { name: "NYSE", code: "US", flag: "🇺🇸", timezone: "ET", utcOffset: -4, openHour: 9, openMin: 30, closeHour: 16, closeMin: 0 },
  { name: "NASDAQ", code: "US", flag: "🇺🇸", timezone: "ET", utcOffset: -4, openHour: 9, openMin: 30, closeHour: 16, closeMin: 0 },
  { name: "LSE", code: "UK", flag: "🇬🇧", timezone: "GMT", utcOffset: 1, openHour: 8, openMin: 0, closeHour: 16, closeMin: 30 },
  { name: "TSE", code: "Japan", flag: "🇯🇵", timezone: "JST", utcOffset: 9, openHour: 9, openMin: 0, closeHour: 15, closeMin: 0 },
  { name: "SSE", code: "China", flag: "🇨🇳", timezone: "CST", utcOffset: 8, openHour: 9, openMin: 30, closeHour: 15, closeMin: 0 },
  { name: "HKEX", code: "HK", flag: "🇭🇰", timezone: "HKT", utcOffset: 8, openHour: 9, openMin: 30, closeHour: 16, closeMin: 0 },
  { name: "Xetra", code: "Germany", flag: "🇩🇪", timezone: "CET", utcOffset: 2, openHour: 9, openMin: 0, closeHour: 17, closeMin: 30 },
  { name: "Euronext", code: "France", flag: "🇫🇷", timezone: "CET", utcOffset: 2, openHour: 9, openMin: 0, closeHour: 17, closeMin: 30 },
  { name: "ASX", code: "Australia", flag: "🇦🇺", timezone: "AEST", utcOffset: 10, openHour: 10, openMin: 0, closeHour: 16, closeMin: 0 },
  { name: "KRX", code: "Korea", flag: "🇰🇷", timezone: "KST", utcOffset: 9, openHour: 9, openMin: 0, closeHour: 15, closeMin: 30 },
  { name: "TSX", code: "Canada", flag: "🇨🇦", timezone: "ET", utcOffset: -4, openHour: 9, openMin: 30, closeHour: 16, closeMin: 0 },
];

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

const MarketTimings = () => {
  const exchangeStatuses = useMemo(() => {
    return EXCHANGES.map((ex) => ({
      ...ex,
      ...getExchangeStatus(ex),
    }));
  }, []);

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
            className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-background hover:border-foreground/10 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm">{ex.flag}</span>
              <div className="min-w-0">
                <p className="font-mono text-[11px] font-semibold text-foreground truncate">{ex.name}</p>
                <p className="font-mono text-[9px] text-muted-foreground">
                  {ex.openHour.toString().padStart(2, "0")}:{ex.openMin.toString().padStart(2, "0")}–{ex.closeHour.toString().padStart(2, "0")}:{ex.closeMin.toString().padStart(2, "0")} {ex.timezone}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-mono text-[10px] text-muted-foreground">{ex.localTime}</span>
              <span
                className={cn(
                  "font-mono text-[9px] font-semibold px-1.5 py-0.5 rounded-full",
                  ex.status === "open" && "bg-[hsl(142,30%,18%)] text-[hsl(142,50%,55%)]",
                  ex.status === "pre-market" && "bg-[hsl(45,30%,18%)] text-[hsl(45,50%,55%)]",
                  ex.status === "closed" && "bg-muted text-muted-foreground"
                )}
              >
                {ex.status === "open" ? "Open" : ex.status === "pre-market" ? "Pre" : "Closed"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketTimings;
