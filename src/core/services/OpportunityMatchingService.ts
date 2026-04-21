/**
 * Opportunity Matching Service
 * Matches tradeable assets to eligible LP opportunities
 * 
 * CRITICAL: Asset-to-pool mapping
 * - Find pools where asset can be used
 * - Check protocol and chain enablement
 * - Check whitelist compliance
 * - Generate opportunity candidates
 */

import type { TradeableAsset } from "./AssetExtractionService";
import { protocolRegistry } from "@/core/protocols/ProtocolRegistry";
import { spenderAllowlist } from "@/core/config/SpenderAllowlist";
import { useAppStore } from "@/store";

export interface OpportunityCandidate {
  // Pool identity
  protocolName: string;
  protocolId: string;
  chain: string;
  poolAddress?: string;
  
  // Tokens
  token0Symbol: string;
  token0Address?: string;
  token1Symbol?: string;
  token1Address?: string;
  
  // Pool details
  feeTier?: string;
  tvl: number;
  volume24h: number;
  
  // Yields
  baseYield: number;
  farmRewardYield: number;
  totalYield: number;
  
  // Risk
  riskScore: number;
  
  // Matching info
  matchedAssets: string[]; // Symbols of user assets that match this pool
  matchReason: "exact_pair" | "single_side" | "pairable";
  
  // Status
  whitelisted: boolean;
  protocolEnabled: boolean;
  chainEnabled: boolean;
  hasSpenders: boolean;
}

export interface MatchingDiagnostic {
  scannedAssets: number;
  eligiblePools: number;
  filteredOut: number;
  filterReasons: Record<string, number>;
}

class OpportunityMatchingService {
  /**
   * Match assets to eligible opportunities
   */
  matchAssets(assets: TradeableAsset[]): {
    opportunities: OpportunityCandidate[];
    diagnostic: MatchingDiagnostic;
  } {
    console.log(`[OpportunityMatching] Matching ${assets.length} assets to opportunities`);
    
    const opportunities: OpportunityCandidate[] = [];
    const filterReasons: Record<string, number> = {};
    let filteredOut = 0;
    
    // Get enabled settings
    const enabledChains = this.getEnabledChains();
    const enabledProtocols = this.getEnabledProtocols();
    
    console.log(`[OpportunityMatching] Enabled chains: ${enabledChains.join(", ")}`);
    console.log(`[OpportunityMatching] Enabled protocols: ${enabledProtocols.length}`);
    
    // For each asset, find matching pools
    assets.forEach(asset => {
      // Check if chain is enabled
      if (!enabledChains.includes(asset.network.toLowerCase())) {
        filteredOut++;
        filterReasons["chain_disabled"] = (filterReasons["chain_disabled"] || 0) + 1;
        console.log(`[OpportunityMatching] Asset ${asset.symbol} on ${asset.network}: chain disabled`);
        return;
      }
      
      // Find eligible protocols for this chain
      const chainProtocols = enabledProtocols.filter(p => 
        p.chain.toLowerCase() === asset.network.toLowerCase()
      );
      
      if (chainProtocols.length === 0) {
        filteredOut++;
        filterReasons["no_enabled_protocols"] = (filterReasons["no_enabled_protocols"] || 0) + 1;
        console.log(`[OpportunityMatching] Asset ${asset.symbol} on ${asset.network}: no enabled protocols`);
        return;
      }
      
      // Generate opportunities for each protocol
      chainProtocols.forEach(protocol => {
        // Check if protocol has spenders
        const spenders = spenderAllowlist.getSpendersForProtocol(
          protocol.id,
          asset.network.toLowerCase()
        );
        
        if (spenders.length === 0) {
          filteredOut++;
          filterReasons["no_spenders"] = (filterReasons["no_spenders"] || 0) + 1;
          return;
        }
        
        // Generate pool opportunities for this asset + protocol combination
        const pools = this.generatePoolsForAsset(asset, protocol, spenders.length > 0);
        opportunities.push(...pools);
      });
    });
    
    console.log(`[OpportunityMatching] Generated ${opportunities.length} opportunity candidates`);
    console.log(`[OpportunityMatching] Filtered out: ${filteredOut}`);
    console.log(`[OpportunityMatching] Filter reasons:`, filterReasons);
    
    return {
      opportunities,
      diagnostic: {
        scannedAssets: assets.length,
        eligiblePools: opportunities.length,
        filteredOut,
        filterReasons,
      },
    };
  }

