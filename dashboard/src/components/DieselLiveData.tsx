import { useState, useEffect } from 'react';
import { alkanesRpcFixed } from '../services/alkanes-rpc-fixed';
import { formatDiesel } from '../utils/bigint-utils';
import type { DieselToken } from '../types/diesel';

export function DieselLiveData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dieselInfo, setDieselInfo] = useState<DieselToken | null>(null);
  const [metashrewHeight, setMetashrewHeight] = useState<number>(0);

  useEffect(() => {
    fetchLiveData();
  }, []);

  const fetchLiveData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch DIESEL token info from mainnet
      console.log('Fetching DIESEL info from mainnet...');
      const diesel = await alkanesRpcFixed.getDieselInfo();
      setDieselInfo(diesel);
      
      // Get current blockchain height
      console.log('Fetching current block height...');
      const height = await alkanesRpcFixed.getMetashrewHeight();
      setMetashrewHeight(height);
      
      console.log('DIESEL Data:', diesel);
      console.log('Current Height:', height);
      
    } catch (err) {
      console.error('Error fetching live data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-alkanes-light rounded-lg p-6 border border-alkanes-lighter">
        <div className="flex items-center justify-center">
          <div className="loading-spinner"></div>
          <span className="ml-4 text-gray-400">Connecting to Bitcoin mainnet...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <h3 className="text-red-400 font-semibold mb-2">Connection Error</h3>
        <p className="text-sm">{error}</p>
        <button 
          onClick={fetchLiveData}
          className="mt-4 px-4 py-2 bg-diesel-500 text-black rounded hover:bg-diesel-400"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-alkanes-light rounded-lg p-6 border border-alkanes-lighter">
      <h2 className="text-2xl font-bold text-diesel-400 mb-6">
        🔴 LIVE MAINNET DATA
      </h2>
      
      {dieselInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-gray-400 text-sm mb-1">Token Name</h3>
            <p className="text-xl font-mono text-white">{dieselInfo.name}</p>
          </div>
          
          <div>
            <h3 className="text-gray-400 text-sm mb-1">Symbol</h3>
            <p className="text-xl font-mono text-white">{dieselInfo.symbol}</p>
          </div>
          
          <div>
            <h3 className="text-gray-400 text-sm mb-1">Total Supply</h3>
            <p className="text-xl font-mono text-diesel-400">
              {formatDiesel(dieselInfo.totalSupply, 2)}
            </p>
          </div>
          
          <div>
            <h3 className="text-gray-400 text-sm mb-1">Genesis Block</h3>
            <p className="text-xl font-mono text-white">
              {dieselInfo.genesis.toString()}
            </p>
          </div>
          
          <div>
            <h3 className="text-gray-400 text-sm mb-1">Current Minted</h3>
            <p className="text-xl font-mono text-diesel-400">
              {formatDiesel(dieselInfo.minted, 2)}
            </p>
          </div>
          
          <div>
            <h3 className="text-gray-400 text-sm mb-1">Maximum Supply</h3>
            <p className="text-xl font-mono text-white">
              {formatDiesel(dieselInfo.cap, 0)}
            </p>
          </div>
        </div>
      )}
      
      <div className="mt-6 pt-6 border-t border-alkanes-lighter">
        <p className="text-sm text-gray-400">
          Metashrew Height: <span className="text-diesel-400 font-mono">{metashrewHeight}</span>
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Connected to: {import.meta.env.VITE_ALKANES_RPC_URL}
        </p>
      </div>
    </div>
  );
}