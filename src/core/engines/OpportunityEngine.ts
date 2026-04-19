/**
 * Opportunity Engine
 * Scans pools, scores opportunities, manages opportunity lifecycle
 */

import { orchestrator } from "@/core/orchestrator";
import { useAppStore } from "@/store";
import type { Opportunity, Asset, EngineResult, AppEvent } from "@/core/contracts";
import { multiProtocolScanner } from "./MultiProtocolOpportunityEngine";

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
    console.log("[OpportunityEngine] Scanning pools across all protocols...");

    try {
      // Delegate to the new MultiProtocolOpportunityEngine
      const opportunities = await multiProtocolScanner.scanAllOpportunities(true);

      await orchestrator.coordinateUpdate(
        "opportunity",
        "opportunities_scanned",
        { count: opportunities.length },
        ["dashboard", "opportunities-page"]
      );

      return {
        success: true,
        data: opportunities as unknown as Opportunity[],
        affectedModules: ["dashboard", "opportunities-page"],
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
    // Scoring is now handled centrally during the MultiProtocol scan and normalization phase.
    console.log("[OpportunityEngine] Scoring is managed by Central Scoring Engine automatically.");
    return {
      success: true,
      affectedModules: [],
      events: [],
    };
  }

  // ==================== RESCAN TASK ====================
  async rescan(): Promise<void> {
    const { assets } = useAppStore.getState().wallet;
    await this.scanPools(assets);
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