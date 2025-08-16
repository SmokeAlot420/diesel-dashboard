import axios from 'axios';
import type { AxiosInstance } from 'axios';

export interface RPCRequest {
  jsonrpc: string;
  method: string;
  params: any[];
  id: number;
}

export interface RPCResponse<T = any> {
  jsonrpc: string;
  result?: T;
  error?: {
    code: number;
    message: string;
  };
  id: number;
}

export class AlkanesRPCService {
  private client: AxiosInstance;
  private requestId: number = 1;

  constructor(rpcUrl?: string) {
    const url = rpcUrl || import.meta.env.VITE_ALKANES_RPC_URL || 'http://alkanes.andr0x.com:18332';
    
    this.client = axios.create({
      baseURL: url,
      headers: {
        'Content-Type': 'application/json',
      },
      auth: import.meta.env.VITE_ALKANES_RPC_USER ? {
        username: import.meta.env.VITE_ALKANES_RPC_USER,
        password: import.meta.env.VITE_ALKANES_RPC_PASSWORD || ''
      } : undefined,
      timeout: 30000,
    });
  }

  private async callRPC<T = any>(method: string, params: any[] = []): Promise<T> {
    const request: RPCRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id: this.requestId++,
    };

    try {
      const response = await this.client.post('/', request);
      const data = response.data as RPCResponse<T>;
      
      if (data.error) {
        throw new Error(`RPC Error ${data.error.code}: ${data.error.message}`);
      }
      
      return data.result!;
    } catch (error) {
      console.error(`RPC call failed for ${method}:`, error);
      throw error;
    }
  }

  async getBlockchainInfo(): Promise<any> {
    return this.callRPC('getblockchaininfo');
  }

  async protorunesByHeight(height: bigint): Promise<any> {
    return this.callRPC('protorunesbyheight', [height.toString()]);
  }

  async protorunesByAddress(address: string): Promise<any> {
    return this.callRPC('protorunesbyaddress', [address]);
  }

  async protorunesByOutpoint(txid: string, vout: number): Promise<any> {
    return this.callRPC('protorunesbyoutpoint', [txid, vout]);
  }
}