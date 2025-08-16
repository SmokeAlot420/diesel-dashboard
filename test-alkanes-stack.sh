#!/bin/bash

# Test Alkanes Stack
# Author: SmokeDev
# Date: 2025-08-14

echo "🧪 Testing Alkanes Stack (Regtest)"
echo "=================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: Bitcoin Core
echo -e "${YELLOW}Test 1: Bitcoin Core Connectivity${NC}"
BLOCK_COUNT=$(docker exec alkanes-bitcoind bitcoin-cli -regtest -rpcuser=bitcoinrpc -rpcpassword=bitcoinrpc getblockcount 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Bitcoin Core: Block height $BLOCK_COUNT${NC}"
else
    echo -e "${RED}✗ Bitcoin Core: Not responding${NC}"
fi

# Test 2: Metashrew
echo -e "${YELLOW}Test 2: Metashrew (rockshrew-mono)${NC}"
METASHREW_HEIGHT=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"metashrew_height","params":[],"id":1}' \
    http://localhost:8080 | grep -o '"result":"[0-9]*"' | cut -d'"' -f4)
    
if [ ! -z "$METASHREW_HEIGHT" ]; then
    echo -e "${GREEN}✓ Metashrew: Synced to block $METASHREW_HEIGHT${NC}"
    if [ "$METASHREW_HEIGHT" -eq "$BLOCK_COUNT" ] || [ "$METASHREW_HEIGHT" -eq $((BLOCK_COUNT + 1)) ]; then
        echo -e "${GREEN}  → Fully synced with Bitcoin Core${NC}"
    else
        echo -e "${YELLOW}  → Syncing... ($METASHREW_HEIGHT/$BLOCK_COUNT)${NC}"
    fi
else
    echo -e "${RED}✗ Metashrew: Not responding${NC}"
fi

# Test 3: JSON-RPC Service
echo -e "${YELLOW}Test 3: JSON-RPC Service${NC}"
JSONRPC_TEST=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"getblockcount","params":[],"id":1}' \
    http://localhost:18888 2>/dev/null)
    
if [ ! -z "$JSONRPC_TEST" ]; then
    echo -e "${GREEN}✓ JSON-RPC: Service responding on port 18888${NC}"
else
    echo -e "${RED}✗ JSON-RPC: Not responding${NC}"
fi

# Test 4: Ord Server
echo -e "${YELLOW}Test 4: Ord Server (Optional)${NC}"
ORD_STATUS=$(curl -s http://localhost:8090/ 2>/dev/null | head -c 100)
if [ ! -z "$ORD_STATUS" ]; then
    echo -e "${GREEN}✓ Ord: Server responding on port 8090${NC}"
else
    echo -e "${YELLOW}⚠ Ord: Not responding (optional service)${NC}"
fi

# Test 5: Container Health
echo -e "${YELLOW}Test 5: Container Health Check${NC}"
CONTAINERS=("alkanes-bitcoind" "alkanes-metashrew" "alkanes-memshrew" "alkanes-jsonrpc")
ALL_HEALTHY=true

for container in "${CONTAINERS[@]}"; do
    STATUS=$(docker ps --filter "name=$container" --format "{{.Status}}" 2>/dev/null)
    if [[ $STATUS == *"Up"* ]]; then
        echo -e "${GREEN}✓ $container: Running${NC}"
    else
        echo -e "${RED}✗ $container: Not running${NC}"
        ALL_HEALTHY=false
    fi
done

echo ""
echo "=================================="
if [ "$ALL_HEALTHY" = true ] && [ ! -z "$METASHREW_HEIGHT" ]; then
    echo -e "${GREEN}✅ Alkanes Stack: OPERATIONAL${NC}"
    echo ""
    echo "Ready for development!"
    echo "  - Bitcoin RPC: localhost:18444"
    echo "  - Metashrew: localhost:8080"
    echo "  - JSON-RPC: localhost:18888"
    echo "  - Ord: localhost:8090"
else
    echo -e "${RED}❌ Alkanes Stack: ISSUES DETECTED${NC}"
    echo ""
    echo "Check logs with:"
    echo "  docker logs alkanes-metashrew"
    echo "  docker logs alkanes-bitcoind"
fi