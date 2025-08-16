/**
 * Chart Data Type Definitions
 * Optimized for Recharts with BigInt support
 */

// Time-based data point
export interface TimeSeriesDataPoint {
  timestamp: number;               // Unix timestamp (milliseconds)
  value: number;                   // Display value (converted from BigInt)
  rawValue?: bigint;              // Original BigInt value
  label?: string;                 // Optional label for tooltip
}

// TVL Chart Data
export interface TVLChartData {
  timestamp: number;               // Unix timestamp
  tvl: number;                     // TVL in BTC (display)
  tvlUSD: number;                  // TVL in USD
  tvlRaw: bigint;                 // TVL in satoshis (exact)
  poolCount: number;              // Number of active pools
  change?: number;                // Percentage change from previous
}

// Emission Chart Data
export interface EmissionChartData {
  blockHeight: number;             // Bitcoin block height
  date: Date;                      // Estimated or actual date
  totalSupply: number;             // Total supply (display)
  supplyRaw: bigint;              // Total supply (exact)
  emissionRate: number;           // Current emission rate (display)
  emissionRateRaw: bigint;        // Current emission rate (exact)
  halvingEpoch: number;           // Current halving epoch
  isHalving?: boolean;            // Mark halving blocks
  percentOfMax: number;           // Percentage of max supply
}

// Distribution Chart Data
export interface DistributionChartData {
  address: string;                 // Holder address (truncated for display)
  balance: number;                 // Balance in DIESEL (display)
  balanceRaw: bigint;             // Balance in base units (exact)
  percentage: number;              // Percentage of total supply
  rank: number;                   // Holder rank (1 = largest)
  label?: string;                 // Optional label (e.g., "Exchange", "Team")
}

// Block Metrics Chart Data
export interface BlockMetricsChartData {
  blockHeight: number;             // Bitcoin block height
  timestamp: number;               // Unix timestamp
  transactions: number;            // Number of transactions
  minters: number;                // Number of unique minters
  volume: number;                 // Volume in BTC (display)
  volumeRaw: bigint;              // Volume in satoshis (exact)
  fees: number;                   // Fees in BTC (display)
  feesRaw: bigint;                // Fees in satoshis (exact)
}

// Price Chart Data
export interface PriceChartData {
  timestamp: number;               // Unix timestamp
  open: number;                   // Opening price (sats per DIESEL)
  high: number;                   // High price
  low: number;                    // Low price
  close: number;                  // Closing price
  volume: number;                 // Volume in BTC (display)
  volumeRaw: bigint;              // Volume in satoshis (exact)
}

// Volume Chart Data
export interface VolumeChartData {
  timestamp: number;               // Unix timestamp
  period: string;                 // Period label (e.g., "1h", "24h")
  volume: number;                 // Volume in BTC (display)
  volumeRaw: bigint;              // Volume in satoshis (exact)
  txCount: number;                // Number of transactions
  uniqueAddresses: number;        // Unique addresses
}

// APR/APY Chart Data
export interface YieldChartData {
  timestamp: number;               // Unix timestamp
  poolId: string;                 // Pool identifier
  apr: number;                    // Annual percentage rate
  apy: number;                    // Annual percentage yield
  tvl: number;                    // Pool TVL (display)
  tvlRaw: bigint;                 // Pool TVL (exact)
  volume24h: number;              // 24h volume (display)
}

// Comparison Chart Data
export interface ComparisonChartData {
  label: string;                  // X-axis label
  diesel: number;                 // DIESEL metric value
  bitcoin: number;                // Bitcoin metric value
  ratio?: number;                 // DIESEL/Bitcoin ratio
}

// Aggregated Stats for Cards
export interface MetricCardData {
  title: string;                  // Metric title
  value: string;                  // Formatted display value
  rawValue: bigint | number;      // Raw value
  change24h?: number;             // 24-hour change percentage
  change7d?: number;              // 7-day change percentage
  sparkline?: TimeSeriesDataPoint[]; // Mini chart data
  unit?: string;                  // Unit label (e.g., "BTC", "USD", "%")
  precision?: number;             // Decimal precision for display
}

// Chart Timeframe Options
export enum ChartTimeframe {
  HOUR_1 = '1h',
  HOUR_24 = '24h',
  DAY_7 = '7d',
  DAY_30 = '30d',
  YEAR_1 = '1y',
  YEAR_5 = '5y',
  ALL = 'all'
}

// Chart Configuration
export interface ChartConfig {
  timeframe: ChartTimeframe;
  autoRefresh: boolean;
  refreshInterval: number;         // Milliseconds
  showGrid: boolean;
  showTooltip: boolean;
  showLegend: boolean;
  animate: boolean;
  responsive: boolean;
  theme: 'dark' | 'light';
}

// Data Aggregation Settings
export interface AggregationSettings {
  method: 'average' | 'sum' | 'min' | 'max' | 'last';
  interval: 'minute' | 'hour' | 'day' | 'week' | 'month';
  fillGaps: boolean;
  smoothing: boolean;
  decimation: boolean;
  maxPoints: number;               // Maximum data points to display
}

// Chart Export Format
export interface ChartExportData {
  title: string;
  description: string;
  timestamp: number;
  timeframe: ChartTimeframe;
  data: any[];                    // Generic chart data
  metadata: {
    source: string;
    version: string;
    blockHeight: number;
  };
}

// Utility function to prepare BigInt data for charts
export function prepareChartData<T extends { [key: string]: any }>(
  data: T[],
  bigIntFields: (keyof T)[]
): any[] {
  return data.map(item => {
    const processed: any = { ...item };
    bigIntFields.forEach(field => {
      if (typeof item[field] === 'bigint') {
        // Convert BigInt to number for display (may lose precision)
        processed[field] = Number(item[field] / 100_000_000n); // Convert sats to BTC
        processed[`${String(field)}Raw`] = item[field]; // Keep original
      }
    });
    return processed;
  });
}

// Decimation function for large datasets
export function decimateData(
  data: TimeSeriesDataPoint[],
  maxPoints: number
): TimeSeriesDataPoint[] {
  if (data.length <= maxPoints) return data;
  
  const step = Math.ceil(data.length / maxPoints);
  const decimated: TimeSeriesDataPoint[] = [];
  
  for (let i = 0; i < data.length; i += step) {
    decimated.push(data[i]);
  }
  
  // Always include the last point
  if (decimated[decimated.length - 1] !== data[data.length - 1]) {
    decimated.push(data[data.length - 1]);
  }
  
  return decimated;
}