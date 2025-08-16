import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = Router();
const execAsync = promisify(exec);

// Real-time sync check from Docker logs
router.get('/real-sync-status', async (req, res) => {
  try {
    // Get last processed block from Docker logs
    const { stdout } = await execAsync('docker logs alkanes-metashrew-mainnet --tail 50 2>&1 | grep "Successfully processed block" | tail -1');
    
    let currentBlock = 871100;
    const match = stdout.match(/block (\d+)/);
    if (match) {
      currentBlock = parseInt(match[1]);
    }
    
    // Get Bitcoin current height
    const targetBlock = 910246; // Or fetch from Bitcoin RPC
    
    // Calculate progress
    const blocksProcessed = currentBlock - 871100;
    const totalBlocks = targetBlock - 871100;
    const progress = (blocksProcessed / totalBlocks) * 100;
    
    // Calculate ETA
    const blocksRemaining = targetBlock - currentBlock;
    const blocksPerSecond = 2; // Observed speed
    const secondsRemaining = blocksRemaining / blocksPerSecond;
    const hoursRemaining = Math.ceil(secondsRemaining / 3600);
    
    res.json({
      success: true,
      data: {
        syncing: currentBlock < targetBlock,
        currentBlock,
        targetBlock,
        progress: Math.round(progress * 100) / 100,
        blocksRemaining,
        blocksPerSecond,
        estimatedTimeRemaining: `~${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}`,
        message: `Metashrew is ${progress.toFixed(2)}% synced`
      }
    });
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message,
      data: {
        syncing: true,
        currentBlock: 871100,
        targetBlock: 910246,
        progress: 0,
        message: 'Unable to check Docker logs'
      }
    });
  }
});

export default router;