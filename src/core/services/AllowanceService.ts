/**
 * Allowance Service
 * Fetches real on-chain token allowances
 * 
 * CRITICAL: No placeholder/mock allowance values in Live Mode
 */

import type { Asset } from "../contracts";
import { createAssetId } from "../utils/assetIdentity";

export interface AllowanceQuery {
  token: {
    chainFamily: string;
    network: string;
    contractAddress: string;
    symbol: string;
    decimals: number;
  };
  owner: string;
  spender: string;
}

export interface AllowanceResult {
  query: AllowanceQuery;
  allowance: string;  // Raw allowance amount as string
  allowanceFormatted: number;  // Formatted with decimals
  isUnlimited: boolean;
  lastChecked: Date;
}

class AllowanceService {
  private cache = new Map<string, AllowanceResult>();
  private cacheTTL = 30000; // 30 seconds

  /**
   * Get current allowance for token
   * 
   * CRITICAL: In Live Mode, this MUST fetch real on-chain data
   * In Demo/Shadow Mode, can return mock data with clear labeling
   */
  async getAllowance(
    query: AllowanceQuery,
    mode: "demo" | "shadow" | "live"
  ): Promise<AllowanceResult> {
    console.log("[AllowanceService] Checking allowance:", {
      token: query.token.symbol,
      network: query.token.network,
      owner: query.owner,
      spender: query.spender,
      mode,
    });

    // Check cache first
    const cacheKey = this.getCacheKey(query);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.lastChecked.getTime() < this.cacheTTL) {
      console.log("[AllowanceService] Using cached allowance");
      return cached;
    }

    // Mode-specific allowance fetching
    if (mode === "demo") {
      // Demo mode: Return mock unlimited allowance
      const result: AllowanceResult = {
        query,
        allowance: "999999999999999999999999",
        allowanceFormatted: 999999999999,
        isUnlimited: true,
        lastChecked: new Date(),
      };
      this.cache.set(cacheKey, result);
      return result;
    }

    if (mode === "shadow" || mode === "live") {
      // CRITICAL: Must fetch real on-chain allowance
      try {
        const allowance = await this.fetchOnChainAllowance(query);
        
        const result: AllowanceResult = {
          query,
          allowance: allowance.toString(),
          allowanceFormatted: parseFloat(allowance) / Math.pow(10, query.token.decimals),
          isUnlimited: this.isUnlimitedAllowance(allowance),
          lastChecked: new Date(),
        };
        
        this.cache.set(cacheKey, result);
        return result;
      } catch (error) {
        console.error("[AllowanceService] Failed to fetch allowance:", error);
        
        // CRITICAL: In Live Mode, throw error instead of returning placeholder
        if (mode === "live") {
          throw new Error(
            `Failed to fetch allowance for ${query.token.symbol} on ${query.token.network}. ` +
            `Cannot proceed with Live Mode execution without real allowance data.`
          );
        }
        
        // Shadow mode: Return zero allowance (safe default)
        return {
          query,
          allowance: "0",
          allowanceFormatted: 0,
          isUnlimited: false,
          lastChecked: new Date(),
        };
      }
    }

    throw new Error(`Unknown mode: ${mode}`);
  }

  /**
   * Fetch real on-chain allowance
   * 
   * STUB: Real implementation would use ethers.js/web3.js/viem
   */
  private async fetchOnChainAllowance(query: AllowanceQuery): Promise<string> {
    console.log("[AllowanceService] Fetching real on-chain allowance...");

    // STUB: Real implementation would be:
    /*
    const provider = this.getProvider(query.token.network);
    const contract = new ethers.Contract(
      query.token.contractAddress,
      ["function allowance(address,address) view returns (uint256)"],
      provider
    );
    
    const allowance = await contract.allowance(query.owner, query.spender);
    return allowance.toString();
    */

    // For now, return zero (safest default)
    // Production must implement real RPC calls
    console.warn(
      "[AllowanceService] STUB: Real on-chain integration required. Returning zero allowance."
    );
    
    return "0";
  }

  /**
   * Check if allowance is "unlimited" (max uint256 or very large)
   */
  private isUnlimitedAllowance(allowance: string): boolean {
    const maxUint256 = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
    
    // Consider unlimited if >= 2^255 (half of max uint256)
    const threshold = "57896044618658097711785492504343953926634992332820282019728792003956564819968";
    
    return BigInt(allowance) >= BigInt(threshold);
  }

  /**
   * Calculate required approval amount
   * 
   * CRITICAL: Default to minimum required, not unlimited
   */
  calculateRequiredApproval(
    requiredAmount: string,
    decimals: number,
    policy: "exact" | "1.1x" | "unlimited" = "1.1x"
  ): string {
    if (policy === "unlimited") {
      // Max uint256
      return "115792089237316195423570985008687907853269984665640564039457584007913129639935";
    }

    const requiredBigInt = BigInt(requiredAmount);

    if (policy === "exact") {
      return requiredAmount;
    }

    if (policy === "1.1x") {
      // 110% of required amount (10% buffer)
      return (requiredBigInt * BigInt(110) / BigInt(100)).toString();
    }

    return requiredAmount;
  }

  /**
   * Check if approval is needed
   */
  async isApprovalNeeded(
    token: Asset,
    owner: string,
    spender: string,
    requiredAmount: string,
    mode: "demo" | "shadow" | "live"
  ): Promise<{
    needed: boolean;
    currentAllowance: string;
    requiredAmount: string;
    recommendedApproval: string;
  }> {
    if (!token.contractAddress) {
      // Native tokens don't need approval
      return {
        needed: false,
        currentAllowance: "0",
        requiredAmount: "0",
        recommendedApproval: "0",
      };
    }

    const allowanceResult = await this.getAllowance(
      {
        token: {
          chainFamily: token.chainFamily,
          network: token.network,
          contractAddress: token.contractAddress,
          symbol: token.symbol,
          decimals: token.decimals,
        },
        owner,
        spender,
      },
      mode
    );

    const currentAllowance = BigInt(allowanceResult.allowance);
    const required = BigInt(requiredAmount);

    const needed = currentAllowance < required;

    return {
      needed,
      currentAllowance: allowanceResult.allowance,
      requiredAmount,
      recommendedApproval: needed
        ? this.calculateRequiredApproval(requiredAmount, token.decimals, "1.1x")
        : "0",
    };
  }

  /**
   * Clear allowance cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for specific query
   */
  invalidateAllowance(query: AllowanceQuery): void {
    const cacheKey = this.getCacheKey(query);
    this.cache.delete(cacheKey);
  }

  /**
   * Generate cache key
   */
  private getCacheKey(query: AllowanceQuery): string {
    return `${query.token.network}:${query.token.contractAddress}:${query.owner}:${query.spender}`.toLowerCase();
  }
}

export const allowanceService = new AllowanceService();