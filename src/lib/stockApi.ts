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
  // Indian stocks
  'paras defence': { symbol: 'PARAS', exchange: 'NSE' },
  'paras defence and space technologies': { symbol: 'PARAS', exchange: 'NSE' },
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
