/**
 * Execution Record Service
 * Server-side immutable audit trail for all fund-critical actions
 * 
 * CRITICAL: This is the source of truth for execution history
 */

import { supabase } from "@/integrations/supabase/client";
import type { ExecutionResult, ActionPlan, ExecutionPreview, ReconciliationResult } from "@/core/execution/types";
import type { ActionType } from "@/core/contracts/actions";

export interface ExecutionRecord {
  id: string;
  action_id: string;
  action_type: ActionType;
  mode: "demo" | "shadow" | "live";
  
  // Target
  protocol?: string;
  chain?: string;
  pool_address?: string;
  target_contracts?: string[];
  spender_addresses?: string[];
  
  // Context
  wallet_address: string;
  user_id?: string;
  
  // Snapshots
  validation_snapshot?: any;
  action_plan_snapshot?: any;
  preview_snapshot?: any;
  
  // Before state
  balances_before?: Record<string, number>;
  positions_before?: any[];
  rewards_before?: any[];
  allowances_before?: Record<string, string>;
  
  // Execution results
  tx_hashes?: string[];
  receipts?: any[];
  gas_used?: number;
  total_cost_usd?: number;
  
  // After state
  balances_after?: Record<string, number>;
  positions_after?: any[];
  rewards_after?: any[];
  allowances_after?: Record<string, string>;
  
  // Reconciliation
  reconciliation_result?: ReconciliationResult;
  discrepancy_flags?: string[];
  state_drift_detected?: boolean;
  critical_discrepancies?: number;
  
  // Status
  status: "pending" | "executing" | "completed" | "failed" | "cancelled";
  error_message?: string;
  
  // Timestamps
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
  reconciled_at?: Date;
  
  // Metadata
  metadata?: Record<string, any>;
}

