import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import SectionWrapper from "./SectionWrapper";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface FlowItem {
  symbol: string;
  label: string;
  category: 'region' | 'asset' | 'sector';
  price: number;
  change: number;
  volume: number;
  netFlow: number;
  direction: 'inflow' | 'outflow' | 'neutral';
}

const fmtFlow = (val: number): string => {
  const abs = Math.abs(val);
  if (abs >= 1e9) return `$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(abs / 1e6).toFixed(0)}M`;
  return `$${(abs / 1e3).toFixed(0)}K`;
};

const FlowTile = ({ item }: { item: FlowItem }) => {
  const isInflow = item.direction === 'inflow';
  const isOutflow = item.direction === 'outflow';

  const bgClass = isInflow
    ? 'bg-[hsl(var(--bull-light))]'
    : isOutflow
    ? 'bg-[hsl(var(--bear-light))]'
    : 'bg-accent';
  const borderClass = isInflow
    ? 'border-[hsl(var(--green-data))]'
    : isOutflow
    ? 'border-[hsl(var(--red-data))]'
    : 'border-border';
  const textClass = isInflow
    ? 'text-[hsl(var(--green-data))]'
    : isOutflow
    ? 'text-[hsl(var(--red-data))]'
    : 'text-muted-foreground';

  // Intensity: stronger color for bigger moves
  const intensity = Math.min(1, Math.abs(item.change) / 3);
  const opacityStyle = { opacity: 0.4 + intensity * 0.6 };

  return (
    <div className={`${bgClass} border ${borderClass} rounded-sm p-2.5 sm:p-3 transition-all`} style={opacityStyle}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[10px] tracking-[1px] uppercase text-muted-foreground truncate">{item.label}</span>
        {isInflow ? <TrendingUp className={`h-3 w-3 shrink-0 ${textClass}`} /> : isOutflow ? <TrendingDown className={`h-3 w-3 shrink-0 ${textClass}`} /> : <Minus className="h-3 w-3 shrink-0 text-muted-foreground" />}
      </div>
      <p className={`font-mono text-sm sm:text-base font-semibold ${textClass}`}>
        {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
      </p>
      <p className={`font-mono text-[10px] mt-0.5 ${textClass}`}>
        {isInflow ? '+' : isOutflow ? '−' : ''}{fmtFlow(item.netFlow)} {item.direction}
      </p>
      <p className="font-mono text-[9px] text-muted-foreground/60 mt-1">{item.symbol}</p>
    </div>
  );
};

const CategorySection = ({ title, items }: { title: string; items: FlowItem[] }) => {
  if (items.length === 0) return null;
  const totalFlow = items.reduce((s, i) => s + i.netFlow, 0);
  const netDir = totalFlow > 0 ? 'Net Inflow' : totalFlow < 0 ? 'Net Outflow' : 'Neutral';
  const netColor = totalFlow > 0 ? 'text-[hsl(var(--green-data))]' : totalFlow < 0 ? 'text-[hsl(var(--red-data))]' : 'text-muted-foreground';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono text-[9px] tracking-[3px] uppercase text-muted-foreground">{title}</p>
        <span className={`font-mono text-[10px] font-medium ${netColor}`}>{netDir}: {fmtFlow(totalFlow)}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {items.map(item => <FlowTile key={item.symbol} item={item} />)}
      </div>
    </div>
  );
};

interface CapitalFlowMapProps {
  currentSector?: string;
}

const CapitalFlowMap = ({ currentSector }: CapitalFlowMapProps) => {
  const [flows, setFlows] = useState<FlowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    const fetchFlows = async () => {
      try {
        setLoading(true);
        const { data, error: fnError } = await supabase.functions.invoke('fetch-capital-flows');
        if (fnError) throw fnError;
        if (data?.success && data.flows) {
          setFlows(data.flows);
          setLastUpdated(new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      } catch (e: any) {
        console.error('Capital flow fetch error:', e);
        setError('Capital flow data unavailable');
      } finally {
        setLoading(false);
      }
    };
    fetchFlows();
  }, []);

  const regions = flows.filter(f => f.category === 'region');
  const assets = flows.filter(f => f.category === 'asset');
  const sectors = flows.filter(f => f.category === 'sector');

  // Sector relevance note
  const matchingSector = currentSector
    ? sectors.find(s => s.label.toLowerCase().includes(currentSector.toLowerCase()))
    : null;

  return (
    <SectionWrapper num="" title="Global Capital Flow Map">
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-accent animate-pulse rounded-sm" />
          ))}
        </div>
      ) : error ? (
        <p className="text-[12px] text-muted-foreground py-4 text-center">{error}</p>
      ) : (
        <div className="space-y-5">
          <CategorySection title="Global Regions" items={regions} />
          <CategorySection title="Asset Classes" items={assets} />
          <CategorySection title="Equity Sectors" items={sectors} />

          {/* Sector relevance callout */}
          {matchingSector && (
            <div className={`p-2.5 border-l-[3px] rounded-sm text-[11px] sm:text-[12px] leading-relaxed ${
              matchingSector.direction === 'inflow'
                ? 'bg-[hsl(var(--bull-light))] border-[hsl(var(--green-data))] text-[hsl(var(--green-data))]'
                : matchingSector.direction === 'outflow'
                ? 'bg-[hsl(var(--bear-light))] border-[hsl(var(--red-data))] text-[hsl(var(--red-data))]'
                : 'bg-accent border-border text-muted-foreground'
            }`}>
              <strong>{matchingSector.label} sector:</strong> {matchingSector.direction === 'inflow' ? `+${fmtFlow(matchingSector.netFlow)} capital inflow — positive sector momentum` : matchingSector.direction === 'outflow' ? `${fmtFlow(matchingSector.netFlow)} capital outflow — sector headwind` : 'Minimal capital movement — neutral momentum'}
            </div>
          )}

          {lastUpdated && (
            <p className="font-mono text-[9px] text-muted-foreground/50 text-right">Last updated: {lastUpdated}</p>
          )}
        </div>
      )}
    </SectionWrapper>
  );
};

export default CapitalFlowMap;
