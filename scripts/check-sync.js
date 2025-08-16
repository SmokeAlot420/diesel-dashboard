#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function checkSyncStatus() {
  try {
    // Get current block from Metashrew logs
    const { stdout: logs } = await execPromise('docker logs alkanes-metashrew-mainnet --tail 20 2>&1');
    
    // Parse current block from logs
    const blockMatch = logs.match(/block (\d+)/g);
    let currentBlock = 871100; // Genesis
    
    if (blockMatch && blockMatch.length > 0) {
      const lastMatch = blockMatch[blockMatch.length - 1];
      currentBlock = parseInt(lastMatch.match(/\d+/)[0]);
    }
    
    // Get target block from Bitcoin
    const { stdout: btcInfo } = await execPromise(`curl -s -u degenrpc:catalyst123 -X POST http://localhost:8332 -H "Content-Type: application/json" -d '{"jsonrpc":"1.0","method":"getblockcount","params":[],"id":1}'`);
    
    const targetBlock = JSON.parse(btcInfo).result;
    
    // Calculate progress
    const progress = ((currentBlock - 871100) / (targetBlock - 871100)) * 100;
    const blocksLeft = targetBlock - currentBlock;
    const hoursLeft = Math.ceil(blocksLeft / 7200); // ~2 blocks/sec = 7200/hour
    
    console.log(JSON.stringify({
      syncing: currentBlock < targetBlock,
      currentBlock,
      targetBlock,
      progress: Math.round(progress * 100) / 100,
      blocksRemaining: blocksLeft,
      estimatedTimeRemaining: `~${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`,
    }, null, 2));
    
  } catch (error) {
    console.error('Error checking sync status:', error.message);
    process.exit(1);
  }
}

checkSyncStatus();