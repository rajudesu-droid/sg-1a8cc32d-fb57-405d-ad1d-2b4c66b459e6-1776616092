// ============================================================================
// AUTOMATED EXECUTION ENGINE
// Orchestrates the complete action lifecycle with job queues and recovery
// ============================================================================

import type {
  ActionTrigger,
  ActionStatus,
  ValidationResult,
} from "../contracts/actions";
import type { ExecutionJob, JobPriority } from "../execution/ExecutionJob";
import type { ActionPlan, ExecutionResult } from "../execution/types";
import { orchestrator } from "../orchestrator";
import { validationEngine } from "./ValidationEngine";
import { actionPlanner } from "../execution/ActionPlanner";
import { previewEngine } from "../execution/PreviewEngine";
import { authorizationEngine } from "../execution/AuthorizationEngine";
import { executionRunner } from "../execution/ExecutionRunner";
import { createExecutionJob, getPriorityForAction, getTargetEntity } from "../execution/ExecutionJob";
import { recoveryHandler } from "../execution/RecoveryHandler";
import { postExecutionSync } from "../execution/PostExecutionSync";
import { executionLogService } from "../execution/ExecutionLogService";
import { concurrencyController } from "../execution/ConcurrencyController";
import { performanceMonitor } from "../performance/PerformanceMonitor";
import { useAppStore } from "@/store";

export class AutomatedExecutionEngine {
  private engineId = "execution-engine";
  private engineVersion = "2.0.0";
  
  // Job queue (priority-based)
  private jobQueue: ExecutionJob[] = [];
  
  // Active jobs (currently executing)
  private activeJobs = new Map<string, ExecutionJob>();
  
  // Processing lock
  private isProcessing = false;