class ExecutionRecordService {
  /**
   * Create new execution record (immutable)
   * 
   * CRITICAL: Call this before starting live execution
   */
  async createRecord(params: {
    actionId: string;
    actionType: ActionType;
    mode: "demo" | "shadow" | "live";
    walletAddress: string;
    protocol?: string;
    chain?: string;
    poolAddress?: string;
    targetContracts?: string[];
    spenderAddresses?: string[];
    validationSnapshot?: any;
    actionPlanSnapshot?: ActionPlan;
    previewSnapshot?: ExecutionPreview;
    balancesBefore?: Record<string, number>;
    positionsBefore?: any[];
    rewardsBefore?: any[];
    allowancesBefore?: Record<string, string>;
  }): Promise<ExecutionRecord | null> {
    console.log(`[ExecutionRecordService] Creating execution record: ${params.actionId}`);

    const { data, error } = await supabase
      .from("execution_records")
      .insert({
        action_id: params.actionId,
        action_type: params.actionType,
        mode: params.mode,
        protocol: params.protocol,
        chain: params.chain,
        pool_address: params.poolAddress,
        target_contracts: params.targetContracts,
        spender_addresses: params.spenderAddresses,
        wallet_address: params.walletAddress,
        validation_snapshot: params.validationSnapshot,
        action_plan_snapshot: params.actionPlanSnapshot,
        preview_snapshot: params.previewSnapshot,
        balances_before: params.balancesBefore,
        positions_before: params.positionsBefore,
        rewards_before: params.rewardsBefore,
        allowances_before: params.allowancesBefore,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error(`[ExecutionRecordService] Failed to create record:`, error);
      return null;
    }

    return this.mapRecord(data);
  }

  /**
   * Update execution record (append state changes)
   * 
   * CRITICAL: Call this after transactions complete
   */
  async updateRecord(
    actionId: string,
    updates: {
      status?: "pending" | "executing" | "completed" | "failed" | "cancelled";
      txHashes?: string[];
      receipts?: any[];
      gasUsed?: number;
      totalCostUsd?: number;
      balancesAfter?: Record<string, number>;
      positionsAfter?: any[];
      rewardsAfter?: any[];
      allowancesAfter?: Record<string, string>;
      reconciliationResult?: ReconciliationResult;
      discrepancyFlags?: string[];
      stateDriftDetected?: boolean;
      criticalDiscrepancies?: number;
      errorMessage?: string;
      startedAt?: Date;
      completedAt?: Date;
      reconciledAt?: Date;
    }
  ): Promise<ExecutionRecord | null> {
    console.log(`[ExecutionRecordService] Updating execution record: ${actionId}`);

    const updateData: any = {};

    if (updates.status) updateData.status = updates.status;
    if (updates.txHashes) updateData.tx_hashes = updates.txHashes;
    if (updates.receipts) updateData.receipts = updates.receipts;
    if (updates.gasUsed !== undefined) updateData.gas_used = updates.gasUsed;
    if (updates.totalCostUsd !== undefined) updateData.total_cost_usd = updates.totalCostUsd;
    if (updates.balancesAfter) updateData.balances_after = updates.balancesAfter;
    if (updates.positionsAfter) updateData.positions_after = updates.positionsAfter;
    if (updates.rewardsAfter) updateData.rewards_after = updates.rewardsAfter;
    if (updates.allowancesAfter) updateData.allowances_after = updates.allowancesAfter;
    if (updates.reconciliationResult) updateData.reconciliation_result = updates.reconciliationResult;
    if (updates.discrepancyFlags) updateData.discrepancy_flags = updates.discrepancyFlags;
    if (updates.stateDriftDetected !== undefined) updateData.state_drift_detected = updates.stateDriftDetected;
    if (updates.criticalDiscrepancies !== undefined) updateData.critical_discrepancies = updates.criticalDiscrepancies;
    if (updates.errorMessage) updateData.error_message = updates.errorMessage;
    if (updates.startedAt) updateData.started_at = updates.startedAt.toISOString();
    if (updates.completedAt) updateData.completed_at = updates.completedAt.toISOString();
    if (updates.reconciledAt) updateData.reconciled_at = updates.reconciledAt.toISOString();

    const { data, error } = await supabase
      .from("execution_records")
      .update(updateData)
      .eq("action_id", actionId)
      .select()
      .single();

    if (error) {
      console.error(`[ExecutionRecordService] Failed to update record:`, error);
      return null;
    }

    return this.mapRecord(data);
  }

  /**
   * Get execution record by action ID
   */
  async getRecord(actionId: string): Promise<ExecutionRecord | null> {
    const { data, error } = await supabase
      .from("execution_records")
      .select("*")
      .eq("action_id", actionId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapRecord(data);
  }

  /**
   * Get recent execution records for wallet
   * 
   * CRITICAL: This is the authoritative history
   */
  async getWalletRecords(
    walletAddress: string,
    options?: {
      mode?: "demo" | "shadow" | "live";
      limit?: number;
      status?: "pending" | "executing" | "completed" | "failed" | "cancelled";
    }
  ): Promise<ExecutionRecord[]> {
    let query = supabase
      .from("execution_records")
      .select("*")
      .eq("wallet_address", walletAddress)
      .order("created_at", { ascending: false });

    if (options?.mode) {
      query = query.eq("mode", options.mode);
    }

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error(`[ExecutionRecordService] Failed to fetch records:`, error);
      return [];
    }

    return data.map((record) => this.mapRecord(record));
  }

  /**
   * Get records with state drift
   */
  async getRecordsWithDrift(
    walletAddress: string,
    options?: {
      mode?: "demo" | "shadow" | "live";
      limit?: number;
    }
  ): Promise<ExecutionRecord[]> {
    let query = supabase
      .from("execution_records")
      .select("*")
      .eq("wallet_address", walletAddress)
      .eq("state_drift_detected", true)
      .order("created_at", { ascending: false });

    if (options?.mode) {
      query = query.eq("mode", options.mode);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error || !data) {
      return [];
    }

    return data.map((record) => this.mapRecord(record));
  }

  /**
   * Check if action exists (prevent duplicates)
   */
  async actionExists(actionId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("execution_records")
      .select("id")
      .eq("action_id", actionId)
      .single();

    return !error && !!data;
  }

  /**
   * Get execution statistics
   */
  async getStats(walletAddress: string, mode: "demo" | "shadow" | "live"): Promise<{
    totalActions: number;
    completedActions: number;
    failedActions: number;
    totalGasUsed: number;
    totalCostUsd: number;
    actionsWithDrift: number;
    criticalDriftCount: number;
  }> {
    const { data, error } = await supabase
      .from("execution_records")
      .select("status, gas_used, total_cost_usd, state_drift_detected, critical_discrepancies")
      .eq("wallet_address", walletAddress)
      .eq("mode", mode);

    if (error || !data) {
      return {
        totalActions: 0,
        completedActions: 0,
        failedActions: 0,
        totalGasUsed: 0,
        totalCostUsd: 0,
        actionsWithDrift: 0,
        criticalDriftCount: 0,
      };
    }

    return {
      totalActions: data.length,
      completedActions: data.filter((r) => r.status === "completed").length,
      failedActions: data.filter((r) => r.status === "failed").length,
      totalGasUsed: data.reduce((sum, r) => sum + (r.gas_used || 0), 0),
      totalCostUsd: data.reduce((sum, r) => sum + (parseFloat(r.total_cost_usd as any) || 0), 0),
      actionsWithDrift: data.filter((r) => r.state_drift_detected).length,
      criticalDriftCount: data.reduce((sum, r) => sum + (r.critical_discrepancies || 0), 0),
    };
  }

  /**
   * Map database record to interface
   */
  private mapRecord(data: any): ExecutionRecord {
    return {
      id: data.id,
      action_id: data.action_id,
      action_type: data.action_type,
      mode: data.mode,
      protocol: data.protocol,
      chain: data.chain,
      pool_address: data.pool_address,
      target_contracts: data.target_contracts,
      spender_addresses: data.spender_addresses,
      wallet_address: data.wallet_address,
      user_id: data.user_id,
      validation_snapshot: data.validation_snapshot,
      action_plan_snapshot: data.action_plan_snapshot,
      preview_snapshot: data.preview_snapshot,
      balances_before: data.balances_before,
      positions_before: data.positions_before,
      rewards_before: data.rewards_before,
      allowances_before: data.allowances_before,
      tx_hashes: data.tx_hashes,
      receipts: data.receipts,
      gas_used: data.gas_used,
      total_cost_usd: parseFloat(data.total_cost_usd) || 0,
      balances_after: data.balances_after,
      positions_after: data.positions_after,
      rewards_after: data.rewards_after,
      allowances_after: data.allowances_after,
      reconciliation_result: data.reconciliation_result,
      discrepancy_flags: data.discrepancy_flags,
      state_drift_detected: data.state_drift_detected,
      critical_discrepancies: data.critical_discrepancies,
      status: data.status,
      error_message: data.error_message,
      created_at: new Date(data.created_at),
      started_at: data.started_at ? new Date(data.started_at) : undefined,
      completed_at: data.completed_at ? new Date(data.completed_at) : undefined,
      reconciled_at: data.reconciled_at ? new Date(data.reconciled_at) : undefined,
      metadata: data.metadata,
    };
  }
}

export const executionRecordService = new ExecutionRecordService();