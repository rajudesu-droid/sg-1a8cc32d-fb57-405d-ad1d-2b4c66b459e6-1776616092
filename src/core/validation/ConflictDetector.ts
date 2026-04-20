/**
 * Conflict Detector
 * Prevents concurrent operations on the same entity
 * 
 * CRITICAL: No duplicate/conflicting operations in Live Mode
 */

import { useAppStore } from "@/store";

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingJobs: Array<{
    jobId: string;
    actionType: string;
    status: string;
    entity: string;
  }>;
  reason?: string;
}

export class ConflictDetector {
  /**
   * Check for conflicting execution jobs
   */
  checkForConflicts(
    actionType: string,
    targetEntity: {
      type: "wallet" | "position" | "pool" | "protocol";
      id: string;
    },
    mode: "demo" | "shadow" | "live"
  ): ConflictCheckResult {
    // CRITICAL: Only enforce in Live Mode
    if (mode !== "live") {
      return {
        hasConflict: false,
        conflictingJobs: [],
      };
    }

    const store = useAppStore.getState();
    const executionJobs = store.executionJobs || [];

    // Find active jobs (not completed/failed/cancelled)
    const activeJobs = executionJobs.filter(job => 
      ["pending", "validating", "planning", "previewing", "awaiting_authorization", "executing"].includes(job.status)
    );

    // Check for conflicts based on entity type and action type
    const conflicts = activeJobs.filter(job => {
      // Same position operations
      if (targetEntity.type === "position" && job.positionId === targetEntity.id) {
        return this.areActionsConflicting(actionType, job.actionType);
      }

      // Same wallet operations
      if (targetEntity.type === "wallet" && job.walletAddress === targetEntity.id) {
        return this.areActionsConflicting(actionType, job.actionType);
      }

      // Same pool operations
      if (targetEntity.type === "pool" && job.poolAddress === targetEntity.id) {
        return this.areActionsConflicting(actionType, job.actionType);
      }

      return false;
    });

    if (conflicts.length > 0) {
      return {
        hasConflict: true,
        conflictingJobs: conflicts.map(job => ({
          jobId: job.id,
          actionType: job.actionType,
          status: job.status,
          entity: this.getEntityIdentifier(job),
        })),
        reason: `Conflicting ${conflicts[0].actionType} operation already running`,
      };
    }

    return {
      hasConflict: false,
      conflictingJobs: [],
    };
  }

  /**
   * Check if two action types conflict
   */
  private areActionsConflicting(action1: string, action2: string): boolean {
    // Same action type always conflicts
    if (action1 === action2) {
      return true;
    }

    // Define conflict matrix
    const conflicts: Record<string, string[]> = {
      "enter_position": ["exit_position", "add_liquidity", "remove_liquidity", "rebalance_position"],
      "exit_position": ["enter_position", "add_liquidity", "remove_liquidity", "rebalance_position", "harvest_rewards"],
      "add_liquidity": ["enter_position", "exit_position", "remove_liquidity", "rebalance_position"],
      "remove_liquidity": ["enter_position", "exit_position", "add_liquidity", "rebalance_position"],
      "harvest_rewards": ["exit_position", "rebalance_position"],
      "compound_rewards": ["harvest_rewards", "exit_position"],
      "rebalance_position": ["enter_position", "exit_position", "add_liquidity", "remove_liquidity", "harvest_rewards"],
    };

    return conflicts[action1]?.includes(action2) || false;
  }

  /**
   * Get entity identifier from job
   */
  private getEntityIdentifier(job: any): string {
    if (job.positionId) return `position:${job.positionId}`;
    if (job.poolAddress) return `pool:${job.poolAddress}`;
    if (job.walletAddress) return `wallet:${job.walletAddress}`;
    return "unknown";
  }

  /**
   * Check for sync conflicts
   */
  checkSyncConflicts(mode: "demo" | "shadow" | "live"): ConflictCheckResult {
    // CRITICAL: Only enforce in Live Mode
    if (mode !== "live") {
      return {
        hasConflict: false,
        conflictingJobs: [],
      };
    }

    const store = useAppStore.getState();
    
    // Check if sync is in progress
    const isSyncing = (store as any).isSyncing || false;
    
    if (isSyncing) {
      return {
        hasConflict: true,
        conflictingJobs: [],
        reason: "State synchronization in progress - execution blocked until complete",
      };
    }

    // Check for sync errors
    const syncError = (store as any).syncError;
    
    if (syncError) {
      return {
        hasConflict: true,
        conflictingJobs: [],
        reason: `Sync error detected: ${syncError} - resolve before executing`,
      };
    }

    return {
      hasConflict: false,
      conflictingJobs: [],
    };
  }
}

export const conflictDetector = new ConflictDetector();