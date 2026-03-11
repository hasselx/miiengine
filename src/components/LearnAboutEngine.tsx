import { useState } from "react";
import { cn } from "@/lib/utils";
import { Cog, Info, Layers, Mail } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import HowItWorks from "@/components/HowItWorks";
import HomeFeatures from "@/components/HomeFeatures";
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
  { key: "contact", label: "Contact Us", icon: Mail },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const LearnAboutEngine = () => {
  const [active, setActive] = useState<TabKey | null>(null);

  const toggle = (key: TabKey) => {
    if (key === "contact") {
      window.open("https://www.heypage.online/hasselx?referrer=MIIEngine&type=redirect", "_blank", "noopener,noreferrer");
      return;
    }
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

        {/* Navigation buttons */}
        <TooltipProvider delayDuration={300}>
          <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 mb-6">
            {TABS.map((tab) => {
              const isActive = active === tab.key;
              const button = (
                <button
                  key={tab.key}
                  onClick={() => toggle(tab.key)}
                  className={cn(
                    "flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border font-mono text-xs sm:text-sm tracking-wide transition-all duration-200",
                    isActive
                      ? "border-primary bg-primary/10 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground hover:shadow-[0_0_8px_hsl(var(--primary)/0.1)]"
                  )}
                >
                  <tab.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-primary" : "")} />
                  {tab.label}
                </button>
              );

              if (tab.key === "contact") {
                return (
                  <Tooltip key={tab.key}>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[240px] text-center">
                      Contact the MII Engine team for feedback, support, or partnership inquiries.
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return button;
            })}
          </div>
        </TooltipProvider>

        {/* Content area */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-out",
            active && active !== "contact" ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
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
                  <p>MII Engine is a multi-institutional intelligence platform designed to generate structured equity research reports using data from multiple financial sources.</p>
                  <p>The engine evaluates stocks using a multi-factor analytical framework that combines fundamentals, valuation models, technical momentum, institutional activity, and macroeconomic signals.</p>
                  <p>Instead of providing simple price predictions, the platform produces transparent research outputs including fair value estimates, risk assessments, factor exposure analysis, and probability-weighted price scenarios.</p>
                  <p>Each report is structured to resemble professional institutional research used by investment analysts and portfolio managers.</p>
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
