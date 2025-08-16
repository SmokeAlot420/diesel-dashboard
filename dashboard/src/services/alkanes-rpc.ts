/**
 * Alkanes RPC Service
 * Queries DIESEL token data from Bitcoin blockchain via Alkanes protocol
 * 
 * Alkanes is a Bitcoin Layer-1 smart contract protocol - all data lives on Bitcoin
 * DIESEL is the Genesis Alkane token (ID: 800000) deployed at Bitcoin block 800,000
 */

import { isJsonRpcError } from '../types/api';
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  AlkanesRpcMethod,
  GetAlkaneByIdParams,
  ProtorunesByAddressParams,
  ProtorunesByHeightParams,
  AlkaneTokenResponse,
  TokenBalanceResponse,
  ProtoruneResponse,
  HexString,
} from '../types/api';
import { DIESEL_CONSTANTS } from '../types/diesel';
import type { AlkaneToken, DieselToken, TokenBalance } from '../types/diesel';
import { hexToBigint, bigintToHex } from '../utils/bigint-utils';

export class AlkanesRpcService {
  private rpcUrl: string;
  private requestId: number = 0;
  
  constructor(rpcUrl?: string) {
    this.rpcUrl = rpcUrl || import.meta.env.VITE_ALKANES_RPC_URL || 'https://mainnet.alkanes.io/rpc';
  }
  
  /**
   * Make JSON-RPC request to Alkanes node
   * @param method RPC method name
   * @param params Method parameters
   * @returns Response data
   */
  private async makeRequest<T>(method: AlkanesRpcMethod, params: any): Promise<T> {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id: ++this.requestId,
    };
    
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: JsonRpcResponse<T> = await response.json();
      
      if (isJsonRpcError(data)) {
        throw new Error(`RPC Error: ${data.error.message} (code: ${data.error.code})`);
      }
      
      if (!data.result) {
        throw new Error('Empty response from RPC');
      }
      
