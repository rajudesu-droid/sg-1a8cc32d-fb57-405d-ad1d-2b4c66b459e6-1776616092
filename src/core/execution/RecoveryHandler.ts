// ============================================================================
// RECOVERY HANDLER
// Smart failure detection and recovery logic
// ============================================================================

import type { ExecutionJob, FailureCategory } from "./ExecutionJob";
import type { ExecutionResult } from "./types";
import { orchestrator } from "../orchestrator";
import { syncEngine } from "../sync";

export class RecoveryHandler {
  private handlerId = "recovery-handler";
  private maxRetries = 3;
  
  /**
   * Analyze execution failure and determine recovery strategy
   */
  async handleFailure(
    job: ExecutionJob,
    result: ExecutionResult
  ): Promise<RecoveryStrategy> {
    console.log(`[RecoveryHandler] Analyzing failure for job ${job.id}`);
    
    const category = this.categorizeFailure(result);
    const isRecoverable = this.isRecoverable(category);
    const shouldRetry = this.shouldRetry(job, category);
    
    const strategy: RecoveryStrategy = {
      category,
      isRecoverable,
      shouldRetry,
      retryDelay: this.getRetryDelay(category),
      requiredActions: this.getRequiredActions(category),
      userNotification: this.getUserNotificationMessage(category, result),
      syncRequired: true,
      partialCompletionState: this.extractPartialState(result),
    };
    
    console.log(`[RecoveryHandler] Strategy: ${JSON.stringify(strategy, null, 2)}`);
    
    return strategy;
  }
  
  /**
   * Execute recovery strategy
   */
  async executeRecovery(
    job: ExecutionJob,
    strategy: RecoveryStrategy
  ): Promise<void> {
    console.log(`[RecoveryHandler] Executing recovery for job ${job.id}`);
    
    // Step 1: Sync state to reflect partial completion
    if (strategy.syncRequired) {
      await this.triggerRecoverySync(job, strategy.partialCompletionState);
    }
    
    // Step 2: Update job with error info
    job.errorInfo = {
      category: strategy.category,
      message: strategy.userNotification,
      recoverable: strategy.isRecoverable,
      retryCount: (job.errorInfo?.retryCount || 0) + 1,
      lastRetryAt: new Date(),
    };
    
    // Step 3: Retry if appropriate
    if (strategy.shouldRetry && job.errorInfo.retryCount < this.maxRetries) {
      console.log(`[RecoveryHandler] Scheduling retry after ${strategy.retryDelay}ms`);
      job.status = "queued";
      job.updatedAt = new Date();
    } else {
      console.log(`[RecoveryHandler] Marking job as failed (no retry)`);
      job.status = "failed";
      job.completedAt = new Date();
    }
    
    // Step 4: Alert user if manual action needed
    if (strategy.requiredActions.length > 0) {
      this.notifyUserOfRequiredActions(job, strategy);
    }
  }
  
  /**
   * Categorize failure based on error message and context
   */
  private categorizeFailure(result: ExecutionResult): FailureCategory {
    const errorMsg = result.error?.message?.toLowerCase() || "";
    
    // Wallet issues
    if (errorMsg.includes("disconnect") || errorMsg.includes("wallet not connected")) {
      return "wallet_disconnected";
    }
    if (errorMsg.includes("rejected") || errorMsg.includes("denied")) {
      return "user_rejected";
    }
    
    // Balance/allowance issues
    if (errorMsg.includes("insufficient balance") || errorMsg.includes("insufficient funds")) {
      return "insufficient_balance";
    }
    if (errorMsg.includes("insufficient allowance") || errorMsg.includes("approve")) {
      return "insufficient_allowance";
    }
    
    // Execution issues
    if (errorMsg.includes("slippage") || errorMsg.includes("price impact")) {
      return "slippage_breach";
    }
    if (errorMsg.includes("gas") && errorMsg.includes("high")) {
      return "gas_too_high";
    }
    if (errorMsg.includes("unsupported network") || errorMsg.includes("wrong network")) {
      return "unsupported_network";
    }
    
    // Infrastructure issues
    if (errorMsg.includes("rpc") || errorMsg.includes("network error") || errorMsg.includes("timeout")) {
      return "rpc_failure";
    }
    if (errorMsg.includes("adapter") || errorMsg.includes("protocol")) {
      return "protocol_adapter_error";
    }
    
    // State issues
    if (errorMsg.includes("stale") || errorMsg.includes("outdated")) {
      return "stale_state";
    }
    if (errorMsg.includes("sync") || errorMsg.includes("mismatch")) {
      return "sync_mismatch";
    }
    
    // Partial completion
    if (result.status === "partial" || result.completedSteps < result.totalSteps) {
      return "partial_completion";
    }
    
    return "unknown_error";
  }
  
  /**
   * Determine if failure is recoverable
   */
  private isRecoverable(category: FailureCategory): boolean {
    const recoverable: FailureCategory[] = [
      "rpc_failure",
      "stale_state",
      "sync_mismatch",
      "gas_too_high",
      "slippage_breach",
      "insufficient_allowance",
    ];
    
    return recoverable.includes(category);
  }
  
