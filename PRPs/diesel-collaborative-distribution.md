# PRP: DIESEL Collaborative Distribution Dashboard

## Goal
Implement comprehensive analytics and visualization features for DIESEL's new collaborative distribution mechanism, where block rewards are split equally among all claimants rather than winner-takes-all, emphasizing protocol utilization, community participation, and liquidity seeding.

## Why
- **Economic Redesign**: DIESEL has undergone a fundamental shift from competitive to collaborative distribution, requiring new analytics
- **Community Growth**: Equal reward distribution encourages broader participation and reduces barriers to entry
- **Protocol Health**: TVL tracking and liquidity metrics are critical for DeFi ecosystem sustainability
- **User Empowerment**: Transparent distribution analytics help users make informed participation decisions
- **Builder Integration**: APIs and real-time data feeds enable third-party applications and analysis tools

## What

### Description
A real-time analytics dashboard that tracks collaborative DIESEL distribution, community participation metrics, OYL AMM TVL, and provides alerts for significant events, all with sub-2-second latency and BigInt precision.

### Success Criteria
- [ ] Real-time mint participation tracking with <2 second latency
- [ ] Accurate TVL calculations for OYL AMM pools (8 decimal precision)
- [ ] Distribution equality metrics (Gini coefficient, participation rates)
- [ ] Interactive visualizations updating live via WebSocket
- [ ] Alert system triggering within 1 block of significant events
- [ ] All calculations use BigInt to prevent precision loss
- [ ] Builder API with comprehensive documentation
- [ ] Mobile-responsive design with smooth animations

### User Stories
- As a DIESEL minter, I want to see how many other participants are claiming in each block so I can understand my expected rewards
- As a liquidity provider, I want to track TVL and APY in OYL pools to optimize my positions
- As a protocol analyst, I want to monitor distribution equality metrics to assess decentralization
- As a developer, I want WebSocket feeds and APIs to build on top of DIESEL data
- As a whale tracker, I want alerts when large claims occur or unusual patterns emerge

## Context

