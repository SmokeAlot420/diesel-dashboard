#!/bin/bash

# DIESEL Dashboard - Quick DigitalOcean Deployment
set -e

echo "========================================"
echo "DIESEL Dashboard - Quick Deploy"
echo "========================================"

# Skip prompts for non-interactive deployment
export DEBIAN_FRONTEND=noninteractive

# Update system (non-interactive)
apt-get update && apt-get upgrade -y -q

# Install Docker
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Install Git
apt-get install -y git

# Clone repository
if [ ! -d "/opt/diesel-dashboard" ]; then
    git clone https://github.com/SmokeAlot420/diesel-dashboard.git /opt/diesel-dashboard
fi

cd /opt/diesel-dashboard

# Create minimal docker-compose for quick start
cat > docker-compose-quick.yml << 'EOF'
version: '3.8'

services:
  # Metashrew with local Bitcoin connection for now
  metashrew:
    image: ghcr.io/sandshrewmetaprotocols/metashrew:latest
    container_name: metashrew-indexer
    environment:
      - DAEMON_RPC_ADDR=http://bitcoin.alkanes.io:8332  # Use public node temporarily
      - AUTH=alkanes:alkanes
      - START_BLOCK=871100
      - INDEXER_BIND_MAINNET=tcp://0.0.0.0:8180
      - INDEXER_TARGET_MODE=MAINNET
    ports:
      - "8180:8180"
    volumes:
      - metashrew-data:/data
    restart: unless-stopped

  # API Backend
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    container_name: diesel-api
    environment:
      - NODE_ENV=production
      - PORT=3001
      - METASHREW_URL=http://metashrew:8180
      - CORS_ORIGIN=*
    ports:
      - "3001:3001"
    restart: unless-stopped
    depends_on:
      - metashrew

  # Dashboard Frontend
  dashboard:
    build:
      context: ./dashboard
      dockerfile: Dockerfile
      args:
        - VITE_API_URL=http://64.23.158.47:3001
    container_name: diesel-dashboard
    ports:
      - "80:80"
    restart: unless-stopped

volumes:
  metashrew-data:
    driver: local
EOF

# Build and start services
echo "Building and starting services..."
docker-compose -f docker-compose-quick.yml build
docker-compose -f docker-compose-quick.yml up -d

# Create monitoring script
cat > /usr/local/bin/diesel-status.sh << 'EOF'
#!/bin/bash
echo "=== DIESEL Dashboard Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}"
echo ""
echo "Metashrew Sync:"
docker logs metashrew-indexer --tail 2 2>&1 | grep -E "processed block|syncing" || echo "Starting sync..."
echo ""
echo "Access Dashboard: http://64.23.158.47"
echo "API Endpoint: http://64.23.158.47:3001"
EOF
chmod +x /usr/local/bin/diesel-status.sh

echo ""
echo "========================================"
echo "Deployment Complete!"
echo "========================================"
echo ""
echo "Dashboard: http://64.23.158.47"
echo "API: http://64.23.158.47:3001"
echo ""
echo "Check status: diesel-status.sh"
echo "View logs: docker-compose -f docker-compose-quick.yml logs -f"
echo ""