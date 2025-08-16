/**
 * DIESEL Emission Calculator
 * Implements the EXACT formula from the DIESEL Genesis contract
 * Source: https://github.com/kungfuflex/alkanes-rs/blob/main/crates/alkanes-std-genesis-alkane/src/lib.rs
 * 
 * Formula: (50e8 as u128) / (1u128 << ((n as u128) / 210000u128))
 * Where n = blocks since genesis (800000)
 */

import { DIESEL_CONSTANTS } from '../types/diesel';
import type { EmissionSchedule, HalvingEvent, ProjectedSupply } from '../types/diesel';

export class DieselEmissionCalculator {
  private readonly GENESIS_BLOCK = DIESEL_CONSTANTS.GENESIS_BLOCK;
  private readonly LAUNCH_BLOCK = DIESEL_CONSTANTS.LAUNCH_BLOCK;
  private readonly HALVING_INTERVAL = DIESEL_CONSTANTS.HALVING_INTERVAL;
  private readonly INITIAL_REWARD = DIESEL_CONSTANTS.INITIAL_REWARD;
  private readonly MAX_SUPPLY = DIESEL_CONSTANTS.MAX_SUPPLY;
  
  /**
   * Calculate block reward using the EXACT formula from Genesis contract
   * @param blockHeight Current Bitcoin block height
   * @returns Block reward in base units (satoshis)
   */
  calculateBlockReward(blockHeight: bigint): bigint {
    // No rewards before genesis
    if (blockHeight < this.GENESIS_BLOCK) {
      return 0n;
    }
    
    // Calculate blocks since genesis
    const blocksSinceGenesis = blockHeight - this.GENESIS_BLOCK;
    
    // Calculate halving epoch (how many halvings have occurred)
    const halvingEpoch = blocksSinceGenesis / this.HALVING_INTERVAL;
    
    // EXACT formula from contract: (50e8) >> halvingEpoch
    // This is equivalent to: (50e8) / (1 << halvingEpoch)
    const reward = this.INITIAL_REWARD >> halvingEpoch;
    
    return reward;
  }
  
  /**
   * Calculate cumulative emission up to a given block
   * @param currentBlock Current Bitcoin block height
   * @returns Total DIESEL emitted in base units
   */
  calculateCumulativeEmission(currentBlock: bigint): bigint {
    if (currentBlock < this.GENESIS_BLOCK) {
      return 0n;
    }
    
    let totalEmission = 0n;
    let blockHeight = this.GENESIS_BLOCK;
    
    while (blockHeight <= currentBlock && totalEmission < this.MAX_SUPPLY) {
      const epochStart = blockHeight;
      const epochNumber = (blockHeight - this.GENESIS_BLOCK) / this.HALVING_INTERVAL;
      const nextHalving = this.GENESIS_BLOCK + ((epochNumber + 1n) * this.HALVING_INTERVAL);
      const epochEnd = nextHalving < currentBlock ? nextHalving : currentBlock + 1n;
      
      const blocksInEpoch = epochEnd - epochStart;
      const rewardPerBlock = this.INITIAL_REWARD >> epochNumber;
      const epochEmission = blocksInEpoch * rewardPerBlock;
      
      totalEmission += epochEmission;
      blockHeight = epochEnd;
      
      // Stop if we've reached max supply (shouldn't happen but good safety check)
      if (totalEmission > this.MAX_SUPPLY) {
        totalEmission = this.MAX_SUPPLY;
        break;
      }
    }
    
    return totalEmission;
  }
  
  /**
   * Calculate the premine amount (blocks 800000-880000)
   * @returns Premine amount in base units
   */
  calculatePremine(): bigint {
    const premineBlocks = this.LAUNCH_BLOCK - this.GENESIS_BLOCK;
    // All premine blocks are in epoch 0 (before first halving)
    return premineBlocks * this.INITIAL_REWARD;
  }
  
  /**
   * Get the next halving block
   * @param currentBlock Current Bitcoin block height
   * @returns Next halving block height
   */
  getNextHalvingBlock(currentBlock: bigint): bigint {
    if (currentBlock < this.GENESIS_BLOCK) {
      return this.GENESIS_BLOCK + this.HALVING_INTERVAL;
    }
    
    const blocksSinceGenesis = currentBlock - this.GENESIS_BLOCK;
    const currentEpoch = blocksSinceGenesis / this.HALVING_INTERVAL;
    const nextEpoch = currentEpoch + 1n;
    
    return this.GENESIS_BLOCK + (nextEpoch * this.HALVING_INTERVAL);
  }
  
  /**
   * Get current halving epoch
   * @param currentBlock Current Bitcoin block height
   * @returns Current epoch number (0-based)
   */
  getCurrentEpoch(currentBlock: bigint): number {
    if (currentBlock < this.GENESIS_BLOCK) {
      return -1; // Not yet started
    }
    
    const blocksSinceGenesis = currentBlock - this.GENESIS_BLOCK;
    const epoch = blocksSinceGenesis / this.HALVING_INTERVAL;
    
    return Number(epoch);
  }
  
  /**
   * Get emission schedule for all epochs
   * @param maxEpochs Maximum number of epochs to calculate (default: 32)
   * @returns Array of emission schedules
   */
  getEmissionSchedule(maxEpochs: number = 32): EmissionSchedule[] {
    const schedule: EmissionSchedule[] = [];
    let cumulativeEmission = 0n;
    
    for (let epoch = 0; epoch < maxEpochs; epoch++) {
      const startBlock = Number(this.GENESIS_BLOCK + BigInt(epoch) * this.HALVING_INTERVAL);
      const endBlock = Number(this.GENESIS_BLOCK + BigInt(epoch + 1) * this.HALVING_INTERVAL - 1n);
      const blockReward = this.INITIAL_REWARD >> BigInt(epoch);
      const totalEmission = this.HALVING_INTERVAL * blockReward;
      cumulativeEmission += totalEmission;
      
      // Stop if block reward becomes 0
      if (blockReward === 0n) {
        break;
      }
      
      schedule.push({
        epoch,
        startBlock,
        endBlock,
        blockReward,
        totalEmission,
        cumulativeEmission,
      });
    }
    
    return schedule;
  }
  
