# DigitalOcean Deployment Guide for DIESEL Dashboard

## Required Droplet Specifications

### Minimum Requirements (Budget Option - $48/month)
- **Droplet Size**: Basic Premium Intel (8 GB RAM, 2 vCPUs, 250 GB SSD)
- **Additional Storage**: 500 GB Volume for Bitcoin blockchain
- **Total Cost**: ~$48 (droplet) + $50 (storage) = ~$98/month

### Recommended Requirements (Performance Option - $96/month)
- **Droplet Size**: Basic Premium Intel (16 GB RAM, 4 vCPUs, 320 GB SSD)
- **Additional Storage**: 1 TB Volume for Bitcoin blockchain + growth
- **Total Cost**: ~$96 (droplet) + $100 (storage) = ~$196/month

### Pro Requirements (Enterprise Option - $192/month)
- **Droplet Size**: General Purpose (32 GB RAM, 8 vCPUs, 640 GB SSD)
- **Additional Storage**: 2 TB Volume for long-term growth
- **Total Cost**: ~$192 (droplet) + $200 (storage) = ~$392/month

## Step-by-Step Deployment

### 1. Create DigitalOcean Droplet

```bash
# Using DigitalOcean CLI (doctl)
doctl compute droplet create diesel-dashboard \
  --image ubuntu-22-04-x64 \
  --size s-4vcpu-8gb \
  --region nyc3 \
  --ssh-keys [YOUR_SSH_KEY_ID] \
  --tag-names diesel,bitcoin,production
```

Or via DigitalOcean Web Console:
1. Click "Create" → "Droplets"
2. Choose Ubuntu 22.04 LTS
3. Select droplet size (see specifications above)
4. Choose datacenter region (prefer close to your users)
5. Add SSH keys
6. Name: `diesel-dashboard`

### 2. Attach Block Storage Volume

```bash
# Create volume for Bitcoin data
doctl compute volume create diesel-bitcoin-data \
  --size 500 \
  --region nyc3 \
  --fs-type ext4
  
# Attach to droplet
doctl compute volume-action attach [VOLUME_ID] [DROPLET_ID]
```

### 3. Initial Server Setup

SSH into your droplet:
```bash
ssh root@YOUR_DROPLET_IP
```

Mount the volume:
```bash
# Find the volume device (usually /dev/sda or /dev/vda)
lsblk

# Create mount point
mkdir -p /mnt/bitcoin-data

# Mount the volume
mount -o defaults,nofail,discard,noatime /dev/disk/by-id/scsi-0DO_Volume_diesel-bitcoin-data /mnt/bitcoin-data

# Add to fstab for persistent mounting
echo '/dev/disk/by-id/scsi-0DO_Volume_diesel-bitcoin-data /mnt/bitcoin-data ext4 defaults,nofail,discard,noatime 0 2' >> /etc/fstab
```

### 4. Run Deployment Script

```bash
# Download deployment script
wget https://raw.githubusercontent.com/SmokeAlot420/diesel-dashboard/main/deploy-digitalocean.sh

# Make executable
chmod +x deploy-digitalocean.sh

# Run deployment
./deploy-digitalocean.sh
```

### 5. Configure Domain & SSL

#### Option A: Using Cloudflare (Recommended)
1. Add your domain to Cloudflare
2. Point A record to droplet IP
3. Enable "Full SSL" mode
4. Use Cloudflare's Origin certificates

#### Option B: Using Let's Encrypt
```bash
# Install certbot
apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d diesel.yourdomain.com -d api.diesel.yourdomain.com

# Auto-renewal
systemctl enable certbot.timer
```

### 6. Update Environment Configuration

Edit `/opt/diesel-dashboard/.env`:
```bash
# Update with your domain
VITE_API_URL=https://api.diesel.yourdomain.com
CORS_ORIGIN=https://diesel.yourdomain.com
```

Restart services:
```bash
cd /opt/diesel-dashboard
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d
```

## Monitoring & Maintenance

