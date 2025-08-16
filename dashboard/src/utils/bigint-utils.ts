/**
 * Utility functions for handling BigInt values in the UI
 */

/**
 * Format a BigInt value for display with appropriate units
 * @param value - The BigInt value to format
 * @param decimals - Number of decimal places (default 2)
 * @returns Formatted string with appropriate units (K, M, B)
 */
export function formatBigInt(value: bigint, decimals: number = 2): string {
  if (value === 0n) return '0';

  // Convert to number for formatting (safe for display purposes)
  const num = Number(value);

  // Determine the appropriate unit
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(decimals)}B`;
  } else if (num >= 1e6) {
    return `${(num / 1e6).toFixed(decimals)}M`;
  } else if (num >= 1e3) {
    return `${(num / 1e3).toFixed(decimals)}K`;
  } else {
    return num.toLocaleString();
  }
}

/**
 * Format a BigInt as a percentage
 * @param value - The BigInt value (should be multiplied by 100)
 * @param decimals - Number of decimal places (default 2)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: bigint, decimals: number = 2): string {
  const percentage = Number(value) / 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Convert a BigInt satoshi value to BTC
 * @param satoshis - Value in satoshis
 * @param decimals - Number of decimal places (default 8)
 * @returns BTC value as string
 */
export function satoshisToBTC(satoshis: bigint, decimals: number = 8): string {
  const btc = Number(satoshis) / 1e8;
  return btc.toFixed(decimals);
}

/**
 * Parse a string to BigInt safely
 * @param value - String value to parse
 * @param defaultValue - Default value if parsing fails
 * @returns BigInt value
 */
export function parseBigInt(value: string, defaultValue: bigint = 0n): bigint {
  try {
    // Remove commas and spaces
    const cleaned = value.replace(/[,\s]/g, '');
    
    // Check if it's a valid number
    if (!/^-?\d+$/.test(cleaned)) {
      return defaultValue;
    }
    
    return BigInt(cleaned);
  } catch {
    return defaultValue;
  }
}

/**
 * Calculate percentage between two BigInt values
 * @param part - The part value
 * @param total - The total value
 * @param decimals - Number of decimal places (default 2)
 * @returns Percentage as number
 */
export function calculatePercentage(part: bigint, total: bigint, decimals: number = 2): number {
  if (total === 0n) return 0;
  
  // Multiply by 10000 for precision, then divide
  const percentage = (part * 10000n) / total;
  return Number(percentage) / 100;
}

/**
 * Compare two BigInt values and return comparison result
 * @param a - First value
 * @param b - Second value
 * @returns -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareBigInt(a: bigint, b: bigint): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Format BigInt with thousand separators
 * @param value - The BigInt value
 * @returns Formatted string with commas
 */
export function formatWithCommas(value: bigint): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Calculate min and max from array of BigInt values
 * @param values - Array of BigInt values
 * @returns Object with min and max
 */
export function getMinMax(values: bigint[]): { min: bigint; max: bigint } {
  if (values.length === 0) {
    return { min: 0n, max: 0n };
  }
  
  let min = values[0];
  let max = values[0];
  
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  
  return { min, max };
}

/**
 * Calculate sum of BigInt array
 * @param values - Array of BigInt values
 * @returns Sum as BigInt
 */
export function sumBigInt(values: bigint[]): bigint {
  return values.reduce((sum, value) => sum + value, 0n);
}

/**
 * Calculate average of BigInt array
 * @param values - Array of BigInt values
 * @returns Average as BigInt (rounded down)
 */
export function averageBigInt(values: bigint[]): bigint {
  if (values.length === 0) return 0n;
  const sum = sumBigInt(values);
  return sum / BigInt(values.length);
}

/**
 * Convert BigInt to hex string
 * @param value - BigInt value
 * @returns Hex string with 0x prefix
 */
export function bigintToHex(value: bigint): string {
  return '0x' + value.toString(16);
}

/**
 * Convert hex string to BigInt
 * @param hex - Hex string (with or without 0x prefix)
 * @returns BigInt value
 */
export function hexToBigint(hex: string): bigint {
  if (!hex) return 0n;
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  return BigInt('0x' + cleanHex);
}

/**
 * Format DIESEL token amount for display
 * @param value - DIESEL amount in smallest units
 * @param decimals - Number of decimal places
 * @returns Formatted string
 */
export function formatDiesel(value: bigint, decimals: number = 2): string {
  // DIESEL has 8 decimal places like Bitcoin
  const divisor = 10n ** 8n;
  const wholePart = value / divisor;
  const decimalPart = value % divisor;
  
  if (decimalPart === 0n) {
    return formatBigInt(wholePart, 0);
  }
  
  const decimalStr = decimalPart.toString().padStart(8, '0').slice(0, decimals);
  return `${formatBigInt(wholePart, 0)}.${decimalStr}`;
}