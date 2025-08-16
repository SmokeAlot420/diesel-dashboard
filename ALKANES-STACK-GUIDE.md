# Alkanes Stack Guide - OPERATIONAL ✅

## Stack Status
**All services running in Docker regtest mode**

## Access Points
- **Bitcoin Core RPC**: `localhost:18444` (user: bitcoinrpc, pass: bitcoinrpc)
- **Metashrew (Alkanes indexer)**: `localhost:8080` 
- **JSON-RPC Gateway**: `localhost:18888`
- **Ord Server**: `localhost:8090`

## Quick Commands

### Start Stack
```bash
cd "E:\v2 repo\diesel"
docker-compose -f docker-compose-regtest.yml up -d
```

### Stop Stack
```bash
docker-compose -f docker-compose-regtest.yml down
```

### Test Stack Health
```bash
bash test-alkanes-stack.sh
```

### Generate Test Blocks
```bash
docker exec alkanes-bitcoind bitcoin-cli -regtest -rpcuser=bitcoinrpc -rpcpassword=bitcoinrpc generatetoaddress 10 bcrt1q6zm7lvc74rtrunrn9sl4uvqzkamyhxhg8mt0y5
```

### Check Sync Status
```bash
# Bitcoin height
docker exec alkanes-bitcoind bitcoin-cli -regtest -rpcuser=bitcoinrpc -rpcpassword=bitcoinrpc getblockcount

# Metashrew height
curl -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"metashrew_height","params":[],"id":1}' http://localhost:8080
```

## Available RPC Methods
- `metashrew_height` - Current indexed block
- `protorunesbyaddress` - Query token balances
- `protorunesbyheight` - Tokens at block height
- `alkanes_getAlkaneById` - Get Alkane token info

## Current State
- **Network**: Regtest
- **Blocks**: 101 generated
- **Metashrew**: Fully synced
- **DIESEL Genesis Block**: 800000 (not reached in regtest)

## Files
- `docker-compose-regtest.yml` - Full stack configuration
- `test-alkanes-stack.sh` - Health check script
- `PRPs/diesel-dashboard-final.md` - DIESEL dashboard implementation plan

**Signed,**
SmokeDev