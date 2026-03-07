import { useState } from "react";
import { StockAnalysis } from "@/lib/stockData";
import { fetchStockData, resolveSymbol } from "@/lib/stockApi";
import { buildAnalysisFromRealData } from "@/lib/buildAnalysis";
import StockInput from "@/components/StockInput";
import ReportHeader from "@/components/report/ReportHeader";
import ScoreBanner from "@/components/report/ScoreBanner";
import ExecutiveSummary from "@/components/report/ExecutiveSummary";
import ScoreMatrix from "@/components/report/ScoreMatrix";
import FundamentalAnalysis from "@/components/report/FundamentalAnalysis";
import DCFValuation from "@/components/report/DCFValuation";
import PriceProjectionSection from "@/components/report/PriceProjectionSection";
import MacroSection from "@/components/report/MacroSection";
import TradingPlanSection from "@/components/report/TradingPlanSection";
import TechnicalSection from "@/components/report/TechnicalSection";
import MoatSection from "@/components/report/MoatSection";
import RiskMatrix from "@/components/report/RiskMatrix";
import FinalVerdict from "@/components/report/FinalVerdict";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (company: string, country: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { symbol, exchange } = resolveSymbol(company, country);
      const rawData = await fetchStockData(symbol, exchange);
      const report = buildAnalysisFromRealData(rawData, company, country, exchange);
      setAnalysis(report);
    } catch (err: any) {
      const msg = err?.message || 'Failed to fetch stock data';
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {!analysis && !isLoading && (
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="text-center mb-8">
            <p className="font-mono text-[10px] tracking-[3px] uppercase text-gold mb-4">Multi-Institutional Intelligence Engine</p>
            <h1 className="font-display text-5xl font-black text-ink mb-3">Stock Analysis</h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Real-time institutional equity research powered by Twelve Data. Enter a country and company to generate a comprehensive multi-factor analysis.
            </p>
          </div>
          <StockInput onAnalyze={handleAnalyze} isLoading={isLoading} />
          {error && (
            <p className="mt-4 text-sm text-red-data font-mono">{error}</p>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-1 bg-gold mx-auto mb-4" style={{ animation: 'fillBar 1.5s ease-out infinite' }} />
            <p className="font-mono text-[10px] tracking-[3px] uppercase text-muted-foreground">Fetching real-time data & running analysis...</p>
          </div>
        </div>
      )}

      {analysis && !isLoading && (
        <div>
          <ReportHeader data={analysis} />
          <ScoreBanner data={analysis} />

          <div className="px-4 sm:px-[60px] py-10 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 max-w-[1400px] mx-auto">
            {/* Left Column */}
            <div className="space-y-6">
              <ExecutiveSummary data={analysis} />
              <ScoreMatrix data={analysis} />
              <FundamentalAnalysis data={analysis} />
              <DCFValuation data={analysis} />
              <PriceProjectionSection data={analysis} />
              <MacroSection data={analysis} />
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <TradingPlanSection data={analysis} />
              <TechnicalSection data={analysis} />
              <MoatSection data={analysis} />
              <RiskMatrix data={analysis} />
              <FinalVerdict data={analysis} />
            </div>
          </div>

          {/* Watermark */}
          <div className="text-center py-3 px-4 sm:px-[60px] font-mono text-[9px] tracking-[3px] text-muted-foreground uppercase">
            {analysis.watermark}
          </div>

          {/* Disclaimer */}
          <div className="bg-ink px-4 sm:px-[60px] py-5 font-mono text-[10px] leading-relaxed text-muted-foreground">
            {analysis.disclaimer}
          </div>

          {/* Analyze another */}
          <div className="bg-background px-4 sm:px-[60px] py-8 flex justify-center">
            <StockInput onAnalyze={(c, co) => { setAnalysis(null); handleAnalyze(c, co); }} isLoading={isLoading} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
