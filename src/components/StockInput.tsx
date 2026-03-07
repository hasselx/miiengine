import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface StockInputProps {
  onAnalyze: (company: string, country: string) => void;
  isLoading: boolean;
}

const StockInput = ({ onAnalyze, isLoading }: StockInputProps) => {
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (company.trim() && country.trim()) {
      onAnalyze(company.trim(), country.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl mx-auto">
      <Input
        placeholder="Country (e.g., United States)"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="bg-secondary border-border font-mono text-sm placeholder:text-muted-foreground"
      />
      <Input
        placeholder="Company Name (e.g., Apple Inc.)"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        className="bg-secondary border-border font-mono text-sm placeholder:text-muted-foreground flex-1"
      />
      <Button type="submit" disabled={isLoading || !company.trim() || !country.trim()} className="gap-2 font-mono text-sm font-semibold shrink-0">
        <Search className="w-4 h-4" />
        {isLoading ? "ANALYZING..." : "ANALYZE"}
      </Button>
    </form>
  );
};

export default StockInput;
