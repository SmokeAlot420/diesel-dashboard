#!/bin/bash

# Monitor Metashrew sync progress
echo "🚀 DIESEL Mainnet Sync Monitor"
echo "================================"
echo ""

GENESIS=871100
TARGET=$(curl -s -u degenrpc:catalyst123 -X POST http://localhost:8332 -H "Content-Type: application/json" -d '{"jsonrpc":"1.0","method":"getblockcount","params":[],"id":1}' | grep -o '"result":[0-9]*' | cut -d: -f2)

echo "📊 Target Block: $TARGET"
echo "🏁 Genesis Block: $GENESIS"
echo ""

while true; do
  # Get current block from Metashrew logs
  CURRENT=$(docker logs alkanes-metashrew-mainnet --tail 10 2>&1 | grep "Processing block" | tail -1 | grep -oE "block [0-9]+" | cut -d' ' -f2)
  
  if [ -z "$CURRENT" ]; then
    CURRENT=$GENESIS
  fi
  
  # Calculate progress
  BLOCKS_DONE=$((CURRENT - GENESIS))
  BLOCKS_TOTAL=$((TARGET - GENESIS))
  PROGRESS=$(echo "scale=2; $BLOCKS_DONE * 100 / $BLOCKS_TOTAL" | bc)
  
  # Calculate ETA (assuming ~2 blocks/second based on logs)
  BLOCKS_LEFT=$((TARGET - CURRENT))
  SECONDS_LEFT=$((BLOCKS_LEFT / 2))
  HOURS=$((SECONDS_LEFT / 3600))
  MINUTES=$(((SECONDS_LEFT % 3600) / 60))
  
  # Display progress
  echo -ne "\r⏳ Block: $CURRENT / $TARGET | Progress: $PROGRESS% | ETA: ${HOURS}h ${MINUTES}m | Speed: ~2 blocks/sec"
  
  # Check if sync complete
  if [ "$CURRENT" -ge "$TARGET" ]; then
    echo ""
    echo ""
    echo "✅ Sync Complete! DIESEL data is now available."
    break
  fi
  
  sleep 5
done