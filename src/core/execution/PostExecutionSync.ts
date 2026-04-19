// ============================================================================
// POST EXECUTION SYNC
// Centralized state synchronization after any execution
// ============================================================================

import type { ExecutionJob } from "./ExecutionJob";
import { orchestrator } from "../orchestrator";
import { syncEngine } from "../sync";
import { useAppStore } from "@/store";

export class PostExecutionSync {
  private syncId = "post-execution-sync";

  /**
   * Trigger global synchronization after an execution job completes or fails partially
   */
  async syncAfterExecution(job: ExecutionJob): Promise<void> {
    console.log(`[PostExecutionSync] Starting sync after job ${job.id} (${job.actionType})`);

    // 1. Determine affected modules based on action type
    const affectedModules = this.determineAffectedModules(job);

    // 2. Publish sync required event
    orchestrator.publishEvent({
      type: "sync_required",
      timestamp: new Date(),
      source: this.syncId,
      data: {
        jobId: job.id,
        actionType: job.actionType,
        targetEntityId: job.targetEntityId,
        status: job.status,
      },
      affectedModules,
    });

    // 3. Directly trigger the sync engine for immediate UI consistency
    await syncEngine.syncAffectedModules(affectedModules);
    
    // 4. Handle Demo mode specific paper wallet updates if needed
    if (job.mode === "demo" && job.executionResult?.stateChanges) {
      this.applyDemoStateChanges(job);
    }

    console.log(`[PostExecutionSync] Completed sync for ${affectedModules.length} modules`);
  }

  /**
   * Identifies exactly which parts of the application need refreshing
   */
  private determineAffectedModules(job: ExecutionJob): string[] {
    const modules = new Set<string>();
    
    // Core modules affected by almost all actions
    modules.add("wallet-engine");
    modules.add("portfolio-engine");
    modules.add("dashboard");
    
    // Action specific module resolution
    switch (job.actionType) {
      case "ADD_LIQUIDITY":
      case "DEPOSIT":
      case "STAKE":
      case "REMOVE_LIQUIDITY":
      case "EXIT_POSITION":
      case "REBALANCE":
        modules.add("position-engine");
        modules.add("positions-page");
        modules.add("opportunities-page"); // Capital was deployed, opportunities need rescoring
        break;
        
      case "HARVEST_REWARDS":
      case "COMPOUND":
      case "CONVERT_REWARDS":
        modules.add("position-engine");
        modules.add("rewards-engine");
        modules.add("positions-page");
        break;
        
      case "WITHDRAW_FUNDS":
        modules.add("withdrawal-engine");
        modules.add("position-engine");
        modules.add("positions-page");
        break;
        
      case "EMERGENCY_PAUSE":
      case "CANCEL_PENDING":
      case "REFRESH_STATE":
        modules.add("policy-engine");
        modules.add("system-monitor");
        break;
    }
    
    return Array.from(modules);
  }

  /**
   * Applies simulated state changes to the local demo store
   */
  private applyDemoStateChanges(job: ExecutionJob): void {
    const store = useAppStore.getState();
    const changes = job.executionResult?.stateChanges;
    
    if (!changes) return;
    
    console.log(`[PostExecutionSync] Applying demo state changes for job ${job.id}`);
    
    // Note: In a fully implemented system, this would explicitly update 
    // the paperWallets array with the exact simulated token transfers.
    // The ExecutionResult.stateChanges would contain the delta to apply.
  }
}

export const postExecutionSync = new PostExecutionSync();