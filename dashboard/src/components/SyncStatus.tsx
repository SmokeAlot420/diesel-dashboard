import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Progress } from './ui/progress';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface SyncStatus {
  syncing: boolean;
  currentBlock: number;
  targetBlock: number;
  progress: number;
  estimatedTimeRemaining?: string;
}

export function SyncStatusBanner() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSyncStatus = async () => {
      try {
        // Use the real sync status endpoint
        const response = await fetch('http://localhost:3001/api/sync/real-sync-status');
        const data = await response.json();
        
        if (data.success && data.data) {
          setSyncStatus(data.data);
          setError(null);
        }
      } catch (err) {
        // Fallback to old endpoint
        try {
          const fallbackResponse = await fetch('http://localhost:3001/api/alkanes/sync-status');
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.success && fallbackData.data) {
            setSyncStatus(fallbackData.data);
            setError(null);
          }
        } catch (fallbackErr) {
          console.error('Failed to check sync status:', fallbackErr);
          setError('Unable to check sync status');
        }
      }
    };

    // Check immediately
    checkSyncStatus();

    // Then check every 10 seconds
    const interval = setInterval(checkSyncStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  // Don't show banner if fully synced or error
  if (!syncStatus || !syncStatus.syncing || error) {
    return null;
  }

  return (
    <Alert className="mb-4 border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800 dark:text-yellow-200">
        Mainnet Data Syncing
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <div className="text-sm text-yellow-700 dark:text-yellow-300">
          The DIESEL indexer is syncing with Bitcoin mainnet. Real-time data will be available once sync is complete.
          Currently showing sample data for demonstration.
        </div>
        <div className="flex items-center gap-4">
          <Progress value={syncStatus.progress} className="flex-1" />
          <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
            {syncStatus.progress.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between text-xs text-yellow-600 dark:text-yellow-400">
          <span>Block {syncStatus.currentBlock.toLocaleString()} / {syncStatus.targetBlock.toLocaleString()}</span>
          {syncStatus.estimatedTimeRemaining && (
            <span>ETA: {syncStatus.estimatedTimeRemaining}</span>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function SyncStatusIndicator() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  useEffect(() => {
    const checkSyncStatus = async () => {
      try {
        // Use the real sync status endpoint
        const response = await fetch('http://localhost:3001/api/sync/real-sync-status');
        const data = await response.json();
        
        if (data.success && data.data) {
          setSyncStatus(data.data);
        }
      } catch (err) {
        // Fallback to old endpoint
        try {
          const fallbackResponse = await fetch('http://localhost:3001/api/alkanes/sync-status');
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.success && fallbackData.data) {
            setSyncStatus(fallbackData.data);
          }
        } catch (fallbackErr) {
          console.error('Failed to check sync status:', fallbackErr);
        }
      }
    };

    checkSyncStatus();
    const interval = setInterval(checkSyncStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!syncStatus) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {syncStatus.syncing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
          <span className="text-yellow-600">Syncing: {syncStatus.progress.toFixed(1)}%</span>
        </>
      ) : (
        <>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-green-600">Synced</span>
        </>
      )}
    </div>
  );
}