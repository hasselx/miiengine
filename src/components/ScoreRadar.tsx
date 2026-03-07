import { ScoreCategory } from "@/lib/stockData";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

interface ScoreRadarProps {
  scores: ScoreCategory[];
}

const ScoreRadar = ({ scores }: ScoreRadarProps) => {
  const data = scores.map((s) => ({
    name: s.name.split(" ")[0],
    score: (s.score / s.maxScore) * 100,
    fullMark: 100,
  }));

  return (
    <div className="bg-card border border-border rounded-sm">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-mono text-xs font-semibold tracking-widest uppercase text-muted-foreground">Score Profile</h3>
      </div>
      <div className="p-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="hsl(220, 15%, 18%)" />
            <PolarAngleAxis dataKey="name" tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 10, fontFamily: "JetBrains Mono" }} />
            <Radar name="Score" dataKey="score" stroke="hsl(45, 90%, 55%)" fill="hsl(45, 90%, 55%)" fillOpacity={0.15} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ScoreRadar;
