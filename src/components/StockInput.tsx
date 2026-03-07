import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StockInputProps {
  onAnalyze: (company: string, country: string) => void;
  isLoading: boolean;
}

const StockInput = ({ onAnalyze, isLoading }: StockInputProps) => {
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (company.trim() && country.trim()) onAnalyze(company.trim(), country.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-3 w-full max-w-4xl">
      <Input
        placeholder="Country (e.g., India)"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="bg-card border-border font-mono text-sm tracking-wide placeholder:text-muted-foreground h-12 px-4 sm:w-[180px] sm:flex-none"
      />
      <Input
        placeholder="Company / Stock Name (e.g., Paras Defence)"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        className="bg-card border-border font-mono text-sm tracking-wide placeholder:text-muted-foreground h-12 px-4 flex-1"
      />
      <Button
        type="submit"
        disabled={isLoading || !company.trim() || !country.trim()}
        className="bg-gold text-ink font-mono text-[11px] font-semibold tracking-[2px] uppercase px-8 h-12 hover:bg-gold-light whitespace-nowrap sm:flex-none"
      >
        {isLoading ? "ANALYZING..." : "ANALYZE"}
      </Button>
    </form>
  );
};

export default StockInput;
