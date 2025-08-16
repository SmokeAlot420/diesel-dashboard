/**
 * Alkanes RPC API Type Definitions
 * JSON-RPC 2.0 compliant request/response types
 * All hex values are prefixed with '0x'
 */

// JSON-RPC 2.0 Base Types
export interface JsonRpcRequest<T = any> {
  jsonrpc: '2.0';
  method: string;
  params: T;
  id: string | number;
}

export interface JsonRpcResponse<T = any> {
  jsonrpc: '2.0';
  result?: T;
  error?: JsonRpcError;
  id: string | number;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

// Alkanes RPC Methods
export type AlkanesRpcMethod =
  | 'alkanes_getAlkaneById'
  | 'protorunesbyaddress'
  | 'protorunesbyheight'
  | 'protorunesbyoutpoint'
  | 'simulate'
  | 'metashrew_height';

// Hex String Types (for API communication)
export type HexString = `0x${string}`;
export type Address = string;
export type Txid = string;
export type Outpoint = `${Txid}:${number}`;

// Request Parameter Types
export interface GetAlkaneByIdParams {
  id: HexString;                   // Alkane ID as hex (e.g., "0xc3500" for 800000)
}

export interface ProtorunesByAddressParams {
  address: Address;                // Bitcoin address
  tokenId?: HexString;             // Optional specific token ID
}

export interface ProtorunesByHeightParams {
  height: number;                  // Block height
  tokenId?: HexString;             // Optional specific token ID
}

export interface ProtorunesByOutpointParams {
  outpoint: Outpoint;              // UTXO outpoint (txid:vout)
}

export interface SimulateParams {
  contract: HexString;             // Contract bytecode
  input: HexString;                // Input data
  height?: number;                 // Optional block height for simulation
}

// Response Types
export interface AlkaneTokenResponse {
  id: HexString;                   // Token ID as hex
  name: string;                    // Token name
  symbol: string;                  // Token symbol
  totalSupply: HexString;          // Total supply as hex
  cap?: HexString;                 // Supply cap as hex
  minted?: HexString;              // Amount minted as hex
  decimals: number;                // Decimal places
  genesis: number;                 // Genesis block
  contractType: string;            // Contract type
}

export interface TokenBalanceResponse {
  address: Address;                // Bitcoin address
  tokenId: HexString;              // Token ID as hex
  amount: HexString;               // Balance as hex
  outpoints: Outpoint[];           // UTXOs containing tokens
}

export interface ProtoruneResponse {
  height: number;                  // Block height
  tokens: Array<{
    id: HexString;                 // Token ID
    amount: HexString;             // Amount as hex
    address?: Address;             // Owner address (if applicable)
  }>;
}

export interface SimulateResponse {
  success: boolean;                // Simulation success
  output?: HexString;              // Output data
  gasUsed?: number;                // Gas consumed
  error?: string;                  // Error message if failed
}

export interface MetashrewHeightResponse {
  result: string;                  // Current indexed height as string
}

// Sandshrew RPC Types
export interface SandshrewBlockResponse {
  hash: string;                    // Block hash
  height: number;                  // Block height
  version: number;                 // Block version
  prevBlockHash: string;           // Previous block hash
  merkleRoot: string;              // Merkle root
  timestamp: number;               // Unix timestamp
  bits: string;                    // Difficulty bits
  nonce: number;                   // Nonce
  size: number;                    // Block size
  weight: number;                  // Block weight
  txCount: number;                 // Transaction count
}

export interface SandshrewTransactionResponse {
  txid: string;                    // Transaction ID
  hash: string;                    // Transaction hash
  version: number;                 // Transaction version
  size: number;                    // Transaction size
  vsize: number;                   // Virtual size
  weight: number;                  // Transaction weight
  locktime: number;                // Lock time
  vin: Array<{
    txid: string;
    vout: number;
    scriptSig: {
      asm: string;
      hex: string;
    };
    sequence: number;
    witness?: string[];
  }>;
  vout: Array<{
    value: number;                // BTC value (careful: uses number)
    n: number;
    scriptPubKey: {
      asm: string;
      hex: string;
      type: string;
      address?: string;
    };
  }>;
  fee?: number;                    // Transaction fee
  blockHash?: string;              // Block hash if confirmed
  blockHeight?: number;            // Block height if confirmed
  confirmations?: number;          // Number of confirmations
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: 'ping' | 'pong' | 'subscribe' | 'unsubscribe' | 'update';
  channel?: string;
  data?: any;
  timestamp?: number;
}

export interface BlockUpdateMessage {
  type: 'update';
  channel: 'blocks';
  data: {
    height: number;
    hash: string;
    timestamp: number;
    txCount: number;
  };
}

export interface PriceUpdateMessage {
  type: 'update';
  channel: 'price';
  data: {
    symbol: string;
    price: number;                // Price in USD
    priceInSats: string;          // Price in sats as string
    change24h: number;            // 24h change percentage
    timestamp: number;
  };
}

// API Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}

// Type Guards
export function isJsonRpcError(response: JsonRpcResponse): response is JsonRpcResponse & { error: JsonRpcError } {
  return 'error' in response && response.error !== undefined;
}

export function isHexString(value: string): value is HexString {
  return /^0x[0-9a-fA-F]+$/.test(value);
}

export function isValidAddress(address: string): boolean {
  // Basic Bitcoin address validation (P2PKH, P2SH, Bech32)
  return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) ||
         /^bc1[a-z0-9]{39,59}$/.test(address) ||
         /^bcrt1[a-z0-9]{39,59}$/.test(address);
}

export function isValidTxid(txid: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(txid);
}

export function isValidOutpoint(outpoint: string): outpoint is Outpoint {
  const parts = outpoint.split(':');
  return parts.length === 2 && 
         isValidTxid(parts[0]) && 
         /^\d+$/.test(parts[1]);
}