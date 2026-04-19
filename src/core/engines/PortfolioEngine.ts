/**
 * Portfolio Engine
 * Calculates and maintains portfolio metrics
 * 
 * CRITICAL: Uses identity-based asset aggregation
 */

import { orchestrator } from "../orchestrator";
import { useAppStore } from "@/store";
import type { PortfolioMetrics, EngineResult } from "../contracts";
import { groupAssetsBySymbol, createAssetId } from "../utils/assetIdentity";

/**
 * Portfolio Engine
 * Calculates and maintains portfolio metrics
 * 
 * CRITICAL: Uses identity-based asset aggregation
 */
export class PortfolioEngine {
  private engineId = "portfolio";

  constructor() {
    orchestrator.registerEngine(this.engineId, this);
    console.log("[PortfolioEngine] Initialized and registered");
  }

  // ==================== CALCULATE PORTFOLIO TASK ====================
  async calculatePortfolio(): Promise<EngineResult<PortfolioMetrics>> {
    console.log("[PortfolioEngine] Calculating portfolio metrics");

    const wallet = useAppStore.getState().wallet;
    const positions = useAppStore.getState().positions;
    const mode = useAppStore.getState().mode.current;

    // CRITICAL: Calculate using identity-aware asset aggregation
    const walletAssets = wallet.assets || [];
    
    // Group by network first, then by symbol
    const assetsByNetwork = walletAssets.reduce((acc, asset) => {
      const network = asset.network || "unknown";
      if (!acc[network]) {
        acc[network] = [];
      }
      acc[network].push(asset);
      return acc;
    }, {} as Record<string, typeof walletAssets>);

    // Calculate network balances (identity-aware)
    const networkBalances = Object.entries(assetsByNetwork).map(([network, assets]) => {
      const totalValue = assets.reduce(
        (sum, asset) => sum + ((asset.priceUsd || 0) * parseFloat(asset.balance)),
        0
      );

      return {
        network,
        assets: assets.map(asset => ({
          // Include full identity
          id: asset.id,
          symbol: asset.symbol,
          chainFamily: asset.chainFamily,
          network: asset.network,
          contractAddress: asset.contractAddress,
          balance: parseFloat(asset.balance),
          valueUsd: (asset.priceUsd || 0) * parseFloat(asset.balance),
        })),
        totalValue,
        percentage: 0, // Will calculate after total
      };
    });

    const totalWalletValue = networkBalances.reduce((sum, nb) => sum + nb.totalValue, 0);

    // Update percentages
    networkBalances.forEach(nb => {
      nb.percentage = totalWalletValue > 0 ? (nb.totalValue / totalWalletValue) * 100 : 0;
    });

    // Calculate position values
    const deployedCapital = positions.reduce(
      (sum, pos) => sum + (pos.valueUsd || 0),
      0
    );

    const totalValue = totalWalletValue + deployedCapital;
    const idleCapital = totalWalletValue;

    // Calculate earnings (mode-aware)
    const realizedEarnings = positions.reduce(
      (sum, pos) => sum + (pos.accruedFees || 0) + (pos.accruedRewards || 0),
      0
    );

    const netApy = deployedCapital > 0
      ? (realizedEarnings / deployedCapital) * 365 * 100
      : 0;

    const metrics: PortfolioMetrics = {
      totalValue,
      deployedCapital,
      idleCapital,
      netApy,
      dailyEarnings: {
        total: realizedEarnings / 30,
        realized: realizedEarnings / 30,
        projected: 0,
        label: mode === "demo" ? "Simulated" : mode === "shadow" ? "Estimated" : "Realized",
      },
      monthlyEarnings: {
        total: realizedEarnings,
        realized: realizedEarnings,
        projected: 0,
        label: mode === "demo" ? "Simulated" : mode === "shadow" ? "Estimated" : "Realized",
      },
      realizedEarnings,
      projected30Day: 0,
      assetsByNetwork: networkBalances.reduce((acc, nb) => {
        acc[nb.network] = {
          network: nb.network,
          assets: nb.assets as any,
          totalValue: nb.totalValue,
          percentage: nb.percentage,
        };
        return acc;
      }, {} as Record<string, any>),
    };

    // Save to mode-specific state
    if (mode === "demo") {
      useAppStore.getState().setDemoPortfolio(metrics);
    } else if (mode === "shadow") {
      useAppStore.getState().setShadowPortfolio(metrics);
    } else if (mode === "live") {
      useAppStore.getState().setLivePortfolio(metrics);
    }

    useAppStore.getState().setPortfolio(metrics);

    await orchestrator.coordinateUpdate(
      this.engineId,
      "portfolio_updated",
      { metrics },
      ["dashboard"]
    );

    return {
      success: true,
      data: metrics,
      affectedModules: ["dashboard"],
      events: [],
    };
  }
}

export const portfolioEngine = new PortfolioEngine();