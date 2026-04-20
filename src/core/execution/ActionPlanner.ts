// ============================================================================
// ACTION PLANNER
// Generates detailed multi-step execution plans for each action type
// ============================================================================

import type {
  ActionPlan,
  ExecutionSubstep,
  ExecutionContext,
} from "./types";
import type { ActionTrigger, ActionType } from "../contracts/actions";
import { useAppStore } from "@/store";
import { allowanceService } from "../services/AllowanceService";
import { findAssetByIdentity } from "../utils/assetIdentity";
import type { Asset } from "../contracts";

export class ActionPlanner {
  private plannerId = "action-planner";
  private plannerVersion = "1.0.0";

  // ============================================================================
  // MAIN PLANNING METHOD
  // ============================================================================

  async generatePlan(
    trigger: ActionTrigger,
    context: ExecutionContext
  ): Promise<ActionPlan> {
    console.log(`[ActionPlanner] Generating plan for ${trigger.actionType}`);

    // Route to specific planner based on action type
    const substeps = await this.planActionSteps(trigger, context);

    // Calculate resource estimates
    const totalEstimatedGas = substeps.reduce((sum, s) => sum + s.estimatedGas, 0);
    const totalEstimatedTime = substeps.length * 15; // 15s per step estimate

    // Collect required approvals
    const requiredApprovals = substeps
      .filter((s) => s.requiredApproval)
      .map((s) => ({
        token: s.requiredApproval!.token,
        spender: s.requiredApproval!.spender,
        amount: s.requiredApproval!.amount,
        currentAllowance: 0, // TODO: Fetch actual allowance
      }));

    // Assess risks
    const risks = this.assessRisks(trigger, substeps);
    const warnings = this.generateWarnings(trigger, substeps);

    // Calculate expected outcome
    const expectedOutcome = this.calculateExpectedOutcome(trigger, substeps);

    const plan: ActionPlan = {
      planId: `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      triggerId: trigger.id,
      actionType: trigger.actionType,
      
      substeps,
      totalSteps: substeps.length,
      
      protocol: trigger.protocol || "unknown",
      chain: trigger.chain || "unknown",
      poolAddress: trigger.poolAddress || "",
      
      totalEstimatedGas,
      totalEstimatedTime,
      estimatedSlippage: 0.5, // Default 0.5%
      
      requiredApprovals,
      risks,
      warnings,
      expectedOutcome,
      
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min expiry
      plannerVersion: this.plannerVersion,
    };

    console.log(`[ActionPlanner] Plan generated with ${substeps.length} steps`);
    return plan;
  }

  // ============================================================================
  // ACTION-SPECIFIC PLANNERS
  // ============================================================================

  private async planActionSteps(
    trigger: ActionTrigger,
    context: ExecutionContext
  ): Promise<ExecutionSubstep[]> {
    switch (trigger.actionType) {
      case "ADD_LIQUIDITY":
        return this.planEnterPosition(trigger, context);
      case "STAKE":
        return this.planStakePosition(trigger, context);
      case "HARVEST_REWARDS":
        return this.planHarvestRewards(trigger, context);
      case "CONVERT_REWARDS":
        return this.planConvertRewards(trigger, context);
      case "COMPOUND":
        return this.planCompoundPosition(trigger, context);
      case "REBALANCE":
        return this.planRebalancePosition(trigger, context);
      case "EXIT_POSITION":
        return this.planExitPosition(trigger, context);
      case "WITHDRAW_FUNDS":
        return this.planWithdrawFunds(trigger, context);
      default:
        return this.planGenericAction(trigger, context);
    }
  }

  // ============================================================================
  // ENTER_POSITION PLANNER
  // ============================================================================

  private async planEnterPosition(
    trigger: ActionTrigger,
    context: ExecutionContext
  ): Promise<ExecutionSubstep[]> {
    const steps: ExecutionSubstep[] = [];
    let seq = 1;
    
    // Step 1: Verify balances
    steps.push(this.createSubstep({
      sequence: seq++,
      operation: "verify_balances",
      description: "Verify token balances are sufficient",
      estimatedGas: 0, // Read-only
      isOptional: false,
      retryable: true,
    }));

    // Step 2 & 3: Dynamic approvals based on real on-chain allowance checks
    if (trigger.metadata?.requiredAssets && trigger.metadata?.spenderAddress) {
      const requiredAssets = trigger.metadata.requiredAssets as Array<{identity: any, amount: string}>;
      const spenderAddress = trigger.metadata.spenderAddress as string;
      const ownerAddress = context.wallet?.address || "";
      
      for (const required of requiredAssets) {
        const walletAsset = findAssetByIdentity(context.walletAssets || [], required.identity) as Asset;
        
        if (walletAsset && walletAsset.contractAddress) {
          try {
            const requiredAmountBase = (parseFloat(required.amount) * Math.pow(10, walletAsset.decimals)).toString();
            const allowanceCheck = await allowanceService.isApprovalNeeded(
              walletAsset,
              ownerAddress,
              spenderAddress,
              requiredAmountBase,
              context.mode as "demo" | "shadow" | "live"
            );

            if (allowanceCheck.needed) {
              steps.push(this.createSubstep({
                sequence: seq++,
                operation: "approve_token",
                description: `Approve ${walletAsset.symbol} for ${spenderAddress.slice(0, 6)}...${spenderAddress.slice(-4)}`,
                estimatedGas: 0.001,
                isOptional: false,
                retryable: true,
                requiredApproval: {
                  token: walletAsset.symbol,
                  spender: spenderAddress,
                  amount: allowanceCheck.recommendedApproval,
                },
              }));
            }
          } catch (error) {
            console.error("[ActionPlanner] Failed to check allowance:", error);
            if (context.mode === "live") {
              throw new Error(`Failed to check allowance for ${walletAsset.symbol}. Cannot plan execution safely.`);
            }
          }
        }
      }
    }

    // Step 4: Add liquidity
    steps.push(this.createSubstep({
      sequence: seq++,
      operation: "add_liquidity",
      description: "Add liquidity to pool",
      estimatedGas: 0.005,
      estimatedSlippage: 0.5,
      isOptional: false,
      retryable: false, // Non-retryable after submission
      protocolAdapter: trigger.protocol,
      methodName: "addLiquidity",
    }));

    // Step 5: Stake LP tokens (if farm exists)
    if (trigger.metadata?.hasFarm) {
      steps.push(this.createSubstep({
        sequence: seq++,
        operation: "stake_position",
        description: "Stake LP tokens in farm",
        estimatedGas: 0.002,
        isOptional: true,
        retryable: true,
        protocolAdapter: trigger.protocol,
        methodName: "stakeLP",
      }));
    }

    // Step 6: Fetch position state
    steps.push(this.createSubstep({
      sequence: seq++,
      operation: "fetch_position_state",
      description: "Fetch new position state",
      estimatedGas: 0,
      isOptional: false,
      retryable: true,
    }));

    // Step 7: Sync state
    steps.push(this.createSubstep({
      sequence: seq++,
      operation: "sync_state",
      description: "Sync balances and position records",
      estimatedGas: 0,
      isOptional: false,
      retryable: true,
    }));

    return steps;
  }

  // ============================================================================
  // HARVEST_REWARDS PLANNER
  // ============================================================================

  private async planHarvestRewards(
    trigger: ActionTrigger,
    context: ExecutionContext
  ): Promise<ExecutionSubstep[]> {
    const steps: ExecutionSubstep[] = [];
    const policy = useAppStore.getState().policy;

    // Step 1: Claim rewards
    steps.push(this.createSubstep({
      sequence: 1,
      operation: "claim_rewards",
      description: "Claim pending rewards",
      estimatedGas: 0.003,
      isOptional: false,
      retryable: true,
      protocolAdapter: trigger.protocol,
      methodName: "harvestRewards",
    }));

    // Step 2: Fetch reward balances
    steps.push(this.createSubstep({
      sequence: 2,
      operation: "verify_balances",
      description: "Fetch claimed reward balances",
      estimatedGas: 0,
      isOptional: false,
      retryable: true,
    }));

    // Step 3: Swap rewards if policy requires
    if (trigger.metadata?.autoConvertRewards) {
      steps.push(this.createSubstep({
        sequence: 3,
        operation: "swap_token",
        description: "Convert reward tokens to target assets",
        estimatedGas: 0.004,
        estimatedSlippage: 1.0,
        isOptional: true,
        retryable: false,
      }));
    }

    // Step 4: Compound rewards if policy allows
    if (policy.autoCompound) {
      steps.push(this.createSubstep({
        sequence: 4,
        operation: "compound_rewards",
        description: "Add rewards back to position",
        estimatedGas: 0.005,
        estimatedSlippage: 0.5,
        isOptional: true,
        retryable: false,
        protocolAdapter: trigger.protocol,
        methodName: "compound",
      }));

      // Restake if needed
      if (trigger.metadata?.hasFarm) {
        steps.push(this.createSubstep({
          sequence: 5,
          operation: "stake_position",
          description: "Restake compounded position",
          estimatedGas: 0.002,
          isOptional: true,
          retryable: true,
        }));
      }
    }

    // Final step: Sync state
    steps.push(this.createSubstep({
      sequence: steps.length + 1,
      operation: "sync_state",
      description: "Sync balances, rewards, and earnings",
      estimatedGas: 0,
      isOptional: false,
      retryable: true,
    }));

    return steps;
  }

  // ============================================================================
  // EXIT_POSITION PLANNER
  // ============================================================================

  private async planExitPosition(
    trigger: ActionTrigger,
    context: ExecutionContext
  ): Promise<ExecutionSubstep[]> {
    const steps: ExecutionSubstep[] = [];

    // Step 1: Unstake if required
    if (trigger.metadata?.isStaked) {
      steps.push(this.createSubstep({
        sequence: 1,
        operation: "unstake_position",
        description: "Unstake LP tokens from farm",
        estimatedGas: 0.002,
        isOptional: false,
        retryable: true,
        protocolAdapter: trigger.protocol,
        methodName: "unstake",
      }));

      // Claim pending rewards before exit
      steps.push(this.createSubstep({
        sequence: 2,
        operation: "claim_rewards",
        description: "Claim final pending rewards",
        estimatedGas: 0.003,
        isOptional: true,
        retryable: true,
      }));
    }

    // Step 2: Remove liquidity
    steps.push(this.createSubstep({
      sequence: steps.length + 1,
      operation: "remove_liquidity",
      description: "Remove liquidity from pool",
      estimatedGas: 0.005,
      estimatedSlippage: 0.5,
      isOptional: false,
      retryable: false,
      protocolAdapter: trigger.protocol,
      methodName: "removeLiquidity",
    }));

    // Step 3: Swap output tokens if target allocation specified
    if (trigger.metadata?.targetAsset) {
      steps.push(this.createSubstep({
        sequence: steps.length + 1,
        operation: "swap_token",
        description: "Swap output tokens to target allocation",
        estimatedGas: 0.004,
        estimatedSlippage: 1.0,
        isOptional: true,
        retryable: false,
      }));
    }

    // Step 4: Mark position closed
    steps.push(this.createSubstep({
      sequence: steps.length + 1,
      operation: "close_position",
      description: "Mark position as closed",
      estimatedGas: 0,
      isOptional: false,
      retryable: true,
    }));

    // Step 5: Sync state
    steps.push(this.createSubstep({
      sequence: steps.length + 1,
      operation: "sync_state",
      description: "Sync portfolio state and logs",
      estimatedGas: 0,
      isOptional: false,
      retryable: true,
    }));

    return steps;
  }

  // ============================================================================
  // WITHDRAW_FUNDS PLANNER
  // ============================================================================

  private async planWithdrawFunds(
    trigger: ActionTrigger,
    context: ExecutionContext
  ): Promise<ExecutionSubstep[]> {
    const steps: ExecutionSubstep[] = [];

    // Step 1: Analyze withdrawal candidates
    steps.push(this.createSubstep({
      sequence: 1,
      operation: "fetch_position_state",
      description: "Analyze positions for optimal withdrawal",
      estimatedGas: 0,
      isOptional: false,
      retryable: true,
    }));

    // Step 2: Select weakest positions
    steps.push(this.createSubstep({
      sequence: 2,
      operation: "close_position",
      description: "Select positions to close (weakest first)",
      estimatedGas: 0,
      isOptional: false,
      retryable: true,
    }));

    // Step 3: Perform partial/full close
    steps.push(this.createSubstep({
      sequence: 3,
      operation: "remove_liquidity",
      description: "Withdraw from selected positions",
      estimatedGas: 0.008,
      estimatedSlippage: 0.5,
      isOptional: false,
      retryable: false,
    }));

    // Step 4: Collect assets
    steps.push(this.createSubstep({
      sequence: 4,
      operation: "verify_balances",
      description: "Collect withdrawn assets",
      estimatedGas: 0,
      isOptional: false,
      retryable: true,
    }));

    // Step 5: Swap to requested asset if needed
    if (trigger.metadata?.targetAsset) {
      steps.push(this.createSubstep({
        sequence: 5,
        operation: "swap_token",
        description: "Swap to requested asset",
        estimatedGas: 0.004,
        estimatedSlippage: 1.0,
        isOptional: true,
        retryable: false,
      }));
    }

    // Step 6: Update idle balance
    steps.push(this.createSubstep({
      sequence: 6,
      operation: "sync_state",
      description: "Update idle balance and portfolio totals",
      estimatedGas: 0,
      isOptional: false,
      retryable: true,
    }));

    // Step 7: Sync all pages
    steps.push(this.createSubstep({
      sequence: 7,
      operation: "sync_state",
      description: "Sync dashboard, positions, and withdrawal pages",
      estimatedGas: 0,
      isOptional: false,
      retryable: true,
    }));

    return steps;
  }

  // ============================================================================
  // PLACEHOLDER PLANNERS (to be implemented)
  // ============================================================================

  private async planStakePosition(
    trigger: ActionTrigger,
    context: ExecutionContext
  ): Promise<ExecutionSubstep[]> {
    return [
      this.createSubstep({
        sequence: 1,
        operation: "stake_position",
        description: "Stake LP tokens in farm",
        estimatedGas: 0.002,
      }),
    ];
  }

  private async planConvertRewards(
    trigger: ActionTrigger,
    context: ExecutionContext
  ): Promise<ExecutionSubstep[]> {
    return [
      this.createSubstep({
        sequence: 1,
        operation: "swap_token",
        description: "Convert reward tokens",
        estimatedGas: 0.004,
      }),
    ];
  }

  private async planCompoundPosition(
    trigger: ActionTrigger,
    context: ExecutionContext
  ): Promise<ExecutionSubstep[]> {
    return this.planHarvestRewards(trigger, context);
  }

  private async planRebalancePosition(
    trigger: ActionTrigger,
    context: ExecutionContext
  ): Promise<ExecutionSubstep[]> {
    return [
      this.createSubstep({
        sequence: 1,
        operation: "remove_liquidity",
        description: "Remove from current position",
        estimatedGas: 0.005,
      }),
      this.createSubstep({
        sequence: 2,
        operation: "add_liquidity",
        description: "Add to new range",
        estimatedGas: 0.005,
      }),
    ];
  }

  private async planGenericAction(
    trigger: ActionTrigger,
    context: ExecutionContext
  ): Promise<ExecutionSubstep[]> {
    return [
      this.createSubstep({
        sequence: 1,
        operation: "sync_state",
        description: "Execute generic action",
        estimatedGas: 0.001,
      }),
    ];
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private createSubstep(partial: Partial<ExecutionSubstep>): ExecutionSubstep {
    return {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sequence: partial.sequence || 1,
      operation: partial.operation || "sync_state",
      description: partial.description || "",
      
      protocolAdapter: partial.protocolAdapter,
      methodName: partial.methodName,
      
      tokenInputs: partial.tokenInputs,
      tokenOutputs: partial.tokenOutputs,
      
      estimatedGas: partial.estimatedGas || 0,
      estimatedSlippage: partial.estimatedSlippage || 0,
      requiredApproval: partial.requiredApproval,
      
      isOptional: partial.isOptional ?? false,
      retryable: partial.retryable ?? false,
      maxRetries: 3,
      
      successCriteria: partial.successCriteria || ["Transaction confirmed"],
      failureCriteria: partial.failureCriteria || ["Transaction reverted"],
      
      expectedStateChanges: partial.expectedStateChanges || {},
      
      status: "pending",
    };
  }

  private assessRisks(trigger: ActionTrigger, substeps: ExecutionSubstep[]): string[] {
    const risks: string[] = [];

    // Gas risk
    const totalGas = substeps.reduce((sum, s) => sum + s.estimatedGas, 0);
    if (totalGas > 0.01) {
      risks.push(`High gas cost: ${totalGas.toFixed(4)} ETH estimated`);
    }

    // Slippage risk
    const hasHighSlippage = substeps.some((s) => s.estimatedSlippage > 1.0);
    if (hasHighSlippage) {
      risks.push("High slippage expected (>1%)");
    }

    // Multi-step risk
    if (substeps.length > 5) {
      risks.push("Complex multi-step execution (higher failure risk)");
    }

    return risks;
  }

  private generateWarnings(trigger: ActionTrigger, substeps: ExecutionSubstep[]): string[] {
    const warnings: string[] = [];

    // Approval warnings
    const approvalCount = substeps.filter((s) => s.operation === "approve_token").length;
    if (approvalCount > 0) {
      warnings.push(`Requires ${approvalCount} token approval(s)`);
    }

    // Optional step warnings
    const optionalCount = substeps.filter((s) => s.isOptional).length;
    if (optionalCount > 0) {
      warnings.push(`Contains ${optionalCount} optional step(s) that may be skipped`);
    }

    return warnings;
  }

  private calculateExpectedOutcome(
    trigger: ActionTrigger,
    substeps: ExecutionSubstep[]
  ): ActionPlan["expectedOutcome"] {
    // Simplified - in production, calculate from actual pool state
    return {
      tokensIn: [],
      tokensOut: [],
      portfolioImpact: {
        totalValueChange: 0,
        deployedCapitalChange: trigger.amount || 0,
        idleCapitalChange: -(trigger.amount || 0),
      },
    };
  }
}

export const actionPlanner = new ActionPlanner();