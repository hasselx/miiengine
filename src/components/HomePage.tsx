import { useState } from "react";
import { Search, BarChart3, Shield, TrendingUp, Activity, Target, Layers, LineChart, Brain, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface HomePageProps {
  onAnalyze: (company: string, country: string) => void;
  isLoading: boolean;
  error: string | null;
}

const EXAMPLES = [
  { company: "Apple", country: "US", label: "AAPL" },
  { company: "Microsoft", country: "US", label: "MSFT" },
  { company: "Tesla", country: "US", label: "TSLA" },
  { company: "Reliance", country: "India", label: "RELIANCE" },
  { company: "Infosys", country: "India", label: "INFY" },
  { company: "Tata Motors", country: "India", label: "TATAMOTORS" },
];

const VERDICTS = [
  { label: "Strong Buy", color: "bg-[hsl(142,60%,35%)] text-white" },
  { label: "Buy", color: "bg-[hsl(142,45%,45%)] text-white" },
  { label: "Accumulate", color: "bg-[hsl(170,40%,40%)] text-white" },
  { label: "Hold", color: "bg-[hsl(42,50%,54%)] text-foreground" },
  { label: "Reduce", color: "bg-[hsl(25,70%,50%)] text-white" },
  { label: "Sell", color: "bg-[hsl(0,60%,45%)] text-white" },
];

const FEATURES = [
  { icon: BarChart3, text: "Multi-Factor Scoring" },
  { icon: TrendingUp, text: "DCF Valuation" },
  { icon: Shield, text: "Moat Analysis" },
  { icon: Target, text: "Price Targets" },
  { icon: Activity, text: "Technical Indicators" },
  { icon: Layers, text: "Fundamental Analysis" },
  { icon: LineChart, text: "Historical Trends" },
  { icon: Brain, text: "AI-Powered Insights" },
  { icon: Zap, text: "Real-Time Data" },
  { icon: BarChart3, text: "Risk Assessment" },
];

const HomePage = ({ onAnalyze, isLoading, error }: HomePageProps) => {
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (company.trim() && country.trim()) onAnalyze(company.trim(), country.trim());
  };

  // Duplicate features for seamless marquee loop
  const marqueeItems = [...FEATURES, ...FEATURES];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Brand */}
      <div className="text-center mb-8 animate-fade-in">
        <p className="font-mono text-xs tracking-[5px] uppercase text-primary mb-4">
          Multi-Institutional Intelligence Engine
        </p>
        <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl font-black text-foreground mb-4 tracking-tight">
          MII Engine
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Institutional-grade equity research powered by multi-factor analysis.
          Enter any company to generate a comprehensive report.
        </p>
      </div>

      {/* Verdict colors showcase */}
      <div className="flex flex-wrap justify-center gap-2 mb-8 animate-fade-in" style={{ animationDelay: "0.05s" }}>
        {VERDICTS.map((v) => (
          <span
            key={v.label}
            className={cn("px-3 py-1 rounded-full text-xs font-semibold font-mono tracking-wide", v.color)}
          >
            {v.label}
          </span>
        ))}
      </div>

      {/* Search form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-card border border-border rounded-lg shadow-lg overflow-hidden animate-fade-in"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            placeholder="Company name (e.g., Apple, Reliance)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="flex-1 bg-transparent text-foreground text-lg font-medium outline-none placeholder:text-muted-foreground"
            autoFocus
          />
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <span className="text-muted-foreground text-sm shrink-0 w-5 text-center">🌍</span>
          <input
            placeholder="Country (e.g., US, India, UK)"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="flex-1 bg-transparent text-foreground text-base outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="p-4">
          <button
            type="submit"
            disabled={isLoading || !company.trim() || !country.trim()}
            className={cn(
              "w-full py-3.5 rounded text-sm font-semibold tracking-[2px] uppercase transition-all",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {isLoading ? "Analyzing…" : "Analyze Stock"}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <p className="mt-4 text-sm text-destructive font-mono animate-fade-in">{error}</p>
      )}

      {/* Example tickers */}
      <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: "0.15s" }}>
        <p className="text-xs font-mono tracking-[3px] uppercase text-muted-foreground mb-3">Popular stocks</p>
        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => {
                setCompany(ex.company);
                setCountry(ex.country);
              }}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-mono border border-border text-muted-foreground hover:text-foreground hover:border-primary hover:bg-primary/5 rounded transition-all disabled:opacity-40"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Marquee */}
      <div className="w-screen mt-14 overflow-hidden animate-fade-in" style={{ animationDelay: "0.25s" }}>
        <p className="text-xs font-mono tracking-[3px] uppercase text-muted-foreground mb-4 text-center">
          Powered by
        </p>
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />

          <div className="flex animate-marquee gap-6">
            {marqueeItems.map((feat, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-lg whitespace-nowrap shrink-0"
              >
                <feat.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{feat.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
