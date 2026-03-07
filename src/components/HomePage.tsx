import { useState } from "react";
import { Search } from "lucide-react";
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
];

const HomePage = ({ onAnalyze, isLoading, error }: HomePageProps) => {
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (company.trim() && country.trim()) onAnalyze(company.trim(), country.trim());
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Brand */}
      <div className="text-center mb-10 animate-fade-in">
        <p className="font-mono text-[10px] tracking-[4px] uppercase text-primary mb-3">
          Multi-Institutional Intelligence Engine
        </p>
        <h1 className="font-display text-5xl sm:text-6xl font-black text-foreground mb-3 tracking-tight">
          StockIQ
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Real-time institutional equity research. Enter a company to generate a comprehensive multi-factor analysis report.
        </p>
      </div>

      {/* Search form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-card border border-border rounded-lg shadow-lg overflow-hidden animate-fade-in"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            placeholder="Company name (e.g., Apple, Reliance)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="flex-1 bg-transparent text-foreground text-lg font-medium outline-none placeholder:text-muted-foreground"
            autoFocus
          />
        </div>

        <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
          <span className="text-muted-foreground text-xs font-mono shrink-0 w-5 text-center">🌍</span>
          <input
            placeholder="Country (e.g., US, India, UK)"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="p-4">
          <button
            type="submit"
            disabled={isLoading || !company.trim() || !country.trim()}
            className={cn(
              "w-full py-3 rounded text-sm font-semibold tracking-[2px] uppercase transition-all",
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
      <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <p className="text-[10px] font-mono tracking-[3px] uppercase text-muted-foreground mb-3">Popular stocks</p>
        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => {
                setCompany(ex.company);
                setCountry(ex.country);
              }}
              disabled={isLoading}
              className="px-4 py-1.5 text-xs font-mono border border-border text-muted-foreground hover:text-foreground hover:border-primary hover:bg-primary/5 rounded transition-all disabled:opacity-40"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
