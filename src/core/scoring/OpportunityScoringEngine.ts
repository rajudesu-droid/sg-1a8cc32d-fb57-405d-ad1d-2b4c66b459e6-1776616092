// ============================================================================
// CENTRALIZED OPPORTUNITY SCORING ENGINE
// Single scoring system for all protocols, chains, and opportunity types
// ============================================================================

import type { NormalizedOpportunity } from "../protocols/types";

export interface ScoringWeights {
  // Yield quality (40%)
  baseYieldQuality: number;      // 15%
  rewardAprQuality: number;      // 15%
  yieldStability: number;        // 10%
  
  // Liquidity & market depth (25%)
  tvlScore: number;              // 10%
  volumeScore: number;           // 8%
  liquidityDepthScore: number;   // 7%
  
  // Risk factors (25%)
  volatilityRisk: number;        // 8%
  impermanentLossRisk: number;   // 8%
  concentrationRisk: number;     // 5%
  contractRisk: number;          // 4%
  
  // Efficiency (10%)
  gasEfficiency: number;         // 5%
  rewardTokenLiquidity: number;  // 5%
}

export class OpportunityScoringEngine {
  private weights: ScoringWeights = {
    // Yield quality weights (40% total)
    baseYieldQuality: 0.15,
    rewardAprQuality: 0.15,
    yieldStability: 0.10,
    
    // Liquidity weights (25% total)
    tvlScore: 0.10,
    volumeScore: 0.08,
    liquidityDepthScore: 0.07,
    
    // Risk weights (25% total)
    volatilityRisk: 0.08,
    impermanentLossRisk: 0.08,
    concentrationRisk: 0.05,
    contractRisk: 0.04,
    
    // Efficiency weights (10% total)
    gasEfficiency: 0.05,
    rewardTokenLiquidity: 0.05,
  };

  // ============================================================================
  // MAIN SCORING METHOD
  // ============================================================================

  scoreOpportunity(opportunity: NormalizedOpportunity): {
    qualityScore: number;
    riskScore: number;
    netScore: number;
    breakdown: Record<string, number>;
  } {
    // Calculate individual component scores
    const yieldScore = this.scoreYield(opportunity);
    const liquidityScore = this.scoreLiquidity(opportunity);
    const riskScore = this.scoreRisk(opportunity);
    const efficiencyScore = this.scoreEfficiency(opportunity);

    // Weighted quality score (0-100)
    const qualityScore = Math.min(
      100,
      yieldScore.total + liquidityScore.total + efficiencyScore.total
    );

    // Risk score (0-100, higher = riskier)
    const totalRiskScore = riskScore.total;

    // Net score: quality adjusted for risk
    const netScore = Math.max(0, qualityScore - totalRiskScore * 0.5);

    return {
      qualityScore: Math.round(qualityScore),
      riskScore: Math.round(totalRiskScore),
      netScore: Math.round(netScore),
      breakdown: {
        baseYield: yieldScore.baseYield,
        rewardYield: yieldScore.rewardYield,
        yieldStability: yieldScore.stability,
        tvl: liquidityScore.tvl,
        volume: liquidityScore.volume,
        depth: liquidityScore.depth,
        volatilityRisk: riskScore.volatility,
        ilRisk: riskScore.impermanentLoss,
        concentrationRisk: riskScore.concentration,
        contractRisk: riskScore.contract,
        gasEfficiency: efficiencyScore.gas,
        rewardLiquidity: efficiencyScore.rewardLiquidity,
      },
    };
  }

  // ============================================================================
  // YIELD SCORING (40% weight)
  // ============================================================================

  private scoreYield(opp: NormalizedOpportunity) {
    // Base yield quality (0-100)
    const baseYieldScore = Math.min(100, (opp.baseYield / 50) * 100); // 50% APY = 100 score

    // Reward APR quality (0-100)
    const rewardYieldScore = Math.min(100, (opp.farmRewardYield / 30) * 100); // 30% APR = 100 score

    // Yield stability (prefer base yield over rewards)
    const yieldRatio = opp.baseYield / (opp.totalYield || 1);
    const stabilityScore = yieldRatio * 100; // Higher base yield ratio = more stable

    return {
      baseYield: baseYieldScore * this.weights.baseYieldQuality,
      rewardYield: rewardYieldScore * this.weights.rewardAprQuality,
      stability: stabilityScore * this.weights.yieldStability,
      total: (baseYieldScore * this.weights.baseYieldQuality) +
             (rewardYieldScore * this.weights.rewardAprQuality) +
             (stabilityScore * this.weights.yieldStability),
    };
  }

  // ============================================================================
  // LIQUIDITY SCORING (25% weight)
  // ============================================================================

