import { ReactNode } from "react";

interface Props {
  num: string;
  title: string;
  score?: string;
  children: ReactNode;
}

const SectionWrapper = ({ num, title, score, children }: Props) => (
  <div className="bg-card border border-border rounded-md overflow-hidden">
    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-3.5 border-b border-border bg-accent-area">
      <span className="font-mono text-[11px] text-gold font-medium">{num}</span>
      <span className="font-mono text-[11px] sm:text-[12px] tracking-[2px] uppercase text-ink font-semibold truncate">{title}</span>
      {score && <span className="ml-auto font-mono text-[12px] sm:text-[14px] font-semibold text-ink shrink-0">{score}</span>}
    </div>
    <div className="p-3 sm:p-5">{children}</div>
  </div>
);

export default SectionWrapper;
