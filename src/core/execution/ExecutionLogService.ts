import type { ExecutionJob } from "./ExecutionJob";
import { serverAuditService } from "@/services/ServerAuditService";
import { executionRecordService } from "@/services/ExecutionRecordService";

/**
 * Execution Log Service
 * Handles logging of execution lifecycle events
 * 
 * CRITICAL: Routes to server-side audit trail for Live Mode
 */
export class ExecutionLogService {
  private serviceId = "execution-log-service";

  /**
   * Log job result
   * 
   * CRITICAL: Creates server-side execution record for Live Mode
   */
  async logJobResult(job: ExecutionJob): Promise<void> {
    const logEntry = {
      jobId: job.id,
      actionType: job.actionType,
      mode: job.mode,
      status: job.status,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      duration: job.completedAt && job.startedAt 
        ? (job.completedAt.getTime() - job.startedAt.getTime()) / 1000 
        : 0,
      result: job.executionResult,
      error: job.errorInfo,
    };

    console.log(`[ExecutionLogService] Logging job result: ${job.id}`, logEntry);

    // CRITICAL: For Live Mode, create or update server-side execution record
    if (job.mode === "live" && job.executionResult) {
      const walletAddress = job.trigger.walletAddress || "";
      
      try {
        // Check if record already exists
        const existingRecord = await executionRecordService.getRecord(job.id);
        
        if (existingRecord) {
          // Update existing record
          await executionRecordService.updateRecord(job.id, {
            status: this.mapJobStatusToRecordStatus(job.status),
            txHashes: job.executionResult.txHashes || [],
            receipts: job.executionResult.transactions || [],
            gasUsed: job.executionResult.gasUsed,
            totalCostUsd: job.executionResult.totalCost,
            balancesAfter: job.executionResult.stateChanges?.balancesAfter || {},
            positionsAfter: [],
            rewardsAfter: [],
            reconciliationResult: job.executionResult.reconciliation,
            discrepancyFlags: job.executionResult.reconciliation?.discrepancies.map(d => d.type),
            stateDriftDetected: (job.executionResult.reconciliation?.criticalDiscrepancies || 0) > 0,
            criticalDiscrepancies: job.executionResult.reconciliation?.criticalDiscrepancies,
            errorMessage: job.errorInfo?.message,
            completedAt: job.completedAt,
            reconciledAt: job.executionResult.reconciliation?.reconciledAt,
          });
          
          console.log(`[ExecutionLogService] Updated server-side execution record: ${job.id}`);
        } else {
          // Create new record (if not already created by ExecutionRunner)
          await executionRecordService.createRecord({
            actionId: job.id,
            actionType: job.actionType,
            mode: job.mode,
            walletAddress,
            protocol: job.trigger.protocol,
            chain: job.trigger.chain,
            poolAddress: (job as any).poolAddress,
            validationSnapshot: (job as any).validationSnapshot,
            actionPlanSnapshot: job.actionPlan,
            previewSnapshot: (job as any).previewSnapshot,
            balancesBefore: job.executionResult.stateChanges?.balancesBefore || {},
          });
          
          console.log(`[ExecutionLogService] Created server-side execution record: ${job.id}`);
        }

        // Also log to audit trail
        await serverAuditService.log({
          actionType: this.mapActionTypeToAuditAction(job.actionType),
          actor: walletAddress,
          mode: job.mode,
          walletAddress,
          executionRecordId: job.id,
          details: {
            jobId: job.id,
            status: job.status,
            result: job.executionResult,
          },
          success: job.status === "completed",
          errorMessage: job.errorInfo?.message,
        });
        
        console.log(`[ExecutionLogService] Logged to server-side audit trail: ${job.id}`);
      } catch (error) {
        console.error(`[ExecutionLogService] Failed to create server-side records:`, error);
      }
    }

    // Local logging (for all modes)
    this.logToConsole(logEntry);
  }

  /**
   * Map job status to execution record status
   */
  private mapJobStatusToRecordStatus(status: string): "pending" | "executing" | "completed" | "failed" | "cancelled" {
    switch (status) {
      case "completed": return "completed";
      case "failed": return "failed";
      case "cancelled": return "cancelled";
      case "executing": return "executing";
      default: return "pending";
    }
  }

  /**
   * Map action type to audit action type
   */
  private mapActionTypeToAuditAction(actionType: string): any {
    const mapping: Record<string, any> = {
      "enter_position": "position_open",
      "exit_position": "position_close",
      "harvest_rewards": "harvest",
      "compound_rewards": "compound",
      "rebalance_position": "rebalance",
      "withdraw": "withdrawal",
    };
    
    return mapping[actionType] || "simulation";
  }

  /**
   * Log to console (for debugging)
   */
  private logToConsole(entry: any): void {
    const prefix = `[ExecutionLog][${entry.mode}][${entry.actionType}]`;
    
    if (entry.status === "completed") {
      console.log(`${prefix} ✅ COMPLETED in ${entry.duration}s`);
    } else if (entry.status === "failed") {
      console.error(`${prefix} ❌ FAILED: ${entry.error?.message || "Unknown error"}`);
    } else {
      console.log(`${prefix} ${entry.status.toUpperCase()}`);
    }
  }
}

export const executionLogService = new ExecutionLogService();