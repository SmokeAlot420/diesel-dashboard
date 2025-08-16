# DIESEL Dashboard - Self-Hosted Edition

Real-time analytics dashboard for DIESEL token on the Alkanes protocol - now with full self-hosted Bitcoin node and Metashrew indexer support.

## 🚀 What's New in Self-Hosted Edition

- **No API Dependencies**: Run your own Bitcoin node and Metashrew indexer
- **Zero API Costs**: Goodbye expensive Sandshrew API fees
- **Full Data Control**: Your node, your data, your sovereignty  
- **Production Ready**: Deploy to DigitalOcean in minutes
- **Mainnet Support**: Direct connection to Bitcoin mainnet

## 📊 Architecture

```
Bitcoin Network
      ↓
Your Bitcoin Core Node (Full mainnet sync)
      ↓
Metashrew Indexer (DIESEL data extraction)
      ↓
Express API Server
      ↓
React Dashboard
```

## 🚀 Quick Deploy to DigitalOcean

### 1. Create Droplet
```bash
# Recommended: 16GB RAM, 4 vCPU, 1TB storage
# Cost: ~$96/month droplet + $100/month storage
```

### 2. Deploy with One Command
```bash
ssh root@YOUR_DROPLET_IP
wget https://raw.githubusercontent.com/SmokeAlot420/diesel-dashboard/main/deploy-digitalocean.sh
chmod +x deploy-digitalocean.sh
./deploy-digitalocean.sh
```

### 3. Monitor Sync Progress
```bash
diesel-monitor.sh  # Custom monitoring script
```

That's it! The system will:
- Install Docker and dependencies
- Set up Bitcoin Core (mainnet)
- Start Metashrew indexer from block 871100
- Deploy API and dashboard
- Configure automated backups

## ⏱️ Sync Timeline

- **Bitcoin Core**: 12-24 hours (full blockchain)
- **Metashrew**: 6-12 hours (from DIESEL genesis)
- **Total**: 24-36 hours to production

## 💻 Local Development

```bash
# Clone repo
git clone https://github.com/SmokeAlot420/diesel-dashboard.git
cd diesel-dashboard

# Start with Docker Compose
docker-compose -f docker-compose-mainnet.yml up -d

# Start API
cd api && npm install && npm run dev

# Start Dashboard
cd dashboard && npm install && npm run dev
```

## 🔧 Configuration

### Required Environment Variables
```env
# Bitcoin RPC
BITCOIN_RPC_USER=degenrpc
BITCOIN_RPC_PASSWORD=your_secure_password

# Metashrew
START_BLOCK=871100  # DIESEL genesis

# API
API_PORT=3001
METASHREW_URL=http://metashrew:8180

# Dashboard
VITE_API_URL=https://api.diesel.yourdomain.com
```

## 📈 Features

- **Distribution Analytics**: Real-time DIESEL token distribution
- **Collaborative Mints**: Track participation metrics
- **TVL Monitoring**: Total Value Locked in pools
- **Alert System**: Large claims, halvings, low participation
- **WebSocket Updates**: Real-time block notifications
- **Historical Data**: Complete history from genesis

## 🛡️ Security

- Self-hosted = No third-party dependencies
- Configurable firewall rules
- SSL/TLS with Let's Encrypt
- Automated backups
- Rate limiting and CORS protection

## 📊 API Endpoints

### Core Endpoints
- `GET /health` - System health check
- `GET /sync-status` - Indexer sync progress
- `GET /real-sync-status` - Live sync from logs

### DIESEL Data
- `POST /rpc` - Metashrew RPC proxy
- WebSocket at `ws://YOUR_IP:3001` for real-time updates

## 🚢 Deployment Options

### Option 1: DigitalOcean (Recommended)
- See [DIGITALOCEAN_DEPLOYMENT.md](./DIGITALOCEAN_DEPLOYMENT.md)
- ~$200/month for production setup

### Option 2: Any VPS with Docker
```bash
docker-compose -f docker-compose.production.yml up -d
```

### Option 3: Bare Metal
- Requires 1TB+ storage
- 16GB+ RAM recommended
- Ubuntu 22.04 or similar

## 📚 Documentation

- [DigitalOcean Deployment Guide](./DIGITALOCEAN_DEPLOYMENT.md)
- [Docker Setup](./docker-compose.production.yml)
- [API Documentation](./api/README.md)
- [Dashboard Documentation](./dashboard/README.md)

## 🤝 Contributing

PRs welcome! Please:
1. Fork the repo
2. Create feature branch
3. Test thoroughly
4. Submit PR with clear description

## 📄 License

MIT - See LICENSE file

## 🙏 Acknowledgments

- Alkanes Protocol team
- Bitcoin Core developers  
- Metashrew contributors
- DIESEL community

---

**Built by SmokeDev** | No more API fees, just pure sovereignty 🚀