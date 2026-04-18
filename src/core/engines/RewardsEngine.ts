/**
 * Rewards Engine
 * Manages reward calculation, tracking, harvesting, and compounding
 */

import { orchestrator } from "@/core/orchestrator";
import { useAppStore } from "@/store";
import type { Reward, Position, EngineResult, AppEvent } from "@/core/contracts";

export class RewardsEngine {
  constructor() {
    orchestrator.registerEngine("rewards", this);
  }

  // ==================== CALCULATE REWARDS TASK ====================
  async calculateRewards(): Promise<EngineResult<void>> {
    console.log("[RewardsEngine] Calculating rewards");

    const positions = useAppStore.getState().positions;
    
    // Calculate total rewards from all positions
    const total = positions.reduce((sum, pos) => sum + pos.accruedFees + pos.accruedRewards, 0);
    const claimable = positions.reduce((sum, pos) => {
      const positionTotal = pos.accruedFees + pos.accruedRewards;
      return sum + (positionTotal > 10 ? positionTotal : 0); // Mock claimability threshold
    }, 0);

    // Group rewards by position
    const byPosition: Record<string, Reward[]> = {};
    positions.forEach((pos) => {
      byPosition[pos.id] = [
        {
          id: `fee-${pos.id}`,
          positionId: pos.id,
          type: "fee",
          token: pos.pair.split("/")[0],
          amount: pos.accruedFees,
          valueUsd: pos.accruedFees,
          claimable: pos.accruedFees > 5,
          lastUpdated: new Date(),
        },
        {
          id: `reward-${pos.id}`,
          positionId: pos.id,
          type: "farm",
          token: "REWARD",
          amount: pos.accruedRewards,
          valueUsd: pos.accruedRewards,
          claimable: pos.accruedRewards > 5,
          lastUpdated: new Date(),
        },
      ];
    });

    useAppStore.getState().setRewards({ total, claimable, byPosition });

    await orchestrator.coordinateUpdate(
      "rewards",
      "rewards_updated",
      { total, claimable },
      ["dashboard", "positions-page"]
    );

    return {
      success: true,
      affectedModules: ["dashboard", "positions-page"],
      events: [],
    };
  }

  // ==================== HARVEST TASK ====================
  async harvest(positionId: string): Promise<EngineResult<number>> {
    console.log("[RewardsEngine] Harvesting rewards for:", positionId);

    const { byPosition } = useAppStore.getState().rewards;
    const rewards = byPosition[positionId] || [];
    
    const harvestedAmount = rewards
      .filter((r) => r.claimable)
      .reduce((sum, r) => sum + r.valueUsd, 0);

    // In production, execute harvest transaction
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await orchestrator.coordinateUpdate(
      "rewards",
      "rewards_updated",
      { positionId, harvestedAmount },
      ["position", "portfolio", "dashboard"]
    );

    return {
      success: true,
      data: harvestedAmount,
      affectedModules: ["position", "portfolio", "dashboard"],
      events: [],
    };
  }

  // ==================== COMPOUND TASK ====================
  async compound(positionId: string): Promise<EngineResult<void>> {
    console.log("[RewardsEngine] Compounding rewards for:", positionId);

    // Harvest first
    const harvestResult = await this.harvest(positionId);
    if (!harvestResult.success) {
      return harvestResult;
    }

    // Add liquidity back to position (in production, execute swap + add liquidity)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await orchestrator.coordinateUpdate(
      "rewards",
      "rewards_updated",
      { positionId, compounded: true },
      ["position", "portfolio", "dashboard"]
    );

    return {
      success: true,
      affectedModules: ["position", "portfolio", "dashboard"],
      events: [],
    };
  }

  // ==================== EVENT HANDLER ====================
  async handleEvent(event: AppEvent): Promise<void> {
    console.log("[RewardsEngine] Handling event:", event.type);

    if (event.type === "positions_updated") {
      await this.calculateRewards();
    }
  }

  // ==================== RECALCULATE ====================
  async recalculate(): Promise<void> {
    await this.calculateRewards();
  }

  // ==================== HEALTH ====================
  isHealthy(): boolean {
    return true;
  }
}

export const rewardsEngine = new RewardsEngine();