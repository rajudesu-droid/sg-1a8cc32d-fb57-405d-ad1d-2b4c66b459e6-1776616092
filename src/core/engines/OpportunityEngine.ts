/**
 * Opportunity Engine
 * Scans and scores LP opportunities
 * 
 * CRITICAL: Respects adapter readiness levels
 */

import { orchestrator } from "../orchestrator";
import { useAppStore } from "@/store";
import type { Opportunity, EngineResult } from "../contracts";
import { protocolRegistry } from "../protocols/ProtocolRegistry";

/**
 * Opportunity Engine
 * Scans and scores LP opportunities
 * 
 * CRITICAL: Respects adapter readiness levels
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
    console.log("[OpportunityEngine] Scanning opportunities", params);

    const mode = useAppStore.getState().mode.current;
    
    // Get available adapters respecting mode
    const availableAdapters = protocolRegistry.getAvailableAdapters(mode);
    
    console.log(`[OpportunityEngine] Found ${availableAdapters.length} adapters available for ${mode} mode`);
    
    const opportunities: Opportunity[] = [];
    
    // STUB: Would scan protocols and normalize opportunities
    // For now, return empty for production safety
    
    useAppStore.getState().setOpportunities(opportunities);

    await orchestrator.coordinateUpdate(
      this.engineId,
      "opportunities_scanned",
      { opportunities },
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