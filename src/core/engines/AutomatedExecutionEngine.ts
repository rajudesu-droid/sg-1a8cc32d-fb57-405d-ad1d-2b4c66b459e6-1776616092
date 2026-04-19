// ============================================================================
// AUTOMATED EXECUTION ENGINE
// Orchestrates the complete action lifecycle from trigger to completion
// ============================================================================

import type { ActionTrigger, ActionLifecycle, ActionStatus } from "../contracts/actions";
import { validationEngine } from "./ValidationEngine";
import { actionPlanner } from "../execution/ActionPlanner";
import { previewEngine } from "../execution/PreviewEngine";
import { authorizationEngine } from "../execution/AuthorizationEngine";
import { executionRunner } from "../execution/ExecutionRunner";
import type { ExecutionContext, ExecutionResult } from "../execution/types";
import { orchestrator } from "../orchestrator";
import { useAppStore } from "@/store";

export class AutomatedExecutionEngine {
  private engineId = "execution-engine";
  private activeExecutions: Map<string, ActionLifecycle> = new Map();

  constructor() {
    this.registerWithOrchestrator();
  }

  // ============================================================================
  // MAIN EXECUTION PIPELINE
  // ============================================================================

  async processTrigger(trigger: ActionTrigger): Promise<ActionLifecycle> {
    console.log(`[ExecutionEngine] Processing trigger: ${trigger.id}`);

    // Initialize lifecycle tracking
    const lifecycle: ActionLifecycle = {
      id: `lifecycle-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      trigger,
      status: "triggered",
      history: [
        {
          timestamp: new Date(),
          status: "triggered",
          message: `Action triggered from ${trigger.source}`,
          metadata: { reason: trigger.reason },
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.activeExecutions.set(lifecycle.id, lifecycle);

    try {
      // STEP 1: VALIDATION
      await this.updateStatus(lifecycle, "validating");
      const validation = await validationEngine.validateAction(trigger);
      lifecycle.validation = validation;

      if (!validation.allowed) {
        await this.updateStatus(lifecycle, "validation_failed");
        this.logAudit(trigger, "validation_failed", `Blocked: ${validation.blockingReasons.join(", ")}`);
        return lifecycle;
      }

      // STEP 2: PLANNING
      await this.updateStatus(lifecycle, "planning");
      const context = this.buildExecutionContext(trigger);
      const plan = await actionPlanner.generatePlan(trigger, context);
      lifecycle.plan = plan;

      // STEP 3: PREVIEW
      await this.updateStatus(lifecycle, "previewing");
      const preview = await previewEngine.generatePreview(plan, context);
      
      // Broadcast preview for UI display
      orchestrator.publishEvent({
        type: "action_triggered" as any,
        timestamp: new Date(),
        source: this.engineId,
        data: { lifecycle, preview },
        affectedModules: ["dashboard", "positions-page"],
      });

      // STEP 4: AUTHORIZATION
      await this.updateStatus(lifecycle, "awaiting_authorization");
      const auth = await authorizationEngine.requestAuthorization(plan, preview, context);
      
      if (!auth.authorized) {
        await this.updateStatus(lifecycle, "awaiting_authorization");
        // Wait for manual approval or policy auto-approval
        return lifecycle;
      }

      // STEP 5: EXECUTION
      await this.updateStatus(lifecycle, "executing");
      const result = await executionRunner.execute(plan, auth, context);
      lifecycle.execution = result;

      // STEP 6: CONFIRMATION & POST-SYNC
      if (result.status === "completed") {
        await this.updateStatus(lifecycle, "completed");
        await this.postExecutionSync(trigger, result);
        this.logAudit(trigger, "completed", "Action completed successfully");
      } else if (result.status === "failed") {
        await this.updateStatus(lifecycle, "failed");
        this.logAudit(trigger, "failed", result.error?.message || "Execution failed");
      }

      // STEP 7: CLEANUP
      setTimeout(() => {
        this.activeExecutions.delete(lifecycle.id);
      }, 60000); // Keep in memory for 1 minute for UI display

      return lifecycle;
    } catch (error: any) {
      await this.updateStatus(lifecycle, "failed");
      this.logAudit(trigger, "failed", error.message);
      lifecycle.execution = {
        executionId: `exec-${Date.now()}`,
        planId: lifecycle.plan?.planId || "unknown",
        actionType: trigger.actionType,
        status: "failed",
        completedSteps: 0,
        totalSteps: 0,
        transactions: [],
        stateChanges: {
          balancesBefore: {},
          balancesAfter: {},
          positionsAffected: [],
          portfolioValueChange: 0,
        },
        startedAt: new Date(),
        completedAt: new Date(),
        error: {
          stepId: "engine",
          message: error.message,
          recoverable: false,
        },
        logs: [error.message],
      };
      return lifecycle;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private buildExecutionContext(trigger: ActionTrigger): ExecutionContext {
    const store = useAppStore.getState();
    return {
      mode: trigger.mode,
      walletAddress: trigger.walletAddress,
      portfolioId: trigger.portfolioId,
      preferences: {
        autoApprove: store.policy.autoHarvest, // Use policy settings
        maxSlippage: 0.5,
        maxGasPrice: 100,
        confirmationBlocks: 2,
      },
      simulationState: trigger.mode === "demo" ? {
        balances: {},
        positions: store.positions,
        portfolio: store.portfolio,
      } : undefined,
    };
  }

  private async updateStatus(lifecycle: ActionLifecycle, status: ActionStatus): Promise<void> {
    lifecycle.status = status;
    lifecycle.updatedAt = new Date();
    lifecycle.history.push({
      timestamp: new Date(),
      status,
      message: `Status changed to ${status}`,
    });

    // Update store for UI reactivity
    const store = useAppStore.getState();
    store.addAlert({
      id: `status-${Date.now()}`,
      type: status === "failed" ? "error" : status === "completed" ? "success" : "info",
      title: `Action ${status}`,
      message: `${lifecycle.trigger.actionType}: ${status}`,
      timestamp: new Date(),
    });

    console.log(`[ExecutionEngine] Lifecycle ${lifecycle.id} -> ${status}`);
  }

  private async postExecutionSync(trigger: ActionTrigger, result: ExecutionResult): Promise<void> {
    console.log(`[ExecutionEngine] Running post-execution sync`);

    // Determine which modules need to refresh
    const affectedModules: string[] = [];

    switch (trigger.actionType) {
      case "ADD_LIQUIDITY":
      case "STAKE":
        affectedModules.push("portfolio-engine", "position-engine", "wallet-engine");
        break;
      case "HARVEST_REWARDS":
      case "CONVERT_REWARDS":
      case "COMPOUND":
        affectedModules.push("rewards-engine", "portfolio-engine", "position-engine");
        break;
      case "EXIT_POSITION":
      case "REMOVE_LIQUIDITY":
        affectedModules.push("position-engine", "portfolio-engine", "wallet-engine");
        break;
      case "WITHDRAW_FUNDS":
        affectedModules.push("portfolio-engine", "wallet-engine", "withdrawal-engine");
        break;
      case "REBALANCE":
        affectedModules.push("position-engine", "portfolio-engine");
        break;
    }

    // Trigger sync via orchestrator
    orchestrator.coordinateUpdate(
      this.engineId,
      "sync_required" as any,
      { result },
      affectedModules
    );
  }

  private logAudit(trigger: ActionTrigger, status: ActionStatus, message: string) {
    const store = useAppStore.getState();
    const isError = status === "failed" || status === "validation_failed";
    
    store.addAuditLog({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date() as any,
      mode: trigger.mode,
      actionType: "simulation" as any,
      actor: "system",
      details: { 
        status,
        message,
        triggerId: trigger.id, 
        protocol: trigger.protocol,
        chain: trigger.chain,
        action: trigger.actionType
      },
      success: !isError,
      error: isError ? message : undefined
    });
  }

  private registerWithOrchestrator() {
    orchestrator.registerEngine(this.engineId, this);
    
    // Listen for new triggers from any source
    orchestrator.subscribe(async (event) => {
      if (event.type === ("action_triggered" as any) && event.source !== this.engineId) {
        if (event.data && event.data.trigger) {
          await this.processTrigger(event.data.trigger);
        }
      }
    });

    console.log("[ExecutionEngine] Registered with orchestrator");
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  getActiveExecutions(): ActionLifecycle[] {
    return Array.from(this.activeExecutions.values());
  }

  getExecution(id: string): ActionLifecycle | undefined {
    return this.activeExecutions.get(id);
  }

  async cancelExecution(id: string): Promise<boolean> {
    const lifecycle = this.activeExecutions.get(id);
    if (!lifecycle) return false;

    if (lifecycle.status === "executing") {
      console.warn(`[ExecutionEngine] Cannot cancel execution ${id} - already in progress`);
      return false;
    }

    await this.updateStatus(lifecycle, "cancelled");
    this.activeExecutions.delete(id);
    return true;
  }

  async pauseExecution(id: string): Promise<boolean> {
    const lifecycle = this.activeExecutions.get(id);
    if (!lifecycle) return false;

    await this.updateStatus(lifecycle, "paused");
    return true;
  }

  // Health check for orchestrator
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    return {
      healthy: true,
      message: `ExecutionEngine operational. ${this.activeExecutions.size} active executions`,
    };
  }
}

export const executionEngine = new AutomatedExecutionEngine();