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

export function resolveSymbol(company: string, country: string): { symbol: string; exchange: string } {
  const key = company.toLowerCase().trim();

  if (SYMBOL_MAP[key]) return SYMBOL_MAP[key];

  // Try to guess exchange from country
  const countryExchange: Record<string, string> = {
    'india': 'NSE',
    'united states': 'NASDAQ',
    'us': 'NASDAQ',
    'usa': 'NASDAQ',
    'uk': 'LSE',
    'united kingdom': 'LSE',
    'japan': 'TSE',
    'germany': 'XETR',
    'china': 'SSE',
  };

  const exchange = countryExchange[country.toLowerCase().trim()] || '';

  // Use company name as symbol guess (uppercase, no spaces)
  const symbol = company.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z]/g, '').slice(0, 10);

  return { symbol, exchange };
}
