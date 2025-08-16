export interface TokenBalance {
  address: string;
  balance: bigint;
  percentage: number;
}

export interface HolderCategories {
  whales: TokenBalance[];      // Top 1%
  dolphins: TokenBalance[];     // Top 10%
  shrimp: TokenBalance[];       // Everyone else
  totalSupply: bigint;
  holderCount: number;
}

export interface ParticipantAnalysis {
  firstTimeMinters: string[];
  veteranMinters: string[];
  totalParticipants: number;
  newParticipantRate: number;
}

export class DistributionMetrics {
  /**
   * Calculate Gini coefficient for distribution equality
   * 0 = perfect equality, 1 = perfect inequality
   */
  calculateGiniCoefficient(balances: bigint[]): number {
    if (balances.length === 0) return 0;
    if (balances.length === 1) return 0;

    // Sort balances in ascending order
    const sortedBalances = [...balances].sort((a, b) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });

    // Calculate total
    const total = sortedBalances.reduce((sum, balance) => sum + balance, 0n);
    if (total === 0n) return 0;

    // Calculate Gini using the formula:
    // G = (2 * Σ(i * xi)) / (n * Σxi) - (n + 1) / n
    let weightedSum = 0n;
    for (let i = 0; i < sortedBalances.length; i++) {
      weightedSum += BigInt(i + 1) * sortedBalances[i];
    }

    const n = BigInt(sortedBalances.length);
    const numerator = 2n * weightedSum;
    const denominator = n * total;
    
    // Convert to number for final calculation (safe for coefficient 0-1)
    const giniRatio = Number(numerator * 10000n / denominator) / 10000;
    const adjustment = Number(n + 1n) / Number(n);
    
    const gini = giniRatio - adjustment;
    
    // Ensure result is between 0 and 1
    return Math.max(0, Math.min(1, gini));
  }

  /**
   * Categorize holders by their balance percentile
   */
  categorizeHolders(balances: TokenBalance[]): HolderCategories {
    if (balances.length === 0) {
      return {
        whales: [],
        dolphins: [],
        shrimp: [],
        totalSupply: 0n,
        holderCount: 0
      };
    }

    // Sort by balance descending
    const sorted = [...balances].sort((a, b) => {
      if (a.balance > b.balance) return -1;
      if (a.balance < b.balance) return 1;
      return 0;
    });

    const totalSupply = sorted.reduce((sum, holder) => sum + holder.balance, 0n);
    
    // Calculate percentages
    sorted.forEach(holder => {
      holder.percentage = totalSupply > 0n 
        ? Number(holder.balance * 10000n / totalSupply) / 100
        : 0;
    });

    // Categorize by position
    const top1PercentIndex = Math.ceil(sorted.length * 0.01);
    const top10PercentIndex = Math.ceil(sorted.length * 0.1);

    return {
      whales: sorted.slice(0, top1PercentIndex),
      dolphins: sorted.slice(top1PercentIndex, top10PercentIndex),
      shrimp: sorted.slice(top10PercentIndex),
      totalSupply,
      holderCount: sorted.length
    };
  }

  /**
   * Analyze participant history - first-timers vs veterans
   */
  async analyzeParticipantHistory(
    addresses: string[],
    historicalParticipants: Set<string>
  ): Promise<ParticipantAnalysis> {
    const firstTimeMinters: string[] = [];
    const veteranMinters: string[] = [];

    for (const address of addresses) {
      if (historicalParticipants.has(address)) {
        veteranMinters.push(address);
      } else {
        firstTimeMinters.push(address);
        // Add to historical set for future checks
        historicalParticipants.add(address);
      }
    }

    const totalParticipants = addresses.length;
    const newParticipantRate = totalParticipants > 0
      ? (firstTimeMinters.length / totalParticipants) * 100
      : 0;

    return {
      firstTimeMinters,
      veteranMinters,
      totalParticipants,
      newParticipantRate
    };
  }

  /**
   * Calculate distribution concentration metrics
   */
  calculateConcentrationMetrics(balances: TokenBalance[]): {
    top1PercentShare: number;
    top10PercentShare: number;
    nakamotoCoefficient: number;
  } {
    if (balances.length === 0) {
      return {
        top1PercentShare: 0,
        top10PercentShare: 0,
        nakamotoCoefficient: 0
      };
    }

    // Sort by balance descending
    const sorted = [...balances].sort((a, b) => {
      if (a.balance > b.balance) return -1;
      if (a.balance < b.balance) return 1;
      return 0;
    });

    const totalSupply = sorted.reduce((sum, holder) => sum + holder.balance, 0n);
    if (totalSupply === 0n) {
      return {
        top1PercentShare: 0,
        top10PercentShare: 0,
        nakamotoCoefficient: 0
      };
    }

    // Calculate top 1% share
    const top1PercentCount = Math.max(1, Math.ceil(sorted.length * 0.01));
    const top1PercentBalance = sorted
      .slice(0, top1PercentCount)
      .reduce((sum, holder) => sum + holder.balance, 0n);
    const top1PercentShare = Number(top1PercentBalance * 10000n / totalSupply) / 100;

    // Calculate top 10% share
    const top10PercentCount = Math.max(1, Math.ceil(sorted.length * 0.1));
    const top10PercentBalance = sorted
      .slice(0, top10PercentCount)
      .reduce((sum, holder) => sum + holder.balance, 0n);
    const top10PercentShare = Number(top10PercentBalance * 10000n / totalSupply) / 100;

    // Calculate Nakamoto Coefficient
    // (minimum number of entities needed to control 51% of supply)
    let cumulativeBalance = 0n;
    let nakamotoCoefficient = 0;
    const threshold = totalSupply / 2n; // 51% threshold

    for (const holder of sorted) {
      cumulativeBalance += holder.balance;
      nakamotoCoefficient++;
      if (cumulativeBalance > threshold) {
        break;
      }
    }

    return {
      top1PercentShare,
      top10PercentShare,
      nakamotoCoefficient
    };
  }

  /**
   * Calculate moving average of Gini coefficient
   */
  calculateMovingAverageGini(
    historicalGiniValues: number[],
    windowSize: number = 10
  ): number {
    if (historicalGiniValues.length === 0) return 0;
    
    const recentValues = historicalGiniValues.slice(-windowSize);
    const sum = recentValues.reduce((total, value) => total + value, 0);
    
    return sum / recentValues.length;
  }

  /**
   * Predict future distribution trends
   */
  predictDistributionTrend(
    historicalGiniValues: number[],
    periods: number = 5
  ): {
    trend: 'improving' | 'stable' | 'worsening';
    predictedGini: number;
  } {
    if (historicalGiniValues.length < 2) {
      return {
        trend: 'stable',
        predictedGini: historicalGiniValues[0] || 0.5
      };
    }

    // Calculate linear regression slope
    const n = historicalGiniValues.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((sum, x) => sum + x, 0);
    const sumY = historicalGiniValues.reduce((sum, y) => sum + y, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * historicalGiniValues[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict future value
    const predictedGini = Math.max(0, Math.min(1, 
      slope * (n + periods - 1) + intercept
    ));

    // Determine trend
    let trend: 'improving' | 'stable' | 'worsening';
    if (Math.abs(slope) < 0.001) {
      trend = 'stable';
    } else if (slope < 0) {
      trend = 'improving'; // Lower Gini = more equal
    } else {
      trend = 'worsening'; // Higher Gini = less equal
    }

    return {
      trend,
      predictedGini
    };
  }
}