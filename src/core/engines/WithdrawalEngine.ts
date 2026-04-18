/**
 * Withdrawal Engine
 * Analyzes positions and generates optimized withdrawal plans
 */

import { orchestrator } from "@/core/orchestrator";
import { useAppStore } from "@/store";
import type { 
  WithdrawalPlan, 
  PositionWithdrawal, 
  WithdrawalStep, 
  Position,
  EngineResult,
  AppEvent 
} from "@/core/contracts";

export class WithdrawalEngine {
  private cachedPlans: Map<string, WithdrawalPlan> = new Map();

  constructor() {
    orchestrator.registerEngine("withdrawal", this);
  }

  // ==================== ANALYZE WITHDRAWAL TASK ====================
  async analyzeWithdrawal(requestedAmount: number): Promise<EngineResult<WithdrawalPlan>> {
    console.log("[WithdrawalEngine] Analyzing withdrawal for:", requestedAmount);

    const positions = useAppStore.getState().positions;

    // Score positions for withdrawal priority
    const scoredPositions = positions.map((pos) => ({
      position: pos,
      score: this.calculateWithdrawalScore(pos),
    })).sort((a, b) => b.score - a.score);

    // Build withdrawal plan
    const selectedPositions: PositionWithdrawal[] = [];
    let remainingAmount = requestedAmount;
    let totalGas = 0;
    let totalSlippage = 0;

    for (const { position } of scoredPositions) {
      if (remainingAmount <= 0) break;

      const closePercentage = Math.min(1, remainingAmount / position.valueUsd);
      const expectedAmount = position.valueUsd * closePercentage;
      const gasEstimate = 50; // Mock gas cost
      const slippageEstimate = expectedAmount * 0.005; // 0.5% slippage

      selectedPositions.push({
        positionId: position.id,
        pair: position.pair,
        closePercentage: closePercentage * 100,
        expectedAmount,
        reason: this.getWithdrawalReason(position),
      });

      remainingAmount -= expectedAmount;
      totalGas += gasEstimate;
      totalSlippage += slippageEstimate;
    }

    // Generate execution steps
    const steps: WithdrawalStep[] = selectedPositions.map((sel, idx) => ({
      order: idx + 1,
      action: `Close ${sel.closePercentage.toFixed(0)}% of ${sel.pair}`,
      position: sel.pair,
      amount: sel.expectedAmount,
      gas: 50,
      slippage: sel.expectedAmount * 0.005,
    }));

    const plan: WithdrawalPlan = {
      id: `plan-${Date.now()}`,
      requestedAmount,
      positions: selectedPositions,
      totalGas,
      totalSlippage,
      estimatedReceived: requestedAmount - totalGas - totalSlippage,
      steps,
      createdAt: new Date(),
    };

    this.cachedPlans.set(plan.id, plan);

    await orchestrator.coordinateUpdate(
      "withdrawal",
      "withdrawal_planned",
      { plan },
      ["withdraw-page"]
    );

    return {
      success: true,
      data: plan,
      affectedModules: ["withdraw-page"],
      events: [],
    };
  }

  // ==================== EXECUTE WITHDRAWAL TASK ====================
  async executeWithdrawal(planId: string): Promise<EngineResult<void>> {
    console.log("[WithdrawalEngine] Executing withdrawal plan:", planId);

    const plan = this.cachedPlans.get(planId);
    if (!plan) {
      return {
        success: false,
        error: "Plan not found",
        affectedModules: [],
        events: [],
      };
    }

    // Execute each step (in production, execute real transactions)
    for (const step of plan.steps) {
      console.log(`[WithdrawalEngine] Executing step ${step.order}: ${step.action}`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    await orchestrator.coordinateUpdate(
      "withdrawal",
      "positions_updated",
      { withdrawn: true },
      ["position", "portfolio", "dashboard"]
    );

    this.cachedPlans.delete(planId);

    return {
      success: true,
      affectedModules: ["position", "portfolio", "dashboard"],
      events: [],
    };
  }

  // ==================== HELPER METHODS ====================
  private calculateWithdrawalScore(position: Position): number {
    let score = 0;

    // Prioritize out-of-range positions
    if (position.status === "out-of-range") score += 100;

    // Prioritize low health positions
    score += (100 - position.health);

    // Prioritize high IL positions
    score += position.estimatedIL * 10;

    // Deprioritize recent positions
    const ageInDays = (Date.now() - position.openedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays < 7) score -= 20;

    return score;
  }

  private getWithdrawalReason(position: Position): string {
    if (position.status === "out-of-range") return "Position out of range";
    if (position.health < 50) return "Low position health";
    if (position.estimatedIL > 5) return "High impermanent loss";
    return "Lowest priority position";
  }

  // ==================== EVENT HANDLER ====================
  async handleEvent(event: AppEvent): Promise<void> {
    console.log("[WithdrawalEngine] Handling event:", event.type);

    if (event.type === "positions_updated") {
      // Invalidate cached plans
      this.cachedPlans.clear();
    }
  }

  // ==================== INVALIDATE CACHE ====================
  async invalidateCache(): Promise<void> {
    this.cachedPlans.clear();
  }

  // ==================== HEALTH ====================
  isHealthy(): boolean {
    return true;
  }
}

export const withdrawalEngine = new WithdrawalEngine();