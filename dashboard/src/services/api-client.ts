import axios from 'axios';
import type { AxiosInstance } from 'axios';

// Create API client
const createAPIClient = (): AxiosInstance => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add API key if configured
  if (import.meta.env.VITE_API_KEY) {
    client.defaults.headers.common['X-API-Key'] = import.meta.env.VITE_API_KEY;
  }

  // Request interceptor for logging
  client.interceptors.request.use(
    (config) => {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error('API Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => {
      // Check for cache headers
      const cacheStatus = response.headers['x-cache'];
      if (cacheStatus) {
        console.log(`Cache ${cacheStatus} for ${response.config.url}`);
      }
      return response;
    },
    (error) => {
      if (error.response) {
        console.error(`API Error ${error.response.status}:`, error.response.data);
        
        // Handle rate limiting
        if (error.response.status === 429) {
          const retryAfter = error.response.data?.retryAfter || 60;
          console.warn(`Rate limited. Retry after ${retryAfter} seconds`);
        }
      } else if (error.request) {
        console.error('API No Response:', error.message);
      } else {
        console.error('API Error:', error.message);
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// Export singleton instance
export const apiClient = createAPIClient();

// API endpoints
export const API_ENDPOINTS = {
  // Alkanes proxy endpoints
  BLOCKCHAIN_INFO: '/api/alkanes/blockchain-info',
  PROTORUNES_BY_HEIGHT: (height: string) => `/api/alkanes/protorunes/${height}`,
  PROTORUNES_BY_ADDRESS: (address: string) => `/api/alkanes/address/${address}`,
  CURRENT_PARTICIPATION: '/api/alkanes/participation/current',
  PARTICIPATION_TRENDS: '/api/alkanes/participation/trends',
  
  // DIESEL specific endpoints
  DIESEL_STATS: '/api/diesel/stats',
  DIESEL_DISTRIBUTION: '/api/diesel/distribution',
  DIESEL_TVL: '/api/diesel/tvl',
  DIESEL_ALERTS: '/api/diesel/alerts',
  MINT_HISTORY: (address: string) => `/api/diesel/mint-history/${address}`,
  
  // Cache management
  INVALIDATE_CACHE: '/api/alkanes/cache/invalidate',
};

// Typed API responses
export interface BlockchainInfoResponse {
  success: boolean;
  data: {
    blocks: number;
    headers: number;
    bestblockhash: string;
    difficulty: number;
    mediantime: number;
    chainwork: string;
    chain: string;
  };
  timestamp: string;
}

export interface ParticipationResponse {
  success: boolean;
  data: {
    blockHeight: string;
    totalClaimants: number;
    rewardPerClaimant: string;
    totalDistributed: string;
    claimants?: any[];
    timestamp: string;
  };
}

export interface DieselStatsResponse {
  success: boolean;
  data: {
    currentBlock: string;
    genesisBlock: string;
    currentRewardPerBlock: string;
    nextHalvingBlock: string;
    blocksUntilHalving: string;
    circulatingSupply: string;
    maxSupply: string;
    remainingSupply: string;
    percentMinted: string;
  };
  timestamp: string;
}

export interface DistributionResponse {
  success: boolean;
  data: {
    totalHolders: number;
    giniCoefficient: number;
    top10Percent: string;
    top1Percent: string;
    median: string;
    average: string;
    categories: {
      [key: string]: {
        count: number;
        threshold: string;
        percentage: string;
      };
    };
  };
  timestamp: string;
}

export interface TVLResponse {
  success: boolean;
  data: {
    totalTVL: string;
    dieselLocked: string;
    bitcoinLocked: string;
    pools: Array<{
      pair: string;
      tvl: string;
      volume24h: string;
      apy: string;
      dieselAmount: string;
      btcAmount?: string;
      usdtAmount?: string;
    }>;
    priceUSD: string;
    priceBTC: string;
    priceChange24h: string;
  };
  timestamp: string;
}

export interface AlertsResponse {
  success: boolean;
  data: {
    alerts: Array<{
      type: string;
      severity: 'info' | 'warning' | 'error';
      message: string;
      blockHeight?: string;
      participants?: number;
      rewardPerClaimant?: string;
      blocksRemaining?: string;
      nextHalvingBlock?: string;
    }>;
    totalAlerts: number;
    currentBlock: string;
  };
  timestamp: string;
}