import axios from 'axios';

interface MetashrewStatus {
  syncing: boolean;
  currentBlock: number;
  targetBlock: number;
  progress: number;
  estimatedTimeRemaining?: string;
}

class MetashrewService {
  private client = axios.create({
    baseURL: process.env.ALKANES_RPC_URL || 'http://localhost:8080',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  private syncStatus: MetashrewStatus = {
    syncing: true,
    currentBlock: 871100, // DIESEL genesis
    targetBlock: 910246, // Current mainnet height
    progress: 0,
  };

  private lastSyncCheck = 0;
  private SYNC_CHECK_INTERVAL = 5000; // Check every 5 seconds

  async checkSyncStatus(): Promise<MetashrewStatus> {
    const now = Date.now();
    
    // Throttle sync checks
    if (now - this.lastSyncCheck < this.SYNC_CHECK_INTERVAL) {
      return this.syncStatus;
    }

    try {
      // Try to get current indexer status via a simple test call
      const testResponse = await this.client.post('/', {
        jsonrpc: '2.0',
        method: 'protorunesbyheight',
        params: ['871100'], // Test with genesis block
        id: 1,
      });

      // If we get a valid response, indexer is likely synced
      if (testResponse.data.result) {
        this.syncStatus.syncing = false;
        // Update current block from result if available
      }
    } catch (error) {
      // Method not available yet, still syncing
      console.debug('Metashrew still syncing, protorunes methods not available yet');
      
      // Try to get progress from Docker logs (development only)
      if (process.env.NODE_ENV === 'development') {
        try {
          const { exec } = require('child_process');
          const util = require('util');
          const execPromise = util.promisify(exec);
          
          const { stdout } = await execPromise('docker logs alkanes-metashrew-mainnet --tail 20 2>&1 | grep "Successfully processed block" | tail -1');
          const match = stdout.match(/block (\d+)/);
          if (match) {
            this.syncStatus.currentBlock = parseInt(match[1]);
          }
        } catch (e) {
          // Ignore, use fallback
        }
      }
    }

    try {
      // Get Bitcoin chain info to know target
      const btcResponse = await axios.post('http://localhost:8332', {
        jsonrpc: '1.0',
        method: 'getblockchaininfo',
        params: [],
        id: 1,
      }, {
        auth: {
          username: 'degenrpc',
          password: 'catalyst123',
        },
      });

      if (btcResponse.data.result) {
        this.syncStatus.targetBlock = btcResponse.data.result.blocks;
        this.syncStatus.progress = 
          ((this.syncStatus.currentBlock - 871100) / (this.syncStatus.targetBlock - 871100)) * 100;
        
        // Estimate time remaining based on sync speed
        const blocksRemaining = this.syncStatus.targetBlock - this.syncStatus.currentBlock;
        const blocksPerSecond = 2; // Rough estimate from logs
        const secondsRemaining = blocksRemaining / blocksPerSecond;
        const hoursRemaining = Math.ceil(secondsRemaining / 3600);
        
        if (hoursRemaining > 0) {
          this.syncStatus.estimatedTimeRemaining = `~${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}`;
        } else {
          const minutesRemaining = Math.ceil(secondsRemaining / 60);
          this.syncStatus.estimatedTimeRemaining = `~${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}`;
        }
      }
    } catch (error) {
      console.debug('Could not get Bitcoin blockchain info');
    }

    // Check if sync is complete
    if (this.syncStatus.currentBlock >= this.syncStatus.targetBlock && this.syncStatus.targetBlock > 0) {
      this.syncStatus.syncing = false;
      this.syncStatus.progress = 100;
    }

    this.lastSyncCheck = now;
    return this.syncStatus;
  }

  async callMethod(method: string, params: any[] = []): Promise<any> {
    const request = {
      jsonrpc: '2.0',
      method,
      params,
      id: Date.now(),
    };

    try {
      const response = await this.client.post('/', request);
      
      if (response.data.error) {
        // Check if it's a method not found error during sync
        if (response.data.error.code === -32601) {
          const status = await this.checkSyncStatus();
          if (status.syncing) {
            throw {
              code: 'SYNCING',
              message: `Metashrew is syncing: ${status.progress.toFixed(2)}% complete`,
              syncStatus: status,
            };
          }
        }
        
        throw response.data.error;
      }

      return response.data.result;
    } catch (error: any) {
      if (error.code === 'SYNCING') {
        throw error;
      }
      
      console.error(`Metashrew RPC error for ${method}:`, error.message);
      throw {
        code: error.code || -32603,
        message: error.message || 'Internal error',
      };
    }
  }

  // Parse log output to track sync progress
  updateSyncProgress(currentBlock: number) {
    this.syncStatus.currentBlock = currentBlock;
    
    if (this.syncStatus.targetBlock > 0) {
      this.syncStatus.progress = 
        ((currentBlock - 871100) / (this.syncStatus.targetBlock - 871100)) * 100;
    }
  }

  getSyncStatus(): MetashrewStatus {
    return this.syncStatus;
  }
}

export const metashrewService = new MetashrewService();