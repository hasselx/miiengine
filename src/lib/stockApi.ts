import { supabase } from "@/integrations/supabase/client";
import { PeerMetric } from "./stockData";

export interface StockRawData {
  quote: any;
  profile: any;
  statistics: any;
  timeSeries: any[];
  fundamentals: any | null;
}

export async function fetchStockData(symbol: string, exchange?: string): Promise<StockRawData> {
  const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
    body: { symbol, exchange },
  });

  if (error) throw new Error(error.message || 'Failed to fetch stock data');
  if (data.error) throw new Error(data.error);

  return data as StockRawData;
}

export async function fetchPeerData(symbol: string, industry: string, sector: string): Promise<PeerMetric[]> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-peer-data', {
      body: { symbol, industry, sector },
    });
    if (error || !data?.peers) return [];
    return data.peers as PeerMetric[];
  } catch {
    return [];
  }
}

// Map common country+company aliases to symbols
const SYMBOL_MAP: Record<string, { symbol: string; exchange: string }> = {
  // Indian stocks
  'paras defence': { symbol: 'PARAS', exchange: 'NSE' },
  'paras defence and space technologies': { symbol: 'PARAS', exchange: 'NSE' },
  'parasdefen': { symbol: 'PARAS', exchange: 'NSE' },
  'paras': { symbol: 'PARAS', exchange: 'NSE' },
  'reliance': { symbol: 'RELIANCE', exchange: 'NSE' },
  'reliance industries': { symbol: 'RELIANCE', exchange: 'NSE' },
  'tata motors': { symbol: 'TATAMOTORS', exchange: 'NSE' },
  'infosys': { symbol: 'INFY', exchange: 'NSE' },
  'tcs': { symbol: 'TCS', exchange: 'NSE' },
  'hdfc bank': { symbol: 'HDFCBANK', exchange: 'NSE' },
  'hdfc': { symbol: 'HDFCBANK', exchange: 'NSE' },
  'wipro': { symbol: 'WIPRO', exchange: 'NSE' },
  'sbi': { symbol: 'SBIN', exchange: 'NSE' },
  'state bank': { symbol: 'SBIN', exchange: 'NSE' },
  'state bank of india': { symbol: 'SBIN', exchange: 'NSE' },
  'icici bank': { symbol: 'ICICIBANK', exchange: 'NSE' },
  'icici': { symbol: 'ICICIBANK', exchange: 'NSE' },
  'bajaj finance': { symbol: 'BAJFINANCE', exchange: 'NSE' },
  'bharti airtel': { symbol: 'BHARTIARTL', exchange: 'NSE' },
  'airtel': { symbol: 'BHARTIARTL', exchange: 'NSE' },
  'grse': { symbol: 'GRSE', exchange: 'NSE' },
  'garden reach': { symbol: 'GRSE', exchange: 'NSE' },
  'hal': { symbol: 'HAL', exchange: 'NSE' },
  'hindustan aeronautics': { symbol: 'HAL', exchange: 'NSE' },
  'adani': { symbol: 'ADANIENT', exchange: 'NSE' },
  'adani enterprises': { symbol: 'ADANIENT', exchange: 'NSE' },
  'itc': { symbol: 'ITC', exchange: 'NSE' },
  'kotak': { symbol: 'KOTAKBANK', exchange: 'NSE' },
  'kotak mahindra': { symbol: 'KOTAKBANK', exchange: 'NSE' },
  'maruti': { symbol: 'MARUTI', exchange: 'NSE' },
  'maruti suzuki': { symbol: 'MARUTI', exchange: 'NSE' },
  'sun pharma': { symbol: 'SUNPHARMA', exchange: 'NSE' },
  'larsen': { symbol: 'LT', exchange: 'NSE' },
  'l&t': { symbol: 'LT', exchange: 'NSE' },
  'asian paints': { symbol: 'ASIANPAINT', exchange: 'NSE' },

  // Commodities / futures
  'brent crude': { symbol: 'BZ=F', exchange: 'NYM' },
  'brentcrude': { symbol: 'BZ=F', exchange: 'NYM' },

  // US stocks
  'apple': { symbol: 'AAPL', exchange: 'NASDAQ' },
  'apple inc': { symbol: 'AAPL', exchange: 'NASDAQ' },
  'microsoft': { symbol: 'MSFT', exchange: 'NASDAQ' },
  'tesla': { symbol: 'TSLA', exchange: 'NASDAQ' },
  'google': { symbol: 'GOOGL', exchange: 'NASDAQ' },
  'alphabet': { symbol: 'GOOGL', exchange: 'NASDAQ' },
  'amazon': { symbol: 'AMZN', exchange: 'NASDAQ' },
  'meta': { symbol: 'META', exchange: 'NASDAQ' },
  'nvidia': { symbol: 'NVDA', exchange: 'NASDAQ' },
  'netflix': { symbol: 'NFLX', exchange: 'NASDAQ' },
  'amd': { symbol: 'AMD', exchange: 'NASDAQ' },
};

function normalizeCompanyKey(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferCountry(exchange: string): string {
  const ex = exchange.toUpperCase();
  if (['NSE', 'BSE'].includes(ex)) return 'India';
  if (['LSE'].includes(ex)) return 'UK';
  if (['TSE'].includes(ex)) return 'Japan';
  if (['XETR'].includes(ex)) return 'Germany';
  return 'US';
}

function parseExplicitTicker(input: string): { symbol: string; exchange: string } | null {
  const raw = input.toUpperCase().replace(/\s+/g, '');
  if (!raw || !/^[A-Z0-9.=_-]{1,20}$/.test(raw)) return null;

  if (raw.endsWith('.NS')) return { symbol: raw.replace(/\.NS$/, ''), exchange: 'NSE' };
  if (raw.endsWith('.BO')) return { symbol: raw.replace(/\.BO$/, ''), exchange: 'BSE' };
  if (raw.includes('=F')) return { symbol: raw, exchange: 'NYM' };

  return { symbol: raw, exchange: 'NASDAQ' };
}

export function resolveSymbol(company: string): { symbol: string; exchange: string; country: string } {
  const normalized = normalizeCompanyKey(company);

  // 1) Exact alias match
  const exact = SYMBOL_MAP[normalized];
  if (exact) {
    return { ...exact, country: inferCountry(exact.exchange) };
  }

  // 2) Fuzzy alias match (handles inputs like "parasdefen")
  const compactInput = normalized.replace(/\s+/g, '');
  for (const [alias, mapped] of Object.entries(SYMBOL_MAP)) {
    const compactAlias = alias.replace(/\s+/g, '');
    if (compactAlias.length >= 4 && (compactInput.includes(compactAlias) || compactAlias.includes(compactInput))) {
      return { ...mapped, country: inferCountry(mapped.exchange) };
    }
  }

  // 3) User typed a ticker directly (supports .NS/.BO and =F)
  const parsed = parseExplicitTicker(company);
  if (parsed) {
    return { ...parsed, country: inferCountry(parsed.exchange) };
  }

  // 4) Final fallback
  const symbol = company.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9.=_-]/g, '').slice(0, 20);
  return { symbol: symbol || 'AAPL', exchange: 'NASDAQ', country: 'US' };
}
