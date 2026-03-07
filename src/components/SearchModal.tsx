import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onAnalyze: (company: string, country: string) => void;
  isLoading: boolean;
}

const EXAMPLES = [
  { company: "Apple", country: "US", label: "AAPL" },
  { company: "Microsoft", country: "US", label: "MSFT" },
  { company: "Tesla", country: "US", label: "TSLA" },
  { company: "Reliance", country: "India", label: "RELIANCE" },
  { company: "Infosys", country: "India", label: "INFY" },
];

const SearchModal = ({ open, onClose, onAnalyze, isLoading }: SearchModalProps) => {
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setCompany("");
      setCountry("");
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (company.trim() && country.trim()) {
      onAnalyze(company.trim(), country.trim());
      onClose();
    }
  };

  const handleExample = (ex: typeof EXAMPLES[0]) => {
    onAnalyze(ex.company, ex.country);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-lg shadow-2xl animate-fade-in">
        <form onSubmit={handleSubmit} className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              placeholder="Company name (e.g., Apple)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="flex-1 bg-transparent text-foreground text-lg font-medium outline-none placeholder:text-muted-foreground"
            />
            <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <input
            placeholder="Country (e.g., US, India)"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full bg-accent/50 text-foreground text-sm outline-none placeholder:text-muted-foreground px-3 py-2.5 rounded mb-4 border border-border focus:border-primary transition-colors"
          />

          <button
            type="submit"
            disabled={isLoading || !company.trim() || !country.trim()}
            className={cn(
              "w-full py-2.5 rounded text-sm font-semibold tracking-wider uppercase transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {isLoading ? "Analyzing…" : "Analyze"}
          </button>
        </form>

        {/* Quick examples */}
        <div className="border-t border-border px-5 py-3">
          <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-2">Quick access</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => handleExample(ex)}
                disabled={isLoading}
                className="px-3 py-1 text-xs font-mono bg-accent text-accent-foreground rounded hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
