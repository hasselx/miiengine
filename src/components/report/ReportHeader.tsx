import { StockAnalysis } from "@/lib/stockData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Bookmark, Download, FileText, FileCode, Briefcase, Eye, Check } from "lucide-react";
import { useState, useRef } from "react";
import { useWatchlist } from "@/App";

const ReportHeader = ({ data, onToggleHoldings, holdingsOpen }: { data: StockAnalysis; onToggleHoldings?: () => void; holdingsOpen?: boolean }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [addedToWatchlist, setAddedToWatchlist] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const { setOpen: setWatchlistOpen } = useWatchlist();

  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const brandHeader = `<div style="border-bottom:2px solid #c9a84c;padding:24px 32px;background:#0a0a0a;display:flex;justify-content:space-between;align-items:center">
    <div><span style="font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:3px;color:#c9a84c;text-transform:uppercase">Multi-Institutional Intelligence Engine</span>
    <h1 style="font-family:'Playfair Display',serif;font-size:28px;font-weight:900;color:#f5f0e8;margin:4px 0 0">${data.company}</h1></div>
    <div style="text-align:right"><span style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#f5f0e8;opacity:0.5">${now}</span>
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:2px;color:#c9a84c;text-transform:uppercase;margin-top:4px;background:rgba(201,168,76,0.15);padding:4px 12px">${data.verdictBadge || ''}</div></div></div>`;
  const brandFooter = `<div style="border-top:2px solid #c9a84c;padding:16px 32px;background:#0a0a0a;display:flex;justify-content:space-between;align-items:center;margin-top:24px">
    <span style="font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:3px;color:#c9a84c;text-transform:uppercase">MII Engine — Confidential</span>
    <span style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:#f5f0e8;opacity:0.4">Generated ${now} · miiengine.lovable.app</span></div>
    <div style="padding:12px 32px;background:#0a0a0a;font-family:'IBM Plex Mono',monospace;font-size:8px;color:#f5f0e8;opacity:0.3;line-height:1.6">${data.disclaimer || 'This report is for informational purposes only and does not constitute financial advice.'}</div>`;

  const downloadHtml = () => {
    const reportEl = document.querySelector('[data-report-root]');
    if (!reportEl) return;
    const clone = reportEl.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('button, nav, .no-print, [data-sidebar]').forEach(el => el.remove());
    const inlineStyles = (source: Element, target: Element) => {
      const computed = window.getComputedStyle(source);
      const important = [
        'color','background-color','background','font-family','font-size','font-weight',
        'letter-spacing','text-transform','line-height','padding','margin','border',
        'border-top','border-bottom','border-left','border-right','border-radius',
        'display','flex-direction','justify-content','align-items','gap','grid-template-columns',
        'width','max-width','min-width','text-align','opacity','box-shadow','overflow',
        'white-space','word-break','flex','flex-wrap','flex-grow','flex-shrink',
        'position','top','right','bottom','left'
      ];
      let style = '';
      for (const prop of important) {
        const val = computed.getPropertyValue(prop);
        if (val && val !== '' && val !== 'none' && val !== 'normal' && val !== 'auto' && val !== '0px') {
          style += `${prop}:${val};`;
        }
      }
      (target as HTMLElement).setAttribute('style', style);
      const sourceChildren = source.children;
      const targetChildren = target.children;
      for (let i = 0; i < sourceChildren.length && i < targetChildren.length; i++) {
        inlineStyles(sourceChildren[i], targetChildren[i]);
      }
    };
    inlineStyles(reportEl, clone);
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${data.company} — MII Engine Report</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=IBM+Plex+Mono:wght@300;400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'IBM Plex Sans',system-ui,sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:0}
table{border-collapse:collapse;width:100%}
td,th{padding:8px 12px;border:1px solid #333;text-align:left;font-size:13px}
h1,h2,h3{font-family:'Playfair Display',serif}
img,svg{max-width:100%;height:auto}
@page{margin:0.5in}
@media print{body{background:white!important;color:black!important}}
</style>
</head><body>${brandHeader}<div style="max-width:1400px;margin:0 auto">${clone.innerHTML}</div>${brandFooter}</body></html>`;
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
    <div className="bg-sidebar text-sidebar-foreground px-3 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-6 sm:pb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 bottom-0 w-[40%]" style={{ background: 'linear-gradient(135deg, transparent 0%, rgba(201,168,76,0.08) 100%)' }} />

      {/* Top section: company info + actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start mb-6 sm:mb-8 relative z-10 gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[3px] text-sidebar-primary uppercase mb-1.5">Multi-Institutional Intelligence Engine</p>
          <h1 className="font-display text-2xl sm:text-4xl lg:text-[48px] font-black leading-none mb-1.5 tracking-tight">{data.company}</h1>
          <p className="text-[12px] sm:text-[13px] text-sidebar-foreground/50 font-light tracking-wide break-words">{data.subtitle}</p>
          <p className="font-mono text-[10px] tracking-[2px] text-sidebar-foreground/30 uppercase mt-2">{data.reportType}</p>
        </div>

        {/* Action buttons — horizontal row on mobile */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-2 shrink-0 flex-wrap">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground font-mono text-[11px] font-semibold tracking-[2px] px-[18px] py-2 uppercase rounded">
            {data.verdictBadge}
          </div>
          <button
            onClick={handleSaveSearch}
            disabled={saved}
            className="flex items-center gap-1.5 font-mono text-[10px] tracking-[1px] text-sidebar-foreground/50 hover:text-sidebar-primary transition-colors disabled:text-sidebar-primary p-2 touch-target"
          >
            <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">{saved ? "Saved" : "Save"}</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setShowDownload(!showDownload)}
              className="flex items-center gap-1.5 font-mono text-[10px] tracking-[1px] text-sidebar-foreground/50 hover:text-sidebar-primary transition-colors p-2 touch-target"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
            {showDownload && (
              <div className="absolute right-0 top-full mt-1 bg-sidebar border border-sidebar-border rounded shadow-lg z-50 min-w-[140px]">
                <button
                  onClick={downloadPdf}
                  className="flex items-center gap-2 w-full px-3 py-3 font-mono text-[11px] tracking-[1px] text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors touch-target"
                >
                  <FileText className="h-4 w-4" /> Save as PDF
                </button>
                <button
                  onClick={downloadHtml}
                  className="flex items-center gap-2 w-full px-3 py-3 font-mono text-[11px] tracking-[1px] text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors touch-target"
                >
                  <FileCode className="h-4 w-4" /> Save as HTML
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onToggleHoldings}
            className={`flex items-center gap-1.5 font-mono text-[10px] tracking-[1px] transition-colors p-2 touch-target ${holdingsOpen ? 'text-sidebar-primary' : 'text-sidebar-foreground/50 hover:text-sidebar-primary'}`}
          >
            <Briefcase className={`h-4 w-4 ${holdingsOpen ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">Holdings</span>
          </button>
        </div>
      </div>

      {/* Header metrics grid — 2 cols mobile, 3 cols tablet, 6 cols desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-t border-sidebar-border pt-4 sm:pt-5 mt-4 relative z-10 gap-3">
        {data.headerMetrics.map((m, i) => (
          <div key={i} className="py-2 sm:py-3 lg:border-r lg:last:border-r-0 border-sidebar-border lg:px-4 first:lg:pl-0 last:lg:pr-0">
            <p className="font-mono text-[9px] tracking-[2px] text-sidebar-foreground/40 uppercase mb-1">{m.label}</p>
            <p className="font-mono text-base sm:text-lg font-medium text-sidebar-foreground">{m.value}</p>
            <p className="text-[11px] text-sidebar-primary">{m.change}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportHeader;
