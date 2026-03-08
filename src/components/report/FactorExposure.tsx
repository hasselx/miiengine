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

function heatColor(score: number): string {
  if (score >= 7) return "bg-green-data/20 text-green-data border-green-data/30";
  if (score >= 4) return "bg-gold/15 text-gold border-gold/30";
  return "bg-red-data/15 text-red-data border-red-data/30";
}

function heatLabel(score: number): string {
  if (score >= 7) return "Strong";
  if (score >= 4) return "Moderate";
  return "Weak";
}

const FactorExposure = ({ data }: { data: StockAnalysis }) => {
  const { factorExposure, marketRegime } = data;

  // Build interpretation
  const strongFactors = factorExposure.filter(f => f.score >= 7).map(f => f.name.toLowerCase());
  const weakFactors = factorExposure.filter(f => f.score < 4).map(f => f.name.toLowerCase());
  const volFactor = factorExposure.find(f => f.name === "Volatility");

  let interpretation = "";
  if (strongFactors.length > 0) {
    interpretation += `This stock exhibits strong exposure to ${strongFactors.join(" and ")} factors`;
  }
  if (weakFactors.length > 0) {
    interpretation += `${strongFactors.length > 0 ? ", while " : ""}${weakFactors.join(" and ")} metrics indicate limited characteristics`;
  }
  if (volFactor && volFactor.score >= 7) {
    interpretation += ". Elevated volatility suggests price sensitivity to market cycles";
  }
  if (interpretation) interpretation += ".";

  return (
    <SectionWrapper num="23" title="Factor Exposure & Market Regime">
      {/* Factor Heatmap Grid */}
      <div className="mb-4">
        <p className="font-mono text-[9px] tracking-[2px] uppercase text-muted-foreground mb-3">Factor Heatmap</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {factorExposure.map((f) => (
            <div key={f.name} className={`border rounded-sm p-3 text-center ${heatColor(f.score)}`}>
              <p className="font-mono text-[10px] tracking-wide uppercase opacity-80">{f.name}</p>
              <p className="font-display text-2xl font-bold mt-1">{f.score}</p>
              <p className="font-mono text-[9px] mt-0.5">{heatLabel(f.score)}</p>
            </div>
          ))}
        </div>
        {interpretation && (
          <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">{interpretation}</p>
        )}
      </div>

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
