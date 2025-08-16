#!/bin/bash

# DigitalOcean Deployment Script for DIESEL Dashboard
# Run this on a fresh Ubuntu 22.04 droplet

set -e

echo "========================================"
echo "DIESEL Dashboard - DigitalOcean Deployment"
echo "========================================"

# Update system
echo "Updating system packages..."
apt-get update && apt-get upgrade -y

# Install Docker
echo "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose
echo "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Install Git
echo "Installing Git..."
apt-get install -y git

# Clone repository
echo "Cloning DIESEL Dashboard repository..."
if [ ! -d "/opt/diesel-dashboard" ]; then
    git clone https://github.com/SmokeAlot420/diesel-dashboard.git /opt/diesel-dashboard
else
    cd /opt/diesel-dashboard && git pull
fi

cd /opt/diesel-dashboard

# Create environment file
echo "Creating environment configuration..."
cat > .env << EOF
# Bitcoin RPC Configuration
BITCOIN_RPC_USER=degenrpc
BITCOIN_RPC_PASSWORD=catalyst123

# API Configuration
API_PORT=3001
METASHREW_URL=http://metashrew:8180

# Dashboard Configuration
VITE_API_URL=http://localhost:3001

# Indexer Configuration
START_BLOCK=871100
EOF

# Create data directories
echo "Creating data directories..."
mkdir -p /var/lib/diesel/bitcoin
mkdir -p /var/lib/diesel/metashrew
mkdir -p /var/lib/diesel/backups

# Set up swap (important for Bitcoin Core)
echo "Setting up swap space..."
if [ ! -f /swapfile ]; then
    fallocate -l 8G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Configure firewall
echo "Configuring firewall..."
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3001/tcp  # API
ufw allow 8332/tcp  # Bitcoin RPC (restrict in production!)
ufw allow 8333/tcp  # Bitcoin P2P
ufw --force enable

# Create systemd service
echo "Creating systemd service..."
cat > /etc/systemd/system/diesel-dashboard.service << EOF
[Unit]
Description=DIESEL Dashboard
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/diesel-dashboard
ExecStart=/usr/local/bin/docker-compose -f docker-compose.production.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.production.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable diesel-dashboard

# Start services
echo "Starting DIESEL Dashboard services..."
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d

# Create monitoring script
echo "Creating monitoring script..."
cat > /usr/local/bin/diesel-monitor.sh << 'EOF'
#!/bin/bash
echo "=== DIESEL Dashboard Status ==="
echo ""
echo "Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "Bitcoin Sync Status:"
docker exec bitcoin-mainnet bitcoin-cli -rpcuser=degenrpc -rpcpassword=catalyst123 getblockchaininfo | grep -E '"chain"|"blocks"|"headers"|"verificationprogress"'
echo ""
echo "Metashrew Sync Status:"
docker logs metashrew-indexer --tail 5 2>&1 | grep "Successfully processed block" | tail -1
echo ""
echo "API Health:"
curl -s http://localhost:3001/health | jq '.'
echo ""
echo "Disk Usage:"
df -h | grep -E '^/dev/|Filesystem'
EOF
chmod +x /usr/local/bin/diesel-monitor.sh

# Create backup script
echo "Creating backup script..."
cat > /usr/local/bin/diesel-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/lib/diesel/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "Creating backup: $DATE"
docker exec metashrew-indexer tar czf - /data > "$BACKUP_DIR/metashrew_$DATE.tar.gz"
docker exec diesel-api tar czf - /app > "$BACKUP_DIR/api_$DATE.tar.gz"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
echo "Backup completed"
EOF
chmod +x /usr/local/bin/diesel-backup.sh

# Add cron job for backups
echo "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/diesel-backup.sh") | crontab -

echo ""
echo "========================================"
echo "Deployment Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Bitcoin Core will start syncing (this will take 12-24 hours for full blockchain)"
echo "2. Metashrew will begin indexing from block 871100"
echo "3. Monitor progress: diesel-monitor.sh"
echo "4. View logs: docker-compose -f docker-compose.production.yml logs -f [service]"
echo ""
echo "Access points:"
echo "- Dashboard: http://YOUR_IP"
echo "- API: http://YOUR_IP:3001"
echo ""
echo "IMPORTANT: Configure SSL certificates and domain names for production!"
echo ""