  private scoreLiquidity(opp: NormalizedOpportunity) {
    // TVL score (0-100)
    const tvlScore = Math.min(100, (opp.tvl / 100000000) * 100); // $100M TVL = 100 score

    // Volume score (0-100)
    const volumeScore = Math.min(100, (opp.volume24h / 50000000) * 100); // $50M volume = 100 score

    // Liquidity depth score (0-100)
    const depthScore = Math.min(100, (opp.liquidityDepth / 10000000) * 100); // $10M depth = 100 score

    return {
      tvl: tvlScore * this.weights.tvlScore,
      volume: volumeScore * this.weights.volumeScore,
      depth: depthScore * this.weights.liquidityDepthScore,
      total: (tvlScore * this.weights.tvlScore) +
             (volumeScore * this.weights.volumeScore) +
             (depthScore * this.weights.liquidityDepthScore),
    };
  }

  // ============================================================================
  // RISK SCORING (25% weight)
  // Higher score = higher risk (penalty)
  // ============================================================================

  private scoreRisk(opp: NormalizedOpportunity) {
    // All risk metrics are 0-100 (already in opportunity data)
    const volatilityPenalty = opp.volatilityRisk * this.weights.volatilityRisk;
    const ilPenalty = opp.impermanentLossRisk * this.weights.impermanentLossRisk;
    const concentrationPenalty = opp.concentrationRisk * this.weights.concentrationRisk;
    const contractPenalty = opp.contractRisk * this.weights.contractRisk;

    return {
      volatility: volatilityPenalty,
      impermanentLoss: ilPenalty,
      concentration: concentrationPenalty,
      contract: contractPenalty,
      total: volatilityPenalty + ilPenalty + concentrationPenalty + contractPenalty,
    };
  }

  // ============================================================================
  // EFFICIENCY SCORING (10% weight)
  // ============================================================================

  private scoreEfficiency(opp: NormalizedOpportunity) {
    // Gas efficiency (lower gas = better)
    const totalGas = opp.gasCostEntry + opp.gasCostExit;
    const gasScore = Math.max(0, 100 - totalGas * 2); // $50 total gas = 0 score

    // Reward token liquidity (higher = better)
    const avgRewardLiquidity = opp.rewardTokens.length > 0
      ? opp.rewardTokens.reduce((sum, r) => sum + r.liquidityUsd, 0) / opp.rewardTokens.length
      : 0;
    const rewardLiquidityScore = Math.min(100, (avgRewardLiquidity / 10000000) * 100); // $10M = 100 score

    return {
      gas: gasScore * this.weights.gasEfficiency,
      rewardLiquidity: rewardLiquidityScore * this.weights.rewardTokenLiquidity,
      total: (gasScore * this.weights.gasEfficiency) +
             (rewardLiquidityScore * this.weights.rewardTokenLiquidity),
    };
  }

  // ============================================================================
  // FILTERING RULES
  // Returns true if opportunity passes all filters
  // ============================================================================

  filterOpportunity(
    opportunity: NormalizedOpportunity,
    filters: {
      minTvl?: number;
      minVolume?: number;
      maxSlippage?: number;
      maxGasCost?: number;
      minBaseYield?: number;
      maxRisk?: number;
      requireWhitelisted?: boolean;
    }
  ): boolean {
    // Whitelist check
    if (filters.requireWhitelisted && !opportunity.whitelisted) {
      return false;
    }

    // Enabled check
    if (!opportunity.enabled) {
      return false;
    }

    // TVL threshold
    if (filters.minTvl && opportunity.tvl < filters.minTvl) {
      return false;
    }

    // Volume threshold
    if (filters.minVolume && opportunity.volume24h < filters.minVolume) {
      return false;
    }

    // Slippage threshold
    if (filters.maxSlippage && opportunity.estimatedSlippage > filters.maxSlippage) {
      return false;
    }

    // Gas cost threshold
    if (filters.maxGasCost) {
      const totalGas = opportunity.gasCostEntry + opportunity.gasCostExit;
      if (totalGas > filters.maxGasCost) {
        return false;
      }
    }

    // Base yield threshold
    if (filters.minBaseYield && opportunity.baseYield < filters.minBaseYield) {
      return false;
    }

    // Risk threshold
    if (filters.maxRisk && opportunity.riskScore > filters.maxRisk) {
      return false;
    }

    return true;
  }

  // ============================================================================
  // RANKING
  // Sort opportunities by net score (descending)
  // ============================================================================

  rankOpportunities(opportunities: NormalizedOpportunity[]): NormalizedOpportunity[] {
    return [...opportunities].sort((a, b) => b.netScore - a.netScore);
  }
}

// Export singleton instance
export const scoringEngine = new OpportunityScoringEngine();