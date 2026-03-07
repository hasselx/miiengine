import { useState } from "react";
import { Search, BarChart3, Shield, TrendingUp, Activity, Target, Layers, LineChart, Brain, Zap, ArrowRight, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HomePageProps {
  onAnalyze: (company: string) => void;
  isLoading: boolean;
  error: string | null;
}

const EXAMPLES = [
  { company: "Apple", label: "AAPL" },
  { company: "Microsoft", label: "MSFT" },
  { company: "Tesla", label: "TSLA" },
  { company: "Reliance", label: "RELIANCE" },
  { company: "Infosys", label: "INFY" },
  { company: "Tata Motors", label: "TATAMOTORS" },
  { company: "Nvidia", label: "NVDA" },
  { company: "Amazon", label: "AMZN" },
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

const HIGHLIGHTS = [
  "Institutional-grade equity research",
  "Multi-source data aggregation",
  "Comprehensive risk & moat analysis",
  "Automated DCF valuation models",
];

const HomePage = ({ onAnalyze, isLoading, error }: HomePageProps) => {
  const [company, setCompany] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (company.trim()) onAnalyze(company.trim());
  };

  const marqueeItems = [...FEATURES, ...FEATURES];

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-8">
        {/* Brand */}
        <div className="text-center mb-6 animate-fade-in">
          <p className="font-mono text-[11px] tracking-[6px] uppercase text-primary mb-5">
            Multi-Institutional Intelligence Engine
          </p>
          <h1 className="font-display text-6xl sm:text-7xl lg:text-[5.5rem] font-black text-foreground mb-5 tracking-tight leading-none">
            MII Engine
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Generate comprehensive, multi-factor stock analysis reports in seconds.
          </p>
        </div>

        {/* Verdict pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 animate-fade-in" style={{ animationDelay: "0.05s" }}>
          {VERDICTS.map((v) => (
            <span
              key={v.label}
              className={cn("px-3 py-1 rounded-full text-[11px] font-semibold font-mono tracking-wide", v.color)}
            >
              {v.label}
            </span>
          ))}
        </div>

        {/* Feature Marquee — above search */}
        <div className="w-screen mb-10 overflow-hidden animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
            <div className="flex animate-marquee gap-5">
              {marqueeItems.map((feat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg whitespace-nowrap shrink-0"
                >
                  <feat.icon className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-medium text-foreground">{feat.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search form — single input, minimal */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-lg animate-fade-in"
          style={{ animationDelay: "0.15s" }}
        >
          <div className="flex items-center bg-card border border-border rounded-lg shadow-lg overflow-hidden transition-all focus-within:border-primary focus-within:shadow-xl">
            <div className="pl-5">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              placeholder="Enter stock or company name..."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="flex-1 bg-transparent text-foreground text-lg font-medium outline-none placeholder:text-muted-foreground px-4 py-4"
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !company.trim()}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-sm font-semibold tracking-[1.5px] uppercase transition-all",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "disabled:opacity-30 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? "Analyzing…" : (
                <>
                  Analyze
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm text-destructive font-mono animate-fade-in">{error}</p>
        )}

        {/* Example tickers */}
        <div className="mt-6 text-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <p className="text-[10px] font-mono tracking-[3px] uppercase text-muted-foreground mb-3">Try these</p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => {
                  setCompany(ex.company);
                }}
                disabled={isLoading}
                className="px-3.5 py-1.5 text-xs font-mono border border-border text-muted-foreground hover:text-foreground hover:border-primary hover:bg-primary/5 rounded transition-all disabled:opacity-40"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* About / Features Section */}
      <div className="border-t border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* About */}
            <div className="animate-fade-in">
              <p className="font-mono text-[10px] tracking-[4px] uppercase text-primary mb-3">About</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
                What is MII Engine?
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-6">
                MII Engine is a Multi-Institutional Intelligence platform that aggregates data from
                multiple financial sources to deliver professional-grade equity research reports.
                Our engine evaluates stocks across 10+ dimensions including fundamentals, technicals,
                valuation, moat strength, and macroeconomic factors.
              </p>
              <ul className="space-y-3">
                {HIGHLIGHTS.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Feature grid */}
            <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <p className="font-mono text-[10px] tracking-[4px] uppercase text-primary mb-3">Features</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                What you get
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {FEATURES.map((feat, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-lg hover:border-primary/40 transition-colors"
                  >
                    <feat.icon className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-medium text-foreground">{feat.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-6 py-6 text-center">
        <p className="text-xs font-mono text-muted-foreground tracking-wide">
          MII Engine · Multi-Institutional Intelligence · Built for serious investors
        </p>
      </div>
    </div>
  );
};

export default HomePage;