      return data.result;
    } catch (error) {
      console.error(`Alkanes RPC error for ${method}:`, error);
      throw error;
    }
  }
  
  /**
   * Get DIESEL token information from Bitcoin blockchain
   * DIESEL is the Genesis Alkane at block 800,000
   * @returns DIESEL token data
   */
  async getDieselInfo(): Promise<DieselToken> {
    const params: GetAlkaneByIdParams = {
      id: bigintToHex(DIESEL_CONSTANTS.GENESIS_BLOCK) as HexString,
    };
    
    const response = await this.makeRequest<AlkaneTokenResponse>(
      'alkanes_getAlkaneById',
      params
    );
    
    return this.parseDieselToken(response);
  }
  
  /**
   * Get any Alkane token by ID (block number)
   * @param tokenId Token ID (block number as BigInt)
   * @returns Alkane token data
   */
  async getAlkaneById(tokenId: bigint): Promise<AlkaneToken> {
    const params: GetAlkaneByIdParams = {
      id: bigintToHex(tokenId) as HexString,
    };
    
    const response = await this.makeRequest<AlkaneTokenResponse>(
      'alkanes_getAlkaneById',
      params
    );
    
    return this.parseAlkaneToken(response);
  }
  
  /**
   * Get DIESEL balance for a Bitcoin address
   * @param address Bitcoin address
   * @returns Token balance data
   */
  async getDieselBalance(address: string): Promise<TokenBalance> {
    const params: ProtorunesByAddressParams = {
      address,
      tokenId: bigintToHex(DIESEL_CONSTANTS.GENESIS_BLOCK) as HexString,
    };
    
    const response = await this.makeRequest<TokenBalanceResponse>(
      'protorunesbyaddress',
      params
    );
    
    return this.parseTokenBalance(response);
  }
  
  /**
   * Get all Alkanes token balances for a Bitcoin address
   * @param address Bitcoin address
   * @returns Array of token balances
   */
  async getAllBalances(address: string): Promise<TokenBalance[]> {
    const params: ProtorunesByAddressParams = {
      address,
    };
    
    const response = await this.makeRequest<TokenBalanceResponse[]>(
      'protorunesbyaddress',
      params
    );
    
    return response.map(balance => this.parseTokenBalance(balance));
  }
  
  /**
   * Get DIESEL holders at specific Bitcoin block height
   * @param height Bitcoin block height
   * @returns Array of token holders
   */
  async getDieselHoldersAtHeight(height: number): Promise<ProtoruneResponse> {
    const params: ProtorunesByHeightParams = {
      height,
      tokenId: bigintToHex(DIESEL_CONSTANTS.GENESIS_BLOCK) as HexString,
    };
    
    const response = await this.makeRequest<ProtoruneResponse>(
      'protorunesbyheight',
      params
    );
    
    return response;
  }
  
  /**
   * Get current Metashrew indexer height (synced Bitcoin block)
   * @returns Current indexed block height
   */
  async getMetashrewHeight(): Promise<number> {
    const response = await this.makeRequest<{ result: string }>(
      'metashrew_height',
      []
    );
    
    return parseInt(response.result, 10);
  }
  
  /**
   * Parse Alkane token response from RPC
   * @param raw Raw response data
   * @returns Parsed Alkane token
   */
  private parseAlkaneToken(raw: AlkaneTokenResponse): AlkaneToken {
    return {
      id: hexToBigint(raw.id),
      name: raw.name,
      symbol: raw.symbol,
      totalSupply: hexToBigint(raw.totalSupply),
      cap: raw.cap ? hexToBigint(raw.cap) : undefined,
      minted: raw.minted ? hexToBigint(raw.minted) : undefined,
      decimals: raw.decimals || 8,
      contractType: raw.contractType as 'genesis' | 'standard' | 'custom',
    };
  }
  
  /**
   * Parse DIESEL token response specifically
   * @param raw Raw response data
   * @returns Parsed DIESEL token
   */
  private parseDieselToken(raw: AlkaneTokenResponse): DieselToken {
    const token = this.parseAlkaneToken(raw);
    
    // Verify this is actually DIESEL
    if (token.id !== DIESEL_CONSTANTS.GENESIS_BLOCK) {
      throw new Error(`Expected DIESEL token at block ${DIESEL_CONSTANTS.GENESIS_BLOCK}, got ${token.id}`);
    }
    
    return {
      id: token.id,
      name: token.name,
      symbol: token.symbol,
      totalSupply: token.totalSupply,
      cap: token.cap || DIESEL_CONSTANTS.MAX_SUPPLY,
      minted: token.minted || 0n,
      genesis: DIESEL_CONSTANTS.GENESIS_BLOCK,
      launch: DIESEL_CONSTANTS.LAUNCH_BLOCK,
    };
  }
  
  /**
   * Parse token balance response
   * @param raw Raw balance data
   * @returns Parsed token balance
   */
  private parseTokenBalance(raw: TokenBalanceResponse): TokenBalance {
    const amount = hexToBigint(raw.amount);
    const tokenId = hexToBigint(raw.tokenId);
    
    // Calculate percentage (will be updated with total supply)
    // This is a placeholder - actual percentage needs total supply
    const percentage = 0;
    
    return {
      address: raw.address,
      tokenId,
      amount,
      percentage,
      lastUpdated: 0, // Will be set from block height
    };
  }
  
  /**
   * Retry logic for failed requests
   * @param fn Function to retry
   * @param retries Number of retries
   * @param delay Delay between retries in ms
   * @returns Result of function
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError;
  }
  
  /**
   * Get DIESEL info with retry logic
   * @returns DIESEL token data
   */
  async getDieselInfoWithRetry(): Promise<DieselToken> {
    return this.withRetry(() => this.getDieselInfo());
  }
  
  /**
   * Batch request multiple RPC calls
   * @param requests Array of method/params pairs
   * @returns Array of results
   */
  async batchRequest(requests: Array<{ method: AlkanesRpcMethod; params: any }>): Promise<any[]> {
    const batchRequests = requests.map((req, index) => ({
      jsonrpc: '2.0' as const,
      method: req.method,
      params: req.params,
      id: index,
    }));
    
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchRequests),
    });
    
    if (!response.ok) {
      throw new Error(`Batch request failed: ${response.status}`);
    }
    
    const results: JsonRpcResponse[] = await response.json();
    
    return results.map(result => {
      if (isJsonRpcError(result)) {
        throw new Error(`Batch RPC Error: ${result.error.message}`);
      }
      return result.result;
    });
  }
  
  /**
   * Health check for Alkanes RPC
   * @returns true if healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const height = await this.getMetashrewHeight();
      return height > 0;
    } catch {
      return false;
    }
  }
}

// Export singleton instance for convenience
export const alkanesRpc = new AlkanesRpcService();