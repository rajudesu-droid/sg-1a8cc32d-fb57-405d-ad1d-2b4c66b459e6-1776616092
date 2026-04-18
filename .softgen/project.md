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

## Implementation Status
**Completed:**
- ✅ Full database schema with multi-chain asset support
- ✅ RLS policies for all tables
- ✅ Professional design system with custom color palette
- ✅ Complete navigation and layout structure
- ✅ Enhanced dashboard with comprehensive earnings metrics:
  * Daily/Monthly realized vs projected earnings
  * 30-day projected earnings with explanatory tooltips
  * Portfolio value, deployed capital, idle capital
  * Network-grouped balances with asset breakdown
  * Connected wallets summary
  * Mode-specific labeling (Demo/Shadow/Live)
- ✅ Opportunities explorer with filtering and risk scoring
- ✅ Position management with health tracking
- ✅ Automation & policy configuration interface
- ✅ Withdrawal optimizer with cost breakdown
- ✅ Demo portfolio with manual asset management
- ✅ Settings page for chains, DEXes, and preferences

**Ready for:**
- Backend service integration (opportunity scanner, scoring engine)
- Wallet connection implementation
- Real-time data feeds and price oracles
- DEX protocol adapters (Uniswap V3, PancakeSwap V3)
- Simulation engine logic
- Live execution engine with transaction signing