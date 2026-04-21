/**
 * Opportunity Engine
 * Scans and scores LP opportunities
 * 
 * CRITICAL: Respects adapter readiness levels
 */

import { orchestrator } from "../orchestrator";
import { useAppStore } from "@/store";
import type { Opportunity, EngineResult } from "../contracts";
import { assetExtractionService } from "../services/AssetExtractionService";
import { opportunityMatchingService } from "../services/OpportunityMatchingService";

/**
 * Opportunity Engine
 * Scans and scores LP opportunities
 */
export class OpportunityEngine {
  private engineId = "opportunity";

  constructor() {
    orchestrator.registerEngine(this.engineId, this);
    console.log("[OpportunityEngine] Initialized and registered");
  }

  // ==================== SCAN OPPORTUNITIES TASK ====================
  async scanOpportunities(params?: {
    chains?: string[];
    protocols?: string[];
    minYield?: number;
    maxRisk?: number;
  }): Promise<EngineResult<Opportunity[]>> {
    console.log("[OpportunityEngine] Starting opportunity scan", params);

    const mode = useAppStore.getState().mode.current;
    console.log(`[OpportunityEngine] Mode: ${mode}`);
    
    // Step 1: Extract tradeable assets based on mode
    const tradeableAssets = assetExtractionService.getTradeableAssets();
    console.log(`[OpportunityEngine] Extracted ${tradeableAssets.length} tradeable assets`);
    
    if (tradeableAssets.length === 0) {
      console.warn("[OpportunityEngine] No tradeable assets found - cannot scan opportunities");
      
      useAppStore.getState().setOpportunities([]);
      
      await orchestrator.coordinateUpdate(
        this.engineId,
        "opportunities_scanned",
        { 
          opportunities: [],
          diagnostic: {
            reason: "no_assets",
            message: mode === "demo" 
              ? "Add assets to your Paper Wallet to discover opportunities" 
              : "Connect a wallet to discover opportunities",
          },
        },
        ["opportunities_page"]
      );

      return {
        success: true,
        data: [],
        affectedModules: ["opportunities_page"],
        events: [],
      };
    }
    
    // Step 2: Match assets to eligible opportunities
    const { opportunities: candidates, diagnostic } = opportunityMatchingService.matchAssets(tradeableAssets);
    console.log(`[OpportunityEngine] Matched ${candidates.length} opportunity candidates`);
    console.log(`[OpportunityEngine] Diagnostic:`, diagnostic);
    
    // Step 3: Convert candidates to Opportunity format and apply filters
    const opportunities: Opportunity[] = candidates
      .filter(candidate => {
        // Apply user filters
        if (params?.chains && !params.chains.includes(candidate.chain.toLowerCase())) {
          return false;
        }
        if (params?.protocols && !params.protocols.includes(candidate.protocolId)) {
          return false;
        }
        if (params?.minYield && candidate.totalYield < params.minYield) {
          return false;
        }
        if (params?.maxRisk && candidate.riskScore > params.maxRisk) {
          return false;
        }
        return true;
      })
      .map(candidate => ({
        id: `${candidate.protocolId}-${candidate.chain}-${candidate.token0Symbol}-${candidate.token1Symbol}`,
        protocolName: candidate.protocolName,
        chain: candidate.chain,
        token0Symbol: candidate.token0Symbol,
        token0Address: candidate.token0Address,
        token1Symbol: candidate.token1Symbol,
        token1Address: candidate.token1Address,
        feeTier: candidate.feeTier,
        tvl: candidate.tvl,
        volume24h: candidate.volume24h,
        baseYield: candidate.baseYield,
        farmRewardYield: candidate.farmRewardYield,
        totalYield: candidate.totalYield,
        riskScore: candidate.riskScore,
        netScore: Math.max(0, candidate.totalYield * (100 - candidate.riskScore) / 100),
        whitelisted: candidate.whitelisted,
      } as Opportunity));
    
    // Sort by net score (best first)
    opportunities.sort((a, b) => b.netScore - a.netScore);
    
    console.log(`[OpportunityEngine] Final opportunities: ${opportunities.length}`);
    
    // Step 4: Update store
    useAppStore.getState().setOpportunities(opportunities);

    // Step 5: Emit event
    await orchestrator.coordinateUpdate(
      this.engineId,
      "opportunities_scanned",
      { 
        opportunities,
        diagnostic: {
          scannedAssets: diagnostic.scannedAssets,
          foundOpportunities: opportunities.length,
          filteredOut: diagnostic.filteredOut,
          filterReasons: diagnostic.filterReasons,
        },
      },
      ["opportunities_page"]
    );

    return {
      success: true,
      data: opportunities,
      affectedModules: ["opportunities_page"],
      events: [],
    };
  }
}

export const opportunityEngine = new OpportunityEngine();