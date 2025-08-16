import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import axios from 'axios';

const router = Router();

// DIESEL token constants
const DIESEL_CONSTANTS = {
  GENESIS_BLOCK: 871100n,
  INITIAL_REWARD: 10000n,
  HALVING_INTERVAL: 1008n,  // 1 week
  MAX_SUPPLY: 2100000000000000n,  // 21M with 8 decimals
  DECIMALS: 8,
};

// Helper to call Alkanes RPC
const alkanesClient = axios.create({
  baseURL: process.env.ALKANES_RPC_URL || 'http://alkanes.andr0x.com:18332',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

const callRPC = async (method: string, params: any[] = []) => {
  const response = await alkanesClient.post('/', {
    jsonrpc: '2.0',
    method,
    params,
    id: Date.now(),
  });
  return response.data.result;
};

// Get current DIESEL stats
router.get('/stats', asyncHandler(async (req, res) => {
  const blockInfo = await callRPC('getblockchaininfo');
  const currentHeight = BigInt(blockInfo.blocks || 0);
  
  // Calculate current emission
  const blocksSinceGenesis = currentHeight - DIESEL_CONSTANTS.GENESIS_BLOCK;
  const halvingEpoch = blocksSinceGenesis / DIESEL_CONSTANTS.HALVING_INTERVAL;
  const currentReward = DIESEL_CONSTANTS.INITIAL_REWARD >> halvingEpoch;
  
  // Calculate total minted
  let totalMinted = 0n;
  for (let epoch = 0n; epoch <= halvingEpoch; epoch++) {
    const epochReward = DIESEL_CONSTANTS.INITIAL_REWARD >> epoch;
    const epochBlocks = epoch === halvingEpoch 
      ? blocksSinceGenesis % DIESEL_CONSTANTS.HALVING_INTERVAL
      : DIESEL_CONSTANTS.HALVING_INTERVAL;
    totalMinted += epochReward * epochBlocks;
  }
  
  const circulatingSupply = totalMinted;
  const remainingSupply = DIESEL_CONSTANTS.MAX_SUPPLY - totalMinted;
  
  res.json({
    success: true,
    data: {
      currentBlock: currentHeight.toString(),
      genesisBlock: DIESEL_CONSTANTS.GENESIS_BLOCK.toString(),
      currentRewardPerBlock: currentReward.toString(),
      nextHalvingBlock: ((halvingEpoch + 1n) * DIESEL_CONSTANTS.HALVING_INTERVAL + DIESEL_CONSTANTS.GENESIS_BLOCK).toString(),
      blocksUntilHalving: (DIESEL_CONSTANTS.HALVING_INTERVAL - (blocksSinceGenesis % DIESEL_CONSTANTS.HALVING_INTERVAL)).toString(),
      circulatingSupply: circulatingSupply.toString(),
      maxSupply: DIESEL_CONSTANTS.MAX_SUPPLY.toString(),
      remainingSupply: remainingSupply.toString(),
      percentMinted: ((circulatingSupply * 10000n) / DIESEL_CONSTANTS.MAX_SUPPLY / 100n).toString(),
    },
    timestamp: new Date().toISOString(),
  });
}));

// Get distribution metrics
router.get('/distribution', asyncHandler(async (req, res) => {
  // This would fetch actual holder data from indexer
  // For now, returning mock structure
  const mockDistribution = {
    totalHolders: 1234,
    giniCoefficient: 0.42,
    top10Percent: '45.2',
    top1Percent: '12.8',
    median: '500',
    average: '1700',
    categories: {
      whales: { count: 12, threshold: '100000', percentage: '15.2' },
      large: { count: 89, threshold: '10000', percentage: '22.1' },
      medium: { count: 456, threshold: '1000', percentage: '35.4' },
      small: { count: 677, threshold: '100', percentage: '27.3' },
    },
  };
  
  res.json({
    success: true,
    data: mockDistribution,
    timestamp: new Date().toISOString(),
  });
}));

// Get TVL data
router.get('/tvl', asyncHandler(async (req, res) => {
  // This would integrate with OYL AMM API
  // For now, returning mock TVL data
  const mockTVL = {
    totalTVL: '2500000',  // $2.5M
    dieselLocked: '150000000',  // 1.5M DIESEL
    bitcoinLocked: '42.5',  // 42.5 BTC
    pools: [
      {
        pair: 'DIESEL/BTC',
        tvl: '1500000',
        volume24h: '250000',
        apy: '12.5',
        dieselAmount: '100000000',
        btcAmount: '25.5',
      },
      {
        pair: 'DIESEL/USDT',
        tvl: '1000000',
        volume24h: '180000',
        apy: '8.2',
        dieselAmount: '50000000',
        usdtAmount: '1000000',
      },
    ],
    priceUSD: '0.025',
    priceBTC: '0.0000006',
    priceChange24h: '+5.2',
  };
  
  res.json({
    success: true,
    data: mockTVL,
    timestamp: new Date().toISOString(),
  });
}));

// Get alerts
router.get('/alerts', asyncHandler(async (req, res) => {
  const threshold = BigInt(req.query.threshold || '1000');
  
  // Check current participation
  const blockInfo = await callRPC('getblockchaininfo');
  const currentHeight = BigInt(blockInfo.blocks || 0);
  const protorunes = await callRPC('protorunesbyheight', [currentHeight.toString()]);
  
  const dieselMints = protorunes?.result?.filter((entry: any) => {
    return entry.alkane_id?.toString() === '871100';
  }) || [];
  
  const participantCount = dieselMints.length;
  const blocksSinceGenesis = currentHeight - DIESEL_CONSTANTS.GENESIS_BLOCK;
  const halvingEpoch = blocksSinceGenesis / DIESEL_CONSTANTS.HALVING_INTERVAL;
  const blockReward = DIESEL_CONSTANTS.INITIAL_REWARD >> halvingEpoch;
  const rewardPerClaimant = participantCount > 0 ? blockReward / BigInt(participantCount) : 0n;
  
  const alerts = [];
  
  // Large claim alert
  if (rewardPerClaimant > threshold) {
    alerts.push({
      type: 'large_claim',
      severity: 'warning',
      message: `Large claim opportunity: ${rewardPerClaimant} DIESEL per participant`,
      blockHeight: currentHeight.toString(),
      participants: participantCount,
      rewardPerClaimant: rewardPerClaimant.toString(),
    });
  }
  
  // Low participation alert
  if (participantCount < 10 && participantCount > 0) {
    alerts.push({
      type: 'low_participation',
      severity: 'info',
      message: `Low participation: Only ${participantCount} claimants this block`,
      blockHeight: currentHeight.toString(),
      participants: participantCount,
    });
  }
  
  // Halving approaching alert
  const blocksUntilHalving = DIESEL_CONSTANTS.HALVING_INTERVAL - (blocksSinceGenesis % DIESEL_CONSTANTS.HALVING_INTERVAL);
  if (blocksUntilHalving < 144n) {  // Less than 1 day
    alerts.push({
      type: 'halving_soon',
      severity: 'info',
      message: `Halving in ${blocksUntilHalving} blocks (~${blocksUntilHalving / 6n} hours)`,
      blocksRemaining: blocksUntilHalving.toString(),
      nextHalvingBlock: ((halvingEpoch + 1n) * DIESEL_CONSTANTS.HALVING_INTERVAL + DIESEL_CONSTANTS.GENESIS_BLOCK).toString(),
    });
  }
  
  res.json({
    success: true,
    data: {
      alerts,
      totalAlerts: alerts.length,
      currentBlock: currentHeight.toString(),
    },
    timestamp: new Date().toISOString(),
  });
}));

// Get mint history for address
router.get('/mint-history/:address', asyncHandler(async (req, res) => {
  const { address } = req.params;
  const limit = parseInt(req.query.limit as string) || 100;
  
  // Fetch protorunes for this address
  const protorunes = await callRPC('protorunesbyaddress', [address]);
  
  // Filter for DIESEL mints
  const dieselHistory = protorunes?.result?.filter((entry: any) => {
    return entry.alkane_id?.toString() === '871100';
  }) || [];
  
  // Transform and limit results
  const history = dieselHistory.slice(0, limit).map((mint: any) => ({
    blockHeight: mint.block_height,
    amount: mint.amount,
    transactionId: mint.txid,
    timestamp: mint.timestamp || null,
    type: 'mint',
  }));
  
  res.json({
    success: true,
    data: {
      address,
      totalMints: dieselHistory.length,
      history,
    },
    timestamp: new Date().toISOString(),
  });
}));

export const dieselRouter = router;