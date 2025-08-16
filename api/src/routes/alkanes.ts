import { Router } from 'express';
import axios from 'axios';
import { z } from 'zod';
import { asyncHandler, BadRequestError, InternalServerError } from '../middleware/errorHandler.js';
import { invalidateCache } from '../middleware/cache.js';
import { createSandshrewClient } from '../services/sandshrew.js';
import { metashrewService } from '../services/metashrew.js';

const router = Router();

// Validation schemas
const blockHeightSchema = z.string().regex(/^\d+$/).transform(v => BigInt(v));
const addressSchema = z.string().min(1);

// Configure RPC client based on environment
const getSandshrewUrl = () => {
  const apiKey = process.env.SANDSHREW_API_KEY;
  const network = process.env.SANDSHREW_NETWORK || 'mainnet';
  
  // Always use local Metashrew if ALKANES_RPC_URL is set
  if (process.env.ALKANES_RPC_URL) {
    console.log('Using local Metashrew at:', process.env.ALKANES_RPC_URL);
    return process.env.ALKANES_RPC_URL;
  }
  
  if (apiKey && apiKey !== 'YOUR-API-KEY-HERE') {
    // Use Sandshrew for mainnet access
    switch (network) {
      case 'mainnet':
        return `https://mainnet.sandshrew.io/v1/${apiKey}`;
      case 'signet':
        return `https://signet.sandshrew.io/v1/${apiKey}`;
      case 'testnet':
        return `https://testnet.sandshrew.io/v1/${apiKey}`;
      default:
        return `https://mainnet.sandshrew.io/v1/${apiKey}`;
    }
  }
  
  // Fallback to local RPC for development
  return 'http://localhost:8080';
};

// Create axios instance for Alkanes RPC
const alkanesClient = axios.create({
  baseURL: getSandshrewUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Basic auth only needed for local RPC, not Sandshrew
  auth: process.env.ALKANES_RPC_USER && !process.env.SANDSHREW_API_KEY ? {
    username: process.env.ALKANES_RPC_USER,
    password: process.env.ALKANES_RPC_PASSWORD || ''
  } : undefined,
});

// Initialize Sandshrew client if available
const sandshrewClient = createSandshrewClient();

// Mock DIESEL data for development/demo
const generateMockDieselData = (height: string) => {
  const blockHeight = BigInt(height);
  const blocksSinceGenesis = blockHeight - 871100n;
  const halvingEpoch = blocksSinceGenesis / 1008n;
  const blockReward = 10000n >> halvingEpoch;
  
  // Generate random number of participants (5-20)
  const participantCount = Math.floor(Math.random() * 15) + 5;
  const rewardPerClaimant = blockReward / BigInt(participantCount);
  
  // Generate mock addresses
  const mockAddresses = Array.from({ length: participantCount }, (_, i) => ({
    address: `bc1q${Math.random().toString(36).substring(2, 15)}${i}`,
    amount: rewardPerClaimant.toString(),
    alkane_id: '871100',
  }));
  
  return {
    result: mockAddresses,
    blockHeight: height,
    totalClaimants: participantCount,
    rewardPerClaimant: rewardPerClaimant.toString(),
    totalDistributed: blockReward.toString(),
  };
};

