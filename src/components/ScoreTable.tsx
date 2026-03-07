import { ScoreCategory } from "@/lib/stockData";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ScoreTableProps {
  scores: ScoreCategory[];
  totalScore: number;
}

const ScoreBar = ({ score, maxScore }: { score: number; maxScore: number }) => {
  const pct = (score / maxScore) * 100;
  const color = pct >= 80 ? "bg-bull" : pct >= 60 ? "bg-neutral-data" : "bg-bear";
  return (
    <div className="w-full bg-secondary rounded-sm h-2 overflow-hidden">
      <div className={`h-full rounded-sm transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
};

const ScoreTable = ({ scores, totalScore }: ScoreTableProps) => {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="bg-card border border-border rounded-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-mono text-xs font-semibold tracking-widest uppercase text-muted-foreground">Multi-Factor Score Table</h3>
        <span className="font-mono text-lg font-bold text-primary">{totalScore}/100</span>
      </div>
      <div className="divide-y divide-border">
        {scores.map((cat, i) => (
          <div key={cat.name}>
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full px-4 py-3 flex items-center gap-4 hover:bg-secondary/50 transition-colors text-left"
            >
              {expanded === i ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
              <span className="text-sm font-medium flex-1">{cat.name}</span>
              <span className="text-xs text-muted-foreground font-mono shrink-0">{cat.weight}</span>
              <div className="w-24 shrink-0"><ScoreBar score={cat.score} maxScore={cat.maxScore} /></div>
              <span className="font-mono text-sm font-bold w-12 text-right shrink-0">
                {cat.score}/{cat.maxScore}
              </span>
            </button>
            {expanded === i && (
              <div className="px-4 pb-3 pl-12">
                <ul className="space-y-1">
                  {cat.details.map((d, j) => (
                    <li key={j} className="text-xs text-muted-foreground font-mono leading-relaxed">• {d}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScoreTable;
