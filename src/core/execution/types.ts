// ============================================================================
// EXECUTION TYPES
// Shared models for action planning, preview, and execution
// ============================================================================

import type { ActionType, ActionTrigger } from "../contracts/actions";

// ============================================================================
// EXECUTION SUBSTEPS
// ============================================================================

export type SubstepOperation =
  | "verify_balances"
  | "approve_token"
  | "add_liquidity"
  | "remove_liquidity"
  | "stake_position"
  | "unstake_position"
  | "claim_rewards"
  | "swap_token"
  | "compound_rewards"
  | "close_position"
  | "fetch_position_state"
  | "sync_state"
  | "validate_result";

export interface ExecutionSubstep {
  id: string;
  sequence: number;
  operation: SubstepOperation;
  description: string;
  
  // Protocol interaction
  protocolAdapter?: string;
  methodName?: string;
  
  // Token details
  tokenInputs?: Array<{
    symbol: string;
    address: string;
    amount: number;
  }>;
  tokenOutputs?: Array<{
    symbol: string;
    address: string;
    estimatedAmount: number;
  }>;
  
  // Execution params
  estimatedGas: number;
  estimatedSlippage: number;
  requiredApproval?: {
    token: string;
    spender: string;
    amount: number;
  };
  
  // Fallback behavior
  isOptional: boolean;
  retryable: boolean;
  maxRetries: number;
  fallbackStep?: string;
  
  // Success/failure criteria
  successCriteria: string[];
  failureCriteria: string[];
  
  // State changes
  expectedStateChanges: {
    balances?: Record<string, number>;
    positions?: Array<{ id: string; change: string }>;
    portfolio?: { totalValue: number; deployedCapital: number };
  };
  
  // Execution tracking
  status: SubstepStatus;
  startTime?: Date;
  endTime?: Date;
  gasUsed?: number;
  txHash?: string;
  error?: string;
  output?: any;
}

export type SubstepStatus =
  | "pending"
  | "executing"
  | "completed"
  | "failed"
  | "skipped"
  | "retrying";

// ============================================================================
// ACTION PLAN
// ============================================================================

export interface ActionPlan {
  planId: string;
  triggerId: string;
  actionType: ActionType;
  
  // Execution sequence
  substeps: ExecutionSubstep[];
  totalSteps: number;
  
  // Protocol details
  protocol: string;
  chain: string;
  poolAddress: string;
  
  // Resource estimates
  totalEstimatedGas: number;
  totalEstimatedTime: number; // seconds
  estimatedSlippage: number;
  
  // Required permissions
  requiredApprovals: Array<{
    token: string;
    spender: string;
    amount: number;
    currentAllowance: number;
  }>;
  
  // Risk assessment
  risks: string[];
  warnings: string[];
  
  // Expected outcomes
  expectedOutcome: {
    tokensIn: Array<{ symbol: string; amount: number }>;
    tokensOut: Array<{ symbol: string; amount: number }>;
    positionChange?: {
      before: any;
      after: any;
    };
    portfolioImpact: {
      totalValueChange: number;
      deployedCapitalChange: number;
      idleCapitalChange: number;
    };
  };
  
  // Plan metadata
  createdAt: Date;
  expiresAt: Date;
  plannerVersion: string;
}

// ============================================================================
// EXECUTION PREVIEW
// ============================================================================

export interface ExecutionPreview {
  planId: string;
  actionType: ActionType;
  mode: "demo" | "shadow" | "live";
  
  // Summary
  summary: {
    title: string;
    description: string;
    protocol: string;
    chain: string;
  };
  
  // Steps preview
  steps: Array<{
    sequence: number;
    operation: string;
    description: string;
    estimatedGas: number;
    status: "pending" | "requires_approval" | "ready";
  }>;
  
  // Resource preview
  resources: {
    totalGas: number;
    totalTime: number;
    approvalCount: number;
  };
  
  // Outcome preview
  outcome: {
    tokensIn: Array<{ symbol: string; amount: number; valueUsd: number }>;
    tokensOut: Array<{ symbol: string; amount: number; valueUsd: number }>;
    netChange: number; // USD
    projectedYield?: number; // APR %
  };
  
  // Risk indicators
  risks: Array<{
    level: "low" | "medium" | "high" | "critical";
    category: string;
    message: string;
  }>;
  
