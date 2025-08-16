import React from 'react';
import { useRealtimeTVL } from '../hooks/useRealtimeData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { motion } from 'framer-motion';
import { formatBigInt } from '../utils/bigint-utils';

interface TVLMonitorProps {
  detailed?: boolean;
}

export function TVLMonitor({ detailed = false }: TVLMonitorProps) {
  const { tvl, historicalTVL, isLoading, error, refetch } = useRealtimeTVL();

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-32 bg-gray-800 rounded"></div>
          <div className="h-6 bg-gray-800 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
        <h3 className="text-xl font-bold text-red-400 mb-2">TVL Data Unavailable</h3>
        <p className="text-gray-400">Unable to fetch TVL data from OYL pools</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Mock data for demonstration - would come from actual TVL service
  const mockHistoricalData = [
    { time: '00:00', tvl: 100000, diesel: 50000, btc: 50000 },
    { time: '04:00', tvl: 120000, diesel: 60000, btc: 60000 },
    { time: '08:00', tvl: 150000, diesel: 75000, btc: 75000 },
    { time: '12:00', tvl: 180000, diesel: 90000, btc: 90000 },
    { time: '16:00', tvl: 200000, diesel: 100000, btc: 100000 },
    { time: '20:00', tvl: 220000, diesel: 110000, btc: 110000 },
    { time: 'Now', tvl: 250000, diesel: 125000, btc: 125000 },
  ];

  const pools = [
    { name: 'DIESEL/BTC', tvl: 125000n, apy: 45.2, volume24h: 50000n },
    { name: 'DIESEL/OYL', tvl: 75000n, apy: 62.8, volume24h: 30000n },
    { name: 'DIESEL/USDT', tvl: 50000n, apy: 38.5, volume24h: 20000n },
  ];

  const totalTVL = pools.reduce((sum, pool) => sum + pool.tvl, 0n);

  return (
    <div className={`bg-gray-900 rounded-lg p-6 border border-gray-800 ${detailed ? 'space-y-6' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">TVL Analytics</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="text-gray-400">Total TVL: </span>
            <span className="font-bold text-green-400">
              ${formatBigInt(totalTVL)}
            </span>
          </div>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 bg-green-500 rounded-full"
          />
        </div>
      </div>

      {/* TVL Chart */}
      <motion.div 
        className="bg-gray-800 rounded-lg p-4"
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <h3 className="text-lg font-semibold text-white mb-3">24h TVL Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={mockHistoricalData}>
            <defs>
              <linearGradient id="colorTvl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="time" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
              labelStyle={{ color: '#F3F4F6' }}
              formatter={(value: any) => `$${(value / 1000).toFixed(1)}k`}
            />
            <Area 
              type="monotone" 
              dataKey="tvl" 
              stroke="#10B981" 
              fillOpacity={1} 
              fill="url(#colorTvl)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Pool Breakdown */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">OYL AMM Pools</h3>
        {pools.map((pool, index) => (
          <motion.div
            key={pool.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <span className="text-yellow-400 font-bold">
                    {pool.name.split('/')[0][0]}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-white">{pool.name}</div>
                  <div className="text-sm text-gray-400">
                    24h Vol: ${formatBigInt(pool.volume24h)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-white">
                  ${formatBigInt(pool.tvl)}
                </div>
                <div className={`text-sm ${pool.apy > 50 ? 'text-green-400' : 'text-blue-400'}`}>
                  {pool.apy}% APY
                </div>
              </div>
            </div>
            
            {/* TVL Progress Bar */}
            <div className="mt-3">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${Number(pool.tvl * 100n / totalTVL)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {detailed && (
        <>
          {/* Detailed Pool Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pool Composition */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Pool Composition</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={mockHistoricalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="diesel" 
                    stackId="1"
                    stroke="#FBBF24" 
                    fill="#FBBF24" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="btc" 
                    stackId="1"
                    stroke="#F97316" 
                    fill="#F97316" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Liquidity Metrics */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Liquidity Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Liquidity</span>
                  <span className="text-xl font-bold text-white">${formatBigInt(totalTVL)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">24h Change</span>
                  <span className="text-lg font-semibold text-green-400">+15.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">7d Change</span>
                  <span className="text-lg font-semibold text-green-400">+42.8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Unique LPs</span>
                  <span className="text-lg font-semibold text-purple-400">1,234</span>
                </div>
              </div>
            </div>
          </div>

          {/* OYL Integration Status */}
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">OYL Protocol Integration</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">Active</div>
                <div className="text-sm text-gray-400">Status</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">3</div>
                <div className="text-sm text-gray-400">Active Pools</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">48.9%</div>
                <div className="text-sm text-gray-400">Avg APY</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">$100k</div>
                <div className="text-sm text-gray-400">24h Volume</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}