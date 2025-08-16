/**
 * Sandshrew API Client for Alkanes Mainnet Access
 * Based on official Sandshrew documentation and code examples
 */

import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';

// Environment validation
const sandshrewConfigSchema = z.object({
  apiKey: z.string().min(1),
  network: z.enum(['mainnet', 'signet', 'testnet']).default('mainnet'),
});

// Response schemas
const rpcResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  result: z.any().optional(),
  error: z.object({
    code: z.number(),
    message: z.string(),
    data: z.any().optional(),
  }).optional(),
});

export class SandshrewClient {
  private client: AxiosInstance;
  private requestId: number = 1;

  constructor(apiKey: string, network: 'mainnet' | 'signet' | 'testnet' = 'mainnet') {
    const config = sandshrewConfigSchema.parse({ apiKey, network });
    
    // Build URL based on network (from Sandshrew docs)
    const baseURL = this.getEndpointUrl(config.network, config.apiKey);
    
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Log configuration (without exposing API key)
    console.log(`🔗 Sandshrew client initialized for ${network}`);
  }

  private getEndpointUrl(network: string, apiKey: string): string {
    // Based on Sandshrew documentation endpoints
    switch (network) {
      case 'mainnet':
        return `https://mainnet.sandshrew.io/v1/${apiKey}`;
      case 'signet':
        return `https://signet.sandshrew.io/v1/${apiKey}`;
      case 'testnet':
        return `https://testnet.sandshrew.io/v1/${apiKey}`;
      default:
        return `https://mainnet.sandshrew.io/v1/${apiKey}`;
    }
  }

  /**
   * Make a JSON-RPC call to Sandshrew
   * Format matches the curl examples from docs
   */
  async call(method: string, params: any[] = []): Promise<any> {
    const requestId = this.requestId++;
    
    const payload = {
      jsonrpc: '2.0',
      id: requestId,
      method,
      params,
    };

    try {
      const response = await this.client.post('', payload);  // Use empty string instead of '/'
      const parsed = rpcResponseSchema.parse(response.data);

      if (parsed.error) {
        throw new Error(`RPC Error ${parsed.error.code}: ${parsed.error.message}`);
      }

      return parsed.result;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid or missing Sandshrew API key. Sign up at www.sandshrew.io');
      }
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Consider upgrading your Sandshrew plan.');
      }
      throw error;
    }
  }

  // Alkanes-specific methods (these should be available via Sandshrew)
  async getProtorunesByAddress(address: string, protocolTag?: bigint) {
    // Try alkanes namespace first, fallback to direct method
    try {
      const params = protocolTag 
        ? [address, protocolTag.toString()]
        : [address];
      return await this.call('alkanes_protorunesbyaddress', params);
    } catch (error: any) {
      // Fallback to non-namespaced version
      if (error.message.includes('not found')) {
        const params = protocolTag 
          ? [address, protocolTag.toString()]
          : [address];
        return await this.call('protorunesbyaddress', params);
      }
      throw error;
    }
  }

  async getProtorunesByHeight(height: bigint) {
    try {
      return await this.call('alkanes_protorunesbyheight', [height.toString()]);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return await this.call('protorunesbyheight', [height.toString()]);
      }
      throw error;
    }
  }

  async getProtorunesByOutpoint(txid: string, vout: number) {
    const outpoint = `${txid}:${vout}`;
    try {
      return await this.call('alkanes_protorunesbyoutpoint', [outpoint]);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return await this.call('protorunesbyoutpoint', [outpoint]);
      }
      throw error;
    }
  }

  // Bitcoin Core RPC methods (btc namespace)
  async getBlockchainInfo() {
    return await this.call('btc_getblockchaininfo');
  }

  async getBlockCount() {
    return await this.call('btc_getblockcount');
  }

  async getBlock(blockhash: string, verbosity: number = 1) {
    return await this.call('btc_getblock', [blockhash, verbosity]);
  }

  async getBlockHash(height: number) {
    return await this.call('btc_getblockhash', [height]);
  }

  // Esplora methods (block explorer)
  async getAddress(address: string) {
    return await this.call('esplora_address', [address]);
  }

  async getAddressTxs(address: string) {
    return await this.call('esplora_address::txs', [address]);
  }

  async getAddressUtxo(address: string) {
    return await this.call('esplora_address::utxo', [address]);
  }

  async getTransaction(txid: string) {
    return await this.call('esplora_tx', [txid]);
  }

  // Ordinals methods (ord namespace)
  async getInscription(inscriptionId: string) {
    return await this.call('ord_inscription', [inscriptionId]);
  }

  async getInscriptions(page: number = 0) {
    return await this.call('ord_inscriptions', [page]);
  }

  // Runes methods
  async getRunes() {
    return await this.call('runes_list');
  }

  async getRuneBalances(address: string) {
    return await this.call('runes_balances', [address]);
  }

  // Multicall for batch operations
  async multicall(calls: Array<{ method: string; params: any[] }>) {
    const requests = calls.map((call, index) => ({
      jsonrpc: '2.0',
      id: index + 1,
      method: call.method,
      params: call.params,
    }));

    return await this.call('multicall', [requests]);
  }
}

// Export singleton instance if API key is configured
export function createSandshrewClient(): SandshrewClient | null {
  const apiKey = process.env.SANDSHREW_API_KEY;
  const network = (process.env.SANDSHREW_NETWORK || 'mainnet') as 'mainnet' | 'signet' | 'testnet';

  if (!apiKey || apiKey === 'YOUR-API-KEY-HERE') {
    console.warn('⚠️ Sandshrew API key not configured. Please set SANDSHREW_API_KEY in .env');
    return null;
  }

  console.log('✅ Sandshrew client initialized for', network);
  return new SandshrewClient(apiKey, network);
}