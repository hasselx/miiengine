import { useState } from "react";
import { Search, ArrowRight, CheckCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import GlobalHeatmap from "@/components/GlobalHeatmap";
import CrossAssetHeatmap from "@/components/CrossAssetHeatmap";
import GlobalRiskRadar from "@/components/GlobalRiskRadar";
import SectorPerformanceTracker from "@/components/SectorPerformanceTracker";
import MarketTimings from "@/components/MarketTimings";
import HomeFeatures from "@/components/HomeFeatures";
import HowItWorks from "@/components/HowItWorks";
import Methodology from "@/components/Methodology";

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
  { company: "HDFC Bank", label: "HDFCBANK" },
  { company: "Nvidia", label: "NVDA" },
  { company: "Amazon", label: "AMZN" },
];

const VERDICTS = [
  { label: "Strong Buy", color: "bg-[hsl(142,60%,35%)] text-[hsl(0,0%,100%)]" },
  { label: "Buy", color: "bg-[hsl(142,45%,45%)] text-[hsl(0,0%,100%)]" },
  { label: "Accumulate", color: "bg-[hsl(170,40%,40%)] text-[hsl(0,0%,100%)]" },
  { label: "Hold", color: "bg-gold text-foreground" },
  { label: "Reduce", color: "bg-[hsl(25,70%,50%)] text-[hsl(0,0%,100%)]" },
  { label: "Sell", color: "bg-destructive text-destructive-foreground" },
];

const HIGHLIGHTS = [
  "Institutional-style multi-factor analysis",
  "Aggregation of data from multiple financial sources",
  "Transparent valuation models and risk frameworks",
  "Automated equity research generation",
];

const HomePage = ({ onAnalyze, isLoading, error }: HomePageProps) => {
  const [company, setCompany] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (company.trim()) onAnalyze(company.trim());
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex justify-end px-4 sm:px-6 py-2 sticky top-8 bg-background/80 backdrop-blur-sm z-20">
        {user ? (
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-full font-mono text-[13px] text-foreground hover:border-primary/50 hover:text-primary transition-colors"
          >
            <User className="h-4 w-4" />
            <span>My Account</span>
          </button>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-full font-mono text-[13px] text-foreground hover:border-primary/50 hover:text-primary transition-colors"
          >
            <User className="h-4 w-4" />
            Sign In
          </button>
        )}
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12 pt-4">
        <div className="text-center mb-8 sm:mb-10">
          <p className="font-mono text-[10px] sm:text-[11px] tracking-[4px] sm:tracking-[6px] uppercase text-muted-foreground mb-5 sm:mb-6">
            Multi-Institutional Intelligence Engine
          </p>
          <h1 className="font-display text-4xl sm:text-6xl lg:text-[5.5rem] font-black text-foreground mb-5 sm:mb-6 tracking-tight leading-none">
            MII Engine
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed px-2">
            Structured institutional-grade equity research reports — generated in seconds.
          </p>
        </div>

        {/* Verdict pills */}
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-8 sm:mb-10 px-2">
          {VERDICTS.map((v) => (
            <span
              key={v.label}
              className={cn("px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold font-mono tracking-wide", v.color)}
            >
              {v.label}
            </span>
          ))}
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="w-full max-w-xl px-2">
          <div className="flex items-center bg-card border border-border rounded-lg overflow-hidden transition-colors focus-within:border-primary">
            <div className="pl-4 sm:pl-5">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              placeholder="Enter stock or company name..."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="flex-1 bg-transparent text-foreground text-base font-medium outline-none placeholder:text-muted-foreground px-3 sm:px-4 py-3.5 sm:py-4"
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !company.trim()}
              className={cn(
                "flex items-center gap-2 px-5 sm:px-7 py-3.5 sm:py-4 text-sm font-semibold tracking-[1.5px] uppercase transition-colors touch-target",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "disabled:opacity-30 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? "…" : (
                <>
                  <span className="hidden sm:inline">Analyze</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-4 text-sm text-destructive font-mono px-4 text-center">{error}</p>
        )}

        {/* Example tickers */}
        <div className="mt-8 text-center px-2">
          <p className="text-[10px] font-mono tracking-[3px] uppercase text-muted-foreground mb-3">Try these</p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => setCompany(ex.company)}
                disabled={isLoading}
                className="px-3 py-2 text-xs font-mono border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 rounded-md transition-colors disabled:opacity-40 touch-target"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap + Market Timings */}
      <div className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
            <GlobalHeatmap inline />
            <MarketTimings />
          </div>
        </div>
      </div>

      <CrossAssetHeatmap />

      <SectorPerformanceTracker />

      <HowItWorks />

      {/* About + Features */}
      <div className="border-t border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-14 items-start">
            {/* About */}
            <div>
              <p className="font-mono text-[10px] tracking-[4px] uppercase text-muted-foreground mb-3">About</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                What is MII Engine?
              </h2>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed mb-6">
                <p>
                  MII Engine is a multi-institutional intelligence platform designed to generate structured equity research reports using data from multiple financial sources.
                </p>
                <p>
                  The engine evaluates stocks using a multi-factor analytical framework that combines fundamentals, valuation models, technical momentum, institutional activity, and macroeconomic signals.
                </p>
                <p>
                  Instead of providing simple price predictions, the platform produces transparent research outputs including fair value estimates, risk assessments, factor exposure analysis, and probability-weighted price scenarios.
                </p>
                <p>
                  Each report is structured to resemble professional institutional research used by investment analysts and portfolio managers.
                </p>
              </div>
              <ul className="space-y-3">
                {HIGHLIGHTS.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Features */}
            <HomeFeatures />
          </div>
        </div>
      </div>

      <Methodology />

      {/* Footer */}
      <div className="border-t border-border px-4 sm:px-6 py-6 text-center space-y-2">
        <p className="text-[10px] sm:text-xs font-mono text-muted-foreground tracking-wide">
          MII Engine · Multi-Institutional Intelligence · Built for serious investors
        </p>
        <a
          href="https://www.heypage.online/hasselx?referrer=MIIEngine&type=redirect"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-[10px] sm:text-xs font-mono text-primary hover:text-primary/80 tracking-wide transition-colors"
        >
          Contact Us
        </a>
      </div>
    </div>
  );
};

export default HomePage;
