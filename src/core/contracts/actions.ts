// ============================================================================
// ACTION TYPES & EXECUTION CONTRACTS
// Core types for the Automated Execution Engine
// ============================================================================

/**
 * Supported action types in the execution system
 */
export type ActionType =
  | "DEPOSIT"
  | "STAKE"
  | "ADD_LIQUIDITY"
  | "REMOVE_LIQUIDITY"
  | "HARVEST_REWARDS"
  | "CONVERT_REWARDS"
  | "COMPOUND"
  | "REBALANCE"
  | "EXIT_POSITION"
  | "WITHDRAW_FUNDS"
  | "EMERGENCY_PAUSE"
  | "CANCEL_PENDING"
  | "REFRESH_STATE";

/**
 * Action trigger source
 */
export type TriggerSource =
  | "user_manual"
  | "farming_strategy"
  | "rebalance_engine"
  | "harvest_engine"
  | "withdrawal_engine"
  | "risk_engine"
  | "policy_engine"
  | "emergency_shutdown";

/**
 * Action urgency level
 */
export type ActionUrgency = "low" | "normal" | "high" | "critical";

/**
 * Action status in lifecycle
 */
export type ActionStatus =
  | "triggered"
  | "validating"
  | "validation_failed"
  | "planning"
  | "previewing"
  | "awaiting_authorization"
  | "authorized"
  | "executing"
  | "confirming"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * Execution mode
 */
export type ExecutionMode = "demo" | "shadow" | "live";

// ============================================================================
// ACTION TRIGGER
// ============================================================================

export interface ActionTrigger {
  id: string;
  actionType: ActionType;
  source: TriggerSource;
  mode: ExecutionMode;
  urgency: ActionUrgency;
  
  // Target context
  walletAddress?: string;
  chain?: string;
  protocol?: string;
  poolAddress?: string;
  positionId?: string;
  
  // Parameters
  amount?: number;
  token?: string;
  slippage?: number;
  
  // Metadata
  reason: string;
  metadata?: Record<string, any>;
  
  // Timestamps
  triggeredAt: Date;
  expiresAt?: Date;
}

// ============================================================================
// VALIDATION RESULT
// ============================================================================

export interface ValidationCheck {
  checkName: string;
  passed: boolean;
  blocking: boolean; // If true and failed, blocks execution
  message: string;
  details?: Record<string, any>;
}

export interface ValidationResult {
  allowed: boolean;
  blockingReasons: string[];
  warningFlags: string[];
  checks: ValidationCheck[];
  requiredNextSteps: string[];
  validatedAt: Date;
  snapshotData?: Record<string, any>;
}

// ============================================================================
// ACTION PLAN
// ============================================================================

export interface ActionStep {
  stepId: string;
  stepType: "approval" | "transaction" | "query" | "wait";
  description: string;
  targetContract?: string;
  method?: string;
  params?: Record<string, any>;
  gasEstimate?: number;
  estimatedDuration?: number; // milliseconds
  canRetry: boolean;
  maxRetries: number;
}

export interface ActionPlan {
  planId: string;
  actionType: ActionType;
  steps: ActionStep[];
  totalGasEstimate: number;
  estimatedDuration: number; // milliseconds
  riskLevel: "low" | "medium" | "high";
  reversible: boolean;
  createdAt: Date;
}

// ============================================================================
// EXECUTION RESULT
// ============================================================================

export interface StepResult {
  stepId: string;
  status: "pending" | "executing" | "success" | "failed" | "skipped";
  transactionHash?: string;
  gasUsed?: number;
  output?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ExecutionResult {
  executionId: string;
  actionType: ActionType;
  status: ActionStatus;
  
  // Results per step
  stepResults: StepResult[];
  
  // Overall metrics
  totalGasUsed?: number;
  totalDuration?: number; // milliseconds
  
  // Final state
  success: boolean;
  error?: string;
  rollbackRequired?: boolean;
  
  // Timestamps
  startedAt: Date;
  completedAt?: Date;
}

// ============================================================================
// ACTION LIFECYCLE
// ============================================================================

export interface ActionLifecycle {
  id: string;
  trigger: ActionTrigger;
  validation?: ValidationResult;
  plan?: ActionPlan;
  execution?: ExecutionResult;
  
  // Current state
  status: ActionStatus;
  currentStep?: string;
  
  // Audit trail
  history: Array<{
    timestamp: Date;
    status: ActionStatus;
    message: string;
    metadata?: Record<string, any>;
  }>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// ============================================================================
// AUTHORIZATION
// ============================================================================

export interface AuthorizationRequest {
  actionId: string;
  actionType: ActionType;
  mode: ExecutionMode;
  
  // Summary
  description: string;
  riskLevel: "low" | "medium" | "high";
  
  // Preview data
  preview: {
    before: Record<string, any>;
    after: Record<string, any>;
    changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
    }>;
  };
  
  // Costs
  gasEstimate: number;
  slippage: number;
  
  // Expiration
  expiresAt: Date;
}

export interface AuthorizationResponse {
  actionId: string;
  approved: boolean;
  approvedBy: "user" | "policy" | "auto";
  approvedAt: Date;
  signature?: string; // For live mode wallet signatures
}