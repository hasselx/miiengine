import { useCallback, useState } from "react";
import { StockAnalysis } from "@/lib/stockData";
import DashboardLayout from "./layout/DashboardLayout";
import ReportHeader from "./report/ReportHeader";
import ScoreBanner from "./report/ScoreBanner";
import ExecutiveSummary from "./report/ExecutiveSummary";
import ScoreMatrix from "./report/ScoreMatrix";
import FundamentalAnalysis from "./report/FundamentalAnalysis";
import DCFValuation from "./report/DCFValuation";
import PriceProjectionSection from "./report/PriceProjectionSection";
import ValuationTriangle from "./report/ValuationTriangle";
import MacroSection from "./report/MacroSection";
import TradingPlanSection from "./report/TradingPlanSection";
import TechnicalSection from "./report/TechnicalSection";
import MoatSection from "./report/MoatSection";
import RiskMatrix from "./report/RiskMatrix";
import RiskMeter from "./report/RiskMeter";
import FinalVerdict from "./report/FinalVerdict";
import HoldingAnalysis from "./report/HoldingAnalysis";
import ComparisonBanner from "./report/ComparisonBanner";
import PriceExtremes from "./report/PriceExtremes";
import EarningsBreakdown from "./report/EarningsBreakdown";
import DividendStrategy from "./report/DividendStrategy";
import PatternFinder from "./report/PatternFinder";
import EarningsSurpriseTracker from "./report/EarningsSurpriseTracker";
import SupportResistance from "./report/SupportResistance";
import InsiderActivity from "./report/InsiderActivity";
import InstitutionalOwnership from "./report/InstitutionalOwnership";
import MarketSentiment from "./report/MarketSentiment";
import CorrelationAnalyzer from "./report/CorrelationAnalyzer";
import SectorRotation from "./report/SectorRotation";
import BacktestSimulator from "./report/BacktestSimulator";
import AIStockSummary from "./report/AIStockSummary";
import FactorExposure from "./report/FactorExposure";
import CatalystTimeline from "./report/CatalystTimeline";
import RecommendationStack from "./report/RecommendationStack";
import ConfidenceMeter from "./report/ConfidenceMeter";
import PriceDistribution from "./report/PriceDistribution";
import FactorContributionChart from "./report/FactorContributionChart";
import PeerComparison from "./report/PeerComparison";
import CapitalFlowMap from "./report/CapitalFlowMap";

interface DashboardReportProps {
  data: StockAnalysis;
  onSearchOpen: () => void;
  savedSnapshot?: { data: StockAnalysis; date: string } | null;
}

const SECTION_IDS: Record<string, string> = {
  "ai-summary": "section-ai-summary",
  summary: "section-summary",
  scores: "section-scores",
  fundamentals: "section-fundamentals",
  earnings: "section-earnings",
  "earnings-surprise": "section-earnings-surprise",
  valuation: "section-valuation",
  "valuation-triangle": "section-valuation-triangle",
  "peer-comparison": "section-peer-comparison",
  price: "section-price",
  "price-distribution": "section-price-distribution",
  "catalyst-timeline": "section-catalyst-timeline",
  "price-extremes": "section-price-extremes",
  "trading-plan": "section-trading-plan",
  technical: "section-technical",
  "support-resistance": "section-support-resistance",
  pattern: "section-pattern",
  institutional: "section-institutional",
  insider: "section-insider",
  sentiment: "section-sentiment",
  macro: "section-macro",
  "sector-rotation": "section-sector-rotation",
  correlation: "section-correlation",
  moat: "section-moat",
  "factor-exposure": "section-factor-exposure",
  risk: "section-risk",
  dividend: "section-dividend",
  backtest: "section-backtest",
  verdict: "section-verdict",
};

