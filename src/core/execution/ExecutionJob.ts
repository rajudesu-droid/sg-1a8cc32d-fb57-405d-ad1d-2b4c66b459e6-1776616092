// ============================================================================
// EXECUTION JOB MODEL
// Strongly-typed execution job with lifecycle tracking
// ============================================================================

import type { ActionType, ActionTrigger, ValidationResult } from "../contracts/actions";
import type { ActionPlan, ExecutionPreview, ExecutionResult } from "./types";

export type JobStatus =
  | "queued"
  | "validating"
  | "validation_failed"
  | "planning"
  | "previewing"
  | "awaiting_authorization"
  | "executing"
  | "completed"
  | "failed"
  | "cancelled"
  | "paused"
  | "partially_completed";

export type JobPriority = "emergency" | "critical" | "high" | "normal" | "low";

export type TargetEntityType = "position" | "pool" | "wallet" | "portfolio" | "global";

export interface ExecutionJob {
  // Identity
  id: string;
  actionType: ActionType;
  mode: "demo" | "shadow" | "live";
  sourceEngine: string;
  
  // Target
  targetEntityType: TargetEntityType;
  targetEntityId: string;
  walletId?: string;
  portfolioId?: string;
  protocol?: string;
  chain?: string;
  
  // Status
  status: JobStatus;
  priority: JobPriority;
  reasonCode: string;
  
  // Snapshots
  trigger: ActionTrigger;
  validationSnapshot?: ValidationResult;
  actionPlan?: ActionPlan;
  previewSnapshot?: ExecutionPreview;
  executionResult?: ExecutionResult;
  
  // Error tracking
  errorInfo?: {
    category: FailureCategory;
    message: string;
    stepId?: string;
    recoverable: boolean;
    retryCount: number;
    lastRetryAt?: Date;
  };
  
  // Locking
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  expiresAt: Date;
}

export type FailureCategory =
  | "wallet_disconnected"
  | "user_rejected"
  | "insufficient_balance"
  | "insufficient_allowance"
  | "slippage_breach"
  | "gas_too_high"
  | "unsupported_network"
  | "rpc_failure"
  | "protocol_adapter_error"
  | "stale_state"
  | "sync_mismatch"
  | "partial_completion"
  | "unknown_error";

export interface JobLock {
  jobId: string;
  targetEntityType: TargetEntityType;
  targetEntityId: string;
  lockedBy: string;
  lockedAt: Date;
  expiresAt: Date;
}

export interface ExecutionLog {
  id: string;
  jobId: string;
  timestamp: Date;
  
  // Action context
  actionType: ActionType;
  mode: "demo" | "shadow" | "live";
  sourceEngine: string;
  
  // Target
  protocol?: string;
  pool?: string;
  chain?: string;
  walletAddress?: string;
  portfolioId?: string;
  
  // Execution details
  reasonCode: string;
  validationSnapshot?: ValidationResult;
  actionPlanSnapshot?: ActionPlan;
  previewSnapshot?: ExecutionPreview;
  finalResult?: ExecutionResult;
  
  // State changes
  beforeBalances?: Record<string, number>;
  afterBalances?: Record<string, number>;
  beforePositionState?: any;
  afterPositionState?: any;
  beforeEarningsState?: any;
  afterEarningsState?: any;
  
  // Costs & metrics
  gasEstimate?: number;
  gasActual?: number;
  slippageEstimate?: number;
  slippageActual?: number;
  
  // Risk & warnings
  riskFlags?: string[];
  warnings?: string[];
  
  // Step-by-step logs
  stepLogs: string[];
  
  // Outcome
  success: boolean;
  error?: {
    category: FailureCategory;
    message: string;
    stepId?: string;
  };
}

/**
 * Helper to create a new execution job
 */
export function createExecutionJob(
  trigger: ActionTrigger,
  priority: JobPriority,
  targetEntityType: TargetEntityType,
  targetEntityId: string
): ExecutionJob {
  return {
    id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    actionType: trigger.actionType,
    mode: trigger.mode,
    sourceEngine: trigger.source,
    
    targetEntityType,
    targetEntityId,
    walletId: trigger.walletAddress,
    portfolioId: trigger.portfolioId,
    protocol: trigger.protocol,
    chain: trigger.chain,
    
    status: "queued",
    priority,
    reasonCode: trigger.reason,
    
    trigger,
    
    isLocked: false,
    
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min expiry
  };
}

/**
 * Helper to determine priority from action type
 */
export function getPriorityForAction(actionType: ActionType): JobPriority {
  switch (actionType) {
    case "EMERGENCY_PAUSE":
      return "emergency";
    case "EXIT_POSITION":
      return "critical";
    case "WITHDRAW_FUNDS":
      return "high";
    case "HARVEST_REWARDS":
    case "COMPOUND":
      return "normal";
    case "REBALANCE":
    case "ADD_LIQUIDITY":
      return "low";
    default:
      return "normal";
  }
}

/**
 * Helper to determine target entity from trigger
 */
export function getTargetEntity(trigger: ActionTrigger): {
  type: TargetEntityType;
  id: string;
} {
  // Position-specific actions
  if (["HARVEST_REWARDS", "COMPOUND", "REBALANCE", "EXIT_POSITION", "STAKE"].includes(trigger.actionType)) {
    return {
      type: "position",
      id: trigger.metadata?.positionId || trigger.poolAddress || "unknown",
    };
  }
  
  // Pool-specific actions
  if (["ADD_LIQUIDITY"].includes(trigger.actionType)) {
    return {
      type: "pool",
      id: trigger.poolAddress || "unknown",
    };
  }
  
  // Wallet-specific actions
  if (["WITHDRAW_FUNDS"].includes(trigger.actionType)) {
    return {
      type: "wallet",
      id: trigger.walletAddress || trigger.portfolioId || "unknown",
    };
  }
  
  // Global actions
  if (["EMERGENCY_PAUSE", "CANCEL_PENDING"].includes(trigger.actionType)) {
    return {
      type: "global",
      id: "system",
    };
  }
  
  return {
    type: "portfolio",
    id: trigger.portfolioId || "default",
  };
}