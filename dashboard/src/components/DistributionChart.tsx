import React from 'react';
import { useDistributionMetrics } from '../hooks/useRealtimeData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

interface DistributionChartProps {
  detailed?: boolean;
}

export function DistributionChart({ detailed = false }: DistributionChartProps) {
  const { 
    balances, 
    giniCoefficient, 
    holderCategories, 
    concentrationMetrics,
    isLoading 
  } = useDistributionMetrics();

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-800 rounded"></div>
      </div>
    );
  }

  // Prepare data for pie chart
  const pieData = holderCategories ? [
    { name: 'Whales (Top 1%)', value: holderCategories.whales.length, color: '#FF6B6B' },
    { name: 'Dolphins (Top 10%)', value: holderCategories.dolphins.length, color: '#4ECDC4' },
    { name: 'Shrimp (Rest)', value: holderCategories.shrimp.length, color: '#45B7D1' },
  ] : [];

  // Prepare data for concentration bar chart
  const concentrationData = concentrationMetrics ? [
    { metric: 'Top 1%', value: concentrationMetrics.top1PercentShare },
    { metric: 'Top 10%', value: concentrationMetrics.top10PercentShare },
    { metric: 'Bottom 90%', value: 100 - concentrationMetrics.top10PercentShare },
  ] : [];

  // Calculate Gini interpretation
  const getGiniInterpretation = (gini: number) => {
    if (gini < 0.2) return { label: 'Very Equal', color: 'text-green-400' };
    if (gini < 0.4) return { label: 'Relatively Equal', color: 'text-blue-400' };
    if (gini < 0.6) return { label: 'Moderate Inequality', color: 'text-yellow-400' };
    if (gini < 0.8) return { label: 'High Inequality', color: 'text-orange-400' };
    return { label: 'Extreme Inequality', color: 'text-red-400' };
  };

  const giniInterpretation = getGiniInterpretation(giniCoefficient || 0);

  return (
    <div className={`bg-gray-900 rounded-lg p-6 border border-gray-800 ${detailed ? 'space-y-6' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Distribution Metrics</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="text-gray-400">Gini Coefficient: </span>
            <span className={`font-bold ${giniInterpretation.color}`}>
              {(giniCoefficient || 0).toFixed(3)}
            </span>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm ${
            giniCoefficient && giniCoefficient < 0.4 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {giniInterpretation.label}
          </div>
        </div>
      </div>

      <div className={`grid ${detailed ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
        {/* Holder Distribution Pie Chart */}
        <motion.div 
          className="bg-gray-800 rounded-lg p-4"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h3 className="text-lg font-semibold text-white mb-3">Holder Categories</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          {holderCategories && (
            <div className="mt-4 text-sm text-gray-400">
              Total Holders: <span className="text-white font-bold">{holderCategories.holderCount}</span>
            </div>
          )}
        </motion.div>

        {/* Concentration Bar Chart */}
        <motion.div 
          className="bg-gray-800 rounded-lg p-4"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h3 className="text-lg font-semibold text-white mb-3">Supply Concentration</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={concentrationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="metric" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Bar dataKey="value" fill="#FBBF24" />
            </BarChart>
          </ResponsiveContainer>
          {concentrationMetrics && (
            <div className="mt-4 text-sm text-gray-400">
              Nakamoto Coefficient: <span className="text-white font-bold">{concentrationMetrics.nakamotoCoefficient}</span>
            </div>
          )}
        </motion.div>
      </div>

      {detailed && (
        <>
          {/* Detailed Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div 
              className="bg-gray-800 rounded-lg p-4"
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-sm text-gray-400 mb-1">Equality Score</div>
              <div className="text-2xl font-bold text-green-400">
                {((1 - (giniCoefficient || 0)) * 100).toFixed(1)}%
              </div>
            </motion.div>

            <motion.div 
              className="bg-gray-800 rounded-lg p-4"
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-sm text-gray-400 mb-1">Whale Dominance</div>
              <div className="text-2xl font-bold text-red-400">
                {concentrationMetrics?.top1PercentShare.toFixed(1) || '0'}%
              </div>
            </motion.div>

            <motion.div 
              className="bg-gray-800 rounded-lg p-4"
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-sm text-gray-400 mb-1">Decentralization</div>
              <div className="text-2xl font-bold text-blue-400">
                {concentrationMetrics?.nakamotoCoefficient || '0'}
              </div>
            </motion.div>

            <motion.div 
              className="bg-gray-800 rounded-lg p-4"
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-sm text-gray-400 mb-1">Active Holders</div>
              <div className="text-2xl font-bold text-purple-400">
                {holderCategories?.holderCount || '0'}
              </div>
            </motion.div>
          </div>

          {/* Distribution Health Score */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Distribution Health Score</h3>
            <div className="relative">
              <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(1 - (giniCoefficient || 0)) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>Centralized</span>
                <span>Moderate</span>
                <span>Decentralized</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-400">
              The DIESEL collaborative distribution model promotes equality by splitting rewards 
              evenly among all participants, leading to a more decentralized token distribution.
            </p>
          </div>
        </>
      )}
    </div>
  );
}