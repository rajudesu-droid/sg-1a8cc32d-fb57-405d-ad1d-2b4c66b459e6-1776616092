/**
 * Sync Engine
 * Keeps all pages, components, and data models aligned
 */

import { orchestrator } from "@/core/orchestrator";
import type { AppEvent } from "@/core/contracts";
import { useAppStore } from "@/store";

export class SyncEngine {
  private syncInProgress = false;
  private lastSyncTime: Date | null = null;

  constructor() {
    this.registerWithOrchestrator();
  }

  private registerWithOrchestrator(): void {
    orchestrator.registerEngine("sync", this);
    
    // Listen to all events for sync decisions
    orchestrator.on("event", (event: AppEvent) => {
      this.handleSyncTrigger(event);
    });
  }

  // ==================== SYNC TRIGGERS ====================
  private async handleSyncTrigger(event: AppEvent): Promise<void> {
    const syncableEvents: AppEvent["type"][] = [
      "wallet_updated",
      "assets_updated",
      "portfolio_updated",
      "positions_updated",
      "rewards_updated",
      "policy_updated",
      "mode_changed",
    ];

    if (syncableEvents.includes(event.type)) {
      await this.syncAffectedModules(event.affectedModules);
    }
  }

  // ==================== SYNC OPERATIONS ====================
  async syncAll(): Promise<void> {
    if (this.syncInProgress) {
      console.log("[Sync] Sync already in progress, skipping");
      return;
    }

    this.syncInProgress = true;
    console.log("[Sync] Full system sync initiated");

    try {
      const store = useAppStore.getState();
      
      // Sync all engines in dependency order
      await this.syncWallet();
      await this.syncPortfolio();
      await this.syncOpportunities();
      await this.syncPositions();
      await this.syncRewards();
      await this.syncWithdrawal();
      
      this.lastSyncTime = new Date();
      console.log("[Sync] Full system sync complete");
    } catch (error) {
      console.error("[Sync] Error during full sync:", error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncAffectedModules(modules: string[]): Promise<void> {
    if (this.syncInProgress) return;

    this.syncInProgress = true;
    console.log("[Sync] Syncing modules:", modules);

    try {
      for (const module of modules) {
        switch (module) {
          case "wallet":
            await this.syncWallet();
            break;
          case "portfolio":
            await this.syncPortfolio();
            break;
          case "opportunity":
            await this.syncOpportunities();
            break;
          case "position":
            await this.syncPositions();
            break;
          case "rewards":
            await this.syncRewards();
            break;
          case "withdrawal":
            await this.syncWithdrawal();
            break;
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncWallet(): Promise<void> {
    const walletEngine = orchestrator.getEngine("wallet");
    if (walletEngine && typeof walletEngine.refresh === "function") {
      await walletEngine.refresh();
    }
  }

  private async syncPortfolio(): Promise<void> {
    const portfolioEngine = orchestrator.getEngine("portfolio");
    if (portfolioEngine && typeof portfolioEngine.recalculate === "function") {
      await portfolioEngine.recalculate();
    }
  }

  private async syncOpportunities(): Promise<void> {
    const opportunityEngine = orchestrator.getEngine("opportunity");
    if (opportunityEngine && typeof opportunityEngine.rescan === "function") {
      await opportunityEngine.rescan();
    }
  }

  private async syncPositions(): Promise<void> {
    const positionEngine = orchestrator.getEngine("position");
    if (positionEngine && typeof positionEngine.updateAll === "function") {
      await positionEngine.updateAll();
    }
  }

  private async syncRewards(): Promise<void> {
    const rewardsEngine = orchestrator.getEngine("rewards");
    if (rewardsEngine && typeof rewardsEngine.recalculate === "function") {
      await rewardsEngine.recalculate();
    }
  }

  private async syncWithdrawal(): Promise<void> {
    const withdrawalEngine = orchestrator.getEngine("withdrawal");
    if (withdrawalEngine && typeof withdrawalEngine.invalidateCache === "function") {
      await withdrawalEngine.invalidateCache();
    }
  }

  // ==================== EVENT HANDLER ====================
  async handleEvent(event: AppEvent): Promise<void> {
    console.log(`[Sync] Handling event: ${event.type}`);
    await this.syncAffectedModules(event.affectedModules);
  }

  // ==================== HEALTH ====================
  isHealthy(): boolean {
    return !this.syncInProgress;
  }

  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }
}

export const syncEngine = new SyncEngine();