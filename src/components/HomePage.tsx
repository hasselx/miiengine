import { useState } from "react";
import { Search, ArrowRight, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import GlobalHeatmap from "@/components/GlobalHeatmap";
import CrossAssetHeatmap from "@/components/CrossAssetHeatmap";
import GlobalRiskRadar from "@/components/GlobalRiskRadar";
import SectorPerformanceTracker from "@/components/SectorPerformanceTracker";
import MarketTimings from "@/components/MarketTimings";
import LearnAboutEngine from "./LearnAboutEngine";

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

      <GlobalRiskRadar />

      <SectorPerformanceTracker />

      <LearnAboutEngine />

      {/* Footer */}
      <div className="border-t border-border px-4 sm:px-6 py-6 text-center">
        <p className="text-[10px] sm:text-xs font-mono text-muted-foreground tracking-wide">
          MII Engine · Multi-Institutional Intelligence · Built for learning
        </p>
      </div>
    </div>
  );
};

export default HomePage;
