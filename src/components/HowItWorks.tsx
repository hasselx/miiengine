import { Database, BarChart3, TrendingUp, ShieldAlert, Award, ArrowRight, ArrowDown } from "lucide-react";

const METRICS = [
  { value: "10+", label: "Analysis Models" },
  { value: "50+", label: "Financial Metrics" },
  { value: "Multi-Source", label: "Market Data" },
  { value: "12-Month", label: "Forecast Horizon" },
];

const STEPS = [
  {
    icon: Database,
    title: "Market Data",
    desc: "Aggregate live market data including price, volume, earnings metrics, and institutional ownership from multiple financial sources.",
  },
  {
    icon: BarChart3,
    title: "Multi-Factor Analysis",
    desc: "Evaluate the stock using a structured scoring model covering fundamentals, valuation, momentum, sector strength, and macro factors.",
  },
  {
    icon: TrendingUp,
    title: "Valuation Models",
    desc: "Estimate fair value using discounted cash flow, relative valuation multiples, and probability-weighted price scenarios.",
  },
  {
    icon: ShieldAlert,
    title: "Risk Assessment",
    desc: "Analyze volatility, leverage, valuation risk, and macro sensitivity to estimate downside exposure.",
  },
  {
    icon: Award,
    title: "Investment Verdict",
    desc: "Combine all analytical signals to produce a final investment score, recommendation, and fair value range.",
  },
];

const HowItWorks = () => (
  <div className="border-t border-border bg-background">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <p className="font-mono text-[10px] tracking-[4px] uppercase text-muted-foreground mb-2 text-center">
        Process
      </p>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-8 sm:mb-10">
        How the Analysis Engine Works
      </h2>

      {/* Live metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-12">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="text-center py-3 px-2 border border-border rounded-md bg-card"
          >
            <p className="font-mono text-lg sm:text-xl font-bold text-primary">{m.value}</p>
            <p className="font-mono text-[10px] sm:text-[11px] tracking-wide text-muted-foreground mt-0.5">
              {m.label}
            </p>
          </div>
        ))}
      </div>

      {/* Pipeline — horizontal on desktop, vertical on mobile */}
      <div className="relative">
        {/* Connecting line — desktop */}
        <div className="hidden sm:block absolute top-[42px] left-[10%] right-[10%] h-px bg-border z-0" />

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-0 sm:gap-3 relative z-10">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex flex-col items-center">
              {/* Arrow between steps — mobile only */}
              {i > 0 && (
                <ArrowDown className="h-4 w-4 text-muted-foreground mb-2 sm:hidden" />
              )}

              <div className="group flex flex-col items-center text-center w-full p-4 bg-card border border-border rounded-lg hover:border-primary/40 transition-colors">
                <div className="w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center mb-3 group-hover:border-primary/40 transition-colors">
                  <step.icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <p className="font-mono text-[11px] sm:text-[12px] font-semibold tracking-wide text-foreground mb-1.5">
                  {step.title}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>

              {/* Arrow between steps — desktop only */}
              {i < STEPS.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground absolute hidden sm:block" style={{ display: 'none' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="text-center mt-8 font-mono text-[10px] sm:text-[11px] text-muted-foreground tracking-wide">
        Analyzing stocks across 10+ financial dimensions to generate structured research reports
      </p>
    </div>
  </div>
);

export default HowItWorks;
