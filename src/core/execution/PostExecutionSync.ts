// ============================================================================
// POST EXECUTION SYNC
// Centralized state synchronization after any execution
// ============================================================================

import type { ExecutionJob } from "./ExecutionJob";
import { orchestrator } from "../orchestrator";
import { syncEngine } from "../sync";
import { incrementalRefreshService } from "../performance/IncrementalRefreshService";

export class PostExecutionSync {
  /**
   * Sync state after execution
   */
  async syncAfterExecution(job: ExecutionJob): Promise<void> {
    console.log(`[PostExecutionSync] Syncing after ${job.actionType} execution`);

    // Determine affected modules based on action type
    const affectedModules = this.getAffectedModules(job);

    // Publish sync event
    orchestrator.publishEvent({
      type: "sync_required",
      timestamp: new Date(),
      source: "post-execution-sync",
      data: { job },
      affectedModules,
    });

    // Trigger sync engine
    await syncEngine.syncAffectedModules(affectedModules);

    // Use incremental refresh for targeted entity updates
    if (job.targetEntityType === "position" && job.targetEntityId) {
      await incrementalRefreshService.refreshAfterPositionChange(
        job.targetEntityId,
        job.mode
      );
    } else if (job.targetEntityType === "wallet" && job.walletId) {
      await incrementalRefreshService.refreshAfterWalletChange(
        job.walletId,
        job.mode
      );
    } else {
      await incrementalRefreshService.refreshAfterPortfolioChange(job.mode);
    }
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
}

export const postExecutionSync = new PostExecutionSync();