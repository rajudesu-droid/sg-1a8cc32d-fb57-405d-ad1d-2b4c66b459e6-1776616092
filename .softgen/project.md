# LP Yield Autopilot

## Vision
A professional-grade, non-custodial Web3 LP yield automation platform. Enables users to discover, deploy, and optimize liquidity provision across DeFi protocols with policy-driven automation, comprehensive risk controls, and full transparency.

**Target Users**: DeFi operators seeking systematic LP management with professional risk controls and automation.

## Design
**Color Palette:**
- `--background: 210 60% 10% (deep navy #0A1628)` — primary surface
- `--foreground: 210 20% 98% (off-white)` — primary text
- `--primary: 188 94% 43% (cyan #06B6D4)` — yields, active states, CTAs
- `--accent: 43 96% 56% (amber #F59E0B)` — warnings, alerts
- `--success: 158 64% 52% (emerald #10B981)` — profitable positions
- `--muted: 210 40% 20% (dark slate)` — secondary surfaces
- `--card: 210 50% 15% (navy card)` — elevated surfaces

**Typography:**
- Headings: Inter (600, 700)
- Body: Inter (400, 500)
- Data/Mono: JetBrains Mono (400, 500) — addresses, numbers, data tables

**Style Direction:**
Professional DeFi terminal aesthetic. Grid-based layouts, precision data displays, color-coded risk indicators, subtle card elevations, micro-interactions on hover/active states.

## Features
**Core Capabilities:**
1. Multi-mode operation: Demo (simulation), Shadow (read-only), Live (automated)
2. Universal multi-chain asset support (EVM, Solana, TRON, Bitcoin, XRPL)
3. LP opportunity discovery with risk-adjusted scoring
4. Policy-driven automation (harvest, compound, rebalance)
5. Optimized withdrawal planning
6. Comprehensive audit logging

**Key Screens:**
- Dashboard: Portfolio overview, active positions, yield metrics
- Opportunities: Scored LP pools with filtering and sorting
- Position Detail: Range status, IL tracking, action history
- Automation Rules: Policy configuration and guardrails
- Withdraw: Optimized unwind planning
- Demo Portfolio: Manual asset management and simulation
- Settings: Chain/DEX preferences, notifications, policies

## Architecture

### Centralized Engine-Based System
The application uses a **coordinated engine architecture** where all business logic, data flow, and synchronization is managed through specialized engines:

**Core Components:**
1. **Central Orchestrator** (`src/core/orchestrator/`):
   - Master coordinator for the entire app
   - Routes events between engines
   - Enforces business rules
   - Prevents conflicting updates

2. **Domain Engines** (`src/core/engines/`):
   - WalletEngine: Connection, asset detection, balances
   - PortfolioEngine: Metrics, capital tracking, earnings
   - OpportunityEngine: Pool scanning, scoring, ranking
   - PositionEngine: LP lifecycle, health monitoring
   - RewardsEngine: Calculation, harvest, compound
   - WithdrawalEngine: Analysis, optimization, execution
   - PolicyEngine: Rules, thresholds, guardrails

3. **Sync Engine** (`src/core/sync/`):
   - Keeps all pages synchronized
   - Propagates changes automatically
   - Prevents stale data
   - Cache invalidation

4. **Code Impact Engine** (`src/core/analysis/`):
   - Dependency mapping
   - Change impact analysis
   - Circular dependency detection
   - Module relationship tracking

5. **Shared Contracts** (`src/core/contracts/`):
   - Single source of truth for types
   - No duplicate type definitions
   - Enforced consistency

6. **Centralized Store** (`src/store/`):
   - Zustand-based global state
   - Mode, wallet, portfolio, positions
   - Automatic UI updates

**Architecture Principles:**
- ✅ Single source of truth
- ✅ No logic duplication
- ✅ Automatic synchronization
- ✅ Deterministic data flow
- ✅ Modular but coordinated

## Implementation Status
**Completed:**
- ✅ Full database schema with multi-chain asset support
- ✅ RLS policies for all tables
- ✅ Professional design system with custom color palette
- ✅ Complete navigation and layout structure
- ✅ Enhanced dashboard with comprehensive earnings KPIs:
  * Daily Earnings: Realized + Projected breakdown
  * Monthly Earnings: Current month realized + projected
  * Realized Earnings: All-time claimed fees/rewards
  * Projected 30-Day: Forward-looking estimate
  * Mode-aware labeling: Demo (Simulated) / Shadow (Estimated) / Live (Realized + Projected)
  * Calculation notes under each KPI explaining data source
  * Portfolio value, deployed capital, idle capital, net APY
  * Network-grouped balances with asset breakdown
  * Connected wallets summary
  * Info tooltips with methodology explanations
- ✅ Opportunities explorer with filtering and risk scoring
- ✅ Position management with health tracking
- ✅ Automation & policy configuration interface with full functionality
- ✅ Withdrawal optimizer with cost breakdown
- ✅ Demo portfolio with manual asset management
- ✅ Settings page for chains, DEXes, and preferences
- ✅ Secure Web3 wallet connection module:
  * QR-based mobile wallet connection via WalletConnect
  * Non-custodial architecture (no private key storage)
  * Multi-chain support (Ethereum, BSC, Polygon, Avalanche)
  * Auto-detection of native assets and tokens
  * Network-grouped asset display
  * Same-symbol tokens separated by network (USDT-ETH, USDT-BSC, etc.)
  * Connected wallet summary in header and dashboard
  * Wallets page with full asset management
  * Security notices and best practices
- ✅ **Centralized Engine Architecture**:
  * Central Orchestrator for app-wide coordination
  * 7 domain engines (Wallet, Portfolio, Opportunity, Position, Rewards, Withdrawal, Policy)
  * Sync Engine for automatic page synchronization
  * Code Impact Engine for dependency analysis
  * Shared contracts layer (single source of truth for types)
  * Centralized Zustand store
  * Event-driven architecture with publish/subscribe
  * No logic duplication across pages
  * Automatic change propagation
  * Full dependency mapping
  * Architecture documentation in README.md

**Ready for:**
- Backend service integration (opportunity scanner, scoring engine)
- Real-time price feeds and token metadata APIs
- DEX protocol adapters (Uniswap V3, PancakeSwap V3)
- Simulation engine logic
- Live execution engine with transaction signing
- Production WalletConnect project ID configuration
- Integration of engines with live data sources