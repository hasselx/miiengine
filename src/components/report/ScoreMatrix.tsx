import { StockAnalysis } from "@/lib/stockData";
import SectionWrapper from "./SectionWrapper";

const ScoreMatrix = ({ data }: { data: StockAnalysis }) => {
  const getScoreColor = (score: number, max: number) => {
    const pct = (score / max) * 100;
    if (pct >= 80) return "text-green-data";
    if (pct >= 50) return "text-gold";
    return "text-red-data";
  };

  return (
    <SectionWrapper num="02" title="Multi-Factor Score Matrix" score={`Total: ${data.totalScore} / 100`}>
      <table className="w-full border-collapse">
        <tbody>
          {data.scores.map((s) => (
            <tr key={s.step} className="border-b border-border last:border-b-0">
              <td className="py-2.5 w-[45%]">
               <p className="text-[14px] font-semibold text-ink">Step {s.step} — {s.name}</p>
                <p className="text-[12px] text-muted-foreground">{s.subtitle}</p>
              </td>
              <td className="font-mono text-[11px] text-muted-foreground text-center w-[15%]">{s.weight}</td>
              <td className="w-[25%] px-3">
                <div className="h-1.5 bg-border rounded-sm overflow-hidden">
                  <div className="h-full bg-gold rounded-sm" style={{ width: `${(s.score / s.maxScore) * 100}%` }} />
                </div>
              </td>
              <td className={`font-mono text-sm font-semibold text-right w-[15%] ${getScoreColor(s.score, s.maxScore)}`}>
                {s.score} / {s.maxScore}
              </td>
            </tr>
          ))}
          {/* Total row */}
          <tr className="bg-accent-area">
            <td className="py-2.5 text-sm font-bold text-ink">TOTAL SCORE</td>
            <td></td>
            <td className="px-3">
              <div className="h-1.5 bg-border rounded-sm overflow-hidden">
                <div className="h-full bg-ink rounded-sm" style={{ width: `${data.totalScore}%` }} />
              </div>
            </td>
            <td className="font-mono text-lg font-semibold text-right text-ink">{data.totalScore} / 100</td>
          </tr>
        </tbody>
      </table>
    </SectionWrapper>
  );
};

export default ScoreMatrix;
