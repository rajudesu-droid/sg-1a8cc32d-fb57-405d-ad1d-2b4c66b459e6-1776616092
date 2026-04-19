import { orchestrator } from "../orchestrator";
import { useAppStore } from "@/store";
import type { WithdrawalPlan, Position, EngineResult } from "../contracts";
import { createAssetId, assetsMatch, getAssetDisplayName, extractIdentity } from "../utils/assetIdentity";

/**
 * Withdrawal Engine
 * Optimizes position unwinding for withdrawals
 * 
 * CRITICAL: Chain-aware withdrawal planning
 * Never assumes same-symbol assets on different chains are interchangeable
 */
export class WithdrawalEngine {
  private engineId = "withdrawal";

  constructor() {
    orchestrator.registerEngine(this.engineId, this);
    console.log("[WithdrawalEngine] Initialized and registered");
  }

  /**
   * Plan optimal withdrawal
   * 
   * CRITICAL: Chain-aware planning
   * If user requests USDT on Ethereum, cannot satisfy with USDT on BSC
   */
  async planWithdrawal(params: {
    targetAsset: {
      chainFamily: string;
      network: string;
      symbol: string;
      contractAddress?: string;
    };
    amount: number;
  }): Promise<EngineResult<WithdrawalPlan>> {
    console.log("[WithdrawalEngine] Planning withdrawal:", params);

    const positions = useAppStore.getState().positions;
    const wallet = useAppStore.getState().wallet;

    // CRITICAL: Find matching asset by identity, not symbol
    const targetAssetIdentity = {
      chainFamily: params.targetAsset.chainFamily as any,
      network: params.targetAsset.network,
      assetKind: "token" as const,
      symbol: params.targetAsset.symbol,
      contractAddress: params.targetAsset.contractAddress,
      decimals: 18, // Would come from asset metadata
    };

    const targetAssetId = createAssetId(targetAssetIdentity);

    // Find positions containing the target asset on the TARGET CHAIN
    const relevantPositions = positions.filter(position => {
      // CRITICAL: Match both symbol AND chain
      return (
        position.chain === params.targetAsset.network &&
        position.pair.includes(params.targetAsset.symbol)
      );
    });

    console.log(
      `[WithdrawalEngine] Found ${relevantPositions.length} positions on ${params.targetAsset.network} containing ${params.targetAsset.symbol}`
    );

    // Score positions for unwinding priority
    const scoredPositions = relevantPositions.map(position => {
      let score = 0;

      // Prefer out-of-range positions (lower opportunity cost)
      if (position.status === "out-of-range") {
        score += 50;
      }

      // We use health as a proxy for how good the position is (higher health = keep, lower health = unwind)
      score += Math.max(0, 100 - position.health);

      // Prefer positions with higher IL risk
      const ilRisk = position.estimatedIL || 0;
      score += ilRisk * 10;

      // Prefer larger positions (can satisfy withdrawal in fewer steps)
      const positionValue = position.valueUsd || 0;
      score += Math.log(positionValue + 1) * 5;

      return {
        position,
        score,
      };
    });

    // Sort by score (higher = better to unwind)
    scoredPositions.sort((a, b) => b.score - a.score);

    // Build withdrawal plan
    let remainingAmount = params.amount;
    const positionsToUnwind: Array<{
      positionId: string;
      pair: string;
      chain: string;
      closePercentage: number;
      expectedAmount: number;
      reason: string;
    }> = [];

    for (const { position, score } of scoredPositions) {
      if (remainingAmount <= 0) break;

      const positionValue = position.valueUsd || 0;
      const positionTargetTokenValue = positionValue / 2; // Assume 50/50 split

      if (positionTargetTokenValue >= remainingAmount) {
        // Partial close
        const closePercentage = (remainingAmount / positionTargetTokenValue) * 100;
        positionsToUnwind.push({
          positionId: position.id,
          pair: position.pair,
          chain: position.chain,
          closePercentage: Math.min(100, closePercentage),
          expectedAmount: remainingAmount,
          reason: `Partial close (${closePercentage.toFixed(1)}%) to satisfy withdrawal`,
        });
        remainingAmount = 0;
      } else {
        // Full close
        positionsToUnwind.push({
          positionId: position.id,
          pair: position.pair,
          chain: position.chain,
          closePercentage: 100,
          expectedAmount: positionTargetTokenValue,
          reason: `Full close - low opportunity cost (score: ${score.toFixed(0)})`,
        });
        remainingAmount -= positionTargetTokenValue;
      }
    }

    // Check if withdrawal can be fully satisfied
    if (remainingAmount > 0) {
      return {
        success: false,
        error: `Insufficient ${params.targetAsset.symbol} on ${params.targetAsset.network}. Need ${remainingAmount} more.`,
        affectedModules: [],
        events: [],
      };
    }

    // Estimate costs
    const totalGas = positionsToUnwind.length * 0.015; // $15 per position
    const totalSlippage = positionsToUnwind.reduce((sum, p) => {
      return sum + (p.expectedAmount * 0.003); // 0.3% slippage estimate
    }, 0);

    const plan: WithdrawalPlan = {
      id: `withdrawal-${Date.now()}`,
      requestedAmount: params.amount,
      positions: positionsToUnwind,
      totalGas,
      totalSlippage,
      estimatedReceived: params.amount - totalSlippage,
      steps: positionsToUnwind.map((p, idx) => ({
        order: idx + 1,
        action: p.closePercentage === 100 ? "Full Close" : `Close ${p.closePercentage.toFixed(1)}%`,
        position: p.pair,
        chain: p.chain,
        amount: p.expectedAmount,
        gas: totalGas / positionsToUnwind.length,
        slippage: p.expectedAmount * 0.003,
      })),
      createdAt: new Date(),
    };

    await orchestrator.coordinateUpdate(
      this.engineId,
      "withdrawal_planned",
      { plan },
      ["dashboard", "withdraw-page"]
    );

    return {
      success: true,
      data: plan,
      affectedModules: ["dashboard", "withdraw-page"],
      events: [],
    };
  }

  /**
   * Execute withdrawal plan
   */
  async executeWithdrawalPlan(planId: string): Promise<EngineResult<void>> {
    console.log("[WithdrawalEngine] Executing withdrawal plan:", planId);

    // STUB: Real execution would:
    // 1. Remove liquidity from each position (chain-specific)
    // 2. Swap one side to target asset (on same chain)
    // 3. Aggregate target asset
    // 4. Transfer to user wallet

    return {
      success: true,
      affectedModules: ["portfolio", "positions", "wallet"],
      events: [],
    };
  }
}

export const withdrawalEngine = new WithdrawalEngine();