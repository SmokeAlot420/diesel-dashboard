import type { AlkaneId } from '../types/diesel';
import { DIESEL_CONSTANTS } from '../types/diesel';
import { AlkanesRPCService } from './alkanes-rpc-fixed';

export interface ClaimantData {
  address: string;
  blockHeight: bigint;
  amount: bigint;
  transactionId: string;
  timestamp: number;
}

export interface ParticipationData {
  blockHeight: bigint;
  totalClaimants: number;
  rewardPerClaimant: bigint;
  totalDistributed: bigint;
  timestamp: number;
}

export interface TrendData {
  blocks: ParticipationData[];
  averageParticipants: number;
  peakParticipants: number;
  minParticipants: number;
  totalUniqueAddresses: number;
}

export class MintTracker {
  private rpcService: AlkanesRPCService;

  constructor(rpcUrl?: string) {
    this.rpcService = new AlkanesRPCService(rpcUrl);
  }

  /**
   * Track claimants for a specific block
   * DIESEL uses collaborative distribution - rewards split equally
   */
  async getBlockClaimants(blockHeight: bigint): Promise<ClaimantData[]> {
    try {
      // Get all protorunes minted at this height
      const response = await this.rpcService.protorunesByHeight(blockHeight);
      
      if (!response || !Array.isArray(response.result)) {
        return [];
      }

      // Filter for DIESEL mints (ID from genesis)
      const dieselMints = response.result.filter(entry => {
        // Check if this is a DIESEL mint operation
        return entry.alkane_id?.toString() === DIESEL_CONSTANTS.GENESIS_BLOCK.toString();
      });

      // Transform to claimant data
      const claimants: ClaimantData[] = dieselMints.map(mint => ({
        address: mint.address || 'unknown',
        blockHeight,
        amount: BigInt(mint.amount || 0),
        transactionId: mint.txid || '',
        timestamp: mint.timestamp || Date.now()
      }));

      return claimants;
    } catch (error) {
      console.error('Error fetching block claimants:', error);
      return [];
    }
  }

  /**
   * Calculate equal reward distribution per claimant
   * This is the core of collaborative distribution
   */
  calculateRewardPerClaimant(blockReward: bigint, claimantCount: bigint): bigint {
    if (claimantCount === 0n) return 0n;
    
    // Equal split among all claimants
    return blockReward / claimantCount;
  }

  /**
   * Get participation trends over a range of blocks
   */
  async getParticipationTrends(
    startBlock: bigint, 
    endBlock: bigint
  ): Promise<TrendData> {
    const blocks: ParticipationData[] = [];
    const uniqueAddresses = new Set<string>();
    let totalParticipants = 0;
    let peakParticipants = 0;
    let minParticipants = Number.MAX_SAFE_INTEGER;

    // Iterate through block range
    for (let height = startBlock; height <= endBlock; height++) {
      const claimants = await this.getBlockClaimants(height);
      
      // Track unique addresses
      claimants.forEach(c => uniqueAddresses.add(c.address));
      
      // Calculate block reward (using emission calculator logic)
      const blocksSinceGenesis = height - DIESEL_CONSTANTS.GENESIS_BLOCK;
      const halvingEpoch = blocksSinceGenesis / DIESEL_CONSTANTS.HALVING_INTERVAL;
      const blockReward = DIESEL_CONSTANTS.INITIAL_REWARD >> halvingEpoch;
      
      const participantCount = claimants.length;
      const rewardPerClaimant = participantCount > 0 
        ? this.calculateRewardPerClaimant(blockReward, BigInt(participantCount))
        : 0n;

      blocks.push({
        blockHeight: height,
        totalClaimants: participantCount,
        rewardPerClaimant,
        totalDistributed: blockReward,
        timestamp: Date.now() // Would be actual block timestamp in production
      });

      // Update statistics
      totalParticipants += participantCount;
      peakParticipants = Math.max(peakParticipants, participantCount);
      if (participantCount > 0) {
        minParticipants = Math.min(minParticipants, participantCount);
      }
    }

    const blockCount = Number(endBlock - startBlock + 1n);
    
    return {
      blocks,
      averageParticipants: blockCount > 0 ? totalParticipants / blockCount : 0,
      peakParticipants,
      minParticipants: minParticipants === Number.MAX_SAFE_INTEGER ? 0 : minParticipants,
      totalUniqueAddresses: uniqueAddresses.size
    };
  }

  /**
   * Get real-time participation for current block
   */
  async getCurrentBlockParticipation(): Promise<ParticipationData | null> {
    try {
      // Get current block height from RPC
      const blockInfo = await this.rpcService.getBlockchainInfo();
      const currentHeight = BigInt(blockInfo.blocks || 0);
      
      const claimants = await this.getBlockClaimants(currentHeight);
      
      // Calculate current block reward
      const blocksSinceGenesis = currentHeight - DIESEL_CONSTANTS.GENESIS_BLOCK;
      const halvingEpoch = blocksSinceGenesis / DIESEL_CONSTANTS.HALVING_INTERVAL;
      const blockReward = DIESEL_CONSTANTS.INITIAL_REWARD >> halvingEpoch;
      
      const participantCount = claimants.length;
      const rewardPerClaimant = participantCount > 0
        ? this.calculateRewardPerClaimant(blockReward, BigInt(participantCount))
        : 0n;

      return {
        blockHeight: currentHeight,
        totalClaimants: participantCount,
        rewardPerClaimant,
        totalDistributed: blockReward,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error getting current block participation:', error);
      return null;
    }
  }

  /**
   * Check if treasury is claiming (for 50% cap enforcement)
   */
  async getTreasuryParticipation(blockHeight: bigint): Promise<bigint> {
    const claimants = await this.getBlockClaimants(blockHeight);
    
    // OYL treasury address would be configured
    const TREASURY_ADDRESS = import.meta.env.VITE_OYL_TREASURY_ADDRESS || '';
    
    const treasuryClaim = claimants.find(c => c.address === TREASURY_ADDRESS);
    if (treasuryClaim) {
      // Treasury gets fees capped at 50% of block reward
      const blocksSinceGenesis = blockHeight - DIESEL_CONSTANTS.GENESIS_BLOCK;
      const halvingEpoch = blocksSinceGenesis / DIESEL_CONSTANTS.HALVING_INTERVAL;
      const blockReward = DIESEL_CONSTANTS.INITIAL_REWARD >> halvingEpoch;
      const maxTreasuryReward = blockReward / 2n; // 50% cap
      
      return treasuryClaim.amount > maxTreasuryReward 
        ? maxTreasuryReward 
        : treasuryClaim.amount;
    }
    
    return 0n;
  }
}