# Alkanes Stack Verification Report

**Date:** 2025-08-14  
**Author:** SmokeDev  
**Status:** Partial Stack Running with Issues

## Executive Summary

The Alkanes development stack is partially operational but missing critical components. Bitcoin Core and some supporting services are running, but the main Alkanes indexer (rockshrew-mono) appears to be missing or not configured.

## Architecture Overview

Your setup uses a **WSL/Windows hybrid approach** (NO Docker):
- **Windows Native:** Bitcoin Core (better performance)
- **WSL Native:** All other services (Linux toolchain compatibility)
- **Networking:** WSL2 with `networkingMode=mirrored` for seamless localhost access

## Service Status Report

### ✅ Working Services

| Service | Port | Status | Details |
|---------|------|--------|---------|
| **Bitcoin Core** | 18443 | ✅ Running | Regtest mode, block 170 |
| **Something on 8080** | 8080 | ⚠️ Responding | Returns metashrew_height: 668 |
| **JSON-RPC Gateway** | 18888 | ✅ Running | Node.js service, proxying requests |
| **Electrs (flextrs)** | 50010 | ✅ Running | Block explorer API |
| **Memshrew** | N/A | ✅ Running | Mempool watcher daemon |

### ❌ Missing/Broken Services

| Service | Expected Port | Issue |
|---------|--------------|-------|
| **rockshrew-mono** | 8080 | Not found - binary missing or renamed |
| **Alkanes RPC methods** | 8080/18888 | Methods not implemented |
| **Ord** | 8090 | Optional - not checked |

## Critical Issues Identified

### 1. Missing rockshrew-mono Binary
**Problem:** The main Alkanes indexer `rockshrew-mono` is not running and the binary cannot be found.

**Evidence:**
- Port 8080 responds but doesn't support Alkanes methods
- `alkanes_getAlkaneById` returns "method not supported"
- No rockshrew process in `ps aux`
- Binary not found in expected locations

**Solution:**
```bash
# Check if rockshrew was renamed or is in a different location
wsl find / -name "*rockshrew*" -o -name "*alkanes*" 2>/dev/null

# If not found, may need to rebuild from source
cd /path/to/alkanes-rs
cargo build --release --bin rockshrew-mono
```

### 2. Block Height Discrepancy
**Problem:** metashrew_height returns 668 while Bitcoin Core shows block 170

**Evidence:**
- `metashrew_height` via port 8080: 668
- Bitcoin Core `getblockcount`: 170
- 498 block difference suggests stale database

**Solution:**
```bash
# Reset metashrew database
rm -rf ~/.metashrew/regtest
# OR
rm -rf ~/.rockshrew/regtest

# Restart services to resync
alkstop
alkstack
```

### 3. Missing Alkanes RPC Methods
**Problem:** Core Alkanes methods not available

**Methods Tested:**
- ❌ `alkanes_getAlkaneById` - Not found
- ❌ `protorunesbyaddress` - Not found  
- ❌ `simulate` - Not found
- ✅ `metashrew_height` - Works (returns 668)

**Root Cause:** rockshrew-mono not running, only basic metashrew methods available

### 4. Directory Structure Issues
**Problem:** jsonrpc working directory doesn't exist

**Evidence:**
```
node 7103 cwd /mnt/c/Users/Degen/source/repos/alkanes/alkanes/jsonrpc 
(stat: No such file or directory)
```

**Solution:**
The jsonrpc service is running from a directory that has been moved/deleted. Need to:
1. Find where the code actually is
2. Restart jsonrpc from correct location
3. Update startup scripts

## Working Components Analysis

### Bitcoin Core Configuration
- **Data Dir:** `C:\Users\Degen\AppData\Roaming\Bitcoin_regtest\`
- **Config:** Separate configs for mainnet and regtest
- **RPC:** `degenrpc:catalyst123` on port 18443
- **Status:** Working correctly

### Process List
```
memshrew     - Running (watching mempool)
jsonrpc      - Running (port 18888, directory issue)
flextrs      - Running (electrs fork, port 50010)
rockshrew    - NOT FOUND
```

## Recommendations

### Immediate Actions

1. **Find/Install rockshrew-mono**
```bash
# Option 1: Check if it's renamed
wsl which rockshrew
wsl which alkanes

# Option 2: Build from source
git clone https://github.com/kungfuflex/alkanes-rs
cd alkanes-rs
cargo build --release
cp target/release/rockshrew-mono /usr/local/bin/
```

2. **Fix Block Height Sync**
```bash
# Stop all services
alkstop

# Clear metashrew database
rm -rf ~/.metashrew
rm -rf ~/.rockshrew  

# Restart
alkstack
```

3. **Verify Startup Script**
```bash
# Check what the script actually starts
cat /mnt/e/Development/bitcoin-tools/start-complete-alkanes-stack.sh

# Look for rockshrew-mono launch command
grep -n "rockshrew" /mnt/e/Development/bitcoin-tools/start-complete-alkanes-stack.sh
```

### Testing Commands

```powershell
# From PowerShell - Test Bitcoin
btc-cli getblockcount
btc-cli getblockchaininfo

# Test services
alkstatus

# Generate blocks to test sync
btc-generate 5

# Check if metashrew height updates
curl -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"metashrew_height","params":[],"id":1}' http://localhost:8080
```

## Next Steps

1. **Locate rockshrew-mono binary or build from source**
2. **Reset and resync metashrew database**
3. **Update startup scripts with correct paths**
4. **Test Alkanes-specific RPC methods**
5. **Document working RPC endpoints**

## Conclusion

The stack is partially functional but missing the critical Alkanes indexer. The WSL/Windows hybrid approach is sound, but the Alkanes-specific components need to be properly installed and configured. Once rockshrew-mono is running, the full Alkanes RPC API should become available.

**Priority:** HIGH - Cannot develop DIESEL dashboard without working Alkanes RPC methods.

---
*End of Report*