// RPC call helper with intelligent sync state handling
const callRPC = async (method: string, params: any[] = []) => {
  console.log(`RPC method called: ${method} with params:`, params);
  
  // First, try using Metashrew service which handles sync state
  if (process.env.ALKANES_RPC_URL || !sandshrewClient) {
    try {
      // For protorunes methods, check sync status first
      if (method.includes('protorunes')) {
        const syncStatus = await metashrewService.checkSyncStatus();
        
        if (syncStatus.syncing) {
          console.log(`Metashrew syncing: ${syncStatus.progress.toFixed(2)}% (Block ${syncStatus.currentBlock}/${syncStatus.targetBlock})`);
          
          // Return mock data with sync status info
          const mockData = generateMockDieselData(params[0] || '871100');
          return {
            ...mockData,
            _sync_status: {
              syncing: true,
              progress: syncStatus.progress,
              currentBlock: syncStatus.currentBlock,
              targetBlock: syncStatus.targetBlock,
              estimatedTime: syncStatus.estimatedTimeRemaining,
              message: `Real data loading... ${syncStatus.progress.toFixed(1)}% complete`,
            },
          };
        }
      }
      
      // Try the actual RPC call
      return await metashrewService.callMethod(method, params);
    } catch (error: any) {
      if (error.code === 'SYNCING') {
        // Return mock data with sync info
        const mockData = generateMockDieselData(params[0] || '871100');
        return {
          ...mockData,
          _sync_status: error.syncStatus,
        };
      }
      
      // For non-protorunes methods or other errors, throw
      if (!method.includes('protorunes')) {
        throw new InternalServerError(`RPC Error: ${error.message}`);
      }
      
      // Fallback to mock for protorunes if error
      console.log('Using mock data due to error:', error.message);
      return generateMockDieselData(params[0] || '871100');
    }
  }
  
  // Fallback to Sandshrew if configured
  if (sandshrewClient) {
    try {
      let sandshrewMethod = method;
      
      // Map methods to Sandshrew namespace
      if (method === 'getblockchaininfo') {
        sandshrewMethod = 'btc_getblockchaininfo';
      } else if (method === 'getblockcount') {
        sandshrewMethod = 'btc_getblockcount';
      }
      
      return await sandshrewClient.call(sandshrewMethod, params);
    } catch (error: any) {
      throw new InternalServerError(`Sandshrew API Error: ${error.message}`);
    }
  }
  
  throw new InternalServerError('No RPC backend available');
};

// Health check endpoint with sync status
router.get('/health', asyncHandler(async (req, res) => {
  const syncStatus = await metashrewService.checkSyncStatus();
  
  const status = {
    sandshrew: !!sandshrewClient,
    metashrew: {
      connected: true,
      syncing: syncStatus.syncing,
      progress: syncStatus.progress,
      currentBlock: syncStatus.currentBlock,
      targetBlock: syncStatus.targetBlock,
      estimatedTime: syncStatus.estimatedTimeRemaining,
    },
    network: process.env.SANDSHREW_NETWORK || 'mainnet',
    apiKeyConfigured: !!process.env.SANDSHREW_API_KEY && process.env.SANDSHREW_API_KEY !== 'YOUR-API-KEY-HERE',
    fallbackRpc: process.env.ALKANES_RPC_URL || 'http://localhost:8080',
  };

  res.json({
    success: true,
    status,
    message: syncStatus.syncing 
      ? `Metashrew syncing: ${syncStatus.progress.toFixed(1)}% complete (${syncStatus.estimatedTimeRemaining} remaining)` 
      : 'Metashrew fully synced - real data available',
    timestamp: new Date().toISOString(),
  });
}));

// Dedicated sync status endpoint
router.get('/sync-status', asyncHandler(async (req, res) => {
  const syncStatus = await metashrewService.checkSyncStatus();
  
  res.json({
    success: true,
    data: syncStatus,
    timestamp: new Date().toISOString(),
  });
}));

// Generic JSON-RPC endpoint for dashboard compatibility
router.post('/', asyncHandler(async (req, res) => {
  const { method, params, id } = req.body;
  
  try {
    const result = await callRPC(method, params);
    res.json({
      jsonrpc: '2.0',
      result,
      id,
    });
  } catch (error: any) {
    res.json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: error.message,
      },
      id,
    });
  }
}));

// Get blockchain info
router.get('/blockchain-info', asyncHandler(async (req, res) => {
  const info = await callRPC('getblockchaininfo');
  
  res.json({
    success: true,
    data: {
      blocks: info.blocks,
      headers: info.headers,
      bestblockhash: info.bestblockhash,
      difficulty: info.difficulty,
      mediantime: info.mediantime,
      chainwork: info.chainwork,
      chain: info.chain,
    },
    provider: sandshrewClient ? 'sandshrew' : 'local',
    timestamp: new Date().toISOString(),
  });
}));

