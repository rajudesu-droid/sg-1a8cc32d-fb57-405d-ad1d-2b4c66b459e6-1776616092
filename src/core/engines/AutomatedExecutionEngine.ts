// ============================================================================
// AUTOMATED EXECUTION ENGINE
// Orchestrates the full lifecycle of automated actions
// ============================================================================

import { orchestrator } from "../orchestrator";
import { useAppStore } from "@/store";
import { validationEngine } from "./ValidationEngine";
import type {
  ActionTrigger,
  ActionPlan,
  ExecutionResult,
  ActionStatus,
} from "../contracts/actions";

export class AutomatedExecutionEngine {
  private engineId = "execution-engine";
  private activeExecutions = new Map<string, ExecutionResult>();

  constructor() {
    console.log("[ExecutionEngine] Initializing...");
    this.registerWithOrchestrator();
  }

  private registerWithOrchestrator() {
    orchestrator.registerEngine(this.engineId, this);
    
    // Listen for new triggers from any source
    orchestrator.subscribe(async (event) => {
      // We expect event.type to be "action_triggered"
      if (event.type === ("action_triggered" as any) && event.source !== this.engineId) {
        if (event.payload && event.payload.trigger) {
          await this.processTrigger(event.payload.trigger);
        }
      }
    });

    console.log("[ExecutionEngine] Registered with orchestrator");
  }

  // ============================================================================
  // LIFECYCLE MANAGEMENT
  // ============================================================================

  async processTrigger(trigger: ActionTrigger) {
    console.log(`[ExecutionEngine] Processing trigger ${trigger.id} (${trigger.actionType})`);
    
    this.logAudit(trigger, "triggered", `Action ${trigger.actionType} triggered by ${trigger.source} in ${trigger.mode} mode`);

    try {
      // 1. Validation Phase
      const validation = await validationEngine.validateAction(trigger);
      
      if (!validation.allowed) {
        console.warn(`[ExecutionEngine] Trigger ${trigger.id} failed validation`);
        this.logAudit(
          trigger, 
          "validation_failed", 
          `Validation blocked: ${validation.blockingReasons.join(", ")}`
        );
        return;
      }

      if (validation.warningFlags.length > 0) {
        this.logAudit(
          trigger,
          "validating",
          `Validation passed with warnings: ${validation.warningFlags.join(", ")}`
        );
      }

      // 2. Planning Phase
      const plan = await this.planAction(trigger);
      this.logAudit(trigger, "planning", `Generated execution plan with ${plan.steps.length} steps. Gas est: $${plan.totalGasEstimate}`);

      // 3. Execution Phase (Preview & Authorization would happen here if live)
      if (trigger.mode === "live") {
        this.logAudit(trigger, "awaiting_authorization", "Awaiting execution authorization for live network");
        // For now, simulate auto-authorization
      }

      await this.executePlan(plan, trigger);

    } catch (error: any) {
      console.error(`[ExecutionEngine] Fatal error processing trigger ${trigger.id}:`, error);
      this.logAudit(trigger, "failed", `Fatal execution error: ${error.message || "Unknown error"}`);
    }
  }

  // ============================================================================
  // PLANNING
  // ============================================================================

  private async planAction(trigger: ActionTrigger): Promise<ActionPlan> {
    // In a full implementation, this queries protocol adapters to build real steps.
    // We create a generalized plan based on action type.
    
    const steps = [];
    let gasEstimate = 0;

    // Standard sequence: Query -> Approve (if needed) -> Transact -> Confirm
    if (trigger.actionType === "ADD_LIQUIDITY" || trigger.actionType === "DEPOSIT" || trigger.actionType === "STAKE") {
      steps.push({
        stepId: `step-${Date.now()}-1`,
        stepType: "approval" as const,
        description: `Approve ${trigger.token || "token"} for protocol`,
        canRetry: true,
        maxRetries: 1,
      });
      gasEstimate += 5;
    }

    steps.push({
      stepId: `step-${Date.now()}-2`,
      stepType: "transaction" as const,
      description: `Execute ${trigger.actionType} payload`,
      canRetry: false,
      maxRetries: 0,
    });
    gasEstimate += 15;

    return {
      planId: `plan-${trigger.id}`,
      actionType: trigger.actionType,
      steps,
      totalGasEstimate: gasEstimate,
      estimatedDuration: steps.length * 3000,
      riskLevel: trigger.amount && trigger.amount > 10000 ? "medium" : "low",
      reversible: trigger.actionType !== "EXIT_POSITION",
      createdAt: new Date(),
    };
  }

  // ============================================================================
  // EXECUTION
  // ============================================================================

  private async executePlan(plan: ActionPlan, trigger: ActionTrigger) {
    this.logAudit(trigger, "executing", `Executing ${plan.actionType} plan...`);
    
    const result: ExecutionResult = {
      executionId: `exec-${trigger.id}`,
      actionType: trigger.actionType,
      status: "executing",
      stepResults: [],
      success: false,
      startedAt: new Date(),
    };
    
    this.activeExecutions.set(result.executionId, result);

    try {
      // Execute steps sequentially
      for (const step of plan.steps) {
        console.log(`[ExecutionEngine] Executing step: ${step.description}`);
        
        // Simulate execution delay (in real app, this calls protocol adapters)
        const delay = trigger.mode === "demo" ? 500 : 2000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        result.stepResults.push({
          stepId: step.stepId,
          status: "success",
          transactionHash: trigger.mode !== "demo" ? `0x${Math.random().toString(16).slice(2, 42)}` : undefined,
          completedAt: new Date(),
        });
      }
      
      // Mark complete
      result.status = "completed";
      result.success = true;
      result.completedAt = new Date();
      this.activeExecutions.set(result.executionId, result);
      
      this.logAudit(trigger, "completed", `Successfully executed ${trigger.actionType} in ${trigger.mode} mode`);
      
    } catch (error: any) {
      result.status = "failed";
      result.success = false;
      result.error = error.message;
      result.completedAt = new Date();
      this.activeExecutions.set(result.executionId, result);
      
      this.logAudit(trigger, "failed", `Execution failed during plan: ${error.message}`);
    }
    
    // Trigger global synchronization so all pages update
    this.synchronizeState();
  }

  // ============================================================================
  // SYNCHRONIZATION & LOGGING
  // ============================================================================

  private synchronizeState() {
    // Tell orchestrator that data has changed and UI needs refresh
    orchestrator.coordinateUpdate(
      this.engineId,
      "sync_required" as any,
      { affectedModules: ["portfolio", "positions", "wallet", "rewards"] },
      ["sync-engine"]
    );
  }

  private logAudit(trigger: ActionTrigger, status: ActionStatus, message: string) {
    const store = useAppStore.getState();
    const isError = status === "failed" || status === "validation_failed";
    
    store.addAuditLog({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString() as any, // Store handles the string conversion implicitly, but TS expects string based on store definition
      level: isError ? "error" : status === "completed" ? "success" : "info",
      category: "execution",
      action: trigger.actionType,
      message,
      metadata: { 
        triggerId: trigger.id, 
        mode: trigger.mode,
        protocol: trigger.protocol,
        chain: trigger.chain,
      }
    });
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    // Clean up old executions
    const now = Date.now();
    for (const [id, exec] of this.activeExecutions.entries()) {
      if (exec.completedAt && now - exec.completedAt.getTime() > 3600000) {
        this.activeExecutions.delete(id);
      }
    }

    return {
      healthy: true,
      message: `AutomatedExecutionEngine running. Active tracking: ${this.activeExecutions.size}`,
    };
  }
}

export const executionEngine = new AutomatedExecutionEngine();