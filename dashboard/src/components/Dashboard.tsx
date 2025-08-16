import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { MintMonitor } from './MintMonitor';
import { DistributionChart } from './DistributionChart';
import { TVLMonitor } from './TVLMonitor';
import { AlertPanel } from './AlertPanel';
import ConnectionChecker from './ConnectionChecker';
import { SyncStatusBanner, SyncStatusIndicator } from './SyncStatus';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Create a client with optimized settings for real-time data
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5000, // Consider data stale after 5 seconds
    },
  },
});

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'distribution' | 'tvl' | 'alerts'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'distribution', label: 'Distribution', icon: '🥧' },
    { id: 'tvl', label: 'TVL Analytics', icon: '💰' },
    { id: 'alerts', label: 'Alerts', icon: '🔔' },
  ];

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionChecker>
        <div className="min-h-screen bg-gray-950 text-white">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-gray-800 rounded transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                DIESEL Collaborative Distribution
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <SyncStatusIndicator />
              <div className="px-3 py-1 bg-green-900/30 border border-green-500 rounded-full text-sm">
                🔥 Mainnet Live
              </div>
              <div className="text-sm text-gray-400">
                Block Height: <span className="text-white font-mono">Loading...</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.aside
                initial={{ x: -250 }}
                animate={{ x: 0 }}
                exit={{ x: -250 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-64 bg-gray-900 border-r border-gray-800 min-h-screen"
              >
                <nav className="p-4">
                  <div className="space-y-2">
                    {tabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                          activeTab === tab.id
                            ? 'bg-yellow-500/20 text-yellow-400 border-l-4 border-yellow-400'
                            : 'hover:bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xl">{tab.icon}</span>
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-8 p-4 bg-gray-800 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Network Stats</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total Supply</span>
                        <span className="font-mono">21M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Circulating</span>
                        <span className="font-mono">0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Halving In</span>
                        <span className="font-mono">210,000</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <h3 className="text-sm font-semibold text-blue-400 mb-2">Alkanes Protocol</h3>
                    <p className="text-xs text-gray-400">
                      Connected to MAINNET RPC for real-time DIESEL distribution tracking
                    </p>
                  </div>
                </nav>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <SyncStatusBanner />
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <MintMonitor />
                    <DistributionChart />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TVLMonitor />
                    <AlertPanel />
                  </div>
                </motion.div>
              )}

              {activeTab === 'distribution' && (
                <motion.div
                  key="distribution"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DistributionChart detailed={true} />
                </motion.div>
              )}

              {activeTab === 'tvl' && (
                <motion.div
                  key="tvl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <TVLMonitor detailed={true} />
                </motion.div>
              )}

              {activeTab === 'alerts' && (
                <motion.div
                  key="alerts"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <AlertPanel detailed={true} />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* React Query Dev Tools */}
        <ReactQueryDevtools initialIsOpen={false} />
        </div>
      </ConnectionChecker>
    </QueryClientProvider>
  );
}