### Check Sync Progress
```bash
# Monitor all services
diesel-monitor.sh

# Check Bitcoin sync specifically
docker exec bitcoin-mainnet bitcoin-cli getblockchaininfo

# Check Metashrew indexing
docker logs metashrew-indexer --tail 50 | grep "processed block"

# Watch real-time logs
docker-compose -f docker-compose.production.yml logs -f
```

### Performance Optimization

1. **Optimize Bitcoin Core**:
```bash
# Edit bitcoin.conf in container
docker exec -it bitcoin-mainnet sh
cat >> /home/bitcoin/.bitcoin/bitcoin.conf << EOF
dbcache=4000
maxmempool=300
maxconnections=50
maxuploadtarget=5000
EOF
```

2. **Optimize Metashrew**:
- Increase memory allocation if needed
- Adjust batch processing size

3. **Enable Monitoring**:
```bash
# Install monitoring
apt-get install -y htop iotop nethogs

# Install Netdata for web-based monitoring
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

## Timeline Expectations

### Initial Sync Times
- **Bitcoin Core**: 12-24 hours (depends on network/disk speed)
- **Metashrew Indexer**: 6-12 hours after Bitcoin syncs
- **Total Time to Production**: 24-36 hours

### Ongoing Performance
- **API Response Time**: < 200ms
- **Dashboard Load Time**: < 2 seconds
- **Sync Lag**: < 1 minute behind chain tip

## Backup Strategy

Automated backups are configured via cron:
```bash
# View backup schedule
crontab -l

# Manual backup
/usr/local/bin/diesel-backup.sh

# Restore from backup
tar xzf /var/lib/diesel/backups/metashrew_[DATE].tar.gz -C /
```

## Troubleshooting

### Bitcoin Core won't sync
```bash
# Check peers
docker exec bitcoin-mainnet bitcoin-cli getpeerinfo | jq '.[].addr'

# Add nodes manually
docker exec bitcoin-mainnet bitcoin-cli addnode "seed.bitcoin.sipa.be" add
```

### Metashrew stuck
```bash
# Restart indexer
docker-compose -f docker-compose.production.yml restart metashrew

# Check for errors
docker logs metashrew-indexer --tail 100 | grep -i error
```

### Out of disk space
```bash
# Check usage
df -h

# Clean Docker
docker system prune -a

# Resize DigitalOcean volume (can be done without downtime)
doctl compute volume-action resize [VOLUME_ID] --size 1000
```

## Security Hardening

### Essential Steps
1. **Disable root SSH**: Create sudo user
2. **Configure firewall**: Only open necessary ports
3. **Enable fail2ban**: Prevent brute force attacks
4. **Regular updates**: `unattended-upgrades`
5. **Secure RPC**: Restrict Bitcoin RPC access

```bash
# Quick security setup
apt-get install -y fail2ban unattended-upgrades

# Configure fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Enable automatic security updates
dpkg-reconfigure -plow unattended-upgrades
```

## Cost Optimization Tips

1. **Use Reserved Droplets**: Save 20% with yearly commitment
2. **Object Storage for Backups**: Cheaper than block storage
3. **CDN for Dashboard**: Serve static files from CDN
4. **Monitoring Alerts**: Prevent overages with usage alerts

## Support & Monitoring

- DigitalOcean Monitoring: Enable in droplet settings
- Status Page: Set up uptime monitoring (UptimeRobot, etc.)
- Alerts: Configure for disk space, CPU, memory
- Logs: Ship to centralized logging (optional)

---

## Quick Start Commands Reference

```bash
# SSH to server
ssh root@YOUR_IP

# Check status
diesel-monitor.sh

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Restart services
docker-compose -f docker-compose.production.yml restart

# Update code
cd /opt/diesel-dashboard && git pull
docker-compose -f docker-compose.production.yml up -d --build

# Backup data
diesel-backup.sh
```

---

**Note**: This deployment will begin syncing immediately. Bitcoin Core will take 12-24 hours to fully sync the blockchain, and Metashrew will then take another 6-12 hours to index from block 871100. The dashboard will show mock data until Metashrew completes its initial sync.