// ============================================================================
// MULTI-PROTOCOL OPPORTUNITY SCANNER ENGINE
// Scans, normalizes, and aggregates opportunities across all enabled DEXs
// ============================================================================

import { protocolRegistry } from "../protocols/ProtocolRegistry";
import { scoringEngine } from "../scoring/OpportunityScoringEngine";
import type { NormalizedOpportunity } from "../protocols/types";
import { useAppStore } from "@/store";

export class MultiProtocolOpportunityEngine {
  private isScanning = false;
  private lastScanTime: Date | null = null;
  private cachedOpportunities: NormalizedOpportunity[] = [];

  // ============================================================================
  // MAIN SCANNING LOOP
  // ============================================================================

  async scanAllOpportunities(forceRefresh = false): Promise<NormalizedOpportunity[]> {
    if (this.isScanning) {
      console.log("[MultiProtocolScanner] Scan already in progress, returning cache");
      return this.cachedOpportunities;
    }

    // Return cache if it's fresh (< 5 minutes old) and forceRefresh is false
    if (!forceRefresh && this.lastScanTime && (Date.now() - this.lastScanTime.getTime() < 5 * 60 * 1000)) {
      return this.cachedOpportunities;
    }

    this.isScanning = true;
    console.log("[MultiProtocolScanner] Starting multi-protocol scan...");

    try {
      const allOpportunities: NormalizedOpportunity[] = [];
      const enabledAdapters = protocolRegistry.getEnabledAdapters();
      const enabledChains = protocolRegistry.getEnabledChains().map(c => c.name);

      // Process each adapter
      for (const adapter of enabledAdapters) {
        console.log(`[MultiProtocolScanner] Scanning ${adapter.protocolName}...`);
        
        // Find overlapping chains (supported by both app and adapter)
        const activeChains = adapter.supportedChains.filter(chain => enabledChains.includes(chain));
        
        for (const chain of activeChains) {
          try {
            // 1. Discover Pools
            const pools = await adapter.getSupportedPools(chain);
            
            // 2. Fetch and Normalize Each Pool
            for (const poolAddress of pools) {
              try {
                const opp = await adapter.normalizeOpportunity(chain, poolAddress);
                
                // 3. Score Opportunity via Centralized Scoring Engine
                const scoringResult = scoringEngine.scoreOpportunity(opp);
                
                // Attach scores
                opp.qualityScore = scoringResult.qualityScore;
                opp.riskScore = scoringResult.riskScore;
                opp.netScore = scoringResult.netScore;
                
                allOpportunities.push(opp);
              } catch (poolErr) {
                console.error(`[MultiProtocolScanner] Failed to normalize pool ${poolAddress} on ${chain}:`, poolErr);
              }
            }
          } catch (chainErr) {
            console.error(`[MultiProtocolScanner] Failed scanning ${adapter.protocolName} on ${chain}:`, chainErr);
          }
        }
      }

      // 4. Rank and Filter Opportunities
      // Use policy engine rules / store settings to filter
      const policy = useAppStore.getState().policy;
      
      const filtered = allOpportunities.filter(opp => 
        scoringEngine.filterOpportunity(opp, {
          minBaseYield: 0,
          maxRisk: 100 - policy.minPoolScore, // Convert min score to max risk
          requireWhitelisted: true
        })
      );
      
      this.cachedOpportunities = scoringEngine.rankOpportunities(filtered);
      this.lastScanTime = new Date();
      
      console.log(`[MultiProtocolScanner] Scan complete. Found ${this.cachedOpportunities.length} opportunities.`);
      
      // Sync to global store (convert Date to string for serialization)
      const serializedOpportunities = this.cachedOpportunities.map(opp => ({
        ...opp,
        lastUpdated: opp.lastUpdated.toISOString(),
      }));
      
      useAppStore.getState().setOpportunities(serializedOpportunities);
      
      return this.cachedOpportunities;
    } catch (error) {
      console.error("[MultiProtocolScanner] Scan failed:", error);
      return this.cachedOpportunities;
    } finally {
      this.isScanning = false;
    }
  }

  // ============================================================================
  // OPPORTUNITY MANAGEMENT
  // ============================================================================

  getOpportunityById(id: string): NormalizedOpportunity | undefined {
    return this.cachedOpportunities.find(opp => opp.id === id);
  }

  getOpportunitiesByChain(chain: string): NormalizedOpportunity[] {
    return this.cachedOpportunities.filter(opp => opp.chain === chain);
  }

  getOpportunitiesByProtocol(protocol: string): NormalizedOpportunity[] {
    return this.cachedOpportunities.filter(opp => opp.protocolName === protocol);
  }

  getLastScanTime(): Date | null {
    return this.lastScanTime;
  }
}

// Export singleton instance
export const multiProtocolScanner = new MultiProtocolOpportunityEngine();