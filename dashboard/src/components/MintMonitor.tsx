import React, { useEffect, useState } from 'react';
import { useRealtimeMints } from '../hooks/useRealtimeData';
import { formatBigInt } from '../utils/bigint-utils';
import { AnimatePresence, motion } from 'framer-motion';

export function MintMonitor() {
  const { currentParticipation, trends, isLoading, error, refetch } = useRealtimeMints();
  const [previousClaimants, setPreviousClaimants] = useState<number>(0);
  const [isIncreasing, setIsIncreasing] = useState(false);

  // Track changes for animations
  useEffect(() => {
    if (currentParticipation) {
      const newCount = currentParticipation.totalClaimants;
      setIsIncreasing(newCount > previousClaimants);
      setPreviousClaimants(newCount);
    }
  }, [currentParticipation?.totalClaimants]);

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-6 bg-gray-800 rounded w-full"></div>
          <div className="h-6 bg-gray-800 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
        <h3 className="text-xl font-bold text-red-400 mb-2">Connection Error</h3>
        <p className="text-gray-400">Unable to fetch mint data</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Live Mint Participation</h2>
        <motion.div
          animate={{ scale: isIncreasing ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 0.3 }}
          className={`px-3 py-1 rounded-full text-sm ${
            isIncreasing ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'
          }`}
        >
          Block #{currentParticipation?.blockHeight.toString() || '---'}
        </motion.div>
      </div>

      {currentParticipation && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Current Claimants */}
          <motion.div
            className="bg-gray-800 rounded-lg p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="text-sm text-gray-400 mb-1">Current Claimants</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentParticipation.totalClaimants}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="text-3xl font-bold text-white"
              >
                {currentParticipation.totalClaimants}
              </motion.div>
            </AnimatePresence>
            {trends && (
              <div className="text-xs text-gray-500 mt-2">
                Avg: {trends.averageParticipants.toFixed(1)}
              </div>
            )}
          </motion.div>

          {/* Reward Per Claimant */}
          <motion.div
            className="bg-gray-800 rounded-lg p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="text-sm text-gray-400 mb-1">Reward Per Claimant</div>
            <div className="text-3xl font-bold text-yellow-400">
              {formatBigInt(currentParticipation.rewardPerClaimant)}
            </div>
            <div className="text-xs text-gray-500 mt-2">DIESEL</div>
          </motion.div>

          {/* Total Distribution */}
          <motion.div
            className="bg-gray-800 rounded-lg p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="text-sm text-gray-400 mb-1">Block Reward</div>
            <div className="text-3xl font-bold text-blue-400">
              {formatBigInt(currentParticipation.totalDistributed)}
            </div>
            <div className="text-xs text-gray-500 mt-2">DIESEL Total</div>
          </motion.div>
        </div>
      )}

      {/* Participation Trends */}
      {trends && trends.blocks.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-3">Recent Blocks</h3>
          <div className="space-y-2">
            {trends.blocks.slice(-5).reverse().map((block, index) => (
              <motion.div
                key={block.blockHeight.toString()}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between bg-gray-800 rounded p-3"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-gray-500 text-sm">
                    #{block.blockHeight.toString()}
                  </span>
                  <span className="text-white">
                    {block.totalClaimants} participants
                  </span>
                </div>
                <div className="text-yellow-400 text-sm">
                  {formatBigInt(block.rewardPerClaimant)} each
                </div>
              </motion.div>
            ))}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-500">Peak</div>
              <div className="text-lg font-semibold text-green-400">
                {trends.peakParticipants}
              </div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-500">Minimum</div>
              <div className="text-lg font-semibold text-red-400">
                {trends.minParticipants}
              </div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-500">Average</div>
              <div className="text-lg font-semibold text-blue-400">
                {trends.averageParticipants.toFixed(1)}
              </div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-500">Unique Addresses</div>
              <div className="text-lg font-semibold text-purple-400">
                {trends.totalUniqueAddresses}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Indicator */}
      <div className="flex items-center justify-center mt-6 space-x-2">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-2 h-2 bg-green-500 rounded-full"
        />
        <span className="text-sm text-gray-400">Live Updates Active</span>
      </div>
    </div>
  );
}