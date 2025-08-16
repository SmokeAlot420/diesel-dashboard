/**
 * DIESEL Token Type Definitions
 * CRITICAL: All cryptocurrency amounts MUST use bigint to prevent precision loss
 * Base units: 1 DIESEL = 100,000,000 base units (like Bitcoin satoshis)
 */

export interface DieselToken {
  id: bigint;                      // Token ID (genesis block 800000)
  name: string;                     // "DIESEL"
  symbol: string;                   // "DIESEL"
  totalSupply: bigint;             // Total minted (base units)
  cap: bigint;                     // Maximum supply cap (156,250,000,000,000 base units)
  minted: bigint;                  // Currently minted amount (base units)
  genesis: bigint;                 // Genesis block (800000n)
  launch: bigint;                  // Launch block (880000n)
}

export interface DieselMetrics {
  totalSupply: bigint;             // Total DIESEL minted (base units)
  circulatingSupply: bigint;       // Circulating supply (base units)
  premine: bigint;                 // Premine amount (880000-800000 blocks worth)
  blockHeight: number;             // Current Bitcoin block (safe as number < 2^53)
  emissionRate: bigint;            // Current emission per block (base units)
  halvingEpoch: number;            // Current halving epoch (0, 1, 2, etc.)
  nextHalvingBlock: number;        // Next halving block height
  blocksUntilHalving: number;      // Blocks remaining until next halving
  tvl: bigint;                     // Total value locked (satoshis)
  tvlUSD: number;                  // TVL in USD (display only, can lose precision)
}

export interface AlkaneToken {
  id: bigint;                      // Alkane ID (block number)
  name: string;                     // Token name
  symbol: string;                   // Token symbol
  totalSupply: bigint;             // Total supply (base units)
  cap?: bigint;                    // Supply cap if applicable
  minted?: bigint;                 // Amount minted so far
  decimals: number;                // Decimal places (8 for DIESEL)
  contractType: 'genesis' | 'standard' | 'custom';
}

export interface TokenBalance {
  address: string;                  // Bitcoin address
  tokenId: bigint;                 // Token ID
  amount: bigint;                  // Balance in base units
  percentage: number;              // % of total supply (display only)
  lastUpdated: number;             // Block height of last update
}

export interface TokenDistribution {
  top10Holders: TokenBalance[];    // Top 10 token holders
  top100Total: bigint;            // Total held by top 100 addresses
  uniqueHolders: number;           // Number of unique addresses holding token
  giniCoefficient: number;         // Distribution inequality measure (0-1)
  blockHeight: number;             // Block at which distribution was calculated
}

export interface EmissionSchedule {
  epoch: number;                   // Halving epoch (0, 1, 2, etc.)
  startBlock: number;              // Starting block of epoch
  endBlock: number;                // Ending block of epoch
  blockReward: bigint;             // Reward per block in this epoch (base units)
  totalEmission: bigint;           // Total emission in this epoch (base units)
  cumulativeEmission: bigint;      // Cumulative emission up to this epoch (base units)
}

export interface ProjectedSupply {
  date: Date;                      // Projection date
  blockHeight: number;             // Estimated block height
  supply: bigint;                  // Projected total supply (base units)
  percentOfCap: number;            // Percentage of max supply
  halvingEpoch: number;            // Halving epoch at this date
}

export interface MintActivity {
  blockHeight: number;             // Block where mint occurred
  txid: string;                    // Transaction ID
  minter: string;                  // Minter address
  amount: bigint;                  // Amount minted (base units)
  timestamp: number;               // Unix timestamp
}

export interface HalvingEvent {
  epoch: number;                   // Halving number (0 = genesis, 1 = first halving)
  blockHeight: number;             // Block height of halving
  date: Date;                      // Actual or projected date
  previousReward: bigint;          // Reward before halving (base units)
  newReward: bigint;               // Reward after halving (base units)
  isCompleted: boolean;            // Whether this halving has occurred
}

// Constants
export const DIESEL_CONSTANTS = {
  GENESIS_BLOCK: 800000n,
  LAUNCH_BLOCK: 880000n,
  HALVING_INTERVAL: 210000n,
  INITIAL_REWARD: 50n * 100_000_000n,  // 50 DIESEL in base units
  MAX_SUPPLY: 156_250_000_000_000n,    // Maximum supply in base units
  DECIMALS: 8,
  PREMINE_BLOCKS: 80000n,              // 880000 - 800000
} as const;

// Type guards
export function isDieselToken(token: AlkaneToken): token is DieselToken {
  return token.id === DIESEL_CONSTANTS.GENESIS_BLOCK;
}

export function isValidBigInt(value: unknown): value is bigint {
  return typeof value === 'bigint';
}

export function isValidTokenAmount(amount: bigint): boolean {
  return amount >= 0n && amount <= DIESEL_CONSTANTS.MAX_SUPPLY;
}