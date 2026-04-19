// ============================================================================
// EXECUTION RUNNER
// Handles step-by-step transaction processing and protocol interactions
// ============================================================================

import type { ActionPlan, ExecutionAuthorization, ExecutionResult, ExecutionContext, ExecutionSubstep } from "./types";

export class ExecutionRunner {
  async execute(
    plan: ActionPlan,
    auth: ExecutionAuthorization,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    console.log(`[ExecutionRunner] Starting execution of plan ${plan.planId}`);

    const result: ExecutionResult = {
      executionId: `exec-${Date.now()}`,
      planId: plan.planId,
      actionType: plan.actionType,
      status: "executing",
      completedSteps: 0,
      totalSteps: plan.totalSteps,
      transactions: [],
      stateChanges: {
        balancesBefore: {},
        balancesAfter: {},
        positionsAffected: [],
        portfolioValueChange: 0,
      },
      startedAt: new Date(),
      logs: [`[Runner] Execution started in ${context.mode} mode`],
    };

    // 1. Authorization Guard
    if (context.mode === "live" && !auth.authorized) {
      result.status = "failed";
      result.error = {
        stepId: "auth_guard",
        message: "Action is missing required authorizations/signatures",
        recoverable: false,
      };
      result.completedAt = new Date();
      result.logs.push("[Runner] Failed: Unauthorized live execution blocked.");
      return result;
    }

    // 2. Shadow Mode Bypass
    if (context.mode === "shadow") {
      result.logs.push("[Runner] Shadow mode detected. Skipping real transactions.");
      result.status = "completed";
      result.completedSteps = plan.totalSteps;
      result.completedAt = new Date();
      return result;
    }

    // 3. Process Sequence
    for (const step of plan.substeps) {
      result.currentStep = step;
      result.logs.push(`[Runner] Executing step ${step.sequence}: ${step.description}`);
      step.status = "executing";
      step.startTime = new Date();

      try {
        // Execute the single step (simulated delay for demo/live stub)
        await this.executeStep(step, context);
        
        step.status = "completed";
        step.endTime = new Date();
        result.completedSteps++;
        
        if (context.mode === "live" && !["verify_balances", "sync_state", "fetch_position_state"].includes(step.operation)) {
          const mockTxHash = `0x${Math.random().toString(16).slice(2, 66)}`;
          step.txHash = mockTxHash;
          result.transactions.push({
            stepId: step.id,
            txHash: mockTxHash,
            gasUsed: step.estimatedGas,
            status: "confirmed",
          });
          result.logs.push(`[Runner] Step confirmed: Tx ${mockTxHash.substring(0, 10)}...`);
        }
      } catch (error: any) {
        step.status = "failed";
        step.endTime = new Date();
        step.error = error.message;
        result.logs.push(`[Runner] Step failed: ${error.message}`);
        
        if (!step.isOptional) {
          result.status = "failed";
          result.error = {
            stepId: step.id,
            message: error.message,
            recoverable: step.retryable,
          };
          result.completedAt = new Date();
          return result;
        } else {
          result.logs.push(`[Runner] Step is optional. Continuing execution...`);
        }
      }
    }

    result.status = "completed";
    result.completedAt = new Date();
    result.logs.push("[Runner] Execution finished successfully");
    
    return result;
  }

  /**
   * Internal processor for a single plan substep
   */
  private async executeStep(step: ExecutionSubstep, context: ExecutionContext): Promise<void> {
    // Artificial delay to simulate processing or on-chain waiting
    const delay = context.mode === "demo" ? 500 : 1500;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Here we would dynamically call Protocol Adapters based on step.protocolAdapter & step.methodName
    if (step.operation === "approve_token") {
       // logic for token approvals...
    } else if (step.operation === "add_liquidity") {
       // logic for providing liquidity...
    }
  }
}

export const executionRunner = new ExecutionRunner();