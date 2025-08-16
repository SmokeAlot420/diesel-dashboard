import React, { useState } from 'react';
import { useRealtimeAlerts } from '../hooks/useRealtimeData';
import { motion, AnimatePresence } from 'framer-motion';
import { formatBigInt } from '../utils/bigint-utils';

interface AlertPanelProps {
  detailed?: boolean;
}

interface Alert {
  type: 'large_claim' | 'treasury_cap' | 'unusual_activity' | 'whale_movement';
  message: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'critical';
  blockHeight?: bigint;
  amount?: bigint;
}

export function AlertPanel({ detailed = false }: AlertPanelProps) {
  const { alerts, refetch } = useRealtimeAlerts();
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'info' | 'warning' | 'critical'>('all');

  // Mock alerts for demonstration
  const mockAlerts: Alert[] = [
    {
      type: 'large_claim',
      message: 'Large claim detected: 5000 DIESEL per participant',
      timestamp: Date.now() - 60000,
      severity: 'warning',
      blockHeight: 850000n,
      amount: 5000n
    },
    {
      type: 'treasury_cap',
      message: 'OYL Treasury approaching 50% cap',
      timestamp: Date.now() - 120000,
      severity: 'info',
      amount: 2500n
    },
    {
      type: 'unusual_activity',
      message: 'Spike in mint participation: 150% increase',
      timestamp: Date.now() - 180000,
      severity: 'warning'
    },
    {
      type: 'whale_movement',
      message: 'Large holder accumulated 10,000 DIESEL',
      timestamp: Date.now() - 240000,
      severity: 'critical',
      amount: 10000n
    }
  ];

  const allAlerts = [...(alerts || []), ...mockAlerts]
    .filter(alert => !dismissedAlerts.has(getAlertKey(alert)))
    .filter(alert => filterSeverity === 'all' || alert.severity === filterSeverity)
    .sort((a, b) => b.timestamp - a.timestamp);

  function getAlertKey(alert: Alert): string {
    return `${alert.type}-${alert.timestamp}`;
  }

  function dismissAlert(alert: Alert) {
    setDismissedAlerts(prev => new Set(prev).add(getAlertKey(alert)));
  }

  function getAlertIcon(type: Alert['type']) {
    switch (type) {
      case 'large_claim': return '💰';
      case 'treasury_cap': return '🏛️';
      case 'unusual_activity': return '📊';
      case 'whale_movement': return '🐋';
      default: return '🔔';
    }
  }

  function getSeverityColor(severity: Alert['severity']) {
    switch (severity) {
      case 'info': return 'border-blue-500 bg-blue-900/20 text-blue-400';
      case 'warning': return 'border-yellow-500 bg-yellow-900/20 text-yellow-400';
      case 'critical': return 'border-red-500 bg-red-900/20 text-red-400';
      default: return 'border-gray-500 bg-gray-900/20 text-gray-400';
    }
  }

  function getTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <div className={`bg-gray-900 rounded-lg p-6 border border-gray-800 ${detailed ? 'space-y-6' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Alert Center</h2>
        <div className="flex items-center space-x-3">
          {detailed && (
            <div className="flex space-x-2">
              {(['all', 'info', 'warning', 'critical'] as const).map(severity => (
                <button
                  key={severity}
                  onClick={() => setFilterSeverity(severity)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    filterSeverity === severity
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => refetch()}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Alert Summary */}
      {!detailed && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {allAlerts.filter(a => a.severity === 'info').length}
            </div>
            <div className="text-xs text-gray-400">Info</div>
          </div>
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {allAlerts.filter(a => a.severity === 'warning').length}
            </div>
            <div className="text-xs text-gray-400">Warnings</div>
          </div>
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-400">
              {allAlerts.filter(a => a.severity === 'critical').length}
            </div>
            <div className="text-xs text-gray-400">Critical</div>
          </div>
        </div>
      )}

      {/* Alert List */}
      <div className={`space-y-3 ${detailed ? '' : 'max-h-96 overflow-y-auto'}`}>
        <AnimatePresence>
          {allAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-400"
            >
              <div className="text-4xl mb-2">✨</div>
              <p>No active alerts</p>
              <p className="text-sm mt-1">System operating normally</p>
            </motion.div>
          ) : (
            allAlerts.slice(0, detailed ? undefined : 5).map((alert, index) => (
              <motion.div
                key={getAlertKey(alert)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{getAlertIcon(alert.type)}</span>
                    <div className="flex-1">
                      <div className="font-semibold mb-1">{alert.message}</div>
                      <div className="flex items-center space-x-4 text-sm opacity-75">
                        <span>{getTimeAgo(alert.timestamp)}</span>
                        {alert.blockHeight && (
                          <span>Block #{alert.blockHeight.toString()}</span>
                        )}
                        {alert.amount && (
                          <span>{formatBigInt(alert.amount)} DIESEL</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert)}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {detailed && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex space-x-3">
                        <button className="text-blue-400 hover:text-blue-300 transition-colors">
                          View Details
                        </button>
                        <button className="text-gray-400 hover:text-gray-300 transition-colors">
                          Configure Alert
                        </button>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        alert.severity === 'critical' ? 'bg-red-500/20' :
                        alert.severity === 'warning' ? 'bg-yellow-500/20' :
                        'bg-blue-500/20'
                      }`}>
                        {alert.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {detailed && (
        <>
          {/* Alert Configuration */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Alert Configuration</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Large Claim Threshold</div>
                  <div className="text-sm text-gray-400">Alert when reward per claimant exceeds</div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    defaultValue="1000"
                    className="w-24 px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                  <span className="text-gray-400">DIESEL</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Treasury Cap Warning</div>
                  <div className="text-sm text-gray-400">Alert when treasury approaches cap</div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    defaultValue="45"
                    className="w-24 px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                  <span className="text-gray-400">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Whale Movement</div>
                  <div className="text-sm text-gray-400">Alert on large accumulation</div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    defaultValue="5000"
                    className="w-24 px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                  <span className="text-gray-400">DIESEL</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Email Notifications</div>
                  <div className="text-sm text-gray-400">Send critical alerts via email</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
              </div>
            </div>

            <button className="mt-6 w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded transition-colors">
              Save Alert Settings
            </button>
          </div>
        </>
      )}
    </div>
  );
}