  /**
   * Determine if job should be retried
   */
  private shouldRetry(job: ExecutionJob, category: FailureCategory): boolean {
    // Never retry user rejections
    if (category === "user_rejected") return false;
    
    // Never retry wallet disconnections
    if (category === "wallet_disconnected") return false;
    
    // Never retry unsupported network
    if (category === "unsupported_network") return false;
    
    // Never retry insufficient balance (manual action needed)
    if (category === "insufficient_balance") return false;
    
    // Never retry partial completions (manual review needed)
    if (category === "partial_completion") return false;
    
    // Retry transient failures
    const retryable: FailureCategory[] = [
      "rpc_failure",
      "stale_state",
      "sync_mismatch",
      "gas_too_high",
      "slippage_breach",
      "insufficient_allowance",
    ];
    
    if (!retryable.includes(category)) return false;
    
    // Check retry count
    const retryCount = job.errorInfo?.retryCount || 0;
    return retryCount < this.maxRetries;
  }
  
  /**
   * Get retry delay based on failure category
   */
  private getRetryDelay(category: FailureCategory): number {
    switch (category) {
      case "rpc_failure":
        return 5000; // 5 seconds
      case "stale_state":
      case "sync_mismatch":
        return 10000; // 10 seconds
      case "gas_too_high":
      case "slippage_breach":
        return 30000; // 30 seconds
      case "insufficient_allowance":
        return 15000; // 15 seconds
      default:
        return 0; // No retry
    }
  }
  
  /**
   * Get required manual actions based on failure
   */
  private getRequiredActions(category: FailureCategory): string[] {
    switch (category) {
      case "wallet_disconnected":
        return ["Reconnect your wallet"];
      case "insufficient_balance":
        return ["Add more funds to your wallet"];
      case "insufficient_allowance":
        return ["Approve token spending in your wallet"];
      case "unsupported_network":
        return ["Switch to the correct network in your wallet"];
      case "partial_completion":
        return ["Review position state and decide next steps"];
      case "user_rejected":
        return ["Approve the transaction in your wallet"];
      default:
        return [];
    }
  }
  
  /**
   * Get user notification message
   */
  private getUserNotificationMessage(
    category: FailureCategory,
    result: ExecutionResult
  ): string {
    const baseMsg = result.error?.message || "Execution failed";
    
    switch (category) {
      case "wallet_disconnected":
        return "Wallet disconnected. Please reconnect to continue.";
      case "user_rejected":
        return "Transaction was rejected. No funds were moved.";
      case "insufficient_balance":
        return "Insufficient balance to complete this action.";
      case "insufficient_allowance":
        return "Token approval required. Please approve in your wallet.";
      case "slippage_breach":
        return "Slippage exceeded limit. Try again with higher slippage tolerance.";
      case "gas_too_high":
        return "Gas price is too high. Will retry when gas is lower.";
      case "unsupported_network":
        return "Wrong network. Please switch to the correct network.";
      case "rpc_failure":
        return "Network error. Retrying automatically...";
      case "stale_state":
        return "Data outdated. Refreshing and retrying...";
      case "partial_completion":
        return "Action partially completed. Please review your position state.";
      default:
        return baseMsg;
    }
  }
  
  /**
   * Extract partial completion state from result
   */
  private extractPartialState(result: ExecutionResult): any {
    if (result.completedSteps === 0) return null;
    
    return {
      completedSteps: result.completedSteps,
      totalSteps: result.totalSteps,
      transactions: result.transactions,
      stateChanges: result.stateChanges,
    };
  }
  
  /**
   * Trigger recovery sync to reflect partial state
   */
  private async triggerRecoverySync(job: ExecutionJob, partialState: any): Promise<void> {
    console.log(`[RecoveryHandler] Triggering recovery sync for job ${job.id}`);
    
    // Determine affected modules
    const affectedModules = this.getAffectedModules(job);
    
    // Trigger sync via orchestrator
    orchestrator.publishEvent({
      type: "sync_required",
      timestamp: new Date(),
      source: this.handlerId,
      data: {
        jobId: job.id,
        reason: "recovery_sync",
        partialState,
      },
      affectedModules,
    });
    
    // Wait for sync to complete
    await syncEngine.syncAffectedModules(affectedModules);
  }
  
  /**
   * Determine which modules need sync based on job type
   */
  private getAffectedModules(job: ExecutionJob): string[] {
    const modules = ["wallet-engine", "portfolio-engine"];
    
    if (["HARVEST_REWARDS", "COMPOUND", "EXIT_POSITION", "ADD_LIQUIDITY", "REBALANCE", "STAKE"].includes(job.actionType)) {
      modules.push("position-engine", "rewards-engine");
    }
    
    if (job.actionType === "WITHDRAW_FUNDS") {
      modules.push("withdrawal-engine");
    }
    
    modules.push("dashboard", "positions-page");
    
    return modules;
  }
  
  /**
   * Notify user of required actions
   */
  private notifyUserOfRequiredActions(job: ExecutionJob, strategy: RecoveryStrategy): void {
    orchestrator.publishEvent({
      type: "sync_required",
      timestamp: new Date(),
      source: this.handlerId,
      data: {
        jobId: job.id,
        notification: {
          type: "action_required",
          title: "Action Required",
          message: strategy.userNotification,
          actions: strategy.requiredActions,
        },
      },
      affectedModules: ["dashboard"],
    });
  }
}

export interface RecoveryStrategy {
  category: FailureCategory;
  isRecoverable: boolean;
  shouldRetry: boolean;
  retryDelay: number;
  requiredActions: string[];
  userNotification: string;
  syncRequired: boolean;
  partialCompletionState: any;
}

export const recoveryHandler = new RecoveryHandler();