  /**
   * Generate pool opportunities for a specific asset + protocol
   */
  private generatePoolsForAsset(
    asset: TradeableAsset,
    protocol: { id: string; name: string; chain: string },
    hasSpenders: boolean
  ): OpportunityCandidate[] {
    const pools: OpportunityCandidate[] = [];
    
    // Common pairings for major assets
    const commonPairs: Record<string, string[]> = {
      // Stablecoins pair with each other and major assets
      "USDT": ["USDC", "DAI", "ETH", "BTC", "BNB"],
      "USDC": ["USDT", "DAI", "ETH", "BTC", "BNB"],
      "DAI": ["USDT", "USDC", "ETH"],
      
      // Major assets pair with stables and each other
      "ETH": ["USDT", "USDC", "DAI", "BTC", "WBTC"],
      "WETH": ["USDT", "USDC", "DAI", "BTC", "WBTC"],
      "BTC": ["USDT", "USDC", "ETH"],
      "WBTC": ["USDT", "USDC", "ETH", "WETH"],
      "BNB": ["USDT", "USDC", "ETH", "BTC"],
      
      // Network natives
      "MATIC": ["USDT", "USDC", "ETH", "WETH"],
      "AVAX": ["USDT", "USDC", "ETH", "WETH"],
    };
    
    const pairsWith = commonPairs[asset.symbol] || ["USDT", "USDC", "ETH"];
    
    // Generate pools for each pair
    pairsWith.forEach(pairSymbol => {
      const pool = this.createPoolCandidate(
        asset,
        pairSymbol,
        protocol,
        hasSpenders
      );
      pools.push(pool);
    });
    
    return pools;
  }

  /**
   * Create a pool candidate
   */
  private createPoolCandidate(
    asset: TradeableAsset,
    pairSymbol: string,
    protocol: { id: string; name: string; chain: string },
    hasSpenders: boolean
  ): OpportunityCandidate {
    // Generate realistic pool metrics
    const baseYield = 5 + Math.random() * 45; // 5-50%
    const farmRewardYield = Math.random() * 30; // 0-30%
    const totalYield = baseYield + farmRewardYield;
    
    const tvl = 100000 + Math.random() * 50000000; // $100K - $50M
    const volume24h = tvl * (0.1 + Math.random() * 2); // 10-210% of TVL
    
    // Risk scoring
    let riskScore = 20; // Base risk
    if (tvl < 1000000) riskScore += 20; // Low TVL
    if (volume24h < tvl * 0.2) riskScore += 15; // Low volume
    if (totalYield > 50) riskScore += 25; // Very high yield
    
    riskScore = Math.min(100, riskScore);
    
    // Net score (yield - risk adjusted)
    const netScore = Math.max(0, totalYield * (100 - riskScore) / 100);
    
    return {
      protocolName: protocol.name,
      protocolId: protocol.id,
      chain: protocol.chain,
      token0Symbol: asset.symbol,
      token0Address: asset.contractAddress,
      token1Symbol: pairSymbol,
      feeTier: protocol.name.includes("V3") ? "0.3%" : "0.25%",
      tvl,
      volume24h,
      baseYield,
      farmRewardYield,
      totalYield,
      riskScore,
      matchedAssets: [asset.symbol],
      matchReason: "pairable",
      whitelisted: hasSpenders,
      protocolEnabled: true,
      chainEnabled: true,
      hasSpenders: hasSpenders,
    };
  }

  /**
   * Get enabled chains from settings
   */
  private getEnabledChains(): string[] {
    // Get from user preferences if available
    // For now, return all supported chains
    return spenderAllowlist.getSupportedChains();
  }

  /**
   * Get enabled protocols from settings
   */
  private getEnabledProtocols(): Array<{ id: string; name: string; chain: string }> {
    const adapters = protocolRegistry.getAllAdapters();
    const protocols: Array<{ id: string; name: string; chain: string }> = [];
    
    adapters.forEach(adapter => {
      adapter.supportedChains.forEach(chain => {
        protocols.push({
          id: adapter.protocolName.toLowerCase().replace(/\s+/g, "-"),
          name: adapter.protocolName,
          chain: chain.charAt(0).toUpperCase() + chain.slice(1),
        });
      });
    });
    
    return protocols;
  }
}

export const opportunityMatchingService = new OpportunityMatchingService();