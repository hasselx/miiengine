interface VerdictBadgeProps {
  verdict: string;
  score: number;
  color: 'bull' | 'bear' | 'neutral';
}

const VerdictBadge = ({ verdict, score, color }: VerdictBadgeProps) => {
  const colorMap = {
    bull: "border-bull/40 bg-bull/10 text-bull",
    bear: "border-bear/40 bg-bear/10 text-bear",
    neutral: "border-neutral-data/40 bg-neutral-data/10 text-neutral-data",
  };

  return (
    <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-sm border ${colorMap[color]}`}>
      <span className="font-mono text-2xl font-black">{score}</span>
      <div className="w-px h-8 bg-current opacity-20" />
      <span className="font-mono text-sm font-bold tracking-wider uppercase">{verdict}</span>
    </div>
  );
};

export default VerdictBadge;