  constructor() {
    this.registerWithOrchestrator();
    console.log(`[ExecutionEngine] Initialized v${this.engineVersion}`);
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Submit a new execution trigger
   */
  async submitTrigger(trigger: ActionTrigger): Promise<ExecutionJob> {
    console.log(`[ExecutionEngine] Received trigger: ${trigger.actionType} from ${trigger.source}`);

    // Create execution job
    const priority = getPriorityForAction(trigger.actionType);
    const { type: targetType, id: targetId } = getTargetEntity(trigger);
    
    const job = createExecutionJob(trigger, priority, targetType, targetId);

    // Check for conflicts
    if (concurrencyController.hasConflict(job)) {
      console.warn(`[ExecutionEngine] Job ${job.id} conflicts with active execution`);
      job.status = "paused";
      job.errorInfo = {
        category: "sync_mismatch",
        message: "Conflicting execution in progress. Job paused.",
        recoverable: true,
        retryCount: 0,
      };
    }

    // Add to queue (priority-sorted)
    this.enqueueJob(job);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return job;
  }

  /**
   * Get all active jobs
   */
  getActiveJobs(): ExecutionJob[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Get specific job by ID
   */
  getJob(jobId: string): ExecutionJob | undefined {
    return this.activeJobs.get(jobId) || this.jobQueue.find(j => j.id === jobId);
  }

  /**
   * Cancel a pending or paused job
   */
  cancelJob(jobId: string): boolean {
    const job = this.getJob(jobId);
    if (!job) return false;

    if (job.status === "queued" || job.status === "paused") {
      job.status = "cancelled";
      job.completedAt = new Date();
      this.removeFromQueue(jobId);
      console.log(`[ExecutionEngine] Job ${jobId} cancelled`);
      return true;
    }

    console.warn(`[ExecutionEngine] Cannot cancel job ${jobId} in status ${job.status}`);
    return false;
  }

  // ============================================================================
  // QUEUE MANAGEMENT
  // ============================================================================

  private enqueueJob(job: ExecutionJob): void {
    // Insert job in priority order
    const priorityOrder: Record<JobPriority, number> = {
      emergency: 0,
      critical: 1,
      high: 2,
      normal: 3,
      low: 4,
    };

    const insertIndex = this.jobQueue.findIndex(
      (existingJob) => priorityOrder[existingJob.priority] > priorityOrder[job.priority]
    );

    if (insertIndex === -1) {
      this.jobQueue.push(job);
    } else {
      this.jobQueue.splice(insertIndex, 0, job);
    }

    console.log(`[ExecutionEngine] Job ${job.id} queued with priority ${job.priority}`);
  }

  private removeFromQueue(jobId: string): void {
    this.jobQueue = this.jobQueue.filter((j) => j.id !== jobId);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.jobQueue.length > 0) {
      const job = this.jobQueue.shift();
      if (!job) break;

      // Skip cancelled or expired jobs
      if (job.status === "cancelled" || new Date() > job.expiresAt) {
        console.log(`[ExecutionEngine] Skipping ${job.status} job ${job.id}`);
        continue;
      }

      // Skip paused jobs
      if (job.status === "paused") {
        console.log(`[ExecutionEngine] Job ${job.id} is paused. Re-queueing.`);
        this.jobQueue.push(job);
        continue;
      }

      // Process job
      await this.processJob(job);
    }

    this.isProcessing = false;
  }

  // ============================================================================
  // JOB PROCESSING
  // ============================================================================

  private async processJob(job: ExecutionJob): Promise<void> {
    const jobOperationId = `job-${job.id}`;
    performanceMonitor.startOperation(jobOperationId, "execution_pipeline", {
      actionType: job.actionType,
      mode: job.mode,
      priority: job.priority,
    });

    console.log(`[ExecutionEngine] Processing job ${job.id} (${job.actionType}) in ${job.mode} mode`);

    // Add to active jobs
    this.activeJobs.set(job.id, job);

    // Acquire lock
    if (!concurrencyController.acquireLock(job)) {
      console.warn(`[ExecutionEngine] Could not acquire lock for job ${job.id}`);
      job.status = "paused";
      this.jobQueue.push(job); // Re-queue
      this.activeJobs.delete(job.id);
      performanceMonitor.endOperation(jobOperationId, "execution_pipeline", { paused: true });
      return;
    }

    try {
      // STEP 1: VALIDATION
      job.status = "validating";
      job.updatedAt = new Date();
      
      const validation = await performanceMonitor.trackAsync(
        "validation",
        async () => validationEngine.validateAction(job.trigger),
        { jobId: job.id }
      );
      
      job.validationSnapshot = validation;

      if (!validation.allowed) {
        job.status = "validation_failed";
        job.errorInfo = {
          category: "stale_state",
          message: validation.blockingReasons.join("; "),
          recoverable: false,
          retryCount: 0,
        };
        await this.handleJobCompletion(job);
        performanceMonitor.endOperation(jobOperationId, "execution_pipeline", { failed: true });
        return;
      }

      // STEP 2: PLANNING
      job.status = "planning";
      job.updatedAt = new Date();
      const context = this.buildExecutionContext(job.trigger);
      
      const plan = await performanceMonitor.trackAsync(
        "action_planning",
        async () => actionPlanner.generatePlan(job.trigger, context),
        { jobId: job.id }
      );
      
      job.actionPlan = plan;

      // STEP 3: PREVIEW
      job.status = "previewing";
      job.updatedAt = new Date();
      
      const preview = await performanceMonitor.trackAsync(
        "preview_generation",
        async () => previewEngine.generatePreview(plan, context),
        { jobId: job.id }
      );
      
      job.previewSnapshot = preview;

      // Broadcast preview for UI
      orchestrator.publishEvent({
        type: "action_triggered" as any,
        timestamp: new Date(),
        source: this.engineId,
        data: { job, preview },
        affectedModules: ["dashboard", "positions-page"],
      });

      // MODE-SPECIFIC BEHAVIOR
      if (job.mode === "shadow") {
        // Shadow mode: preview only, no execution
        job.status = "completed";
        job.executionResult = {
          executionId: `shadow-${job.id}`,
          planId: plan.planId,
          actionType: job.actionType,
          status: "completed",
          completedSteps: 0,
          totalSteps: plan.totalSteps,
          transactions: [],
          stateChanges: {
            balancesBefore: {},
            balancesAfter: {},
            positionsAffected: [],
            portfolioValueChange: 0
          },
          startedAt: new Date(),
          completedAt: new Date(),
          logs: ["Shadow mode: Preview generated, no execution performed"],
        };
        
        await postExecutionSync.syncAfterExecution(job);
        executionLogService.logJobResult(job);
        await this.handleJobCompletion(job);
        performanceMonitor.endOperation(jobOperationId, "execution_pipeline", { shadow: true });
        return;
      }

      // STEP 4: AUTHORIZATION
      job.status = "awaiting_authorization";
      job.updatedAt = new Date();
      const auth = await authorizationEngine.requestAuthorization(plan, preview, context);

      if (!auth.authorized) {
        console.log(`[ExecutionEngine] Job ${job.id} awaiting authorization`);
        
        // Auto-approve for demo mode
        if (job.mode === "demo") {
          const approved = await authorizationEngine.approveAuthorization(auth);
          if (!approved.authorized) {
            job.status = "failed";
            job.errorInfo = {
              category: "user_rejected",
              message: "Authorization failed",
              recoverable: false,
              retryCount: 0,
            };
            await this.handleJobCompletion(job);
            performanceMonitor.endOperation(jobOperationId, "execution_pipeline", { failed: true });
            return;
          }
        } else if (job.mode === "live") {
          // Live mode requires explicit user approval (keep in awaiting state)
          job.status = "awaiting_authorization";
          this.activeJobs.delete(job.id);
          concurrencyController.releaseLock(job);
          performanceMonitor.endOperation(jobOperationId, "execution_pipeline", { awaiting: true });
          return;
        }
      }

      // STEP 5: EXECUTION
      job.status = "executing";
      job.startedAt = new Date();
      job.updatedAt = new Date();
      
      const result = await performanceMonitor.trackAsync(
        "execution_start",
        async () => executionRunner.execute(plan, auth, context),
        { jobId: job.id }
      );
      
      job.executionResult = result;

      // STEP 6: RESULT HANDLING
      if (result.status === "completed") {
        job.status = "completed";
        console.log(`[ExecutionEngine] Job ${job.id} completed successfully`);
      } else if (result.status === "failed") {
        job.status = "failed";
        console.log(`[ExecutionEngine] Job ${job.id} failed`);
        
        // STEP 7: RECOVERY
        const recoveryStrategy = await recoveryHandler.handleFailure(job, result);
        await recoveryHandler.executeRecovery(job, recoveryStrategy);
      } else {
        job.status = "partially_completed";
        console.log(`[ExecutionEngine] Job ${job.id} partially completed`);
      }

      // STEP 8: POST-EXECUTION SYNC
      await performanceMonitor.trackAsync(
        "sync_propagation",
        async () => postExecutionSync.syncAfterExecution(job),
        { jobId: job.id }
      );

      // STEP 9: AUDIT LOGGING
      executionLogService.logJobResult(job);

      // STEP 10: CLEANUP
      await this.handleJobCompletion(job);
      performanceMonitor.endOperation(jobOperationId, "execution_pipeline", { success: true });

    } catch (error: any) {
      console.error(`[ExecutionEngine] Unexpected error in job ${job.id}:`, error);
      job.status = "failed";
      job.errorInfo = {
        category: "unknown_error",
        message: error.message || "Unknown execution error",
        recoverable: false,
        retryCount: 0,
      };
      await this.handleJobCompletion(job);
      performanceMonitor.endOperation(jobOperationId, "execution_pipeline", { error: true });
    }
  }

  private async handleJobCompletion(job: ExecutionJob): Promise<void> {
    job.completedAt = new Date();
    job.updatedAt = new Date();

    // Release lock
    concurrencyController.releaseLock(job);

    // Keep in active jobs for 1 minute for UI display
    setTimeout(() => {
      this.activeJobs.delete(job.id);
    }, 60000);

    console.log(`[ExecutionEngine] Job ${job.id} completed with status: ${job.status}`);
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private buildExecutionContext(trigger: ActionTrigger): any {
    const store = useAppStore.getState();

    return {
      mode: trigger.mode,
      wallet: store.wallet,
      portfolio: store.portfolio,
      positions: store.positions,
      policy: store.policy,
    };
  }

  private registerWithOrchestrator() {
    orchestrator.registerEngine(this.engineId, this);

    // Listen for new triggers from any source
    orchestrator.subscribe(async (event) => {
      if (event.type === ("action_triggered" as any) && event.source !== this.engineId) {
        if (event.data && event.data.trigger) {
          await this.submitTrigger(event.data.trigger);
        }
      }
    });

    console.log("[ExecutionEngine] Registered with orchestrator");
  }

  // ============================================================================
  // ENGINE INTERFACE
  // ============================================================================

  getName(): string {
    return "Automated Execution Engine";
  }

  getStatus(): Record<string, any> {
    return {
      engineId: this.engineId,
      version: this.engineVersion,
      queueLength: this.jobQueue.length,
      activeJobs: this.activeJobs.size,
      isProcessing: this.isProcessing,
      status: "operational",
    };
  }
}

export const executionEngine = new AutomatedExecutionEngine();