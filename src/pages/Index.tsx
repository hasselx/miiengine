import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { StockAnalysis, InvestmentStyle, PeerMetric, PeerComparisonData } from "@/lib/stockData";
import { fetchStockData, fetchPeerData, resolveSymbol } from "@/lib/stockApi";
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

function buildPeerComparison(
  companyName: string,
  peers: PeerMetric[],
  quote: any,
  financials: any,
  statistics: any,
  profile: any
): PeerComparisonData | null {
  if (peers.length === 0) return null;

  const pe = quote?.pe || 0;
  const eps = quote?.eps || 0;
  const price = parseFloat(quote?.close || quote?.price || 0);
  const marketCap = statistics?.valuations_metrics?.market_capitalization || 0;
  const fin = statistics?.financials || {};

  const companyMetrics: PeerMetric = {
    symbol: quote?.symbol || companyName,
    name: companyName,
    price,
    pe,
    marketCap,
    revenueGrowth: fin?.revenueGrowth ?? null,
    operatingMargin: fin?.operatingMargins ?? fin?.profitMargins ?? null,
    profitMargin: fin?.profitMargins ?? null,
    roe: fin?.returnOnEquity ?? null,
    debtToEquity: fin?.debtToEquity ?? null,
    eps,
  };

  // Calculate sector averages from peers only
  const avgOf = (vals: (number | null)[]) => {
    const valid = vals.filter((v): v is number => v != null && v > 0);
    return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
  };
  const sectorAvg = {
    pe: avgOf(peers.map(p => p.pe > 0 ? p.pe : null)) || 0,
    revenueGrowth: avgOf(peers.map(p => p.revenueGrowth)),
    operatingMargin: avgOf(peers.map(p => p.operatingMargin)),
    roe: avgOf(peers.map(p => p.roe)),
    debtToEquity: avgOf(peers.map(p => p.debtToEquity)),
  };

  // Relative scoring: compare company to peer averages
  let relScore = 5; // baseline
  if (sectorAvg.pe > 0 && pe > 0) {
    const pePremium = (pe - sectorAvg.pe) / sectorAvg.pe;
    if (pePremium > 0.5) relScore -= 2;
    else if (pePremium > 0.2) relScore -= 1;
    else if (pePremium < -0.2) relScore += 1;
    else if (pePremium < -0.5) relScore += 2;
  }
  if (sectorAvg.revenueGrowth != null && fin?.revenueGrowth != null) {
    if (fin.revenueGrowth > sectorAvg.revenueGrowth) relScore += 1;
    else relScore -= 0.5;
  }
  if (sectorAvg.operatingMargin != null && (fin?.operatingMargins ?? fin?.profitMargins) != null) {
    const m = fin.operatingMargins ?? fin.profitMargins;
    if (m > sectorAvg.operatingMargin) relScore += 1;
    else relScore -= 0.5;
  }
  if (sectorAvg.roe != null && fin?.returnOnEquity != null) {
    if (fin.returnOnEquity > sectorAvg.roe) relScore += 0.5;
  }
  relScore = Math.min(10, Math.max(0, relScore));

  // Rank all companies
  const scoreCompany = (c: PeerMetric): number => {
    let s = 5;
    if (sectorAvg.pe > 0 && c.pe > 0) s += (sectorAvg.pe - c.pe) / sectorAvg.pe * 2;
    if (c.revenueGrowth != null) s += c.revenueGrowth * 5;
    if (c.operatingMargin != null) s += c.operatingMargin * 3;
    if (c.roe != null) s += c.roe * 3;
    return Math.min(10, Math.max(0, s));
  };
  const allCompanies = [companyMetrics, ...peers];
  const ranking = allCompanies
    .map(c => ({ symbol: c.symbol, name: c.name || c.symbol, score: scoreCompany(c) }))
    .sort((a, b) => b.score - a.score);

  // Commentary
  const rank = ranking.findIndex(r => r.symbol === companyMetrics.symbol) + 1;
  const pePremiumPct = sectorAvg.pe > 0 && pe > 0 ? ((pe - sectorAvg.pe) / sectorAvg.pe * 100).toFixed(0) : null;
  let commentary = `${companyName} ranks #${rank} out of ${ranking.length} peers. `;
  if (pePremiumPct && parseFloat(pePremiumPct) > 20) {
    commentary += `The stock trades at a ${pePremiumPct}% P/E premium to peer average (${sectorAvg.pe.toFixed(1)}x), suggesting the market prices in higher growth expectations. `;
  } else if (pePremiumPct && parseFloat(pePremiumPct) < -20) {
    commentary += `The stock trades at a ${Math.abs(parseFloat(pePremiumPct))}% P/E discount to peer average (${sectorAvg.pe.toFixed(1)}x), suggesting potential undervaluation. `;
  }
  if (fin?.revenueGrowth != null && sectorAvg.revenueGrowth != null) {
    commentary += fin.revenueGrowth > sectorAvg.revenueGrowth
      ? 'Revenue growth outpaces peers, supporting premium valuation. '
      : 'Revenue growth lags peers, limiting upside potential. ';
  }
  if (fin?.profitMargins != null && sectorAvg.operatingMargin != null) {
    commentary += (fin.operatingMargins ?? fin.profitMargins) > sectorAvg.operatingMargin
      ? 'Margins are above sector average, indicating operational efficiency.'
      : 'Margins are below sector average — operational improvement needed.';
  }

  return { peers, companyMetrics, relativeScore: relScore, ranking, commentary: commentary.trim(), sectorAvg };
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

      // Fetch peer data asynchronously (non-blocking)
      const industry = rawData.profile?.industry || '';
      const sector = rawData.profile?.sector || '';
      if (industry || sector) {
        fetchPeerData(symbol, industry, sector).then(peers => {
          if (peers.length > 0) {
            const peerData = buildPeerComparison(
              report.company,
              peers,
              rawData.quote,
              rawData.statistics?.financials,
              rawData.statistics,
              rawData.profile
            );
            if (peerData) {
              setAnalysis(prev => prev ? { ...prev, peerComparison: peerData } : prev);
            }
          }
        });
      }
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
