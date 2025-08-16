# DIESEL Collaborative Distribution Dashboard

Production-ready dashboard for monitoring DIESEL token collaborative distribution on the Alkanes protocol. Features real-time mint tracking, distribution analytics, TVL monitoring, and alert systems.

## 🚀 Features

- **Real-time Mint Tracking**: Monitor collaborative distribution participation in real-time
- **Distribution Analytics**: Gini coefficient calculation and holder distribution metrics
- **TVL Monitoring**: Track Total Value Locked in OYL AMM pools
- **Alert System**: Notifications for large claims, low participation, and halvings
- **Production Ready**: Built with caching, rate limiting, and high-traffic optimization
- **WebSocket Support**: Real-time updates with <2 second latency

## 📊 Architecture

```
diesel/
├── dashboard/          # React + Vite frontend
│   ├── src/
│   │   ├── components/   # Dashboard UI components
│   │   ├── services/     # API and data services
│   │   ├── hooks/        # React Query hooks
│   │   └── utils/        # BigInt utilities
│   └── vercel.json       # Frontend deployment config
│
├── api/               # Express backend API
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Caching, rate limiting
│   │   └── services/     # WebSocket, monitoring
│   └── vercel.json       # API deployment config
│
└── deploy.sh          # Production deployment script
```

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- TanStack Query (React Query) for data fetching
- Recharts for data visualization
- Tailwind CSS for styling
- Vite for fast development

### Backend
- Node.js + Express API server
- Redis caching layer (optional)
- Rate limiting with express-rate-limit
- WebSocket support for real-time updates
- Helmet for security headers

### Infrastructure
- Vercel deployment (serverless)
- CORS proxy for Alkanes RPC
- Environment-based configuration
- Production monitoring & metrics

## 🚀 Quick Start

### Local Development

1. **Clone and install dependencies:**
```bash
# Install dashboard dependencies
cd dashboard
npm install

# Install API dependencies
cd ../api
npm install
```

2. **Configure environment variables:**
```bash
# Copy example configs
cp dashboard/.env dashboard/.env.local
cp api/.env.example api/.env
```

3. **Start development servers:**
```bash
# Terminal 1: Start API server
cd api
npm run dev

# Terminal 2: Start dashboard
cd dashboard
npm run dev
```

Dashboard will be available at http://localhost:5173

## 🌐 Production Deployment

### Prerequisites
- Vercel account (free tier works)
- Node.js 18+
- Vercel CLI (`npm i -g vercel`)

### Deploy to Vercel

1. **Run deployment script:**
```bash
chmod +x deploy.sh
./deploy.sh
# Choose option 3 to deploy both API and dashboard
```

2. **Configure environment variables in Vercel:**

**API Environment Variables:**
```
ALKANES_RPC_URL=http://alkanes.andr0x.com:18332
REDIS_URL=redis://your-redis-url (optional)
CORS_ORIGIN=https://your-dashboard-url.vercel.app
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
CACHE_TTL=60
```

**Dashboard Environment Variables:**
```
VITE_API_BASE_URL=https://your-api-url.vercel.app
VITE_WS_URL=wss://your-api-url.vercel.app/ws
VITE_ENABLE_MAINNET=true
VITE_ENABLE_WEBSOCKET=true
VITE_ALERT_THRESHOLD=1000
```

3. **Update production URLs:**
- Update `CORS_ORIGIN` in API settings
- Update `VITE_API_BASE_URL` in dashboard settings

## 📡 API Endpoints

### Alkanes Proxy
- `GET /api/alkanes/blockchain-info` - Current blockchain information
- `GET /api/alkanes/protorunes/:height` - Protorunes at specific height
- `GET /api/alkanes/address/:address` - Protorunes for address
- `GET /api/alkanes/participation/current` - Current block participation
- `GET /api/alkanes/participation/trends` - Historical participation trends

### DIESEL Specific
- `GET /api/diesel/stats` - Token emission and supply statistics
- `GET /api/diesel/distribution` - Holder distribution metrics
- `GET /api/diesel/tvl` - Total Value Locked data
- `GET /api/diesel/alerts` - Active alerts and warnings
- `GET /api/diesel/mint-history/:address` - Address mint history

### WebSocket Events
- `new_block` - New block detected
- `new_mint` - DIESEL mint detected
- `large_claim` - Large reward opportunity
- `halving_soon` - Halving approaching

## 🔧 Configuration

### Cache TTL Settings
```javascript
// api/.env
CACHE_TTL=60  // Seconds to cache responses
```

### Rate Limiting
```javascript
// api/.env
RATE_LIMIT_WINDOW=15  // Minutes
RATE_LIMIT_MAX=100    // Max requests per window
```

### Alert Thresholds
```javascript
// dashboard/.env
VITE_ALERT_THRESHOLD=1000  // DIESEL amount for large claim alerts
```

## 📈 Performance Optimization

- **Caching**: Redis caching with 60s TTL for expensive queries
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CDN**: Static assets served via Vercel Edge Network
- **Code Splitting**: Lazy loading for optimal bundle size
- **BigInt Handling**: Native BigInt for precision without libraries

## 🔒 Security

- CORS protection with configurable origins
- Rate limiting to prevent abuse
- Helmet.js security headers
- Environment variable secrets
- Input validation with Zod schemas

## 📊 Monitoring

Access metrics at `/api/metrics`:
```json
{
  "totalRequests": 1234,
  "avgResponseTime": 45,
  "statusCodes": {
    "200": 1200,
    "429": 34
  },
  "uptime": 3600
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues or questions:
- Open an issue on GitHub
- Check Alkanes documentation at https://alkanes.build
- Join the DIESEL community Discord

## 🎯 Roadmap

- [ ] Historical chart improvements
- [ ] Mobile responsive design
- [ ] Multi-wallet support
- [ ] Advanced filtering options
- [ ] Export functionality
- [ ] Notification preferences

---

Built with ❤️ for the DIESEL community

SmokeDev 2024