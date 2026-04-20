// ============================================================================
// POST EXECUTION SYNC
// Centralized state synchronization after any execution
// ============================================================================

import { syncEngine } from "../sync";
import { orchestrator } from "../orchestrator";
import type { ExecutionResult, ReconciliationResult } from "./types";
import { reconciliationService } from "./ReconciliationService";
import { useAppStore } from "@/store";

export class PostExecutionSync {
  private syncId = "post-execution-sync";

  /**
   * Sync state after execution completes
   * 
   * CRITICAL: Routes reconciliation through Sync Engine
   */
  async syncAfterExecution(
    result: ExecutionResult,
    mode: "demo" | "shadow" | "live",
    walletAddress?: string,
    chain?: string
  ): Promise<void> {
    console.log(`[PostExecutionSync] Syncing after execution in ${mode} mode`);

    // Step 1: Basic state sync (all modes)
    await syncEngine.syncAll();

    // Step 2: Live Mode reconciliation
    if (mode === "live" && result.status === "success" && walletAddress && chain) {
      console.log(`[PostExecutionSync] Initiating onchain reconciliation for Live Mode`);

      // Extract expected state from execution result
      const expectedState = this.extractExpectedState(result);

      // Get final tx hash
      const finalTxHash = result.txHashes[result.txHashes.length - 1];

      if (finalTxHash) {
        try {
          // CRITICAL: Reconcile with actual onchain state
          const reconciliationResult = await reconciliationService.reconcile(
            finalTxHash,
            result.actionType,
            expectedState,
            walletAddress,
            chain
          );

          // Add reconciliation result to execution result
          result.reconciliation = reconciliationResult;

          // If critical discrepancies, add to audit log
          if (reconciliationResult.criticalDiscrepancies > 0) {
            console.warn(
              `[PostExecutionSync] CRITICAL DISCREPANCIES DETECTED: ${reconciliationResult.criticalDiscrepancies}`
            );

            useAppStore.getState().addAuditLog({
              id: `reconciliation-${finalTxHash}`,
              timestamp: new Date(),
              mode: "live",
              actionType: "reconciliation_warning",
              actor: walletAddress,
              walletAddress,
              details: {
                txHash: finalTxHash,
                actionType: result.actionType,
                discrepancies: reconciliationResult.discrepancies,
                criticalCount: reconciliationResult.criticalDiscrepancies,
              },
              success: true,
            });
          }

          console.log(
            `[PostExecutionSync] Reconciliation complete. ` +
            `Discrepancies: ${reconciliationResult.totalDiscrepancies}, ` +
            `Critical: ${reconciliationResult.criticalDiscrepancies}`
          );
        } catch (error) {
          console.error(`[PostExecutionSync] Reconciliation failed:`, error);

          // Add failure to audit log
          useAppStore.getState().addAuditLog({
            id: `reconciliation-error-${finalTxHash}`,
            timestamp: new Date(),
            mode: "live",
            actionType: "reconciliation_failed",
            actor: walletAddress,
            walletAddress,
            details: {
              txHash: finalTxHash,
              actionType: result.actionType,
              error: error instanceof Error ? error.message : "Unknown error",
            },
            success: false,
          });
        }
      }
    }

    // Step 3: Notify affected modules
    await orchestrator.coordinateUpdate(
      this.syncId,
      "execution_completed" as any,
      { result, mode },
      ["dashboard", "wallets", "positions", "opportunities", "withdraw", "execution_center"]
    );

    console.log(`[PostExecutionSync] Post-execution sync complete`);
  }

  /**
   * Extract expected state from execution result
   */
  private extractExpectedState(result: ExecutionResult): any {
    // STUB: Would extract expected balances, positions, allowances from result
    // For now, return empty structure
    return {
      balances: {},
      positions: {},
      allowances: {},
    };
  }
}

export const postExecutionSync = new PostExecutionSync();