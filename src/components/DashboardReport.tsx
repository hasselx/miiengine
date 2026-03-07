import { useCallback } from "react";
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
  const scrollTo = useCallback((section: string) => {
    const id = SECTION_IDS[section];
    if (id) {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <DashboardLayout
      onSearchOpen={onSearchOpen}
      onSectionClick={scrollTo}
      companyName={data.company}
    >
      <ReportHeader data={data} />
      {savedSnapshot && (
        <ComparisonBanner savedData={savedSnapshot.data} currentData={data} savedDate={savedSnapshot.date} />
      )}
      <ScoreBanner data={data} />

      {/* Holding Analysis — below verdict */}
      <div className="px-4 sm:px-8 pt-6 max-w-[1400px] mx-auto">
        <HoldingAnalysis data={data} />
      </div>

      <div className="px-4 sm:px-8 py-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 max-w-[1400px] mx-auto">
        {/* Main column */}
        <div className="space-y-6">
          <div id="section-summary"><ExecutiveSummary data={data} /></div>
          <div id="section-scores"><ScoreMatrix data={data} /></div>
          <div id="section-fundamentals"><FundamentalAnalysis data={data} /></div>
          <div id="section-valuation"><DCFValuation data={data} /></div>
          <div id="section-price"><PriceProjectionSection data={data} /></div>
          <div id="section-macro"><MacroSection data={data} /></div>
        </div>

        {/* Sidebar column */}
        <div className="space-y-5">
          <TradingPlanSection data={data} />
          <div id="section-technical"><TechnicalSection data={data} /></div>
          <div id="section-moat"><MoatSection data={data} /></div>
          <div id="section-risk"><RiskMatrix data={data} /></div>
          <FinalVerdict data={data} />
        </div>
      </div>

      {/* Watermark */}
      <div className="text-center py-3 px-4 sm:px-8 font-mono text-[9px] tracking-[3px] text-muted-foreground uppercase">
        {data.watermark}
      </div>

      {/* Disclaimer */}
      <div className="bg-sidebar px-4 sm:px-8 py-5 font-mono text-[10px] leading-relaxed text-sidebar-foreground/50">
        {data.disclaimer}
      </div>
    </DashboardLayout>
  );
};

export default DashboardReport;