### Documentation
- [Alkanes Protocol Docs](https://alkanes.build/docs) - Core protocol mechanics
- [OYL AMM Documentation](https://docs.oyl.io) - Liquidity pool interfaces and TVL calculation
- [DIESEL Upgraded Genesis Contract](crates/alkanes-std-genesis-alkane-upgraded/src/lib.rs) - Collaborative distribution implementation
- [Metashrew RPC API](https://docs.sandshrew.io) - Blockchain data indexing

### Existing Code
- `src/services/alkanes-rpc-fixed.ts` - RPC service for blockchain queries
- `src/services/emission-calculator.ts` - DIESEL emission formula implementation
- `src/types/diesel.ts` - Core type definitions with BigInt support
- `src/components/DieselLiveData.tsx` - Current live data component

### Gotchas
- **BigInt Serialization**: JSON.stringify doesn't handle BigInt natively - must use custom replacer
- **CORS Issues**: Local Docker stack requires Vite proxy configuration
- **RPC Methods**: Use `protorunesbyaddress`, not `getAlkaneById` (doesn't exist)
- **Treasury Cap**: OYL treasury receives DIESEL based on fees, capped at 50% of block reward
- **One Mint Per TX**: Collaborative distribution enforces single mint per transaction
- **Block Timing**: Bitcoin blocks are ~10 minutes, affecting real-time update strategies

### Current State
The DIESEL dashboard currently shows:
- Token information (supply, cap, genesis block)
- Basic emission calculations
- Connection to local Docker stack via proxy
- BigInt utilities for hex conversion

Missing features:
- Collaborative distribution analytics
- TVL tracking for OYL pools
- Real-time WebSocket updates
- Distribution visualizations
- Alert system
- Builder integration

### Dependencies
```json
{
  "recharts": "^2.x",           // For charts and visualizations
  "d3": "^7.x",                 // Advanced visualizations
  "socket.io-client": "^4.x",   // WebSocket connections
  "date-fns": "^3.x",           // Date/time utilities
  "react-query": "^3.x",        // Data fetching and caching
  "zustand": "^4.x"             // State management
}
```

### Environment Variables
```bash
VITE_ALKANES_RPC_URL=/rpc        # Alkanes RPC endpoint
VITE_OYL_API_URL=                # OYL AMM API endpoint
VITE_WS_URL=ws://localhost:8081  # WebSocket server
VITE_ALERT_THRESHOLD=1000        # DIESEL amount for large claim alerts
```

## Implementation Blueprint

### Phase 1: Collaborative Distribution Tracker

#### Task 1.1: Mint Participation Service
**Files**: `src/services/mint-tracker.ts`
```typescript
export class MintTracker {
  // Track claimants per block
  async getBlockClaimants(blockHeight: bigint): Promise<ClaimantData[]>
  // Calculate equal reward distribution
  calculateRewardPerClaimant(blockReward: bigint, claimantCount: bigint): bigint
  // Get participation trends over time
  async getParticipationTrends(startBlock: bigint, endBlock: bigint): Promise<TrendData>
}
```

#### Task 1.2: Distribution Metrics Calculator
**Files**: `src/services/distribution-metrics.ts`
```typescript
export class DistributionMetrics {
  // Calculate Gini coefficient for distribution equality
  calculateGiniCoefficient(balances: bigint[]): number
  // Categorize addresses (whale/dolphin/shrimp)
  categorizeHolders(balances: TokenBalance[]): HolderCategories
  // Track first-time vs veteran minters
  async analyzeParticipantHistory(addresses: string[]): Promise<ParticipantAnalysis>
}
```

#### Task 1.3: Real-time Mint Monitor Component
**Files**: `src/components/MintMonitor.tsx`
```typescript
export function MintMonitor() {
  // Display current block claimants
  // Show reward per participant
  // Live update via WebSocket
  // Animated entry/exit of participants
}
```

### Phase 2: TVL & Liquidity Analytics

#### Task 2.1: OYL Pool Service
**Files**: `src/services/oyl-pools.ts`
```typescript
export class OylPoolService {
  // Get pool reserves and calculate TVL
  async getPoolTVL(poolId: AlkaneId): Promise<TVLData>
  // Calculate pool APY based on fees and volume
  calculateAPY(poolData: PoolData): number
  // Track liquidity provider positions
  async getLPPositions(address: string): Promise<LPPosition[]>
}
```

#### Task 2.2: TVL Aggregator
**Files**: `src/services/tvl-aggregator.ts`
```typescript
export class TVLAggregator {
  // Aggregate TVL across all DIESEL pools
  async getTotalTVL(): Promise<bigint>
  // Track TVL changes over time
  async getTVLHistory(timeRange: TimeRange): Promise<TVLHistory>
  // Get top liquidity providers
  async getTopLPs(limit: number): Promise<LPRanking[]>
}
```

#### Task 2.3: Liquidity Dashboard Component
**Files**: `src/components/LiquidityDashboard.tsx`
```typescript
export function LiquidityDashboard() {
  // Display total TVL with sparkline
  // Show individual pool metrics
  // LP rankings and positions
  // APY calculations and projections
}
```

### Phase 3: Distribution Visualizations

#### Task 3.1: Pie Chart Component
**Files**: `src/components/charts/DistributionPieChart.tsx`
```typescript
export function DistributionPieChart() {
  // Interactive pie chart using Recharts
  // Whale vs dolphin vs shrimp distribution
  // Click to drill down into categories
  // Animated transitions
}
```

#### Task 3.2: Treasury Tracker
**Files**: `src/components/TreasuryTracker.tsx`
```typescript
export function TreasuryTracker() {
  // Track OYL treasury DIESEL allocation
  // Show fee-based rewards (50% cap)
  // Historical treasury growth
  // Projection models
}
```

#### Task 3.3: Time Series Charts
**Files**: `src/components/charts/TimeSeriesChart.tsx`
```typescript
export function TimeSeriesChart() {
  // Participation over time
  // Distribution equality evolution
  // TVL growth trajectory
  // Configurable time ranges
}
```

### Phase 4: Alert System

#### Task 4.1: Alert Service
**Files**: `src/services/alert-service.ts`
```typescript
export class AlertService {
  // Monitor for large claims
  async checkLargeClaims(threshold: bigint): Promise<Alert[]>
  // Detect unusual participation patterns
  detectAnomalies(data: ParticipationData): Anomaly[]
  // Treasury cap warnings
  checkTreasuryCap(treasuryAmount: bigint, blockReward: bigint): boolean
}
```

#### Task 4.2: Notification Manager
**Files**: `src/services/notification-manager.ts`
```typescript
export class NotificationManager {
  // Push browser notifications
  // Email alerts (optional)
  // Discord/Telegram webhooks
  // Alert history and management
}
```

#### Task 4.3: Alert Dashboard Component
**Files**: `src/components/AlertDashboard.tsx`
```typescript
export function AlertDashboard() {
  // Display active alerts
  // Alert configuration UI
  // Historical alert timeline
  // Snooze/dismiss functionality
}
```

### Phase 5: WebSocket Integration

#### Task 5.1: WebSocket Manager
**Files**: `src/services/websocket-manager.ts`
```typescript
export class WebSocketManager {
  // Auto-reconnect logic
  // Heartbeat/ping-pong
  // Message queuing during disconnection
  // Event emitter for updates
}
```

#### Task 5.2: Real-time Hooks
**Files**: `src/hooks/useRealtimeData.ts`
```typescript
export function useRealtimeMints() { /* Subscribe to mint updates */ }
export function useRealtimeTVL() { /* Subscribe to TVL changes */ }
export function useRealtimeAlerts() { /* Subscribe to alert stream */ }
```

### Phase 6: Builder Integration

#### Task 6.1: Public API Endpoints
**Files**: `src/api/public-endpoints.ts`
```typescript
// GET /api/distribution/current - Current block distribution
// GET /api/tvl/pools - Pool TVL data
// GET /api/participants/stats - Participation metrics
// WebSocket /ws/subscribe - Real-time subscriptions
```

#### Task 6.2: SDK Package
**Files**: `packages/diesel-sdk/`
```typescript
export class DieselSDK {
  // Initialize with API key
  // Subscribe to events
  // Query historical data
  // Calculate projections
}
```

#### Task 6.3: Developer Documentation
**Files**: `docs/api/`
- API reference with examples
- WebSocket event specifications
- Rate limiting and authentication
- Integration tutorials

## Validation

### Level 1: Syntax & Linting
```bash
npm run lint                    # ESLint checks
npm run typecheck              # TypeScript validation
npm run format                 # Prettier formatting
```

### Level 2: Unit Tests
```bash
# Test emission calculations
npm test emission-calculator.test.ts

# Test distribution metrics
npm test distribution-metrics.test.ts

# Test BigInt utilities
npm test bigint-utils.test.ts

# Test alert thresholds
npm test alert-service.test.ts
```

### Level 3: Integration Tests
```bash
# Test RPC connections
npm run test:integration rpc-integration.test.ts

# Test WebSocket connectivity
npm run test:integration websocket.test.ts

# Test TVL calculations against known values
npm run test:integration tvl-validation.test.ts
```

### Level 4: End-to-End Tests
```bash
# Start development environment
npm run dev

# Run Playwright tests
npm run test:e2e

# Manual validation checklist:
# [ ] Mint participation updates in real-time
# [ ] TVL calculations match on-chain data
# [ ] Distribution pie chart renders correctly
# [ ] Alerts trigger for large claims
# [ ] WebSocket reconnects after disconnection
# [ ] Mobile responsive design works
# [ ] API endpoints return correct data
```

## Additional Context

### Security Considerations
- **Input Validation**: Sanitize all user inputs and RPC responses
- **Rate Limiting**: Implement rate limiting on API endpoints
- **BigInt Safety**: Always validate BigInt operations for overflow
- **CORS Policy**: Properly configure CORS for production
- **WebSocket Security**: Implement authentication for WebSocket connections

### Performance Optimizations
- **Data Caching**: Use React Query for intelligent caching
- **Pagination**: Implement pagination for large data sets
- **Virtualization**: Use react-window for long lists
- **Web Workers**: Offload heavy calculations to workers
- **Debouncing**: Debounce rapid WebSocket updates

### Monitoring & Analytics
- **Error Tracking**: Integrate Sentry for error monitoring
- **Performance Metrics**: Track Core Web Vitals
- **Usage Analytics**: Monitor feature adoption
- **A/B Testing**: Test different visualization approaches

### Future Enhancements
- **AI Predictions**: ML models for participation forecasting
- **Social Features**: Leaderboards and achievements
- **Mobile App**: Native iOS/Android applications
- **Cross-chain**: Track DIESEL on other chains (if bridged)
- **Governance**: Voting dashboard for protocol decisions

---

## Acceptance Criteria Checklist

- [ ] All amounts use BigInt throughout the application
- [ ] WebSocket updates occur within 2 seconds of blockchain events
- [ ] TVL calculations accurate to 8 decimal places
- [ ] Distribution equality metrics update every block
- [ ] Alert system triggers within 1 block of threshold breach
- [ ] API documentation complete with examples
- [ ] Mobile responsive design tested on major devices
- [ ] All validation gates pass successfully
- [ ] Performance metrics meet targets (LCP < 2.5s, FID < 100ms)
- [ ] Security audit completed with no critical issues

---

*This PRP comprehensively addresses the collaborative DIESEL distribution features, emphasizing community participation, protocol utilization, and liquidity metrics. The implementation focuses on real-time accuracy, visual clarity, and developer accessibility.*