import { SMA, RSI, MACD } from 'technicalindicators';

export interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma10?: number;
  sma50?: number;
  sma200?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
}

export interface ComparableData {
  ticker: string;
  marketCap: number;
  ftmRev: number;
  mrqRevGrowth: number;
  ftmRevGrowth: number;
  ftmFcfMargin: number;
  evRevFtm: number;
  evFcfFtm: number;
}

// Helper to generate mock data if API fails
function generateMockChartData(days: number): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  let price = 150;
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const change = (Math.random() - 0.5) * 5;
    price += change;
    const open = price - Math.random() * 2;
    const high = price + Math.random() * 2;
    const low = price - Math.random() * 2;
    
    data.push({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close: price,
      volume: Math.floor(Math.random() * 1000000) + 500000,
    });
  }
  return data;
}

export async function fetchChartData(ticker: string, range: string = '1y'): Promise<ChartDataPoint[]> {
  try {
    // Try to fetch from Yahoo Finance via a CORS proxy
    // Using a common public proxy. In production, you'd want your own backend.
    const interval = range === '1d' ? '5m' : range === '5d' ? '15m' : '1d';
    const url = `https://corsproxy.io/?https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}&range=${range}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const json = await response.json();
    const result = json.chart.result[0];
    const quote = result.indicators.quote[0];
    const timestamps = result.timestamp;
    
    const data: ChartDataPoint[] = timestamps.map((t: number, i: number) => ({
      date: new Date(t * 1000).toISOString().split('T')[0],
      open: quote.open[i],
      high: quote.high[i],
      low: quote.low[i],
      close: quote.close[i],
      volume: quote.volume[i],
    })).filter((d: any) => d.close !== null); // Filter out nulls

    return calculateIndicators(data);
    
  } catch (error) {
    console.warn('Failed to fetch real data, using mock data', error);
    const mockData = generateMockChartData(range === '1mo' ? 30 : range === '3mo' ? 90 : 365);
    return calculateIndicators(mockData);
  }
}

function calculateIndicators(data: ChartDataPoint[]): ChartDataPoint[] {
  const closes = data.map(d => d.close);
  
  const sma10 = SMA.calculate({ period: 10, values: closes });
  const sma50 = SMA.calculate({ period: 50, values: closes });
  const sma200 = SMA.calculate({ period: 200, values: closes });
  const rsi = RSI.calculate({ period: 14, values: closes });
  const macd = MACD.calculate({ 
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  });

  // Align indicators with data
  // Indicators result arrays are shorter than input. 
  // e.g. SMA10 starts at index 9 (10th point)
  
  return data.map((point, index) => {
    const sma10Val = index >= 9 ? sma10[index - 9] : undefined;
    const sma50Val = index >= 49 ? sma50[index - 49] : undefined;
    const sma200Val = index >= 199 ? sma200[index - 199] : undefined;
    const rsiVal = index >= 14 ? rsi[index - 14] : undefined;
    const macdVal = index >= 25 ? macd[index - 25] : undefined; // MACD usually starts after slowPeriod - 1? No, it needs slowPeriod data points.

    return {
      ...point,
      sma10: sma10Val,
      sma50: sma50Val,
      sma200: sma200Val,
      rsi: rsiVal,
      macd: macdVal?.MACD,
      macdSignal: macdVal?.signal,
      macdHistogram: macdVal?.histogram,
    };
  });
}

export async function fetchComparableData(ticker: string): Promise<ComparableData> {
    // Mocking this for now as Yahoo Finance doesn't easily give FTM data via public free API
    // In a real app, you'd scrape or use a paid API like Financial Modeling Prep
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const randomFactor = 0.8 + Math.random() * 0.4;
    
    return {
        ticker: ticker.toUpperCase(),
        marketCap: 10000000000 * randomFactor * 10, // ~100B
        ftmRev: 5000000000 * randomFactor,
        mrqRevGrowth: 0.15 * randomFactor, // 15%
        ftmRevGrowth: 0.12 * randomFactor,
        ftmFcfMargin: 0.25 * randomFactor,
        evRevFtm: 8.5 * randomFactor,
        evFcfFtm: 35 * randomFactor,
    };
}
