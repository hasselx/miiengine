import { BarChart3, TrendingUp, Shield, Target, Activity, Layers, LineChart, Brain, Zap, AlertTriangle } from "lucide-react";

const FEATURES = [
  { icon: BarChart3, title: "Multi-Factor Scoring", desc: "Structured scoring combining fundamentals, valuation, momentum, institutional activity, and risk metrics." },
  { icon: TrendingUp, title: "DCF Valuation", desc: "Intrinsic value estimation using discounted cash flow modeling based on growth, margins, and cost of capital." },
  { icon: Shield, title: "Moat Analysis", desc: "Competitive advantage assessment including brand strength, positioning, and structural barriers to entry." },
  { icon: Target, title: "Price Projection Models", desc: "Probability-weighted bull, base, and bear scenarios to estimate realistic valuation ranges." },
  { icon: Activity, title: "Technical Signals", desc: "Price momentum analysis using moving averages, RSI, support/resistance levels, and trend indicators." },
  { icon: Layers, title: "Fundamental Analysis", desc: "Financial health evaluation including revenue growth, profitability, leverage, and earnings consistency." },
  { icon: LineChart, title: "Historical Performance", desc: "Long-term price and earnings trend analysis to identify structural growth or cyclical patterns." },
  { icon: Brain, title: "AI Research Summary", desc: "Complex financial data converted into concise explanations highlighting key drivers and risks." },
  { icon: Zap, title: "Real-Time Market Data", desc: "Live market data integration from multiple financial feeds for accurate analysis." },
  { icon: AlertTriangle, title: "Risk Assessment", desc: "Volatility, leverage risk, valuation risk, and macro sensitivity evaluation for downside exposure." },
];

const HomeFeatures = () => (
  <div>
    <p className="font-mono text-[10px] tracking-[4px] uppercase text-muted-foreground mb-3">Features</p>
    <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-6">
      What the Engine Analyzes
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
      {FEATURES.map((feat, i) => (
        <div
          key={i}
          className="group px-3 sm:px-4 py-3 bg-background border border-border rounded-lg hover:border-foreground/20 transition-colors"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-1.5">
            <feat.icon className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-foreground">{feat.title}</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed pl-6 sm:pl-7">{feat.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

export default HomeFeatures;
