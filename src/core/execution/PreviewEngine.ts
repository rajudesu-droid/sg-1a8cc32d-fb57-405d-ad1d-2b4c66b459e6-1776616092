// ============================================================================
// PREVIEW ENGINE
// Generates a comprehensive preview of an action before authorization
// ============================================================================

import type { ActionPlan, ExecutionPreview, ExecutionContext } from "./types";
import { validationEngine } from "../engines/ValidationEngine";

export class PreviewEngine {
  async generatePreview(
    plan: ActionPlan,
    context: ExecutionContext
  ): Promise<ExecutionPreview> {
    console.log(`[PreviewEngine] Generating preview for plan ${plan.planId}`);

    // CRITICAL: Run validation to detect blockers
    const validation = await validationEngine.validateAction({
      actionType: plan.actionType,
      mode: context.mode,
      chain: plan.chain,
      poolAddress: plan.poolAddress,
      walletAddress: context.walletAddress,
      metadata: {}
    } as any);

    // Map plan steps to preview format
    const steps = plan.substeps.map((step) => {
      let description = step.description;
      
      // CRITICAL: Surface exact approval requirements clearly
      if (step.operation === "approve_token" && step.requiredApproval) {
        description = `APPROVE: ${step.requiredApproval.token} to spender ${step.requiredApproval.spender.slice(0, 6)}...${step.requiredApproval.spender.slice(-4)} on ${plan.chain}`;
      }
      
      return {
        sequence: step.sequence,
        operation: step.operation,
        description,
        estimatedGas: step.estimatedGas,
        status: step.requiredApproval ? ("requires_approval" as const) : ("ready" as const),
      };
    });

    // Format risk indicators with validation results
    const risks = [
      ...plan.risks.map(r => ({
        level: "medium" as const,
        category: "execution",
        message: r,
      })),
      // Add blocking validation failures as CRITICAL risks
      ...validation.blockingReasons.map(reason => ({
        level: "critical" as const,
        category: "validation",
        message: reason,
      })),
    ];

    // Format warnings
    const warnings = [
      ...plan.warnings,
      ...validation.warningFlags,
    ];

    return {
      planId: plan.planId,
      actionType: plan.actionType,
      mode: context.mode,
      
      summary: {
        title: `${plan.actionType.replace(/_/g, " ")}`,
        description: `Execute ${plan.actionType} on ${plan.protocol}`,
        protocol: plan.protocol,
        chain: plan.chain,
      },
      
      steps,
      
      resources: {
        totalGas: plan.totalEstimatedGas,
        totalTime: plan.totalEstimatedTime,
        approvalCount: plan.requiredApprovals.length,
      },
      
      outcome: {
        tokensIn: plan.expectedOutcome.tokensIn.map(t => ({
          ...t,
          valueUsd: t.amount * 1.0, // Would fetch real price
        })),
        tokensOut: plan.expectedOutcome.tokensOut.map(t => ({
          ...t,
          valueUsd: t.amount * 1.0,
        })),
        netChange: 0, // Calculate from tokensIn/Out
        projectedYield: 0,
      },
      
      risks,
      warnings,
      
      // CRITICAL: Include validation status
      validationStatus: {
        allowed: validation.allowed,
        blockingReasons: validation.blockingReasons,
        warningFlags: validation.warningFlags,
        checks: validation.checks,
      },
      
      postExecutionState: {
        balances: {},
        positions: 0,
        totalValue: 0,
        deployedCapital: 0,
        idleCapital: 0,
      },
      
      generatedAt: new Date(),
      validUntil: new Date(Date.now() + 5 * 60 * 1000),
    };
  }
}

export const previewEngine = new PreviewEngine();