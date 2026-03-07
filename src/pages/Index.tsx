import { useState } from "react";
import { StockAnalysis } from "@/lib/stockData";
import { fetchStockData, resolveSymbol } from "@/lib/stockApi";
import { buildAnalysisFromRealData } from "@/lib/buildAnalysis";
import HomePage from "@/components/HomePage";
import LoadingState from "@/components/LoadingState";
import DashboardReport from "@/components/DashboardReport";
import SearchModal from "@/components/SearchModal";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleAnalyze = async (company: string) => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const { symbol, exchange, country } = resolveSymbol(company);
      const rawData = await fetchStockData(symbol, exchange);
      const report = buildAnalysisFromRealData(rawData, company, country, exchange);
      setAnalysis(report);
    } catch (err: any) {
      const msg = err?.message || "Failed to fetch stock data";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingState />;

  if (analysis) {
    return (
      <>
        <DashboardReport data={analysis} onSearchOpen={() => setSearchOpen(true)} />
        <SearchModal
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onAnalyze={(c) => {
            setSearchOpen(false);
            handleAnalyze(c);
          }}
          isLoading={isLoading}
        />
      </>
    );
  }

  return <HomePage onAnalyze={handleAnalyze} isLoading={isLoading} error={error} />;
};

export default Index;
