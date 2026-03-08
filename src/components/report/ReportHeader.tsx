import { StockAnalysis, INVESTMENT_STYLES } from "@/lib/stockData";
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
          <p className="font-mono text-[10px] tracking-[2px] text-sidebar-foreground/30 uppercase mt-2">
            {data.reportType}
            {data.investmentStyle && (
              <span className={`ml-3 ${
                (() => {
                  switch (data.investmentStyle) {
                    case 'long_term': return 'text-[hsl(142,50%,45%)]';
                    case 'value': return 'text-[hsl(152,45%,42%)]';
                    case 'growth': return 'text-[hsl(170,40%,45%)]';
                    case 'swing_trader': return 'text-[hsl(45,70%,50%)]';
                    case 'short_term': return 'text-[hsl(25,70%,50%)]';
                    case 'intraday': return 'text-[hsl(0,65%,50%)]';
                    default: return 'text-sidebar-primary/70';
                  }
                })()
              }`}>
                · {INVESTMENT_STYLES.find(s => s.value === data.investmentStyle)?.label || data.investmentStyle}
              </span>
            )}
          </p>
        </div>

        {/* Compact action bar */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <div className={`font-mono text-[10px] sm:text-[11px] font-semibold tracking-[2px] px-3 sm:px-4 py-1.5 sm:py-2 uppercase rounded mr-1 text-white ${
            (() => {
              const v = data.verdictBadge?.toLowerCase() || '';
              if (v.includes('strong buy')) return 'bg-[hsl(142,60%,25%)]';
              if (v.includes('strong sell')) return 'bg-[hsl(0,70%,35%)]';
              if (v.includes('buy') && v.includes('accumulate')) return 'bg-[hsl(152,50%,32%)]';
              if (v.includes('hold') && v.includes('accumulate')) return 'bg-[hsl(160,40%,36%)]';
              if (v.includes('buy')) return 'bg-[hsl(142,45%,38%)]';
              if (v.includes('accumulate')) return 'bg-[hsl(170,40%,36%)]';
              if (v.includes('hold')) return 'bg-[hsl(45,60%,42%)]';
              if (v.includes('reduce')) return 'bg-[hsl(20,70%,42%)]';
              if (v.includes('sell')) return 'bg-[hsl(0,65%,40%)]';
              return 'bg-sidebar-primary text-sidebar-primary-foreground';
            })()
          }`}>
            {data.verdictBadge}
          </div>
          <div className="flex items-center gap-0.5 bg-sidebar-accent/30 border border-sidebar-border rounded-lg p-0.5">
            <button
              onClick={handleSaveSearch}
              disabled={saved}
              title={saved ? "Saved" : "Save Search"}
              className={`flex items-center gap-1.5 font-mono text-[10px] tracking-[1px] px-2.5 py-1.5 rounded-md transition-all ${
                saved
                  ? 'text-sidebar-primary bg-sidebar-primary/10'
                  : 'text-sidebar-foreground/50 hover:text-sidebar-primary hover:bg-sidebar-primary/10'
              }`}
            >
              <Bookmark className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{saved ? "Saved" : "Save"}</span>
            </button>
            <button
              onClick={async () => {
                if (!user) {
                  toast({ title: "Sign in required", description: "Create an account to use the watchlist." });
                  navigate("/auth");
                  return;
                }
                if (addedToWatchlist) return;
                const ticker = data.subtitle?.split('·')[2]?.trim() || data.company;
                const { error } = await supabase.from('watchlist').insert({
                  user_id: user.id,
                  ticker,
                  company_name: data.company,
                });
                if (error) {
                  toast({ title: error.message.includes("duplicate") ? "Already in watchlist" : "Error", description: error.message, variant: "destructive" });
                  if (error.message.includes("duplicate")) setAddedToWatchlist(true);
                } else {
                  setAddedToWatchlist(true);
                  toast({ title: "Added to Watchlist", description: `${data.company} is now in your watchlist.` });
                }
              }}
              disabled={addedToWatchlist}
              title={addedToWatchlist ? "Watching" : "Add to Watchlist"}
              className={`flex items-center gap-1.5 font-mono text-[10px] tracking-[1px] px-2.5 py-1.5 rounded-md transition-all ${
                addedToWatchlist
                  ? 'text-sidebar-primary bg-sidebar-primary/10'
                  : 'text-sidebar-foreground/50 hover:text-sidebar-primary hover:bg-sidebar-primary/10'
              }`}
            >
              {addedToWatchlist ? <Check className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{addedToWatchlist ? "Watching" : "Watch"}</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowDownload(!showDownload)}
                title="Download Report"
                className="flex items-center gap-1.5 font-mono text-[10px] tracking-[1px] text-sidebar-foreground/50 hover:text-sidebar-primary hover:bg-sidebar-primary/10 px-2.5 py-1.5 rounded-md transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>
              {showDownload && (
                <div className="absolute right-0 top-full mt-1 bg-sidebar border border-sidebar-border rounded-lg shadow-xl z-50 min-w-[140px] overflow-hidden">
                  <button
                    onClick={downloadPdf}
                    className="flex items-center gap-2 w-full px-3 py-2.5 font-mono text-[10px] tracking-[1px] text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" /> PDF
                  </button>
                  <button
                    onClick={downloadHtml}
                    className="flex items-center gap-2 w-full px-3 py-2.5 font-mono text-[10px] tracking-[1px] text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                  >
                    <FileCode className="h-3.5 w-3.5" /> HTML
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={onToggleHoldings}
              title="Holdings Analysis"
              className={`flex items-center gap-1.5 font-mono text-[10px] tracking-[1px] px-2.5 py-1.5 rounded-md transition-all ${
                holdingsOpen
                  ? 'text-sidebar-primary bg-sidebar-primary/10'
                  : 'text-sidebar-foreground/50 hover:text-sidebar-primary hover:bg-sidebar-primary/10'
              }`}
            >
              <Briefcase className={`h-3.5 w-3.5 ${holdingsOpen ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">Holdings</span>
            </button>
          </div>
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
