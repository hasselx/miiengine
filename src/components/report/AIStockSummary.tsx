import { useMemo } from "react";
import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";
import { Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  data: StockAnalysis;
}

function parsePrice(s: string): number {
  return parseFloat(s.replace(/[^0-9.-]/g, "")) || 0;
}

function generateSummary(data: StockAnalysis): { text: string; signals: { label: string; positive: boolean }[]; sentiment: "Bullish" | "Neutral" | "Bearish" } {
  const score = data.totalScore;
  const verdict = data.verdict;
  const company = data.company;
  const price = data.headerMetrics[0]?.value || "N/A";
  const pe = data.fundamentalMetrics.find(m => m.label.includes("P/E"));
  const upside = data.expectedUpside;

  // Determine sentiment
  const sentiment: "Bullish" | "Neutral" | "Bearish" =
    score >= 70 ? "Bullish" : score <= 45 ? "Bearish" : "Neutral";

  // Build key signals
  const signals: { label: string; positive: boolean }[] = [];

  // Score-based signal
  if (score >= 70) signals.push({ label: "Strong overall score (" + score + "/100)", positive: true });
  else if (score >= 55) signals.push({ label: "Moderate score (" + score + "/100)", positive: true });
  else signals.push({ label: "Weak overall score (" + score + "/100)", positive: false });

  // Valuation
  if (pe) {
    const peVal = parseFloat(pe.value);
    if (peVal > 40) signals.push({ label: "Premium valuation (P/E " + pe.value + ")", positive: false });
    else if (peVal > 0) signals.push({ label: "Reasonable valuation (P/E " + pe.value + ")", positive: true });
  }

  // Moat
  const avgMoat = data.moatItems.reduce((s, m) => s + m.score, 0) / Math.max(data.moatItems.length, 1);
  if (avgMoat >= 7) signals.push({ label: "Strong competitive moat", positive: true });
  else signals.push({ label: "Moderate competitive position", positive: false });

  // Risk
  const highRisks = data.riskItems.filter(r => r.level === "HIGH").length;
  if (highRisks >= 3) signals.push({ label: `${highRisks} high-risk factors identified`, positive: false });
  else if (highRisks === 0) signals.push({ label: "Low overall risk profile", positive: true });
  else signals.push({ label: `${highRisks} elevated risk factor${highRisks > 1 ? "s" : ""}`, positive: false });

  // Institutional
  if (data.institutionalOwnership > 50) signals.push({ label: `High institutional ownership (${data.institutionalOwnership}%)`, positive: true });
  else signals.push({ label: `Institutional ownership at ${data.institutionalOwnership}%`, positive: data.institutionalOwnership > 30 });

  // Sentiment
  if (data.sentimentLabel === "Bullish") signals.push({ label: "Positive market sentiment", positive: true });
  else if (data.sentimentLabel === "Bearish") signals.push({ label: "Negative market sentiment", positive: false });

  // Generate paragraph
  const peNote = pe ? (parseFloat(pe.value) > 40 ? "the valuation appears stretched at " + pe.value + " P/E" : "valuation is reasonable at " + pe.value + " P/E") : "valuation data is limited";
  const moatNote = avgMoat >= 7 ? "a strong competitive moat" : "a moderate competitive position";
  const riskNote = highRisks >= 3 ? "several elevated risk factors warrant caution" : highRisks === 0 ? "the risk profile is favorable" : "some risk factors should be monitored";
  const technicalNote = data.technicalSignals.find(s => s.name.includes("200"))?.status === "positive" ? "bullish technical momentum above key moving averages" : "technical indicators suggest mixed momentum";
  const sentimentNote = data.sentimentLabel === "Bullish" ? "investor sentiment is positive" : data.sentimentLabel === "Bearish" ? "market sentiment is cautious" : "sentiment is neutral";

  const text = `${company} currently trades at ${price} with an MII Score of ${score}/100, earning a "${verdict}" recommendation. ` +
    `Our analysis shows ${peNote}, supported by ${moatNote}. ` +
    `The stock exhibits ${technicalNote}, and ${riskNote}. ` +
    `With an expected 12-month target of ${data.expectedPrice} (${upside}), ${sentimentNote}. ` +
    `Institutional ownership stands at ${data.institutionalOwnership}%, and the ${data.sentimentLabel.toLowerCase()} outlook is reflected across multiple analytical models.`;

  return { text, signals, sentiment };
}

const AIStockSummary = ({ data }: Props) => {
  const { text, signals, sentiment } = useMemo(() => generateSummary(data), [data]);

  const sentimentConfig = {
    Bullish: { icon: TrendingUp, color: "text-green bg-green/10 border-green/20" },
    Neutral: { icon: Minus, color: "text-gold bg-gold/10 border-gold/20" },
    Bearish: { icon: TrendingDown, color: "text-red bg-red/10 border-red/20" },
  };

  const cfg = sentimentConfig[sentiment];
  const SentimentIcon = cfg.icon;

  return (
    <SectionWrapper num="AI" title="AI Investment Summary">
      {/* Sentiment Badge */}
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-mono text-[11px] font-semibold tracking-wider uppercase", cfg.color)}>
          <SentimentIcon className="w-3.5 h-3.5" />
          {sentiment}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          <span className="font-mono text-[10px] tracking-wider uppercase">AI-Generated Analysis</span>
        </div>
      </div>

      {/* Summary Text */}
      <p className="text-[12px] sm:text-[13px] leading-relaxed text-foreground/90 mb-4 font-sans">
        {text}
      </p>

      {/* Key Signals */}
      <div className="space-y-1.5">
        <div className="font-mono text-[10px] tracking-[2px] uppercase text-muted-foreground mb-2">Key Signals</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {signals.map((signal, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded border text-[11px] font-mono",
                signal.positive
                  ? "border-green/20 bg-green/5 text-green"
                  : "border-red/20 bg-red/5 text-red"
              )}
            >
              <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", signal.positive ? "bg-green" : "bg-red")} />
              {signal.label}
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

export default AIStockSummary;
