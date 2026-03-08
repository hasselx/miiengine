import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { StockAnalysis, InvestmentStyle } from "@/lib/stockData";
import { fetchStockData, resolveSymbol } from "@/lib/stockApi";
import { buildAnalysisFromRealData } from "@/lib/buildAnalysis";
import HomePage from "@/components/HomePage";
import LoadingState from "@/components/LoadingState";
import DashboardReport from "@/components/DashboardReport";
import SearchModal from "@/components/SearchModal";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface SavedSearchState {
  savedSearch: {
    company_name: string;
    ticker: string | null;
    report_data: any;
    searched_at: string;
  };
}

const Index = () => {
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<{ data: StockAnalysis; date: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [investmentStyle, setInvestmentStyle] = useState<InvestmentStyle>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch user's investment style
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('investment_style').eq('id', user.id).single().then(({ data }) => {
      if (data?.investment_style) setInvestmentStyle(data.investment_style as InvestmentStyle);
    });
  }, [user]);

  // Handle navigation from saved searches
  useEffect(() => {
    const state = location.state as SavedSearchState | null;
    if (state?.savedSearch) {
      const { company_name, report_data, searched_at } = state.savedSearch;
      navigate("/", { replace: true, state: null });

      if (report_data) {
        setSavedSnapshot({ data: report_data as StockAnalysis, date: searched_at });
      }
      handleAnalyze(company_name);
    }
  }, [location.state]);

  const handleAnalyze = async (company: string) => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const { symbol, exchange, country } = resolveSymbol(company);
      const rawData = await fetchStockData(symbol, exchange);
      const report = buildAnalysisFromRealData(rawData, company, country, exchange, investmentStyle);
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
        <DashboardReport data={analysis} onSearchOpen={() => setSearchOpen(true)} savedSnapshot={savedSnapshot} />
        <SearchModal
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onAnalyze={(c) => {
            setSearchOpen(false);
            setSavedSnapshot(null);
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
