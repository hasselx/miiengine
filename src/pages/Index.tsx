import { useState } from "react";
import { getAnalysis, StockAnalysis } from "@/lib/stockData";
import StockInput from "@/components/StockInput";
import ScoreTable from "@/components/ScoreTable";
import ScoreRadar from "@/components/ScoreRadar";
import PriceProjection from "@/components/PriceProjection";
import TradingPlanComponent from "@/components/TradingPlan";
import VerdictBadge from "@/components/VerdictBadge";
import AnalysisSection from "@/components/AnalysisSection";
import { Activity, AlertTriangle, Zap, Globe, Shield, BarChart3 } from "lucide-react";

const Header = () => (
  <div className="text-center space-y-3 py-8">
    <div className="flex items-center justify-center gap-2 mb-2">
      <Activity className="w-5 h-5 text-primary" />
      <span className="font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase">Institutional Intelligence Engine</span>
    </div>
    <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
      Stock <span className="text-primary">Analysis</span> Terminal
    </h1>
    <p className="text-sm text-muted-foreground max-w-lg mx-auto">
      Multi-factor scoring algorithm combining fundamental, technical, quantitative, and macro analysis.
    </p>
  </div>
);

const StockHeader = ({ data }: { data: StockAnalysis }) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-card border border-border rounded-sm">
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-xl font-bold">{data.company}</h2>
        <span className="font-mono text-xs px-2 py-0.5 bg-secondary rounded-sm text-muted-foreground">{data.ticker}</span>
      </div>
      <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
        <span>{data.country}</span>
        <span>•</span>
        <span>{data.sector}</span>
        <span>•</span>
        <span>MCap: {data.marketCap}</span>
      </div>
    </div>
    <div className="flex items-center gap-6">
      <div className="text-right">
        <div className="text-xs font-mono text-muted-foreground">PRICE</div>
        <div className="font-mono text-2xl font-bold">${data.currentPrice.toFixed(2)}</div>
      </div>
      <VerdictBadge verdict={data.verdict} score={data.totalScore} color={data.verdictColor} />
    </div>
  </div>
);

const ListSection = ({ title, items, icon: Icon, colorClass }: { title: string; items: string[]; icon: React.ElementType; colorClass: string }) => (
  <AnalysisSection title={title}>
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${colorClass}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </AnalysisSection>
);

const Index = () => {
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = (company: string, country: string) => {
    setIsLoading(true);
    // Simulate analysis delay
    setTimeout(() => {
      setAnalysis(getAnalysis(company, country));
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <Header />
        <StockInput onAnalyze={handleAnalyze} isLoading={isLoading} />

        {isLoading && (
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-card border border-border rounded-sm">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-sm text-muted-foreground">Running multi-factor analysis...</span>
            </div>
          </div>
        )}

        {analysis && !isLoading && (
          <div className="mt-8 space-y-6 animate-in fade-in duration-500">
            <StockHeader data={analysis} />

            {/* Executive Summary */}
            <AnalysisSection title="Executive Summary">
              <p className="leading-relaxed">{analysis.executiveSummary}</p>
            </AnalysisSection>

            {/* Score Table + Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ScoreTable scores={analysis.scores} totalScore={analysis.totalScore} />
              </div>
              <ScoreRadar scores={analysis.scores} />
            </div>

            {/* Price Projection + Trading Plan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PriceProjection
                scenarios={analysis.priceScenarios}
                expectedPrice={analysis.expectedPrice}
                expectedReturn={analysis.expectedReturn}
                currentPrice={analysis.currentPrice}
                currency={analysis.currency}
              />
              <TradingPlanComponent plan={analysis.tradingPlan} currency={analysis.currency} />
            </div>

            {/* Valuation + Technical */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnalysisSection title="Valuation Model">
                <div className="flex items-start gap-2">
                  <BarChart3 className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <p>{analysis.valuationSummary}</p>
                </div>
              </AnalysisSection>
              <AnalysisSection title="Technical Analysis">
                <div className="flex items-start gap-2">
                  <Activity className="w-4 h-4 mt-0.5 text-data-accent shrink-0" />
                  <p>{analysis.technicalSummary}</p>
                </div>
              </AnalysisSection>
            </div>

            {/* Risk + Catalysts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ListSection title="Risk Factors" items={analysis.riskFactors} icon={AlertTriangle} colorClass="text-bear" />
              <ListSection title="Catalysts" items={analysis.catalysts} icon={Zap} colorClass="text-bull" />
            </div>

            {/* Competitive + Macro */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnalysisSection title="Competitive Landscape">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <p>{analysis.competitivePosition}</p>
                </div>
              </AnalysisSection>
              <AnalysisSection title="Macro Impact">
                <div className="flex items-start gap-2">
                  <Globe className="w-4 h-4 mt-0.5 text-data-accent shrink-0" />
                  <p>{analysis.macroOutlook}</p>
                </div>
              </AnalysisSection>
            </div>

            {/* Disclaimer */}
            <div className="text-center py-6">
              <p className="text-xs font-mono text-muted-foreground opacity-50">
                This analysis is for informational purposes only and does not constitute investment advice.
                Past performance is not indicative of future results.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
