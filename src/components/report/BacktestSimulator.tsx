import { useState, useMemo } from "react";
import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";
import { format, subYears } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarIcon, TrendingUp, TrendingDown, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";

interface Props {
  data: StockAnalysis;
}

function parsePrice(s: string): number {
  return parseFloat(s.replace(/[^0-9.-]/g, "")) || 0;
}

function simulateGrowth(
  currentPrice: number,
  high52: number,
  low52: number,
  initialInvestment: number,
  monthlyContribution: number,
  years: number
) {
  // Simulate historical returns using price extremes as volatility proxy
  const annualReturn = ((currentPrice - low52) / low52) / Math.max(years, 1);
  const volatility = (high52 - low52) / ((high52 + low52) / 2);
  const monthlyReturn = annualReturn / 12;
  const months = years * 12;

  const data: { month: string; investment: number; benchmark: number }[] = [];
  let portfolioValue = initialInvestment;
  let benchmarkValue = initialInvestment;
  let totalInvested = initialInvestment;
  let maxValue = portfolioValue;
  let maxDrawdown = 0;
  const benchmarkMonthlyReturn = 0.008; // ~10% annual for S&P 500

  // Seed a deterministic random using price
  let seed = Math.round(currentPrice * 100);
  const pseudoRandom = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed / 2147483647) - 0.5;
  };

  for (let i = 0; i <= months; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - (months - i));
    const label = format(date, "MMM yy");

    if (i > 0) {
      const noise = pseudoRandom() * volatility * 0.15;
      portfolioValue *= (1 + monthlyReturn + noise);
      benchmarkValue *= (1 + benchmarkMonthlyReturn + pseudoRandom() * 0.03);
      portfolioValue += monthlyContribution;
      benchmarkValue += monthlyContribution;
      totalInvested += monthlyContribution;
    }

    maxValue = Math.max(maxValue, portfolioValue);
    const drawdown = (portfolioValue - maxValue) / maxValue;
    maxDrawdown = Math.min(maxDrawdown, drawdown);

    data.push({
      month: label,
      investment: Math.round(portfolioValue),
      benchmark: Math.round(benchmarkValue),
    });
  }

  const finalValue = portfolioValue;
  const totalReturn = ((finalValue - totalInvested) / totalInvested) * 100;
  const cagr = (Math.pow(finalValue / initialInvestment, 1 / years) - 1) * 100;
  const annualizedVol = volatility * 100;

  return {
    data,
    finalValue,
    totalInvested,
    totalReturn,
    cagr,
    maxDrawdown: maxDrawdown * 100,
    annualizedVol,
  };
}

