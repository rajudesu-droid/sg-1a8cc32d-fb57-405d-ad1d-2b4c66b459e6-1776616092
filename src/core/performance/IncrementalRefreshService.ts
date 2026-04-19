
// ============================================================================
// INCREMENTAL REFRESH SERVICE
// Updates only changed entities instead of full refresh
// ============================================================================

import { orchestrator } from "../orchestrator";
import { performanceMonitor } from "./PerformanceMonitor";

interface RefreshConfig {
  mode: "demo" | "shadow" | "live";
  priority: "urgent" | "high" | "normal" | "low";
  changedEntityType?: "position" | "wallet" | "portfolio" | "opportunity";
  changedEntityId?: string;
}

export class IncrementalRefreshService {
  /**
   * Determine affected modules from entity change
   */
  private getAffectedModules(config: RefreshConfig): string[] {
    const { changedEntityType } = config;

    if (!changedEntityType) {
      // Full refresh if entity type unknown
      return [
        "wallet-engine",
        "portfolio-engine",
        "position-engine",
        "rewards-engine",
        "opportunity-engine",
        "dashboard",
        "positions-page",
        "wallets-page",
        "opportunities-page",
      ];
    }

    // Incremental refresh based on entity type
    switch (changedEntityType) {
      case "position":
        return [
          "portfolio-engine",    // Recalc portfolio totals
          "position-engine",     // Update position details
          "rewards-engine",      // Update accrued rewards
          "dashboard",           // Refresh KPIs
          "positions-page",      // Update position list
        ];

      case "wallet":
        return [
          "wallet-engine",
          "portfolio-engine",
          "dashboard",
          "wallets-page",
        ];

      case "portfolio":
        return [
          "portfolio-engine",
          "dashboard",
        ];

      case "opportunity":
        return [
          "opportunity-engine",
          "opportunities-page",
        ];

      default:
        return [];
    }
  }

  /**
   * Refresh only affected modules
   */
  async refreshIncremental(config: RefreshConfig): Promise<void> {
    const operationId = `incremental-refresh-${Date.now()}`;
    performanceMonitor.startOperation(operationId, "incremental_refresh", config);

    try {
      const affectedModules = this.getAffectedModules(config);

      console.log(
        `[IncrementalRefresh] Refreshing ${affectedModules.length} modules for ${config.changedEntityType || "unknown"} change`
      );

      // Publish targeted sync event
      orchestrator.publishEvent({
        type: "sync_required",
        timestamp: new Date(),
        source: "incremental-refresh-service",
        data: { config },
        affectedModules,
      });

      performanceMonitor.endOperation(operationId, "incremental_refresh", config);
    } catch (error) {
      console.error("[IncrementalRefresh] Error during incremental refresh:", error);
      performanceMonitor.endOperation(operationId, "incremental_refresh", {
        ...config,
        error: true,
      });
    }
  }

  /**
   * Refresh after position change
   */
  async refreshAfterPositionChange(positionId: string, mode: "demo" | "shadow" | "live"): Promise<void> {
    await this.refreshIncremental({
      mode,
      priority: "high",
      changedEntityType: "position",
      changedEntityId: positionId,
    });
  }

  /**
   * Refresh after wallet change
   */
  async refreshAfterWalletChange(walletAddress: string, mode: "demo" | "shadow" | "live"): Promise<void> {
    await this.refreshIncremental({
      mode,
      priority: "high",
      changedEntityType: "wallet",
      changedEntityId: walletAddress,
    });
  }

  /**
   * Refresh after portfolio change
   */
  async refreshAfterPortfolioChange(mode: "demo" | "shadow" | "live"): Promise<void> {
    await this.refreshIncremental({
      mode,
      priority: "normal",
      changedEntityType: "portfolio",
    });
  }

  /**
   * Refresh all active positions
   */
  async refreshActivePositions(mode: "demo" | "shadow" | "live"): Promise<void> {
    await this.refreshIncremental({
      mode,
      priority: "normal",
      changedEntityType: "position",
    });
  }

  /**
   * Refresh wallet balances
   */
  async refreshWalletBalances(mode: "demo" | "shadow" | "live"): Promise<void> {
    await this.refreshIncremental({
      mode,
      priority: "normal",
      changedEntityType: "wallet",
    });
  }
}

export const incrementalRefreshService = new IncrementalRefreshService();
