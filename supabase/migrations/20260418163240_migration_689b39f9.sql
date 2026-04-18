-- LP Yield Autopilot Database Schema

-- =====================================================
-- PROFILES (extends auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PORTFOLIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('demo', 'shadow', 'live')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ASSETS (Universal Multi-Chain Asset Identity)
-- =====================================================
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  
  -- Chain identification
  chain_family TEXT NOT NULL CHECK (chain_family IN ('evm', 'solana', 'tron', 'bitcoin', 'xrpl')),
  network TEXT NOT NULL,
  
  -- Asset classification
  asset_kind TEXT NOT NULL CHECK (asset_kind IN ('native', 'token', 'lp', 'position')),
  token_standard TEXT,
  
  -- Unique identifiers
  contract_address TEXT,
  mint_address TEXT,
  issuer TEXT,
  currency_code TEXT,
  
  -- Metadata
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  decimals INTEGER NOT NULL DEFAULT 18,
  logo_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(portfolio_id, chain_family, network, asset_kind, contract_address, mint_address, issuer, currency_code)
);

-- =====================================================
-- BALANCES
-- =====================================================
CREATE TABLE IF NOT EXISTS balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  
  quantity DECIMAL(36, 18) NOT NULL DEFAULT 0,
  price_override DECIMAL(18, 8),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(portfolio_id, asset_id)
);

-- =====================================================
-- SUPPORTED POOLS (Whitelisted LP Opportunities)
-- =====================================================
CREATE TABLE IF NOT EXISTS supported_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  chain_family TEXT NOT NULL,
  network TEXT NOT NULL,
  dex TEXT NOT NULL,
  pool_address TEXT NOT NULL,
  
  -- Pair information
  token0_symbol TEXT NOT NULL,
  token0_address TEXT NOT NULL,
  token1_symbol TEXT NOT NULL,
  token1_address TEXT NOT NULL,
  fee_tier INTEGER NOT NULL,
  
  -- Pool type
  pool_type TEXT NOT NULL CHECK (pool_type IN ('concentrated', 'stable', 'weighted')),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(chain_family, network, dex, pool_address)
);

-- =====================================================
-- OPPORTUNITIES (Scored LP Pool Opportunities)
-- =====================================================
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID NOT NULL REFERENCES supported_pools(id) ON DELETE CASCADE,
  
  -- Metrics
  fee_apy DECIMAL(8, 4) NOT NULL,
  farm_reward_apy DECIMAL(8, 4) DEFAULT 0,
  tvl DECIMAL(20, 2) NOT NULL,
  volume_24h DECIMAL(20, 2) NOT NULL,
  
  -- Risk scores (0-100)
  volatility_risk INTEGER NOT NULL,
  il_risk INTEGER NOT NULL,
  concentration_risk INTEGER NOT NULL,
  
  -- Composite score (0-100, higher is better)
  net_score INTEGER NOT NULL,
  
  -- Recommended range (for concentrated liquidity)
  recommended_min_price DECIMAL(18, 8),
  recommended_max_price DECIMAL(18, 8),
  
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(pool_id, calculated_at)
);

-- =====================================================
-- POSITIONS (Active LP Positions)
-- =====================================================
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  pool_id UUID NOT NULL REFERENCES supported_pools(id) ON DELETE CASCADE,
  
  -- Position details
  token0_amount DECIMAL(36, 18) NOT NULL,
  token1_amount DECIMAL(36, 18) NOT NULL,
  
  -- Range (for concentrated liquidity)
  min_price DECIMAL(18, 8),
  max_price DECIMAL(18, 8),
  
  -- Entry state
  entry_price DECIMAL(18, 8) NOT NULL,
  entry_value_usd DECIMAL(20, 2) NOT NULL,
  entry_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Current state
  current_price DECIMAL(18, 8),
  is_in_range BOOLEAN DEFAULT true,
  health_score INTEGER DEFAULT 100,
  
  -- Accumulated metrics
  total_fees_usd DECIMAL(20, 2) DEFAULT 0,
  total_rewards_usd DECIMAL(20, 2) DEFAULT 0,
  estimated_il_usd DECIMAL(20, 2) DEFAULT 0,
  
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'pending')),
  closed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- REWARDS (Unclaimed Rewards)
-- =====================================================
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  
  reward_token_symbol TEXT NOT NULL,
  reward_token_address TEXT NOT NULL,
  amount DECIMAL(36, 18) NOT NULL,
  value_usd DECIMAL(20, 2),
  
  is_claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ACTIONS (Audit Log for All Operations)
-- =====================================================
CREATE TABLE IF NOT EXISTS actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  
  action_type TEXT NOT NULL CHECK (action_type IN (
    'open_position', 'close_position', 'add_liquidity', 'remove_liquidity',
    'harvest', 'compound', 'rebalance', 'withdraw'
  )),
  
  -- Mode at execution time
  execution_mode TEXT NOT NULL CHECK (execution_mode IN ('demo', 'shadow', 'live')),
  
  -- Transaction details
  tx_hash TEXT,
  gas_used DECIMAL(20, 2),
  
  -- Action details (JSON)
  details JSONB,
  
  -- Results
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- POLICIES (Automation Rules & Guardrails)
-- =====================================================
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  
  -- Automation toggles
  auto_deploy BOOLEAN DEFAULT false,
  auto_harvest BOOLEAN DEFAULT false,
  auto_compound BOOLEAN DEFAULT false,
  auto_rebalance BOOLEAN DEFAULT false,
  
  -- Thresholds
  min_harvest_value_usd DECIMAL(10, 2) DEFAULT 10,
  min_rebalance_edge_percent DECIMAL(5, 2) DEFAULT 5,
  max_daily_gas_budget_usd DECIMAL(10, 2) DEFAULT 50,
  
  -- Capital limits
  max_capital_per_pool_usd DECIMAL(20, 2),
  max_capital_per_chain_usd DECIMAL(20, 2),
  max_total_deployed_usd DECIMAL(20, 2),
  
  -- Risk controls
  min_opportunity_score INTEGER DEFAULT 70,
  emergency_pause BOOLEAN DEFAULT false,
  
  -- Whitelists (JSON arrays)
  whitelisted_chains JSONB DEFAULT '[]'::jsonb,
  whitelisted_dexes JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(portfolio_id)
);

-- =====================================================
-- WITHDRAWAL PLANS (Optimized Unwind Strategies)
-- =====================================================
CREATE TABLE IF NOT EXISTS withdrawal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  
  requested_amount_usd DECIMAL(20, 2) NOT NULL,
  target_token_symbol TEXT NOT NULL,
  
  -- Optimization results (JSON)
  execution_plan JSONB NOT NULL,
  
  -- Cost estimates
  total_gas_estimate_usd DECIMAL(10, 2),
  total_slippage_estimate_usd DECIMAL(10, 2),
  final_amount_estimate DECIMAL(36, 18),
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'completed', 'cancelled')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_portfolios_mode ON portfolios(mode);
CREATE INDEX idx_assets_portfolio_id ON assets(portfolio_id);
CREATE INDEX idx_balances_portfolio_id ON balances(portfolio_id);
CREATE INDEX idx_positions_portfolio_id ON positions(portfolio_id);
CREATE INDEX idx_positions_status ON positions(status);
CREATE INDEX idx_actions_portfolio_id ON actions(portfolio_id);
CREATE INDEX idx_actions_created_at ON actions(created_at);
CREATE INDEX idx_opportunities_pool_id ON opportunities(pool_id);
CREATE INDEX idx_opportunities_net_score ON opportunities(net_score);