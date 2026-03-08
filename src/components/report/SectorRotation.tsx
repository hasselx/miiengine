import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const icons = {
  up: <TrendingUp className="h-3.5 w-3.5 text-green-data" />,
  down: <TrendingDown className="h-3.5 w-3.5 text-destructive" />,
  neutral: <Minus className="h-3.5 w-3.5 text-muted-foreground" />,
};

const SectorRotation = ({ data }: { data: StockAnalysis }) => (
  <SectionWrapper num="17" title="Sector Rotation Tracker">
    <div className="space-y-2">
      {data.sectorRotation.map((s, i) => (
        <div key={i} className="flex items-center gap-3 bg-accent-area rounded-md px-3 py-2.5 border border-border">
          {icons[s.direction]}
          <span className="text-[12px] sm:text-[13px] text-foreground flex-1 truncate">{s.sector}</span>
          <span className={cn(
            "font-mono text-[13px] font-bold",
            s.direction === "up" ? "text-green-data" : s.direction === "down" ? "text-destructive" : "text-muted-foreground"
          )}>
            {s.performance}
          </span>
        </div>
      ))}
    </div>
    <p className="mt-3 text-[10px] text-muted-foreground font-mono">
      30-day sector momentum · Arrow indicates trend direction
    </p>
  </SectionWrapper>
);

export default SectorRotation;
