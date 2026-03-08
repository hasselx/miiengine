import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

const regimeColor = {
  "Bull Market": "text-green-data",
  "Bear Market": "text-red-data",
  "Sideways Market": "text-gold",
};

const regimeBg = {
  "Bull Market": "bg-green-data/10",
  "Bear Market": "bg-red-data/10",
  "Sideways Market": "bg-gold/10",
};

const FactorExposure = ({ data }: { data: StockAnalysis }) => {
  const { factorExposure, marketRegime } = data;

  return (
    <SectionWrapper num="22" title="Factor Exposure & Market Regime">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Radar Chart */}
        <div className="bg-accent-area rounded-sm p-4 flex items-center justify-center" style={{ minHeight: 260 }}>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={factorExposure} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
              <Radar dataKey="score" stroke="hsl(var(--gold))" fill="hsl(var(--gold))" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Factor scores list + regime */}
        <div>
          <div className="divide-y divide-border mb-4">
            {factorExposure.map((f) => (
              <div key={f.name} className="flex items-center justify-between py-2.5">
                <span className="text-[12px]">{f.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-border rounded overflow-hidden">
                    <div className="h-full bg-gold rounded" style={{ width: `${f.score * 10}%` }} />
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground w-6 text-right">{f.score}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Market Regime */}
          <div className={`${regimeBg[marketRegime.regime]} p-3 rounded-sm`}>
            <p className="font-mono text-[9px] tracking-[2px] uppercase text-muted-foreground mb-1">Detected Market Regime</p>
            <p className={`font-display text-lg font-bold ${regimeColor[marketRegime.regime]}`}>{marketRegime.regime}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{marketRegime.adjustment}</p>
            <div className="mt-2 space-y-0.5">
              {marketRegime.signals.map((s, i) => (
                <p key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
                  <span className="text-gold mt-0.5">•</span> {s}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default FactorExposure;
