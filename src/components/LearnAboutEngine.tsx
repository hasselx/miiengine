import { useState } from "react";
import { cn } from "@/lib/utils";
import { Cog, Info, Layers } from "lucide-react";
import HowItWorks from "@/components/HowItWorks";
import HomeFeatures from "@/components/HomeFeatures";
import Methodology from "@/components/Methodology";
import { CheckCircle } from "lucide-react";

const HIGHLIGHTS = [
  "Institutional-style multi-factor analysis",
  "Aggregation of data from multiple financial sources",
  "Transparent valuation models and risk frameworks",
  "Automated equity research generation",
];

const TABS = [
  { key: "process", label: "Process", icon: Cog },
  { key: "about", label: "About", icon: Info },
  { key: "features", label: "Features", icon: Layers },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const LearnAboutEngine = () => {
  const [active, setActive] = useState<TabKey | null>(null);

  const toggle = (key: TabKey) => {
    setActive((prev) => (prev === key ? null : key));
  };

  return (
    <div className="border-t border-border bg-card">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <p className="font-mono text-[10px] tracking-[4px] uppercase text-muted-foreground mb-2 text-center">
          Explore
        </p>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-8">
          Learn About the Engine
        </h2>

        {/* Tab buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => toggle(tab.key)}
              className={cn(
                "flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border font-mono text-xs sm:text-sm tracking-wide transition-all duration-200",
                active === tab.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content area with smooth animation */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-out",
            active ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          {active === "process" && (
            <div className="animate-fade-in">
              <HowItWorks />
            </div>
          )}

          {active === "about" && (
            <div className="animate-fade-in">
              <div className="max-w-3xl mx-auto">
                <p className="font-mono text-[10px] tracking-[4px] uppercase text-muted-foreground mb-3">About</p>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  What is MII Engine?
                </h3>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed mb-6">
                  <p>
                    MII Engine is a multi-institutional intelligence platform designed to generate structured equity research reports using data from multiple financial sources.
                  </p>
                  <p>
                    The engine evaluates stocks using a multi-factor analytical framework that combines fundamentals, valuation models, technical momentum, institutional activity, and macroeconomic signals.
                  </p>
                  <p>
                    Instead of providing simple price predictions, the platform produces transparent research outputs including fair value estimates, risk assessments, factor exposure analysis, and probability-weighted price scenarios.
                  </p>
                  <p>
                    Each report is structured to resemble professional institutional research used by investment analysts and portfolio managers.
                  </p>
                </div>
                <ul className="space-y-3">
                  {HIGHLIGHTS.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {active === "features" && (
            <div className="animate-fade-in">
              <HomeFeatures />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearnAboutEngine;
