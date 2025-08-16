#!/bin/bash

# Fix Alkanes Stack - Build and Install rockshrew-mono
# Author: SmokeDev
# Date: 2025-08-14

echo "🔧 Fixing Alkanes Stack - Installing rockshrew-mono"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Clone metashrew if not exists
echo -e "${YELLOW}Step 1: Setting up metashrew repository${NC}"

METASHREW_DIR="/mnt/e/Development/metashrew"
if [ ! -d "$METASHREW_DIR" ]; then
    echo "Cloning metashrew repository..."
    cd /mnt/e/Development
    git clone https://github.com/sandshrewmetaprotocols/metashrew.git
    cd metashrew
else
    echo "Metashrew directory exists, updating..."
    cd "$METASHREW_DIR"
    git pull
fi

# Step 2: Install Rust if needed
echo -e "${YELLOW}Step 2: Checking Rust installation${NC}"
if ! command -v cargo &> /dev/null; then
    echo "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
else
    echo -e "${GREEN}✓ Rust is installed${NC}"
fi

# Step 3: Build metashrew binaries
echo -e "${YELLOW}Step 3: Building metashrew binaries${NC}"
cd "$METASHREW_DIR"

# Build in release mode
echo "Building rockshrew-mono..."
cargo build --release --bin rockshrew-mono

echo "Building memshrew..."
cargo build --release --bin memshrew

# Step 4: Create symbolic links in expected location
echo -e "${YELLOW}Step 4: Creating symbolic links${NC}"

# Create the expected directory structure
mkdir -p /mnt/c/Users/Degen/source/repos/alkanes/metashrew/target/release

# Link the binaries
if [ -f "$METASHREW_DIR/target/release/rockshrew-mono" ]; then
    ln -sf "$METASHREW_DIR/target/release/rockshrew-mono" \
        /mnt/c/Users/Degen/source/repos/alkanes/metashrew/target/release/rockshrew-mono
    echo -e "${GREEN}✓ rockshrew-mono linked${NC}"
else
    echo -e "${RED}❌ rockshrew-mono binary not found after build${NC}"
fi

if [ -f "$METASHREW_DIR/target/release/memshrew" ]; then
    ln -sf "$METASHREW_DIR/target/release/memshrew" \
        /mnt/c/Users/Degen/source/repos/alkanes/metashrew/target/release/memshrew
    echo -e "${GREEN}✓ memshrew linked${NC}"
else
    echo -e "${RED}❌ memshrew binary not found after build${NC}"
fi

# Step 5: Download alkanes.wasm if missing
echo -e "${YELLOW}Step 5: Checking alkanes.wasm${NC}"

WASM_PATH="/mnt/c/Users/Degen/source/repos/alkanes/alkanes/vendor/alkanes.wasm"
if [ ! -f "$WASM_PATH" ]; then
    echo "Downloading alkanes.wasm..."
    mkdir -p /mnt/c/Users/Degen/source/repos/alkanes/alkanes/vendor
    
    # Try to download from GitHub releases or build from source
    echo "Checking for alkanes-rs repository..."
    ALKANES_RS_DIR="/mnt/e/Development/alkanes-rs"
    
    if [ ! -d "$ALKANES_RS_DIR" ]; then
        cd /mnt/e/Development
        git clone https://github.com/kungfuflex/alkanes-rs.git
        cd alkanes-rs
    else
        cd "$ALKANES_RS_DIR"
        git pull
    fi
    
    # Build alkanes.wasm
    echo "Building alkanes.wasm..."
    cargo build --release --target wasm32-unknown-unknown
    
    # Copy the wasm file
    if [ -f "target/wasm32-unknown-unknown/release/alkanes.wasm" ]; then
        cp target/wasm32-unknown-unknown/release/alkanes.wasm "$WASM_PATH"
        echo -e "${GREEN}✓ alkanes.wasm created${NC}"
    fi
else
    echo -e "${GREEN}✓ alkanes.wasm exists${NC}"
fi

# Step 6: Reset databases
echo -e "${YELLOW}Step 6: Resetting databases (optional)${NC}"
echo "Do you want to reset the metashrew databases? (y/n)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "Resetting databases..."
    rm -rf ~/.rockshrew
    rm -rf ~/.metashrew
    rm -rf /mnt/c/Users/Degen/.rockshrew
    rm -rf /mnt/c/Users/Degen/.metashrew
    echo -e "${GREEN}✓ Databases reset${NC}"
else
    echo "Keeping existing databases"
fi

# Step 7: Kill existing processes
echo -e "${YELLOW}Step 7: Stopping existing services${NC}"
pkill -f rockshrew
pkill -f memshrew
sleep 2

# Step 8: Start services
echo -e "${YELLOW}Step 8: Starting services${NC}"

# Start rockshrew-mono
echo "Starting rockshrew-mono..."
cd /mnt/c/Users/Degen/source/repos/alkanes/metashrew
./target/release/rockshrew-mono \
    --daemon-rpc-url "http://degenrpc:catalyst123@localhost:18443" \
    --indexer "/mnt/c/Users/Degen/source/repos/alkanes/alkanes/vendor/alkanes.wasm" \
    --db-path "$HOME/.rockshrew/regtest" \
    --start-block 0 \
    --host "0.0.0.0" \
    --port 8080 > /tmp/rockshrew-mono.log 2>&1 &

ROCKSHREW_PID=$!
echo -e "${GREEN}✓ rockshrew-mono started (PID: $ROCKSHREW_PID)${NC}"

# Start memshrew
echo "Starting memshrew..."
./target/release/memshrew \
    --daemon-rpc-url "http://degenrpc:catalyst123@localhost:18443" > /tmp/memshrew.log 2>&1 &

MEMSHREW_PID=$!
echo -e "${GREEN}✓ memshrew started (PID: $MEMSHREW_PID)${NC}"

# Step 9: Test the setup
echo -e "${YELLOW}Step 9: Testing services${NC}"
sleep 5

# Test metashrew_height
echo "Testing metashrew_height..."
HEIGHT=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"metashrew_height","params":[],"id":1}' \
    http://localhost:8080 | grep -o '"result":"[0-9]*"' | cut -d'"' -f4)

if [ ! -z "$HEIGHT" ]; then
    echo -e "${GREEN}✓ metashrew_height working: Block $HEIGHT${NC}"
else
    echo -e "${RED}❌ metashrew_height not responding${NC}"
fi

echo ""
echo -e "${GREEN}=== Fix Complete ===${NC}"
echo ""
echo "Services running:"
echo "  rockshrew-mono: PID $ROCKSHREW_PID (port 8080)"
echo "  memshrew: PID $MEMSHREW_PID"
echo ""
echo "Logs:"
echo "  rockshrew-mono: /tmp/rockshrew-mono.log"
echo "  memshrew: /tmp/memshrew.log"
echo ""
echo "To restart everything properly, run from PowerShell:"
echo "  alkstop"
echo "  alkstack"