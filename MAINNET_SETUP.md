# 🚀 DIESEL Dashboard - Mainnet Production Setup

## 🔑 CRITICAL: Get Your Sandshrew API Key

The dashboard requires a **Sandshrew API key** to connect to the Alkanes mainnet and fetch real DIESEL token data.

### Step 1: Sign Up for Sandshrew

1. **Go to:** https://www.sandshrew.io
2. **Click "Sign Up"** (top right)
3. **Create your account** with email/password
4. **Verify your email** (check spam folder if needed)

### Step 2: Get Your API Key

1. **Log in** to your Sandshrew account
2. **Navigate to Dashboard** → **API Keys**
3. **Click "Create New API Key"**
4. **Copy your API key** (looks like: `sandshrew_k1_abc123...`)
5. **IMPORTANT:** Save this key securely - you won't be able to see it again!

### Step 3: Configure Your Environment

Update your `.env` file in the `api` folder:

```bash
# Navigate to the API directory
cd E:\v2 repo\diesel\api

# Copy the example env file if you haven't already
cp .env.example .env

# Edit .env and add your Sandshrew API key
```

In your `.env` file, update these values:

```env
# Sandshrew API Configuration (REQUIRED FOR MAINNET)
SANDSHREW_API_KEY=sandshrew_k1_YOUR_ACTUAL_KEY_HERE
SANDSHREW_NETWORK=mainnet

# Set production environment
NODE_ENV=production
```

## 🌐 Deploy to Production

### Option 1: Deploy to Vercel (Recommended)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy the API:**
```bash
cd E:\v2 repo\diesel\api
vercel --prod
```

3. **Deploy the Dashboard:**
```bash
cd E:\v2 repo\diesel\dashboard
vercel --prod
```

4. **Set Environment Variables in Vercel:**
- Go to your Vercel dashboard
- Select your project
- Go to Settings → Environment Variables
- Add `SANDSHREW_API_KEY` with your actual key
- Add `SANDSHREW_NETWORK` set to `mainnet`

### Option 2: Deploy to Netlify

1. **Build the dashboard:**
```bash
cd E:\v2 repo\diesel\dashboard
npm run build
```

2. **Deploy with Netlify CLI:**
```bash
netlify deploy --prod --dir=dist
```

3. **Deploy API separately** (Netlify Functions or separate service)

### Option 3: Self-Host with Docker

1. **Build and run with Docker Compose:**
```bash
cd E:\v2 repo\diesel
docker-compose -f docker-compose.yml up -d
```

## 🧪 Test Your Connection

After setting up your API key, test the connection:

```bash
# Start the API locally with your Sandshrew key
cd E:\v2 repo\diesel\api
npm run dev

# In another terminal, test the endpoint
curl http://localhost:3001/api/alkanes/blockchain-info
```

You should see real mainnet blockchain data if configured correctly.

## 📊 Available Sandshrew RPC Methods

Your dashboard uses these Sandshrew/Alkanes RPC methods:

- `getblockchaininfo` - Current blockchain state
- `protorunesbyaddress` - Get protorunes balance for an address
- `protorunesbyheight` - Get protorunes at specific block height
- `protorunesbyoutpoint` - Get protorunes by UTXO

## 🎯 What Your Dashboard Shows

Once connected to mainnet with your Sandshrew API key:

1. **Real-time DIESEL Distribution**
   - Live participant count
   - Current reward per claimant
   - Total supply distributed

2. **Distribution Metrics**
   - Gini coefficient (inequality measure)
   - Top holder concentration
   - Participation trends over time

3. **TVL Analytics**
   - Total value locked in DIESEL
   - Historical TVL charts
   - Liquidity pool metrics

4. **Smart Alerts**
   - Whale movements
   - Distribution anomalies
   - Network health indicators

## 🔒 Security Notes

- **NEVER** commit your API key to Git
- **ALWAYS** use environment variables
- **ROTATE** your API key if exposed
- **MONITOR** your Sandshrew usage (check dashboard for limits)

## 📈 Sandshrew Pricing

- **Free Tier:** 100,000 requests/month
- **Pro:** $49/month for 1M requests
- **Business:** Custom pricing for higher volumes

Your DIESEL dashboard with caching should easily stay within free tier limits for moderate traffic.

## 🆘 Troubleshooting

### "RPC connection failed"
- Check your API key is correctly set in `.env`
- Verify the key starts with `sandshrew_k1_`
- Ensure you're using the correct network (mainnet/signet/testnet)

### "Invalid API key"
- Log in to sandshrew.io and verify your key is active
- Check for typos or extra spaces in the `.env` file
- Try regenerating a new API key

### "Rate limit exceeded"
- Enable Redis caching in production
- Increase cache TTL in `.env`
- Consider upgrading your Sandshrew plan

## 📞 Support

- **Sandshrew Support:** https://discord.gg/sandshrew
- **Alkanes Discord:** https://discord.gg/anPUpQtPzg
- **Dashboard Issues:** Create an issue in your repo

---

## ✅ Production Checklist

- [ ] Sandshrew account created
- [ ] API key obtained and saved
- [ ] `.env` file configured with API key
- [ ] Local testing confirms mainnet connection
- [ ] Redis configured for production caching
- [ ] Dashboard deployed to hosting service
- [ ] Environment variables set in hosting platform
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Monitoring/analytics setup

🎉 **Your DIESEL dashboard is ready for mainnet!**

-SmokeDev