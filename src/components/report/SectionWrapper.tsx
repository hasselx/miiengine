import { ReactNode } from "react";

interface Props {
  num: string;
  title: string;
  score?: string;
  children: ReactNode;
}

const SectionWrapper = ({ num, title, score, children }: Props) => (
  <div className="bg-card border border-border">
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-accent-area">
      <span className="font-mono text-[10px] text-gold font-medium">{num}</span>
      <span className="font-mono text-[11px] tracking-[2px] uppercase text-ink font-semibold">{title}</span>
      {score && <span className="ml-auto font-mono text-[13px] font-semibold text-ink">{score}</span>}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

export default SectionWrapper;
