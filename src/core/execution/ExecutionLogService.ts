// ============================================================================
// EXECUTION LOG SERVICE
// Comprehensive audit logging for all execution jobs
// ============================================================================

import type { ExecutionJob, ExecutionLog } from "./ExecutionJob";
import { useAppStore } from "@/store";

export class ExecutionLogService {
  /**
   * Creates a comprehensive audit log entry for a completed or failed job
   */
  logJobResult(job: ExecutionJob): ExecutionLog {
    console.log(`[ExecutionLogService] Generating audit log for job ${job.id}`);
    
    const isSuccess = job.status === "completed";
    
    // Compile step logs
    const stepLogs = job.executionResult?.transactions.map(tx => 
      `Tx: ${tx.txHash} (Gas: ${tx.gasUsed}) - ${tx.status}`
    ) || [];
    
    if (job.executionResult?.logs) {
      stepLogs.push(...job.executionResult.logs);
    }
    
    const log: ExecutionLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      jobId: job.id,
      timestamp: new Date(),
      
      actionType: job.actionType,
      mode: job.mode,
      sourceEngine: job.sourceEngine,
      
      protocol: job.protocol,
      chain: job.chain,
      pool: job.targetEntityType === "pool" || job.targetEntityType === "position" ? job.targetEntityId : undefined,
      walletAddress: job.walletId,
      portfolioId: job.portfolioId,
      
      reasonCode: job.reasonCode,
      
      // Store lightweight snapshots
      validationSnapshot: job.validationSnapshot,
      actionPlanSnapshot: job.actionPlan,
      previewSnapshot: job.previewSnapshot,
      finalResult: job.executionResult,
      
      // Costs
      gasEstimate: job.actionPlan?.totalEstimatedGas,
      gasActual: job.executionResult?.stateChanges?.gasUsed,
      slippageEstimate: job.actionPlan?.estimatedSlippage,
      
      // Risks
      riskFlags: job.actionPlan?.risks || [],
      warnings: job.actionPlan?.warnings || [],
      
      stepLogs,
      
      success: isSuccess,
      error: job.errorInfo,
    };
    
    // Save to centralized store
    this.persistToStore(log);
    
    return log;
  }
  
  private persistToStore(log: ExecutionLog): void {
    const store = useAppStore.getState();
    
    // Append to global audit log 
    store.addAuditLog({
      id: log.id,
      timestamp: log.timestamp as any,
      mode: log.mode,
      actionType: "simulation" as any, // Simplified for UI compatibility
      actor: log.sourceEngine,
      details: {
        actionType: log.actionType,
        protocol: log.protocol,
        chain: log.chain,
        success: log.success,
        gasUsed: log.gasActual,
        error: log.error?.message,
      },
      success: log.success,
      error: log.error?.message,
    });
  }
}

export const executionLogService = new ExecutionLogService();