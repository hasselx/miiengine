import { TradingPlan as TradingPlanType } from "@/lib/stockData";
import { Target, ShieldAlert, Crosshair, BarChart3 } from "lucide-react";

interface TradingPlanProps {
  plan: TradingPlanType;
  currency: string;
}

const fmt = (v: number, c: string) => `${c === "USD" ? "$" : c}${v.toFixed(0)}`;

const TradingPlanComponent = ({ plan, currency }: TradingPlanProps) => {
  const items = [
    { icon: Crosshair, label: "ENTRY ZONE", value: `${fmt(plan.entryZone[0], currency)} – ${fmt(plan.entryZone[1], currency)}`, cls: "text-data-accent" },
    { icon: ShieldAlert, label: "STOP LOSS", value: fmt(plan.stopLoss, currency), cls: "text-bear" },
    { icon: Target, label: "TARGETS", value: plan.targets.map(t => fmt(t, currency)).join(" → "), cls: "text-bull" },
    { icon: BarChart3, label: "RISK / REWARD", value: plan.riskReward, cls: "text-primary" },
  ];

  return (
    <div className="bg-card border border-border rounded-sm">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-mono text-xs font-semibold tracking-widest uppercase text-muted-foreground">Trading Plan</h3>
      </div>
      <div className="divide-y divide-border">
        {items.map((item) => (
          <div key={item.label} className="px-4 py-3 flex items-center gap-3">
            <item.icon className={`w-4 h-4 ${item.cls} shrink-0`} />
            <span className="text-xs font-mono text-muted-foreground w-28 shrink-0">{item.label}</span>
            <span className={`font-mono text-sm font-semibold ${item.cls}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TradingPlanComponent;
