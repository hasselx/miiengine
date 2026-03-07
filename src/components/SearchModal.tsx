import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onAnalyze: (company: string) => void;
  isLoading: boolean;
}

const EXAMPLES = [
  { company: "Apple", label: "AAPL" },
  { company: "Microsoft", label: "MSFT" },
  { company: "Tesla", label: "TSLA" },
  { company: "Reliance", label: "RELIANCE" },
  { company: "Infosys", label: "INFY" },
];

const SearchModal = ({ open, onClose, onAnalyze, isLoading }: SearchModalProps) => {
  const [company, setCompany] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setCompany("");
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
    if (company.trim()) {
      onAnalyze(company.trim());
      onClose();
    }
  };

  const handleExample = (ex: typeof EXAMPLES[0]) => {
    onAnalyze(ex.company);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-3 sm:px-4">
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-lg shadow-2xl animate-fade-in">
        <form onSubmit={handleSubmit} className="p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-4">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              placeholder="Stock or company name..."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="flex-1 bg-transparent text-foreground text-base sm:text-lg font-medium outline-none placeholder:text-muted-foreground"
            />
            <button type="button" onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground touch-target">
              <X className="h-5 w-5" />
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || !company.trim()}
            className={cn(
              "w-full py-3 rounded-md text-sm font-semibold tracking-wider uppercase transition-colors touch-target",
              "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {isLoading ? "Analyzing…" : "Analyze"}
          </button>
        </form>

        <div className="border-t border-border px-4 sm:px-5 py-3">
          <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-2">Quick access</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => handleExample(ex)}
                disabled={isLoading}
                className="px-3 py-2 text-xs font-mono bg-accent text-accent-foreground rounded-md hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40 touch-target"
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
