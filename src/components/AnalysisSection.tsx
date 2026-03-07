import { ReactNode } from "react";

interface AnalysisSectionProps {
  title: string;
  children: ReactNode;
}

const AnalysisSection = ({ title, children }: AnalysisSectionProps) => (
  <div className="bg-card border border-border rounded-sm">
    <div className="px-4 py-3 border-b border-border">
      <h3 className="font-mono text-xs font-semibold tracking-widest uppercase text-muted-foreground">{title}</h3>
    </div>
    <div className="p-4 text-sm leading-relaxed text-secondary-foreground">{children}</div>
  </div>
);

export default AnalysisSection;
