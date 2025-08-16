import { WebSocketServer, WebSocket } from 'ws';
import axios from 'axios';
import pino from 'pino';

const logger = pino();

interface WSClient {
  id: string;
  ws: WebSocket;
  subscriptions: Set<string>;
  lastPing: number;
}

const clients = new Map<string, WSClient>();

// Alkanes RPC client
const alkanesClient = axios.create({
  baseURL: process.env.ALKANES_RPC_URL || 'http://alkanes.andr0x.com:18332',
  timeout: 30000,
});

const callRPC = async (method: string, params: any[] = []) => {
  try {
    const response = await alkanesClient.post('/', {
      jsonrpc: '2.0',
      method,
      params,
      id: Date.now(),
    });
    return response.data.result;
  } catch (error) {
    logger.error('RPC call failed:', error);
    return null;
  }
};

// Broadcast message to subscribed clients
const broadcast = (channel: string, data: any) => {
  const message = JSON.stringify({
    type: channel,
    data,
    timestamp: new Date().toISOString(),
  });

  for (const client of clients.values()) {
    if (client.subscriptions.has(channel) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
};

// Monitor blockchain for new blocks
let lastBlockHeight = 0n;
const monitorBlockchain = async () => {
  try {
    const blockInfo = await callRPC('getblockchaininfo');
    const currentHeight = BigInt(blockInfo?.blocks || 0);
    
    if (currentHeight > lastBlockHeight) {
      lastBlockHeight = currentHeight;
      
      // Broadcast new block event
      broadcast('new_block', {
        blockHeight: currentHeight.toString(),
        blockhash: blockInfo.bestblockhash,
        time: blockInfo.mediantime,
      });
      
      // Check for DIESEL mints in new block
      const protorunes = await callRPC('protorunesbyheight', [currentHeight.toString()]);
      const dieselMints = protorunes?.result?.filter((entry: any) => {
        return entry.alkane_id?.toString() === '871100';
      }) || [];
      
      if (dieselMints.length > 0) {
        // Calculate rewards
        const blocksSinceGenesis = currentHeight - 871100n;
        const halvingEpoch = blocksSinceGenesis / 1008n;
        const blockReward = 10000n >> halvingEpoch;
        const rewardPerClaimant = blockReward / BigInt(dieselMints.length);
        
        broadcast('new_mint', {
          blockHeight: currentHeight.toString(),
          totalClaimants: dieselMints.length,
          rewardPerClaimant: rewardPerClaimant.toString(),
          totalDistributed: blockReward.toString(),
          claimants: dieselMints.slice(0, 5),  // First 5 claimants
        });
      }
    }
  } catch (error) {
    logger.error('Blockchain monitoring error:', error);
  }
};

// Start monitoring (every 10 seconds)
setInterval(monitorBlockchain, 10000);

export const wsHandler = (wss: WebSocketServer, logger: any) => {
  wss.on('connection', (ws: WebSocket) => {
    const clientId = Math.random().toString(36).substring(7);
    const client: WSClient = {
      id: clientId,
      ws,
      subscriptions: new Set(['new_block', 'new_mint']),  // Default subscriptions
      lastPing: Date.now(),
    };
    
    clients.set(clientId, client);
    logger.info(`WebSocket client connected: ${clientId}`);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      subscriptions: Array.from(client.subscriptions),
      timestamp: new Date().toISOString(),
    }));
    
    // Handle messages
    ws.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'subscribe':
            if (data.channel) {
              client.subscriptions.add(data.channel);
              ws.send(JSON.stringify({
                type: 'subscribed',
                channel: data.channel,
                timestamp: new Date().toISOString(),
              }));
            }
            break;
            
          case 'unsubscribe':
            if (data.channel) {
              client.subscriptions.delete(data.channel);
              ws.send(JSON.stringify({
                type: 'unsubscribed',
                channel: data.channel,
                timestamp: new Date().toISOString(),
              }));
            }
            break;
            
          case 'ping':
            client.lastPing = Date.now();
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString(),
            }));
            break;
        }
      } catch (error) {
        logger.error(`WebSocket message error for ${clientId}:`, error);
      }
    });
    
    // Handle disconnect
    ws.on('close', () => {
      clients.delete(clientId);
      logger.info(`WebSocket client disconnected: ${clientId}`);
    });
    
    // Handle errors
    ws.on('error', (error) => {
      logger.error(`WebSocket error for ${clientId}:`, error);
      clients.delete(clientId);
    });
  });
  
  // Ping clients every 30 seconds
  setInterval(() => {
    const now = Date.now();
    for (const [id, client] of clients.entries()) {
      if (now - client.lastPing > 60000) {  // No ping for 60 seconds
        client.ws.terminate();
        clients.delete(id);
        logger.info(`Terminated inactive client: ${id}`);
      } else if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString(),
        }));
      }
    }
  }, 30000);
  
  logger.info('WebSocket handler initialized');
};