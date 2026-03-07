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
import MacroSection from "./report/MacroSection";
import TradingPlanSection from "./report/TradingPlanSection";
import TechnicalSection from "./report/TechnicalSection";
import MoatSection from "./report/MoatSection";
import RiskMatrix from "./report/RiskMatrix";
import FinalVerdict from "./report/FinalVerdict";
import HoldingAnalysis from "./report/HoldingAnalysis";
import ComparisonBanner from "./report/ComparisonBanner";
import PriceExtremes from "./report/PriceExtremes";
import EarningsBreakdown from "./report/EarningsBreakdown";
import DividendStrategy from "./report/DividendStrategy";
import PatternFinder from "./report/PatternFinder";

interface DashboardReportProps {
  data: StockAnalysis;
  onSearchOpen: () => void;
  savedSnapshot?: { data: StockAnalysis; date: string } | null;
}

const SECTION_IDS: Record<string, string> = {
  summary: "section-summary",
  scores: "section-scores",
  fundamentals: "section-fundamentals",
  valuation: "section-valuation",
  price: "section-price",
  macro: "section-macro",
  technical: "section-technical",
  moat: "section-moat",
  risk: "section-risk",
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

      {/* Price Extremes */}
      <div className="px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 max-w-[1400px] mx-auto">
        <PriceExtremes data={data} />
      </div>

      {/* Holding Analysis — togglable */}
      {holdingsOpen && (
        <div className="px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 max-w-[1400px] mx-auto">
          <HoldingAnalysis data={data} />
        </div>
      )}

      {/* Main content grid: single column mobile, 2-col tablet sidebar layout on lg */}
      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 sm:gap-5 lg:gap-6 max-w-[1400px] mx-auto">
        {/* Main column */}
        <div className="space-y-4 sm:space-y-5 lg:space-y-6 min-w-0">
          <div id="section-summary"><ExecutiveSummary data={data} /></div>
          <div id="section-scores"><ScoreMatrix data={data} /></div>
          <div id="section-fundamentals"><FundamentalAnalysis data={data} /></div>
          <div id="section-earnings"><EarningsBreakdown data={data} /></div>
          <div id="section-valuation"><DCFValuation data={data} /></div>
          <div id="section-price"><PriceProjectionSection data={data} /></div>
          <div id="section-macro"><MacroSection data={data} /></div>
          <div id="section-dividend"><DividendStrategy data={data} /></div>
        </div>

        {/* Sidebar column — stacks below main on mobile */}
        <div className="space-y-4 sm:space-y-5">
          <TradingPlanSection data={data} />
          <div id="section-technical"><TechnicalSection data={data} /></div>
          <div id="section-moat"><MoatSection data={data} /></div>
          <div id="section-pattern"><PatternFinder data={data} /></div>
          <div id="section-risk"><RiskMatrix data={data} /></div>
          <FinalVerdict data={data} />
        </div>
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