const BacktestSimulator = ({ data }: Props) => {
  const [investment, setInvestment] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(0);
  const [startDate, setStartDate] = useState<Date>(subYears(new Date(), 5));
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const years = Math.max(0.5, (new Date().getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  const currentPrice = parsePrice(data.headerMetrics[0]?.value || "0");
  const high52 = data.priceExtremes.yearHigh || data.priceExtremes.ath;
  const low52 = data.priceExtremes.yearLow || data.priceExtremes.atl;

  const result = useMemo(
    () => simulateGrowth(currentPrice, high52, low52, investment, monthlyContribution, years),
    [currentPrice, high52, low52, investment, monthlyContribution, years]
  );

  const chartConfig = {
    investment: { label: data.company, color: "hsl(var(--gold))" },
    benchmark: { label: "S&P 500", color: "hsl(var(--muted-foreground))" },
  };

  // Thin data for display (max ~30 points)
  const step = Math.max(1, Math.floor(result.data.length / 30));
  const thinData = result.data.filter((_, i) => i % step === 0 || i === result.data.length - 1);

  const currency = data.priceExtremes.currency || "$";

  const fmtVal = (v: number) => {
    if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return v.toFixed(0);
  };

  return (
    <SectionWrapper num="SIM" title="Portfolio Backtest Simulator">
      {/* Input Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground block mb-1">
            Initial Investment
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">{currency}</span>
            <input
              type="number"
              value={investment}
              onChange={e => setInvestment(Math.max(100, Number(e.target.value)))}
              className="w-full pl-7 pr-3 py-2 rounded border border-border bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
        <div>
          <label className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground block mb-1">
            Monthly Contribution
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">{currency}</span>
            <input
              type="number"
              value={monthlyContribution}
              onChange={e => setMonthlyContribution(Math.max(0, Number(e.target.value)))}
              className="w-full pl-7 pr-3 py-2 rounded border border-border bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
        <div>
          <label className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground block mb-1">
            Start Date
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-mono text-sm h-[38px]")}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                {format(startDate, "MMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={d => d && setStartDate(d)}
                disabled={date => date > new Date() || date < new Date("2000-01-01")}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        {[
          { label: "Value Today", value: `${currency}${fmtVal(result.finalValue)}`, color: result.totalReturn >= 0 ? "text-green" : "text-red" },
          { label: "Total Return", value: `${result.totalReturn >= 0 ? "+" : ""}${result.totalReturn.toFixed(1)}%`, color: result.totalReturn >= 0 ? "text-green" : "text-red" },
          { label: "CAGR", value: `${result.cagr.toFixed(1)}%`, color: result.cagr >= 0 ? "text-green" : "text-red" },
          { label: "Max Drawdown", value: `${result.maxDrawdown.toFixed(1)}%`, color: "text-red" },
          { label: "Volatility", value: `${result.annualizedVol.toFixed(1)}%`, color: "text-muted-foreground" },
        ].map(m => (
          <div key={m.label} className="bg-accent-area rounded p-2.5 text-center">
            <div className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground mb-1">{m.label}</div>
            <div className={cn("font-mono text-sm sm:text-base font-semibold", m.color)}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[200px] sm:h-[260px]">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <AreaChart data={thinData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="backtestGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--gold))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--gold))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="benchGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => fmtVal(v)} tickLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ReferenceLine y={result.totalInvested} stroke="hsl(var(--border))" strokeDasharray="4 4" label={{ value: "Invested", fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
            <Area type="monotone" dataKey="investment" stroke="hsl(var(--gold))" fill="url(#backtestGrad)" strokeWidth={2} />
            {showBenchmark && (
              <Area type="monotone" dataKey="benchmark" stroke="hsl(var(--muted-foreground))" fill="url(#benchGrad)" strokeWidth={1.5} strokeDasharray="4 4" />
            )}
          </AreaChart>
        </ChartContainer>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-3">
        <button
          onClick={() => setShowBenchmark(!showBenchmark)}
          className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          <div className={cn("w-3 h-3 rounded-sm border border-border", showBenchmark && "bg-muted-foreground")} />
          S&P 500 Benchmark
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 sm:hidden"
        >
          {expanded ? "Less" : "Details"}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Expanded details (always on desktop, toggleable on mobile) */}
      <div className={cn("mt-3 text-[11px] font-mono text-muted-foreground leading-relaxed", !expanded && "hidden sm:block")}>
        <p>
          Simulation based on {data.company}'s price dynamics. Initial: {currency}{fmtVal(investment)}
          {monthlyContribution > 0 && <> + {currency}{fmtVal(monthlyContribution)}/mo</>} over {years.toFixed(1)} years.
          {result.totalReturn > 0 ? (
            <span className="text-green"> Portfolio grew to {currency}{fmtVal(result.finalValue)} ({result.totalReturn.toFixed(1)}% return).</span>
          ) : (
            <span className="text-red"> Portfolio declined to {currency}{fmtVal(result.finalValue)} ({result.totalReturn.toFixed(1)}% loss).</span>
          )}
        </p>
      </div>
    </SectionWrapper>
  );
};

export default BacktestSimulator;
