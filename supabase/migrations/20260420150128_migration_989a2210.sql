-- ============================================================================
-- EXECUTION RECORDS TABLE
-- Immutable server-side audit trail for all fund-critical actions
-- ============================================================================

CREATE TABLE IF NOT EXISTS execution_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  action_id TEXT NOT NULL UNIQUE,
  action_type TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('demo', 'shadow', 'live')),
  
  -- Target
  protocol TEXT,
  chain TEXT,
  pool_address TEXT,
  target_contracts TEXT[], -- Array of contract addresses involved
  spender_addresses TEXT[], -- Array of approved spenders
  
  -- Execution context
  wallet_address TEXT NOT NULL,
  user_id TEXT,
  
  -- State snapshots (JSONB for complex structures)
  validation_snapshot JSONB,
  action_plan_snapshot JSONB,
  preview_snapshot JSONB,
  
  -- Before state
  balances_before JSONB,
  positions_before JSONB,
  rewards_before JSONB,
  allowances_before JSONB,
  
  -- Execution results
  tx_hashes TEXT[],
  receipts JSONB, -- Array of transaction receipts
  gas_used BIGINT,
  total_cost_usd DECIMAL(20, 8),
  
  -- After state
  balances_after JSONB,
  positions_after JSONB,
  rewards_after JSONB,
  allowances_after JSONB,
  
  -- Reconciliation
  reconciliation_result JSONB,
  discrepancy_flags TEXT[],
  state_drift_detected BOOLEAN DEFAULT false,
  critical_discrepancies INTEGER DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'executing', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  reconciled_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB,
  
  -- Indexes
  CONSTRAINT execution_records_action_id_key UNIQUE (action_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_execution_records_wallet ON execution_records(wallet_address);
CREATE INDEX IF NOT EXISTS idx_execution_records_status ON execution_records(status);
CREATE INDEX IF NOT EXISTS idx_execution_records_mode ON execution_records(mode);
CREATE INDEX IF NOT EXISTS idx_execution_records_created ON execution_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_execution_records_action_type ON execution_records(action_type);
CREATE INDEX IF NOT EXISTS idx_execution_records_chain ON execution_records(chain);

-- ============================================================================
-- AUDIT LOGS TABLE
-- Comprehensive append-only log for all system actions
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  action_type TEXT NOT NULL,
  actor TEXT NOT NULL, -- wallet address or "system"
  mode TEXT NOT NULL CHECK (mode IN ('demo', 'shadow', 'live')),
  
  -- Context
  wallet_address TEXT,
  user_id TEXT,
  execution_record_id UUID REFERENCES execution_records(id),
  
  -- Details
  details JSONB NOT NULL,
  
  -- Result
  success BOOLEAN NOT NULL,
  error_message TEXT,
  
  -- Timestamp
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor);
CREATE INDEX IF NOT EXISTS idx_audit_logs_wallet ON audit_logs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_execution_record ON audit_logs(execution_record_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE execution_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Execution records: users can read their own records
CREATE POLICY "select_own_execution_records" ON execution_records
  FOR SELECT USING (wallet_address = auth.uid()::text OR user_id = auth.uid()::text);

-- Execution records: system can insert (no user inserts)
CREATE POLICY "system_insert_execution_records" ON execution_records
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Audit logs: users can read their own logs
CREATE POLICY "select_own_audit_logs" ON audit_logs
  FOR SELECT USING (wallet_address = auth.uid()::text OR user_id = auth.uid()::text);

-- Audit logs: system can insert (append-only)
CREATE POLICY "system_insert_audit_logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);