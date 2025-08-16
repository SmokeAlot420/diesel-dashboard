import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { MintTracker, type ParticipationData, type ClaimantData } from '../services/mint-tracker';
import { DistributionMetrics, type TokenBalance } from '../services/distribution-metrics';

// Initialize services
const mintTracker = new MintTracker();
const distributionMetrics = new DistributionMetrics();

/**
 * Hook for real-time mint participation data
 * Uses TanStack Query with WebSocket invalidation
 */
export function useRealtimeMints() {
  const queryClient = useQueryClient();

  // Query for current block participation
  const { data: currentParticipation, isLoading, error } = useQuery({
    queryKey: ['mints', 'current'],
    queryFn: () => mintTracker.getCurrentBlockParticipation(),
    refetchInterval: 10000, // Poll every 10 seconds (Bitcoin block time ~10 min)
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  // Query for historical trends
  const { data: trends } = useQuery({
    queryKey: ['mints', 'trends'],
    queryFn: async () => {
      const currentBlock = currentParticipation?.blockHeight || 0n;
      const startBlock = currentBlock - 10n; // Last 10 blocks
      return mintTracker.getParticipationTrends(startBlock, currentBlock);
    },
    enabled: !!currentParticipation,
    staleTime: 30000, // Cache for 30 seconds
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!import.meta.env.VITE_WS_URL) return;

    const ws = new WebSocket(import.meta.env.VITE_WS_URL);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_block' || data.type === 'new_mint') {
        // Invalidate queries on new block or mint
        queryClient.invalidateQueries({ queryKey: ['mints'] });
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [queryClient]);

  return {
    currentParticipation,
    trends,
    isLoading,
    error,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['mints'] });
    }
  };
}

/**
 * Hook for real-time distribution metrics
 */
export function useDistributionMetrics() {
  const queryClient = useQueryClient();

  // Query for token balances
  const { data: balances, isLoading } = useQuery({
    queryKey: ['distribution', 'balances'],
    queryFn: async (): Promise<TokenBalance[]> => {
      // This would fetch from your RPC endpoint
      // For now, returning mock data structure
      return [];
    },
    staleTime: 60000, // Cache for 1 minute
    refetchInterval: 60000, // Refetch every minute
  });

  // Calculate Gini coefficient
  const { data: giniCoefficient } = useQuery({
    queryKey: ['distribution', 'gini'],
    queryFn: () => {
      if (!balances || balances.length === 0) return 0;
      const balanceValues = balances.map(b => b.balance);
      return distributionMetrics.calculateGiniCoefficient(balanceValues);
    },
    enabled: !!balances && balances.length > 0,
  });

  // Calculate holder categories
  const { data: holderCategories } = useQuery({
    queryKey: ['distribution', 'categories'],
    queryFn: () => {
      if (!balances) return null;
      return distributionMetrics.categorizeHolders(balances);
    },
    enabled: !!balances,
  });

  // Calculate concentration metrics
  const { data: concentrationMetrics } = useQuery({
    queryKey: ['distribution', 'concentration'],
    queryFn: () => {
      if (!balances) return null;
      return distributionMetrics.calculateConcentrationMetrics(balances);
    },
    enabled: !!balances,
  });

  return {
    balances,
    giniCoefficient,
    holderCategories,
    concentrationMetrics,
    isLoading,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['distribution'] });
    }
  };
}

/**
 * Hook for real-time TVL data
 */
export function useRealtimeTVL() {
  const queryClient = useQueryClient();

  const { data: tvl, isLoading, error } = useQuery({
    queryKey: ['tvl', 'current'],
    queryFn: async () => {
      // Fetch TVL from OYL AMM pools
      // This would integrate with OYL API
      return {
        totalTVL: 0n,
        pools: [],
        lastUpdated: Date.now()
      };
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000,
  });

  // Historical TVL for charts
  const { data: historicalTVL } = useQuery({
    queryKey: ['tvl', 'historical'],
    queryFn: async () => {
      // Fetch historical TVL data
      return [];
    },
    staleTime: 300000, // 5 minutes
  });

  return {
    tvl,
    historicalTVL,
    isLoading,
    error,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['tvl'] });
    }
  };
}

/**
 * Hook for real-time alert monitoring
 */
export function useRealtimeAlerts() {
  const queryClient = useQueryClient();
  const alertThreshold = BigInt(import.meta.env.VITE_ALERT_THRESHOLD || 1000);

  // Monitor for large claims
  const { data: alerts } = useQuery({
    queryKey: ['alerts', 'large-claims'],
    queryFn: async () => {
      const participation = await mintTracker.getCurrentBlockParticipation();
      if (!participation) return [];

      const alerts = [];
      if (participation.rewardPerClaimant > alertThreshold) {
        alerts.push({
          type: 'large_claim',
          message: `Large claim detected: ${participation.rewardPerClaimant} DIESEL per participant`,
          blockHeight: participation.blockHeight,
          timestamp: Date.now()
        });
      }

      return alerts;
    },
    refetchInterval: 10000, // Check every 10 seconds
  });

  // Treasury cap monitoring
  const { data: treasuryAlert } = useQuery({
    queryKey: ['alerts', 'treasury'],
    queryFn: async () => {
      const participation = await mintTracker.getCurrentBlockParticipation();
      if (!participation) return null;

      const treasuryAmount = await mintTracker.getTreasuryParticipation(participation.blockHeight);
      const maxAllowed = participation.totalDistributed / 2n; // 50% cap

      if (treasuryAmount >= maxAllowed) {
        return {
          type: 'treasury_cap',
          message: 'Treasury at 50% cap',
          amount: treasuryAmount,
          timestamp: Date.now()
        };
      }

      return null;
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  return {
    alerts: [...(alerts || []), ...(treasuryAlert ? [treasuryAlert] : [])],
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  };
}

/**
 * Hook for optimistic mint updates
 */
export function useOptimisticMint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mintData: { address: string; amount: bigint }) => {
      // This would submit the mint transaction
      // For now, simulating the API call
      return new Promise((resolve) => {
        setTimeout(() => resolve(mintData), 1000);
      });
    },
    onMutate: async (newMint) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['mints', 'current'] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<ParticipationData>(['mints', 'current']);

      // Optimistically update to the new value
      if (previousData) {
        queryClient.setQueryData(['mints', 'current'], {
          ...previousData,
          totalClaimants: previousData.totalClaimants + 1,
          rewardPerClaimant: previousData.totalDistributed / BigInt(previousData.totalClaimants + 1)
        });
      }

      return { previousData };
    },
    onError: (err, newMint, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['mints', 'current'], context.previousData);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['mints'] });
    }
  });
}