const DashboardReport = ({ data, onSearchOpen, savedSnapshot }: DashboardReportProps) => {
  const [holdingsOpen, setHoldingsOpen] = useState(false);

  const scrollTo = useCallback((section: string) => {
    const id = SECTION_IDS[section];
    if (id) {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div data-report-root>
      <DashboardLayout
        onSearchOpen={onSearchOpen}
        onSectionClick={scrollTo}
        companyName={data.company}
      >
        <ReportHeader
          data={data}
          onToggleHoldings={() => setHoldingsOpen(prev => !prev)}
          holdingsOpen={holdingsOpen}
        />
        {savedSnapshot && (
          <ComparisonBanner savedData={savedSnapshot.data} currentData={data} savedDate={savedSnapshot.date} />
        )}
        <ScoreBanner data={data} />

        {/* Decision Stack + Factor Contribution + Confidence — below score banner */}
        <div className="px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 max-w-[1000px] mx-auto space-y-4 sm:space-y-5">
          <RecommendationStack data={data} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FactorContributionChart data={data} />
            <ConfidenceMeter data={data} />
          </div>
        </div>
        {/* Holding Analysis — togglable */}
        {holdingsOpen && (
          <div className="px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 max-w-[1400px] mx-auto">
            <HoldingAnalysis data={data} />
          </div>
        )}

        {/* All sections in priority order — single column */}
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1000px] mx-auto space-y-4 sm:space-y-5 lg:space-y-6">
          {/* 01 */}
          <div id="section-ai-summary"><AIStockSummary data={data} /></div>
          {/* 02 */}
          <div id="section-summary"><ExecutiveSummary data={data} /></div>
          {/* 03 */}
          <div id="section-scores"><ScoreMatrix data={data} /></div>
          {/* 04 */}
          <div id="section-fundamentals"><FundamentalAnalysis data={data} /></div>
          {/* 05 */}
          <div id="section-earnings"><EarningsBreakdown data={data} /></div>
          {/* 06 */}
          <div id="section-earnings-surprise"><EarningsSurpriseTracker data={data} /></div>
          {/* 07 */}
          <div id="section-valuation"><DCFValuation data={data} /></div>
          {/* 08 */}
          <div id="section-valuation-triangle"><ValuationTriangle data={data} /></div>
          {/* Peer Comparison */}
          {data.peerComparison && <div id="section-peer-comparison"><PeerComparison data={data} /></div>}
          {/* 09 */}
          <div id="section-price"><PriceProjectionSection data={data} /></div>
          {/* Price Distribution */}
          <div id="section-price-distribution"><PriceDistribution data={data} /></div>
          {/* 10 */}
          <div id="section-catalyst-timeline"><CatalystTimeline data={data} /></div>
          {/* 11 */}
          <div id="section-price-extremes"><PriceExtremes data={data} /></div>
          {/* 12 */}
          <div id="section-trading-plan"><TradingPlanSection data={data} /></div>
          {/* 13 */}
          <div id="section-technical"><TechnicalSection data={data} /></div>
          {/* 14 */}
          <div id="section-support-resistance"><SupportResistance data={data} /></div>
          {/* 15 */}
          <div id="section-pattern"><PatternFinder data={data} /></div>
          {/* 16 */}
          <div id="section-institutional"><InstitutionalOwnership data={data} /></div>
          {/* 17 */}
          <div id="section-insider"><InsiderActivity data={data} /></div>
          {/* 18 */}
          <div id="section-sentiment"><MarketSentiment data={data} /></div>
          {/* 19 */}
          <div id="section-macro"><MacroSection data={data} /></div>
          {/* 20 */}
          <div id="section-sector-rotation"><SectorRotation data={data} /></div>
          {/* 21 */}
          <div id="section-correlation"><CorrelationAnalyzer data={data} /></div>
          {/* 22 */}
          <div id="section-moat"><MoatSection data={data} /></div>
          {/* 23 */}
          <div id="section-factor-exposure"><FactorExposure data={data} /></div>
          {/* 24 */}
          <div id="section-risk">
            <RiskMeter data={data} />
            <div className="mt-4 sm:mt-5"><RiskMatrix data={data} /></div>
          </div>
          {/* 25 */}
          <div id="section-dividend"><DividendStrategy data={data} /></div>
          {/* 26 */}
          <div id="section-backtest"><BacktestSimulator data={data} /></div>
          {/* 27 */}
          <div id="section-verdict"><FinalVerdict data={data} /></div>
        </div>

        {/* Watermark */}
        <div className="text-center py-3 px-3 sm:px-8 font-mono text-[9px] tracking-[3px] text-muted-foreground uppercase">
          {data.watermark}
        </div>

        {/* Disclaimer */}
        <div className="bg-sidebar px-3 sm:px-8 py-5 font-mono text-[10px] leading-relaxed text-sidebar-foreground/50">
          {data.disclaimer}
        </div>
      </DashboardLayout>
    </div>
  );
};

export default DashboardReport;
