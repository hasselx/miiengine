import { StockAnalysis, PeerMetric, PeerComparisonData } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

function fmtLarge(val: number): string {
  if (val >= 1e12) return `${(val / 1e12).toFixed(1)}T`;
  if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e7) return `${(val / 1e7).toFixed(0)} Cr`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
  return val.toFixed(0);
}

const PeerComparison = ({ data }: { data: StockAnalysis }) => {
  const peer = data.peerComparison;
  if (!peer || peer.peers.length === 0) return null;

  const allCompanies = [peer.companyMetrics, ...peer.peers];
  const signalColor = (val: number | null, avg: number | null, higher: boolean) => {
    if (val == null || avg == null) return 'text-muted-foreground';
    const diff = higher ? val - avg : avg - val;
    if (diff > 0) return 'text-green-data';
    if (diff < 0) return 'text-red-data';
    return 'text-foreground';
  };

  return (
    <SectionWrapper num="" title="Peer Comparison">
      {/* Relative Score */}
      <div className="flex items-center gap-4 mb-4">
        <div>
          <p className="font-mono text-[9px] tracking-[3px] uppercase text-muted-foreground mb-1">Relative Score</p>
          <div className="flex items-center gap-2">
            <p className="font-display text-2xl font-bold text-foreground">{peer.relativeScore.toFixed(1)}</p>
            <span className="font-mono text-[10px] text-muted-foreground">/ 10</span>
          </div>
        </div>
        <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              peer.relativeScore >= 7 ? 'bg-green-data' : peer.relativeScore >= 4 ? 'bg-gold' : 'bg-red-data'
            }`}
            style={{ width: `${peer.relativeScore * 10}%` }}
          />
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="font-mono text-[9px] tracking-[2px] uppercase text-muted-foreground py-2 pr-3">Company</th>
              <th className="font-mono text-[9px] tracking-[2px] uppercase text-muted-foreground py-2 px-2 text-right">P/E</th>
              <th className="font-mono text-[9px] tracking-[2px] uppercase text-muted-foreground py-2 px-2 text-right">Rev Growth</th>
              <th className="font-mono text-[9px] tracking-[2px] uppercase text-muted-foreground py-2 px-2 text-right">Op. Margin</th>
              <th className="font-mono text-[9px] tracking-[2px] uppercase text-muted-foreground py-2 px-2 text-right">ROE</th>
              <th className="font-mono text-[9px] tracking-[2px] uppercase text-muted-foreground py-2 px-2 text-right">D/E</th>
              <th className="font-mono text-[9px] tracking-[2px] uppercase text-muted-foreground py-2 pl-2 text-right">Mkt Cap</th>
            </tr>
          </thead>
          <tbody>
            {allCompanies.map((c, i) => {
              const isTarget = i === 0;
              return (
                <tr key={c.symbol} className={`border-b border-border/50 ${isTarget ? 'bg-accent-area' : ''}`}>
                  <td className="py-2 pr-3">
                    <span className={`text-[12px] font-medium ${isTarget ? 'text-primary font-semibold' : 'text-foreground'}`}>
                      {c.name || c.symbol}
                    </span>
                    {isTarget && <span className="ml-1.5 font-mono text-[8px] tracking-[1px] uppercase text-primary/70">Target</span>}
                  </td>
                  <td className={`font-mono text-[11px] py-2 px-2 text-right ${signalColor(c.pe, peer.sectorAvg.pe, false)}`}>
                    {c.pe > 0 ? `${c.pe.toFixed(1)}x` : 'N/A'}
                  </td>
                  <td className={`font-mono text-[11px] py-2 px-2 text-right ${signalColor(c.revenueGrowth, peer.sectorAvg.revenueGrowth, true)}`}>
                    {c.revenueGrowth != null ? `${(c.revenueGrowth * 100).toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className={`font-mono text-[11px] py-2 px-2 text-right ${signalColor(c.operatingMargin, peer.sectorAvg.operatingMargin, true)}`}>
                    {c.operatingMargin != null ? `${(c.operatingMargin * 100).toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className={`font-mono text-[11px] py-2 px-2 text-right ${signalColor(c.roe, peer.sectorAvg.roe, true)}`}>
                    {c.roe != null ? `${(c.roe * 100).toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className={`font-mono text-[11px] py-2 px-2 text-right ${signalColor(c.debtToEquity, peer.sectorAvg.debtToEquity, false)}`}>
                    {c.debtToEquity != null ? c.debtToEquity.toFixed(1) : 'N/A'}
                  </td>
                  <td className="font-mono text-[11px] py-2 pl-2 text-right text-muted-foreground">
                    {c.marketCap > 0 ? fmtLarge(c.marketCap) : 'N/A'}
                  </td>
                </tr>
              );
            })}
            {/* Sector Average Row */}
            <tr className="bg-muted/30">
              <td className="py-2 pr-3">
                <span className="font-mono text-[10px] tracking-[1px] uppercase text-muted-foreground">Peer Avg</span>
              </td>
              <td className="font-mono text-[11px] py-2 px-2 text-right text-muted-foreground font-semibold">
                {peer.sectorAvg.pe > 0 ? `${peer.sectorAvg.pe.toFixed(1)}x` : 'N/A'}
              </td>
              <td className="font-mono text-[11px] py-2 px-2 text-right text-muted-foreground font-semibold">
                {peer.sectorAvg.revenueGrowth != null ? `${(peer.sectorAvg.revenueGrowth * 100).toFixed(1)}%` : 'N/A'}
              </td>
              <td className="font-mono text-[11px] py-2 px-2 text-right text-muted-foreground font-semibold">
                {peer.sectorAvg.operatingMargin != null ? `${(peer.sectorAvg.operatingMargin * 100).toFixed(1)}%` : 'N/A'}
              </td>
              <td className="font-mono text-[11px] py-2 px-2 text-right text-muted-foreground font-semibold">
                {peer.sectorAvg.roe != null ? `${(peer.sectorAvg.roe * 100).toFixed(1)}%` : 'N/A'}
              </td>
              <td className="font-mono text-[11px] py-2 px-2 text-right text-muted-foreground font-semibold">
                {peer.sectorAvg.debtToEquity != null ? peer.sectorAvg.debtToEquity.toFixed(1) : 'N/A'}
              </td>
              <td className="font-mono text-[11px] py-2 pl-2 text-right text-muted-foreground">—</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Peer Ranking */}
      <div className="mb-4">
        <p className="font-mono text-[9px] tracking-[3px] uppercase text-muted-foreground mb-2">Peer Ranking</p>
        <div className="space-y-1.5">
          {peer.ranking.map((r, i) => {
            const isTarget = r.symbol === peer.companyMetrics.symbol;
            const maxScore = peer.ranking[0]?.score || 1;
            return (
              <div key={r.symbol} className="flex items-center gap-2.5">
                <span className={`font-mono text-[12px] font-bold w-5 ${isTarget ? 'text-primary' : 'text-muted-foreground'}`}>{i + 1}</span>
                <span className={`text-[12px] w-28 truncate ${isTarget ? 'text-primary font-semibold' : 'text-foreground'}`}>{r.name}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isTarget ? 'bg-primary' : 'bg-primary/40'}`}
                    style={{ width: `${(r.score / maxScore) * 100}%` }}
                  />
                </div>
                <span className={`font-mono text-[11px] w-8 text-right ${isTarget ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>{r.score.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Commentary */}
      <div className="p-3 border-l-[3px] border-primary bg-accent-area rounded-sm">
        <p className="text-[12px] text-muted-foreground leading-[1.7]">{peer.commentary}</p>
      </div>
    </SectionWrapper>
  );
};

export default PeerComparison;
