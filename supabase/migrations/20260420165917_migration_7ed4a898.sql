-- Create user_preferences table for storing user settings
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Chain & Protocol Settings
  enabled_chains TEXT[] DEFAULT ARRAY[]::TEXT[],
  enabled_protocols JSONB DEFAULT '[]'::JSONB,
  
  -- Wallet Settings
  default_slippage NUMERIC DEFAULT 2.0,
  auto_approve BOOLEAN DEFAULT false,
  
  -- Notification Settings
  notify_out_of_range BOOLEAN DEFAULT true,
  notify_harvest BOOLEAN DEFAULT true,
  notify_rebalance BOOLEAN DEFAULT false,
  notify_actions BOOLEAN DEFAULT true,
  email_alerts BOOLEAN DEFAULT true,
  push_alerts BOOLEAN DEFAULT true,
  discord_alerts BOOLEAN DEFAULT false,
  
  -- Advanced Settings
  debug_mode BOOLEAN DEFAULT false,
  testnet_mode BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- RLS Policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read their own preferences
CREATE POLICY "select_own_preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "insert_own_preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "update_own_preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies table for automation rules
CREATE TABLE IF NOT EXISTS user_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Automation Settings
  auto_harvest BOOLEAN DEFAULT false,
  auto_compound BOOLEAN DEFAULT false,
  auto_rebalance BOOLEAN DEFAULT false,
  emergency_pause BOOLEAN DEFAULT false,
  
  -- Thresholds
  min_harvest_value NUMERIC DEFAULT 50,
  compound_threshold NUMERIC DEFAULT 100,
  rebalance_threshold NUMERIC DEFAULT 5.0,
  
  -- Capital Limits
  max_per_pool NUMERIC DEFAULT 10000,
  max_per_chain NUMERIC DEFAULT 50000,
  max_total_deployed NUMERIC DEFAULT 100000,
  
  -- Gas Settings
  daily_gas_budget NUMERIC DEFAULT 100,
  max_gas_price NUMERIC DEFAULT 100,
  
  -- Risk Settings
  max_slippage NUMERIC DEFAULT 2.0,
  max_impermanent_loss NUMERIC DEFAULT 10.0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_policies_user_id ON user_policies(user_id);

-- RLS Policies
ALTER TABLE user_policies ENABLE ROW LEVEL SECURITY;

-- Users can read their own policies
CREATE POLICY "select_own_policies" ON user_policies
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own policies
CREATE POLICY "insert_own_policies" ON user_policies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own policies
CREATE POLICY "update_own_policies" ON user_policies
  FOR UPDATE USING (auth.uid() = user_id);