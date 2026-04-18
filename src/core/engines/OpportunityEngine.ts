/**
 * Opportunity Engine
 * Scans pools, scores opportunities, manages opportunity lifecycle
 */

import { orchestrator } from "@/core/orchestrator";
import { useAppStore } from "@/store";
import type { Opportunity, Asset, EngineResult, AppEvent } from "@/core/contracts";

export class OpportunityEngine {
  private scanInProgress = false;

  constructor() {
    orchestrator.registerEngine("opportunity", this);
  }

  // ==================== SCAN POOLS TASK ====================
  async scanPools(assets: Asset[]): Promise<EngineResult<Opportunity[]>> {
    if (this.scanInProgress) {
      return {
        success: false,
        error: "Scan already in progress",
        affectedModules: [],
        events: [],
      };
    }

    this.scanInProgress = true;
    console.log("[OpportunityEngine] Scanning pools for", assets.length, "assets");

    try {
      // Mock opportunity discovery (in production, query DEX indexers)
      const opportunities: Opportunity[] = [
        {
          id: "opp-eth-usdt-uniswap-v3",
          chain: "Ethereum",
          dex: "Uniswap V3",
          pair: "ETH/USDT",
          token0: "ETH",
          token1: "USDT",
          feeTier: "0.3%",
          poolAddress: "0x...",
          tvl: "45000000",
          volume24h: "12000000",
          feeApy: "18.5",
          rewardApy: "5.2",
          netApy: "23.7",
          riskScore: 72,
          riskLevel: "low",
          recommended: true,
          score: 85,
        },
        {
          id: "opp-bnb-usdt-pancake-v3",
          chain: "BSC",
          dex: "PancakeSwap V3",
          pair: "BNB/USDT",
          token0: "BNB",
          token1: "USDT",
          feeTier: "0.25%",
          poolAddress: "0x...",
          tvl: "28000000",
          volume24h: "8500000",
          feeApy: "22.3",
          rewardApy: "8.1",
          netApy: "30.4",
          riskScore: 68,
          riskLevel: "medium",
          recommended: true,
          score: 75,
        },
      ];

      useAppStore.getState().setOpportunities(opportunities);

      await orchestrator.coordinateUpdate(
        "opportunity",
        "opportunities_scanned",
        { count: opportunities.length },
        ["dashboard"]
      );

      return {
        success: true,
        data: opportunities,
        affectedModules: ["dashboard"],
        events: [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to scan pools",
        affectedModules: [],
        events: [],
      };
    } finally {
      this.scanInProgress = false;
    }
  }

  // ==================== SCORE OPPORTUNITIES TASK ====================
  async scoreOpportunities(): Promise<EngineResult<void>> {
    console.log("[OpportunityEngine] Scoring opportunities");

    const opportunities = useAppStore.getState().opportunities;
    
    // Recalculate risk scores based on current market conditions
    const updatedOpportunities = opportunities.map((opp) => ({
      ...opp,
      riskScore: this.calculateRiskScore(opp),
    }));

    useAppStore.getState().setOpportunities(updatedOpportunities);

    return {
      success: true,
      affectedModules: ["opportunities-page"],
      events: [],
    };
  }

  // ==================== RESCAN TASK ====================
  async rescan(): Promise<void> {
    const { assets } = useAppStore.getState().wallet;
    await this.scanPools(assets);
  }

  // ==================== HELPER METHODS ====================
  private calculateRiskScore(opp: Opportunity): number {
    // Mock risk scoring (in production, use real risk models)
    let score = 100;
    
    const tvl = parseFloat(opp.tvl);
    const volume24h = parseFloat(opp.volume24h);
    const netApy = parseFloat(opp.netApy);

    // TVL depth
    if (tvl < 1000000) score -= 20;
    else if (tvl < 5000000) score -= 10;

    // Volume
    if (volume24h < tvl * 0.1) score -= 15;

    // APY sustainability
    if (netApy > 50) score -= 10;
    else if (netApy > 30) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  // ==================== EVENT HANDLER ====================
  async handleEvent(event: AppEvent): Promise<void> {
    console.log("[OpportunityEngine] Handling event:", event.type);

    if (event.type === "assets_updated") {
      const { assets } = useAppStore.getState().wallet;
      await this.scanPools(assets);
    }
  }

  // ==================== HEALTH ====================
  isHealthy(): boolean {
    return !this.scanInProgress;
  }
}

export const opportunityEngine = new OpportunityEngine();