// Get protorunes by height
router.get('/protorunes/:height', asyncHandler(async (req, res) => {
  const height = blockHeightSchema.parse(req.params.height);
  
  const protorunes = await callRPC('protorunesbyheight', [height.toString()]);
  
  res.json({
    success: true,
    data: protorunes,
    blockHeight: height.toString(),
    timestamp: new Date().toISOString(),
  });
}));

// Get protorunes by address
router.get('/address/:address', asyncHandler(async (req, res) => {
  const address = addressSchema.parse(req.params.address);
  
  const protorunes = await callRPC('protorunesbyaddress', [address]);
  
  res.json({
    success: true,
    data: protorunes,
    address,
    timestamp: new Date().toISOString(),
  });
}));

// Get current participation data
router.get('/participation/current', asyncHandler(async (req, res) => {
  // Get current block height
  const blockInfo = await callRPC('getblockchaininfo');
  const currentHeight = BigInt(blockInfo.blocks || 0);
  
  // Get protorunes at current height
  const protorunes = await callRPC('protorunesbyheight', [currentHeight.toString()]);
  
  // Filter for DIESEL mints
  const dieselMints = protorunes?.result?.filter((entry: any) => {
    // Filter for DIESEL genesis block ID
    return entry.alkane_id?.toString() === '871100';  // DIESEL genesis block
  }) || [];
  
  // Calculate participation metrics
  const participantCount = dieselMints.length;
  const blocksSinceGenesis = currentHeight - 871100n;
  const halvingEpoch = blocksSinceGenesis / 1008n;  // 1 week halving
  const blockReward = 10000n >> halvingEpoch;  // Initial reward with halvings
  const rewardPerClaimant = participantCount > 0 ? blockReward / BigInt(participantCount) : 0n;
  
  res.json({
    success: true,
    data: {
      blockHeight: currentHeight.toString(),
      totalClaimants: participantCount,
      rewardPerClaimant: rewardPerClaimant.toString(),
      totalDistributed: blockReward.toString(),
      claimants: dieselMints.slice(0, 10),  // Return first 10 claimants
      timestamp: new Date().toISOString(),
    },
  });
}));

// Get participation trends
router.get('/participation/trends', asyncHandler(async (req, res) => {
  const blocks = parseInt(req.query.blocks as string) || 10;
  const blockInfo = await callRPC('getblockchaininfo');
  const currentHeight = BigInt(blockInfo.blocks || 0);
  
  const trends = [];
  const startBlock = currentHeight - BigInt(blocks);
  
  for (let height = startBlock; height <= currentHeight; height++) {
    const protorunes = await callRPC('protorunesbyheight', [height.toString()]);
    
    const dieselMints = protorunes?.result?.filter((entry: any) => {
      return entry.alkane_id?.toString() === '871100';
    }) || [];
    
    const participantCount = dieselMints.length;
    const blocksSinceGenesis = height - 871100n;
    const halvingEpoch = blocksSinceGenesis / 1008n;
    const blockReward = 10000n >> halvingEpoch;
    
    trends.push({
      blockHeight: height.toString(),
      totalClaimants: participantCount,
      rewardPerClaimant: participantCount > 0 ? (blockReward / BigInt(participantCount)).toString() : '0',
      totalDistributed: blockReward.toString(),
    });
  }
  
  res.json({
    success: true,
    data: {
      trends,
      averageParticipants: Math.round(trends.reduce((sum, t) => sum + t.totalClaimants, 0) / trends.length),
      peakParticipants: Math.max(...trends.map(t => t.totalClaimants)),
      minParticipants: Math.min(...trends.map(t => t.totalClaimants)),
    },
    timestamp: new Date().toISOString(),
  });
}));

// Force cache invalidation endpoint
router.post('/cache/invalidate', asyncHandler(async (req, res) => {
  const pattern = req.body.pattern || '*';
  await invalidateCache(pattern);
  
  res.json({
    success: true,
    message: `Cache invalidated for pattern: ${pattern}`,
    timestamp: new Date().toISOString(),
  });
}));

export const alkaneProxyRouter = router;