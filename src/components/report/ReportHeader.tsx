import { StockAnalysis } from "@/lib/stockData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Bookmark, Download, FileText, FileCode } from "lucide-react";
import { useState, useRef } from "react";

const ReportHeader = ({ data }: { data: StockAnalysis }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [showDownload, setShowDownload] = useState(false);

  const downloadHtml = () => {
    const reportEl = document.querySelector('[data-report-root]');
    if (!reportEl) return;
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${data.company} — MII Report</title>
<style>body{font-family:system-ui,sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:20px}
table{border-collapse:collapse;width:100%}td,th{padding:8px;border:1px solid #333;text-align:left;font-size:13px}
h1,h2,h3{margin-top:1.5em}.text-green{color:#22c55e}.text-red{color:#ef4444}</style>
</head><body>${reportEl.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.company.replace(/\s+/g, '_')}_MII_Report.html`;
    a.click();
    URL.revokeObjectURL(url);
    setShowDownload(false);
    toast({ title: "Downloaded", description: "HTML report saved." });
  };

  const downloadPdf = () => {
    setShowDownload(false);
    window.print();
  };

  const handleSaveSearch = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Create an account to save searches." });
      navigate("/auth");
      return;
    }
    try {
      const ticker = data.subtitle?.split('·')[2]?.trim() || data.company;
      const { error } = await supabase.from('saved_searches').insert({
        user_id: user.id,
        company_name: data.company,
        ticker,
        total_score: data.totalScore,
        verdict: data.verdict,
        report_data: data as any,
      });
      if (error) throw error;
      setSaved(true);
      toast({ title: "Search saved", description: `${data.company} added to your saved searches.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="bg-sidebar text-sidebar-foreground px-4 sm:px-8 pt-10 pb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 bottom-0 w-[40%]" style={{ background: 'linear-gradient(135deg, transparent 0%, rgba(201,168,76,0.08) 100%)' }} />
      <div className="flex flex-col sm:flex-row justify-between items-start mb-8 relative z-10 gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[3px] text-sidebar-primary uppercase mb-1.5">Multi-Institutional Intelligence Engine</p>
          <h1 className="font-display text-3xl sm:text-[48px] font-black leading-none mb-1.5 tracking-tight">{data.company}</h1>
          <p className="text-[13px] text-sidebar-foreground/50 font-light tracking-wide">{data.subtitle}</p>
          <p className="font-mono text-[10px] tracking-[2px] text-sidebar-foreground/30 uppercase mt-2">{data.reportType}</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground font-mono text-[11px] font-semibold tracking-[2px] px-[18px] py-2 uppercase rounded">
            {data.verdictBadge}
          </div>
          <button
            onClick={handleSaveSearch}
            disabled={saved}
            className="flex items-center gap-1.5 font-mono text-[10px] tracking-[1px] text-sidebar-foreground/50 hover:text-sidebar-primary transition-colors disabled:text-sidebar-primary"
          >
            <Bookmark className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />
            {saved ? "Saved" : "Save Search"}
          </button>
          <div className="relative">
            <button
              onClick={() => setShowDownload(!showDownload)}
              className="flex items-center gap-1.5 font-mono text-[10px] tracking-[1px] text-sidebar-foreground/50 hover:text-sidebar-primary transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
            {showDownload && (
              <div className="absolute right-0 top-full mt-1 bg-sidebar border border-sidebar-border rounded shadow-lg z-50 min-w-[140px]">
                <button
                  onClick={downloadPdf}
                  className="flex items-center gap-2 w-full px-3 py-2 font-mono text-[10px] tracking-[1px] text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                >
                  <FileText className="h-3 w-3" /> Save as PDF
                </button>
                <button
                  onClick={downloadHtml}
                  className="flex items-center gap-2 w-full px-3 py-2 font-mono text-[10px] tracking-[1px] text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                >
                  <FileCode className="h-3 w-3" /> Save as HTML
                </button>
              </div>
            )}
          </div>
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
};

export default ReportHeader;
