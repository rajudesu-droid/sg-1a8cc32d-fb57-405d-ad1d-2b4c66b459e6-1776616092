/**
 * Portfolio Engine
 * Calculates portfolio metrics, tracks positions, manages capital allocation
 */

import { orchestrator } from "@/core/orchestrator";
import { useAppStore } from "@/store";
import type { PortfolioMetrics, Asset, Position, EngineResult, AppEvent } from "@/core/contracts";

export class PortfolioEngine {
  constructor() {
    orchestrator.registerEngine("portfolio", this);
  }

  // ==================== CALCULATE PORTFOLIO TASK ====================
  async calculatePortfolio(): Promise<EngineResult<PortfolioMetrics>> {
    console.log("[PortfolioEngine] Calculating portfolio metrics");

    try {
      const { wallet, mode, positions } = useAppStore.getState();
      const { assets } = wallet;

      // Calculate total value
      const totalValue = this.calculateTotalValue(assets);
      const deployedCapital = this.calculateDeployedCapital(positions);
      const idleCapital = totalValue - deployedCapital;

      // Calculate earnings
      const dailyEarnings = this.calculateDailyEarnings(positions, mode.current);
      const monthlyEarnings = this.calculateMonthlyEarnings(positions, mode.current);
      const realizedEarnings = this.calculateRealizedEarnings(positions);
      const projected30Day = this.calculateProjected30Day(positions);

      // Calculate net APY
      const netApy = deployedCapital > 0 ? (projected30Day * 12 / deployedCapital) * 100 : 0;

      // Group assets by network
      const assetsByNetwork = this.groupAssetsByNetwork(assets);

      const metrics: PortfolioMetrics = {
        totalValue,
        deployedCapital,
        idleCapital,
        netApy,
        dailyEarnings,
        monthlyEarnings,
        realizedEarnings,
        projected30Day,
        assetsByNetwork,
      };

      useAppStore.getState().setPortfolio(metrics);

      await orchestrator.coordinateUpdate(
        "portfolio",
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to calculate portfolio",
        affectedModules: [],
        events: [],
      };
    }
  }

  // ==================== CALCULATION HELPERS ====================
  private calculateTotalValue(assets: Asset[]): number {
    return assets.reduce((sum, asset) => {
      const balance = parseFloat(asset.balance);
      const price = asset.priceUsd || this.getMockPrice(asset.symbol);
      return sum + (balance * price);
    }, 0);
  }

  private calculateDeployedCapital(positions: Position[]): number {
    return positions.reduce((sum, pos) => sum + pos.valueUsd, 0);
  }

  private calculateDailyEarnings(positions: Position[], mode: string) {
    const realized = positions.reduce((sum, pos) => sum + pos.accruedFees * 0.1, 0);
    const projected = positions.reduce((sum, pos) => sum + pos.accruedFees * 0.15, 0);

    return {
      total: realized + projected,
      realized,
      projected,
      label: mode === "demo" ? "Simulated" : mode === "shadow" ? "Estimated" : "Realized + Projected",
    };
  }

  private calculateMonthlyEarnings(positions: Position[], mode: string) {
    const realized = positions.reduce((sum, pos) => sum + pos.accruedFees * 0.5, 0);
    const projected = positions.reduce((sum, pos) => sum + pos.accruedRewards * 0.8, 0);

    return {
      total: realized + projected,
      realized,
      projected,
      label: mode === "demo" ? "Simulated" : mode === "shadow" ? "Estimated" : "Realized + Projected",
    };
  }

  private calculateRealizedEarnings(positions: Position[]): number {
    return positions.reduce((sum, pos) => sum + pos.accruedFees + pos.accruedRewards, 0);
  }

  private calculateProjected30Day(positions: Position[]): number {
    return positions.reduce((sum, pos) => {
      const dailyFees = pos.accruedFees / 30;
      return sum + (dailyFees * 30);
    }, 0);
  }

  private groupAssetsByNetwork(assets: Asset[]) {
    return assets.reduce((acc, asset) => {
      if (!acc[asset.network]) {
        acc[asset.network] = {
          network: asset.network,
          assets: [],
          totalValue: 0,
          percentage: 0,
        };
      }
      acc[asset.network].assets.push(asset);
      const value = parseFloat(asset.balance) * (asset.priceUsd || this.getMockPrice(asset.symbol));
      acc[asset.network].totalValue += value;
      return acc;
    }, {} as Record<string, any>);
  }

  private getMockPrice(symbol: string): number {
    const prices: Record<string, number> = {
      ETH: 3200,
      BNB: 580,
      MATIC: 0.85,
      AVAX: 38,
      USDT: 1,
      USDC: 1,
      DAI: 1,
    };
    return prices[symbol] || 0;
  }

  // ==================== EVENT HANDLER ====================
  async handleEvent(event: AppEvent): Promise<void> {
    console.log("[PortfolioEngine] Handling event:", event.type);

    if (["wallet_updated", "assets_updated", "positions_updated"].includes(event.type)) {
      await this.calculatePortfolio();
    }
  }

  // ==================== RECALCULATE ====================
  async recalculate(): Promise<void> {
    await this.calculatePortfolio();
  }

  // ==================== HEALTH ====================
  isHealthy(): boolean {
    return true;
  }
}

export const portfolioEngine = new PortfolioEngine();