  /**
   * Get all halving events (past and future)
   * @param currentBlock Current Bitcoin block height
   * @param maxHalvings Maximum number of halvings to calculate
   * @returns Array of halving events
   */
  getHalvingEvents(currentBlock: number, maxHalvings: number = 10): HalvingEvent[] {
    const events: HalvingEvent[] = [];
    const currentBlockBigInt = BigInt(currentBlock);
    
    for (let epoch = 0; epoch < maxHalvings; epoch++) {
      const blockHeight = Number(this.GENESIS_BLOCK + BigInt(epoch) * this.HALVING_INTERVAL);
      const previousReward = epoch === 0 ? this.INITIAL_REWARD : this.INITIAL_REWARD >> BigInt(epoch - 1);
      const newReward = this.INITIAL_REWARD >> BigInt(epoch);
      
      // Estimate date based on 10 minutes per block
      const blocksFromNow = blockHeight - currentBlock;
      const minutesFromNow = blocksFromNow * 10;
      const date = new Date(Date.now() + minutesFromNow * 60 * 1000);
      
      events.push({
        epoch,
        blockHeight,
        date,
        previousReward,
        newReward,
        isCompleted: currentBlockBigInt >= BigInt(blockHeight),
      });
      
      // Stop if reward becomes 0
      if (newReward === 0n) {
        break;
      }
    }
    
    return events;
  }
  
  /**
   * Project future supply at specific dates
   * @param currentBlock Current Bitcoin block height
   * @param projectionMonths Number of months to project
   * @returns Array of projected supplies
   */
  projectSupply(currentBlock: number, projectionMonths: number): ProjectedSupply[] {
    const projections: ProjectedSupply[] = [];
    const currentSupply = this.calculateCumulativeEmission(BigInt(currentBlock));
    const blocksPerDay = 144; // Average: 6 blocks per hour * 24 hours
    const daysPerMonth = 30;
    
    for (let month = 0; month <= projectionMonths; month++) {
      const daysFromNow = month * daysPerMonth;
      const blocksFromNow = daysFromNow * blocksPerDay;
      const projectedBlock = currentBlock + blocksFromNow;
      const projectedSupply = this.calculateCumulativeEmission(BigInt(projectedBlock));
      const percentOfCap = Number((projectedSupply * 10000n) / this.MAX_SUPPLY) / 100;
      
      const date = new Date();
      date.setMonth(date.getMonth() + month);
      
      projections.push({
        date,
        blockHeight: projectedBlock,
        supply: projectedSupply,
        percentOfCap,
        halvingEpoch: this.getCurrentEpoch(BigInt(projectedBlock)),
      });
    }
    
    return projections;
  }
  
  /**
   * Calculate blocks until next halving
   * @param currentBlock Current Bitcoin block height
   * @returns Number of blocks until next halving
   */
  getBlocksUntilHalving(currentBlock: bigint): number {
    const nextHalving = this.getNextHalvingBlock(currentBlock);
    return Number(nextHalving - currentBlock);
  }
  
  /**
   * Estimate time until next halving
   * @param currentBlock Current Bitcoin block height
   * @returns Estimated time in milliseconds
   */
  getTimeUntilHalving(currentBlock: bigint): number {
    const blocksRemaining = this.getBlocksUntilHalving(currentBlock);
    const minutesRemaining = blocksRemaining * 10; // 10 minutes per block average
    return minutesRemaining * 60 * 1000; // Convert to milliseconds
  }
  
  /**
   * Verify emission calculations are correct
   * @returns true if calculations pass basic sanity checks
   */
  verifyEmissionIntegrity(): boolean {
    // Test known values
    const genesisReward = this.calculateBlockReward(this.GENESIS_BLOCK);
    if (genesisReward !== this.INITIAL_REWARD) {
      console.error('Genesis reward mismatch:', genesisReward, 'expected:', this.INITIAL_REWARD);
      return false;
    }
    
    // Test first halving
    const firstHalvingBlock = this.GENESIS_BLOCK + this.HALVING_INTERVAL;
    const firstHalvingReward = this.calculateBlockReward(firstHalvingBlock);
    const expectedFirstHalving = this.INITIAL_REWARD / 2n;
    if (firstHalvingReward !== expectedFirstHalving) {
      console.error('First halving reward mismatch:', firstHalvingReward, 'expected:', expectedFirstHalving);
      return false;
    }
    
    // Test premine calculation
    const premine = this.calculatePremine();
    const expectedPremine = (this.LAUNCH_BLOCK - this.GENESIS_BLOCK) * this.INITIAL_REWARD;
    if (premine !== expectedPremine) {
      console.error('Premine mismatch:', premine, 'expected:', expectedPremine);
      return false;
    }
    
    // Test that total emission approaches but doesn't exceed max supply
    const farFutureBlock = this.GENESIS_BLOCK + (this.HALVING_INTERVAL * 100n); // 100 halvings
    const totalEmission = this.calculateCumulativeEmission(farFutureBlock);
    if (totalEmission > this.MAX_SUPPLY) {
      console.error('Total emission exceeds max supply:', totalEmission, 'max:', this.MAX_SUPPLY);
      return false;
    }
    
    return true;
  }
}

// Export singleton instance
export const dieselEmissionCalculator = new DieselEmissionCalculator();