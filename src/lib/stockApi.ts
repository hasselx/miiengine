import { supabase } from "@/integrations/supabase/client";

export interface StockRawData {
  quote: any;
  profile: any;
  statistics: any;
  timeSeries: any[];
}

export async function fetchStockData(symbol: string, exchange?: string): Promise<StockRawData> {
  const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
    body: { symbol, exchange },
  });

  if (error) throw new Error(error.message || 'Failed to fetch stock data');
  if (data.error) throw new Error(data.error);

  return data as StockRawData;
}

// Map common country+company to Twelve Data symbols
const SYMBOL_MAP: Record<string, { symbol: string; exchange: string }> = {
  'paras defence': { symbol: 'PARAS', exchange: 'NSE' },
  'paras defence and space technologies': { symbol: 'PARAS', exchange: 'NSE' },
  'apple': { symbol: 'AAPL', exchange: 'NASDAQ' },
  'apple inc': { symbol: 'AAPL', exchange: 'NASDAQ' },
  'microsoft': { symbol: 'MSFT', exchange: 'NASDAQ' },
  'reliance': { symbol: 'RELIANCE', exchange: 'NSE' },
  'reliance industries': { symbol: 'RELIANCE', exchange: 'NSE' },
  'tata motors': { symbol: 'TATAMOTORS', exchange: 'NSE' },
  'infosys': { symbol: 'INFY', exchange: 'NSE' },
  'tcs': { symbol: 'TCS', exchange: 'NSE' },
  'hdfc bank': { symbol: 'HDFCBANK', exchange: 'NSE' },
  'wipro': { symbol: 'WIPRO', exchange: 'NSE' },
  'tesla': { symbol: 'TSLA', exchange: 'NASDAQ' },
  'google': { symbol: 'GOOGL', exchange: 'NASDAQ' },
  'alphabet': { symbol: 'GOOGL', exchange: 'NASDAQ' },
  'amazon': { symbol: 'AMZN', exchange: 'NASDAQ' },
  'meta': { symbol: 'META', exchange: 'NASDAQ' },
  'nvidia': { symbol: 'NVDA', exchange: 'NASDAQ' },
};

export function resolveSymbol(company: string): { symbol: string; exchange: string; country: string } {
  const key = company.toLowerCase().trim();

  if (SYMBOL_MAP[key]) {
    const mapped = SYMBOL_MAP[key];
    const country = ['NSE', 'BSE'].includes(mapped.exchange) ? 'India' : 
                    ['LSE'].includes(mapped.exchange) ? 'UK' :
                    ['TSE'].includes(mapped.exchange) ? 'Japan' :
                    ['XETR'].includes(mapped.exchange) ? 'Germany' : 'US';
    return { ...mapped, country };
  }

  // Default: treat as US stock, use name as symbol
  const symbol = company.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z]/g, '').slice(0, 10);
  return { symbol, exchange: 'NASDAQ', country: 'US' };
}
