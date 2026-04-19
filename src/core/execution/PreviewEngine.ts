// ============================================================================
// PREVIEW ENGINE
// Generates a comprehensive preview of an action before authorization
// ============================================================================

import type { ActionPlan, ExecutionPreview, ExecutionContext } from "./types";

export class PreviewEngine {
  async generatePreview(
    plan: ActionPlan,
    context: ExecutionContext
  ): Promise<ExecutionPreview> {
    console.log(`[PreviewEngine] Generating preview for plan ${plan.planId}`);

    // Map plan steps to preview format
    const steps = plan.substeps.map((step) => ({
      sequence: step.sequence,
      operation: step.operation,
      description: step.description,
      estimatedGas: step.estimatedGas,
      status: step.requiredApproval ? ("requires_approval" as const) : ("ready" as const),
    }));

    // Format risk indicators
    const risks = plan.risks.map((risk) => ({
      level: "medium" as const, // Derived in advanced engine
      category: "execution",
      message: risk,
    }));

    return {
      planId: plan.planId,
      actionType: plan.actionType,
      mode: context.mode,
      summary: {
        title: `Execute ${plan.actionType.replace(/_/g, " ")}`,
        description: `Will execute ${plan.totalSteps} steps on ${plan.protocol}`,
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
        tokensIn: plan.expectedOutcome.tokensIn.map((t) => ({ ...t, valueUsd: 0 })),
        tokensOut: plan.expectedOutcome.tokensOut.map((t) => ({ ...t, valueUsd: 0 })),
        netChange: plan.expectedOutcome.portfolioImpact.totalValueChange,
        projectedYield: 0,
      },
      risks,
      postExecutionState: {
        balances: {}, // Populated with diff in real environment
        positions: 0,
        totalValue: 0,
        deployedCapital: 0,
        idleCapital: 0,
      },
      warnings: plan.warnings,
      generatedAt: new Date(),
      validUntil: new Date(Date.now() + 5 * 60 * 1000), // 5 minute validity
    };
  }
}

export const previewEngine = new PreviewEngine();