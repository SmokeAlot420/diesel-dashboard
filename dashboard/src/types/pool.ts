/**
 * OYL AMM Pool Type Definitions
 * All amounts use bigint for precision
 * Follows constant product formula: x * y = k
 */

export interface PoolToken {
  id: bigint;                      // Token ID
  symbol: string;                   // Token symbol
  amount: bigint;                  // Amount in pool (base units)
  value: bigint;                   // Value in satoshis
  weight: number;                  // Weight in pool (0.5 for 50/50)
}

export interface AMMPool {
  id: string;                      // Pool identifier
  token0: PoolToken;               // First token in pair
  token1: PoolToken;               // Second token in pair
  lpTokenSupply: bigint;           // Total LP token supply
  constantProduct: bigint;         // k value (x * y = k)
  fee: number;                     // Trading fee (e.g., 0.003 for 0.3%)
  tvl: bigint;                     // Total value locked (satoshis)
  volume24h: bigint;               // 24-hour volume (satoshis)
  fees24h: bigint;                 // 24-hour fees collected (satoshis)
  apr: number;                     // Annual percentage rate
  lastUpdate: number;              // Last update block height
}

export interface LiquidityPosition {
  pool: string;                    // Pool ID
  owner: string;                   // Position owner address
  lpTokens: bigint;                // LP tokens held
  token0Deposited: bigint;         // Token 0 deposited (base units)
  token1Deposited: bigint;         // Token 1 deposited (base units)
  currentValue: bigint;            // Current position value (satoshis)
  impermanentLoss: number;         // IL percentage (negative = loss)
  unclaimedFees: bigint;           // Unclaimed trading fees (satoshis)
  entryBlock: number;              // Block when position was opened
}

export interface PoolSnapshot {
  poolId: string;                  // Pool identifier
  blockHeight: number;             // Block height of snapshot
  timestamp: number;               // Unix timestamp
  token0Reserve: bigint;           // Token 0 reserves (base units)
  token1Reserve: bigint;           // Token 1 reserves (base units)
  lpTokenSupply: bigint;           // Total LP tokens
  tvl: bigint;                     // TVL at snapshot (satoshis)
  price0: number;                  // Token 0 price (display only)
  price1: number;                  // Token 1 price (display only)
}

export interface SwapTransaction {
  txid: string;                    // Transaction ID
  poolId: string;                  // Pool where swap occurred
  blockHeight: number;             // Block height
  timestamp: number;               // Unix timestamp
  swapper: string;                 // Swapper address
  tokenIn: bigint;                 // Amount swapped in (base units)
  tokenOut: bigint;                // Amount received (base units)
  tokenInSymbol: string;           // Input token symbol
  tokenOutSymbol: string;          // Output token symbol
  fee: bigint;                     // Fee paid (base units)
  priceImpact: number;             // Price impact percentage
}

export interface PoolMetrics {
  poolId: string;                  // Pool identifier
  tvl: bigint;                     // Current TVL (satoshis)
  tvlChange24h: number;            // 24h TVL change percentage
  volume24h: bigint;               // 24h volume (satoshis)
  volume7d: bigint;                // 7d volume (satoshis)
  fees24h: bigint;                 // 24h fees (satoshis)
  fees7d: bigint;                  // 7d fees (satoshis)
  txCount24h: number;              // Number of transactions in 24h
  uniqueUsers24h: number;          // Unique users in 24h
  apr: number;                     // Current APR
  apy: number;                     // Current APY (compounded)
}

export interface TVLHistory {
  timestamp: number;               // Unix timestamp
  blockHeight: number;             // Block height
  tvl: bigint;                     // TVL at this point (satoshis)
  tvlUSD: number;                  // TVL in USD (display only)
  poolCount: number;               // Number of active pools
}

export interface DieselPoolInfo {
  poolId: string;                  // DIESEL pool identifier
  dieselReserve: bigint;           // DIESEL in pool (base units)
  btcReserve: bigint;              // BTC in pool (satoshis)
  dieselPrice: number;             // DIESEL price in sats (display)
  marketCap: bigint;               // Market cap (satoshis)
  liquidity: bigint;               // Total liquidity (satoshis)
  holders: number;                 // Number of LP token holders
}

// OYL AMM Constants
export const POOL_CONSTANTS = {
  STANDARD_FEE: 0.003,             // 0.3% trading fee
  MIN_LIQUIDITY: 1000n,            // Minimum liquidity (base units)
  PRICE_PRECISION: 18,             // Decimal precision for price calculations
} as const;

// Calculation helpers (pure functions, no side effects)
export function calculateConstantProduct(
  reserve0: bigint,
  reserve1: bigint
): bigint {
  return reserve0 * reserve1;
}

export function calculatePrice(
  reserve0: bigint,
  reserve1: bigint,
  decimals0: number = 8,
  decimals1: number = 8
): number {
  // For display only - converts to number for UI
  const adjustedReserve0 = Number(reserve0) / (10 ** decimals0);
  const adjustedReserve1 = Number(reserve1) / (10 ** decimals1);
  return adjustedReserve1 / adjustedReserve0;
}

export function calculateLPValue(
  lpTokens: bigint,
  totalSupply: bigint,
  poolTVL: bigint
): bigint {
  if (totalSupply === 0n) return 0n;
  return (lpTokens * poolTVL) / totalSupply;
}

export function calculateImpermanentLoss(
  initialPrice: number,
  currentPrice: number
): number {
  const priceRatio = currentPrice / initialPrice;
  const il = 2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1;
  return il * 100; // Return as percentage
}