  // CRITICAL: Validation status
  validationStatus?: {
    allowed: boolean;
    blockingReasons: string[];
    warningFlags: string[];
    checks: any[];
  };
  
  // Post-execution state preview
  postExecutionState: {
    balances: Record<string, number>;
    positions: number;
    totalValue: number;
    deployedCapital: number;
    idleCapital: number;
  };
  
  // Warnings
  warnings: string[];
  
  // Preview timestamp
  generatedAt: Date;
  validUntil: Date;
}

// ============================================================================
// AUTHORIZATION
// ============================================================================

export interface ExecutionAuthorization {
  authId: string;
  planId: string;
  actionType: ActionType;
  
  // Authorization type
  authType: "manual" | "policy" | "auto";
  
  // Required approvals
  requiredApprovals: Array<{
    type: "wallet_signature" | "token_approval" | "policy_override";
    description: string;
    status: "pending" | "approved" | "rejected";
    approvedBy?: string;
    approvedAt?: Date;
    signature?: string;
  }>;
  
  // Authorization result
  authorized: boolean;
  authorizationMessage: string;
  
  // Metadata
  requestedAt: Date;
  expiresAt: Date;
}

// ============================================================================
// EXECUTION RESULT
// ============================================================================

export interface ExecutionResult {
  executionId: string;
  planId: string;
  actionType: ActionType;
  mode?: "demo" | "shadow" | "live";
  
  // Status
  status: "success" | "failed" | "partial";
  
  // Transaction data
  txHashes?: string[];
  transactions?: Array<{
    stepId: string;
    txHash: string;
    gasUsed: number;
    status: "confirmed" | "pending" | "failed";
  }>;
  gasUsed?: number;
  totalCost?: number; // USD
  
  // Timing
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // seconds
  
  // Steps
  completedSteps: number;
  totalSteps: number;
  failedSteps?: number;
  currentStep?: ExecutionSubstep;
  
  // Outcome
  tokensIn?: Array<{ symbol: string; amount: number }>;
  tokensOut?: Array<{ symbol: string; amount: number }>;
  
  // State changes
  stateChanges?: {
    balancesBefore: Record<string, number>;
    balancesAfter: Record<string, number>;
    positionsAffected: string[];
    portfolioValueChange: number;
  };
  
  // Error (if failed)
  error?: {
    stepId: string;
    message: string;
    recoverable: boolean;
  };
  
  // CRITICAL: Reconciliation result (Live Mode only)
  reconciliation?: ReconciliationResult;
  
  // Logs
  logs: string[];
}

/**
 * Reconciliation Result
 * Compares expected vs actual onchain state after live transactions
 */
export interface ReconciliationResult {
  success: boolean;
  reconciledAt: Date;
  txHash: string;
  actionType: string;
  
  // State comparison
  expectedState: {
    balances: Record<string, number>;
    positions: Record<string, any>;
    allowances: Record<string, string>;
  };
  actualState: {
    balances: Record<string, number>;
    positions: Record<string, any>;
    allowances: Record<string, string>;
  };
  
  // Discrepancies
  discrepancies: Array<{
    type: "balance" | "position" | "allowance";
    assetOrId: string;
    expected: any;
    actual: any;
    difference: number | string;
    percentDiff?: number;
    severity: "minor" | "moderate" | "critical";
  }>;
  
  // Summary
  totalDiscrepancies: number;
  criticalDiscrepancies: number;
  requiresUserAttention: boolean;
  nextActions: string[];
}

export type ExecutionStatus =
  | "pending"
  | "awaiting_approval"
  | "simulating"
  | "executing"
  | "partially_completed"
  | "completed"
  | "failed"
  | "cancelled"
  | "paused";

// ============================================================================
// EXECUTION CONTEXT
// ============================================================================

export interface ExecutionContext {
  mode: "demo" | "shadow" | "live";
  walletAddress?: string;
  portfolioId?: string;
  
  // User preferences
  preferences: {
    autoApprove: boolean;
    maxSlippage: number;
    maxGasPrice: number;
    confirmationBlocks: number;
  };
  
  // Simulation data (demo mode)
  simulationState?: {
    balances: Record<string, number>;
    positions: any[];
    portfolio: any;
  };
}