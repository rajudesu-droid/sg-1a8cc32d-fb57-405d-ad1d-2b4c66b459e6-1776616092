-- =====================================================
-- RLS POLICIES
-- =====================================================

-- PROFILES: T1 (Private user data)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- PORTFOLIOS: T1 (User-owned)
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_portfolios" ON portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_portfolios" ON portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_portfolios" ON portfolios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own_portfolios" ON portfolios FOR DELETE USING (auth.uid() = user_id);

-- ASSETS: T1 (Via portfolio ownership)
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_assets" ON assets FOR SELECT USING (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = assets.portfolio_id AND portfolios.user_id = auth.uid())
);
CREATE POLICY "insert_own_assets" ON assets FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = assets.portfolio_id AND portfolios.user_id = auth.uid())
);
CREATE POLICY "update_own_assets" ON assets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = assets.portfolio_id AND portfolios.user_id = auth.uid())
);
CREATE POLICY "delete_own_assets" ON assets FOR DELETE USING (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = assets.portfolio_id AND portfolios.user_id = auth.uid())
);

-- BALANCES: T1 (Via portfolio ownership)
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_balances" ON balances FOR SELECT USING (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = balances.portfolio_id AND portfolios.user_id = auth.uid())
);
CREATE POLICY "insert_own_balances" ON balances FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = balances.portfolio_id AND portfolios.user_id = auth.uid())
);
CREATE POLICY "update_own_balances" ON balances FOR UPDATE USING (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = balances.portfolio_id AND portfolios.user_id = auth.uid())
);
CREATE POLICY "delete_own_balances" ON balances FOR DELETE USING (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = balances.portfolio_id AND portfolios.user_id = auth.uid())
);

-- SUPPORTED_POOLS: T2 (Public read, authenticated write)
ALTER TABLE supported_pools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_pools" ON supported_pools FOR SELECT USING (true);
CREATE POLICY "auth_insert_pools" ON supported_pools FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_pools" ON supported_pools FOR UPDATE USING (auth.uid() IS NOT NULL);

-- OPPORTUNITIES: T2 (Public read, authenticated write)
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_opportunities" ON opportunities FOR SELECT USING (true);
CREATE POLICY "auth_insert_opportunities" ON opportunities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_opportunities" ON opportunities FOR UPDATE USING (auth.uid() IS NOT NULL);

-- POSITIONS: T1 (Via portfolio ownership)
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_positions" ON positions FOR SELECT USING (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = positions.portfolio_id AND portfolios.user_id = auth.uid())
);
CREATE POLICY "insert_own_positions" ON positions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = positions.portfolio_id AND portfolios.user_id = auth.uid())
);
CREATE POLICY "update_own_positions" ON positions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = positions.portfolio_id AND portfolios.user_id = auth.uid())
);
CREATE POLICY "delete_own_positions" ON positions FOR DELETE USING (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = positions.portfolio_id AND portfolios.user_id = auth.uid())
);

-- REWARDS: T1 (Via position ownership)
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_rewards" ON rewards FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM positions 
    JOIN portfolios ON portfolios.id = positions.portfolio_id 
    WHERE positions.id = rewards.position_id AND portfolios.user_id = auth.uid()
  )
);
CREATE POLICY "insert_own_rewards" ON rewards FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM positions 
    JOIN portfolios ON portfolios.id = positions.portfolio_id 
    WHERE positions.id = rewards.position_id AND portfolios.user_id = auth.uid()
  )
);
CREATE POLICY "update_own_rewards" ON rewards FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM positions 
    JOIN portfolios ON portfolios.id = positions.portfolio_id 
    WHERE positions.id = rewards.position_id AND portfolios.user_id = auth.uid()
  )
);

-- ACTIONS: T1 (Via portfolio ownership)
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_actions" ON actions FOR SELECT USING (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = actions.portfolio_id AND portfolios.user_id = auth.uid())
);
CREATE POLICY "insert_own_actions" ON actions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = actions.portfolio_id AND portfolios.user_id = auth.uid())
);

-- POLICIES: T1 (Via portfolio ownership)
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_policies" ON policies FOR SELECT USING (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = policies.portfolio_id AND portfolios.user_id = auth.uid())
);
CREATE POLICY "insert_own_policies" ON policies FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = policies.portfolio_id AND portfolios.user_id = auth.uid())
);
CREATE POLICY "update_own_policies" ON policies FOR UPDATE USING (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = policies.portfolio_id AND portfolios.user_id = auth.uid())
);

-- WITHDRAWAL_PLANS: T1 (Via portfolio ownership)
ALTER TABLE withdrawal_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_withdrawal_plans" ON withdrawal_plans FOR SELECT USING (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = withdrawal_plans.portfolio_id AND portfolios.user_id = auth.uid())
);
CREATE POLICY "insert_own_withdrawal_plans" ON withdrawal_plans FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = withdrawal_plans.portfolio_id AND portfolios.user_id = auth.uid())
);
CREATE POLICY "update_own_withdrawal_plans" ON withdrawal_plans FOR UPDATE USING (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = withdrawal_plans.portfolio_id AND portfolios.user_id = auth.uid())
);

-- =====================================================
-- PROFILE AUTO-CREATE TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users
INSERT INTO public.profiles (id, email) 
SELECT u.id, u.email FROM auth.users u 
LEFT JOIN public.profiles p ON p.id = u.id 
WHERE p.id IS NULL;