import { StockAnalysis } from "@/lib/stockData";

const ReportHeader = ({ data }: { data: StockAnalysis }) => (
  <div className="bg-sidebar text-sidebar-foreground px-4 sm:px-8 pt-10 pb-8 relative overflow-hidden">
    <div className="absolute top-0 right-0 bottom-0 w-[40%]" style={{ background: 'linear-gradient(135deg, transparent 0%, rgba(201,168,76,0.08) 100%)' }} />
    <div className="flex flex-col sm:flex-row justify-between items-start mb-8 relative z-10 gap-3">
      <div>
        <p className="font-mono text-[10px] tracking-[3px] text-sidebar-primary uppercase mb-1.5">Multi-Institutional Intelligence Engine</p>
        <h1 className="font-display text-3xl sm:text-[48px] font-black leading-none mb-1.5 tracking-tight">{data.company}</h1>
        <p className="text-[13px] text-sidebar-foreground/50 font-light tracking-wide">{data.subtitle}</p>
        <p className="font-mono text-[10px] tracking-[2px] text-sidebar-foreground/30 uppercase mt-2">{data.reportType}</p>
      </div>
      <div className="bg-sidebar-primary text-sidebar-primary-foreground font-mono text-[11px] font-semibold tracking-[2px] px-[18px] py-2 uppercase shrink-0 rounded">
        {data.verdictBadge}
      </div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-t border-sidebar-border pt-5 mt-4 relative z-10 gap-3 sm:gap-0">
      {data.headerMetrics.map((m, i) => (
        <div key={i} className={`py-3 ${i < 5 ? 'sm:border-r border-sidebar-border sm:pr-5' : 'sm:pl-5'} ${i > 0 && i < 5 ? 'sm:pl-5' : ''}`}>
          <p className="font-mono text-[9px] tracking-[2px] text-sidebar-foreground/40 uppercase mb-1">{m.label}</p>
          <p className="font-mono text-lg font-medium text-sidebar-foreground">{m.value}</p>
          <p className="text-[11px] text-sidebar-primary">{m.change}</p>
        </div>
      ))}
    </div>
  </div>
);

export default ReportHeader;
