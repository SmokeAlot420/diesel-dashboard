import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import SetupGuide from './SetupGuide';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ConnectionCheckerProps {
  children: React.ReactNode;
}

const ConnectionChecker: React.FC<ConnectionCheckerProps> = ({ children }) => {
  const { data, error, isLoading } = useQuery({
    queryKey: ['connection-check'],
    queryFn: async () => {
      try {
        // First check health status
        const healthResponse = await axios.get(`${API_BASE_URL}/api/alkanes/health`);
        const health = healthResponse.data;
        
        // Check if we're using local Metashrew (which is fine!)
        if (health.status?.metashrew?.connected) {
          // Local Metashrew is connected, proceed with dashboard
          return { 
            connected: true, 
            provider: 'metashrew',
            network: 'mainnet',
            syncing: health.status.metashrew.syncing,
            syncProgress: health.status.metashrew.progress,
            data: health 
          };
        }
        
        // If not using Sandshrew OR Metashrew, show setup guide
        if (!health.status?.sandshrew && !health.status?.metashrew?.connected) {
          throw new Error('No connection to Alkanes network. Please configure Sandshrew API or local Metashrew.');
        }
        
        // Try to get blockchain info to verify connection works
        const infoResponse = await axios.get(`${API_BASE_URL}/api/alkanes/blockchain-info`);
        
        return { 
          connected: true, 
          provider: infoResponse.data.provider,
          network: health.status.network,
          data: infoResponse.data 
        };
      } catch (err: any) {
        // Check specific error types
        if (err.response?.data?.error?.includes('API key') || 
            err.response?.data?.error?.includes('Sandshrew') ||
            err.response?.status === 401) {
          throw new Error('Invalid Sandshrew API key. Please check your configuration.');
        }
        if (err.message.includes('Sandshrew')) {
          throw err; // Re-throw Sandshrew-specific errors
        }
        throw new Error('Unable to connect to Alkanes mainnet. Check your configuration.');
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Connecting to Alkanes Mainnet...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.connected) {
    return <SetupGuide isConnected={false} error={error?.message} />;
  }

  return <>{children}</>;
};

export default ConnectionChecker;