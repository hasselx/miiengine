import { StockAnalysis } from "@/lib/stockData";

const ReportHeader = ({ data }: { data: StockAnalysis }) => (
  <div className="bg-ink text-cream px-[60px] pt-12 pb-9 relative overflow-hidden">
    <div className="absolute top-0 right-0 bottom-0 w-[40%]" style={{ background: 'linear-gradient(135deg, transparent 0%, rgba(201,168,76,0.08) 100%)' }} />
    <div className="flex justify-between items-start mb-8 relative z-10">
      <div>
        <p className="font-mono text-[10px] tracking-[3px] text-gold uppercase mb-1.5">Multi-Institutional Intelligence Engine</p>
        <h1 className="font-display text-[48px] font-black leading-none mb-1.5 tracking-tight">{data.company}</h1>
        <p className="text-[13px] text-[#aaa] font-light tracking-wide">{data.subtitle}</p>
        <p className="font-mono text-[10px] tracking-[2px] text-[#666] uppercase mt-2">{data.reportType}</p>
      </div>
      <div className="bg-gold text-ink font-mono text-[11px] font-semibold tracking-[2px] px-[18px] py-2 uppercase shrink-0">
        {data.verdictBadge}
      </div>
    </div>
    <div className="grid grid-cols-6 border-t border-[#333] pt-5 mt-4 relative z-10">
      {data.headerMetrics.map((m, i) => (
        <div key={i} className={`py-3 ${i < 5 ? 'border-r border-[#333] pr-5' : 'pl-5'} ${i > 0 && i < 5 ? 'pl-5' : ''}`}>
          <p className="font-mono text-[9px] tracking-[2px] text-[#666] uppercase mb-1">{m.label}</p>
          <p className="font-mono text-lg font-medium text-cream">{m.value}</p>
          <p className="text-[11px] text-gold">{m.change}</p>
        </div>
      ))}
    </div>
  </div>
);

export default ReportHeader;
