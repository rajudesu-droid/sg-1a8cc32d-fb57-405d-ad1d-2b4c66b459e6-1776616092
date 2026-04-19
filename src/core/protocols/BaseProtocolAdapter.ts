// ============================================================================
// BASE PROTOCOL ADAPTER
// Abstract base class that all protocol adapters extend
// ============================================================================

import type {
  IProtocolAdapter,
  ProtocolType,
  PoolMetrics,
  RewardMetrics,
  EntryQuote,
  ExitQuote,
  PositionParams,
  HarvestResult,
  PositionState,
  NormalizedOpportunity,
} from "./types";

export abstract class BaseProtocolAdapter implements IProtocolAdapter {
  abstract protocolName: string;
  abstract protocolType: ProtocolType;
  abstract supportedChains: string[];

  // ============================================================================
  // DISCOVERY METHODS
  // Subclasses must implement pool/farm discovery
  // ============================================================================

  abstract getSupportedPools(chain: string): Promise<string[]>;
  abstract getEligibleFarms(chain: string, walletAddress?: string): Promise<string[]>;

  // ============================================================================
  // METRICS METHODS
  // Subclasses must implement metrics fetching
  // ============================================================================

  abstract getPoolMetrics(chain: string, poolAddress: string): Promise<PoolMetrics>;
  abstract getRewardMetrics(chain: string, poolAddress: string): Promise<RewardMetrics>;

  // ============================================================================
  // WALLET INTEGRATION
  // Subclasses must implement wallet compatibility checks
  // ============================================================================

  abstract getWalletEligiblePairs(chain: string, walletAddress: string): Promise<string[]>;

  // ============================================================================
  // QUOTE METHODS
  // Subclasses must implement entry/exit quoting
  // ============================================================================

  abstract quoteEntry(chain: string, poolAddress: string, amountUsd: number): Promise<EntryQuote>;
  abstract quoteExit(chain: string, poolAddress: string, positionId: string): Promise<ExitQuote>;

  // ============================================================================
  // EXECUTION METHODS
  // Subclasses must implement position management
  // ============================================================================

  abstract openPosition(
    chain: string,
    poolAddress: string,
    params: PositionParams
  ): Promise<string>;
  abstract addLiquidity(chain: string, positionId: string, amountUsd: number): Promise<void>;
  abstract removeLiquidity(chain: string, positionId: string, percentage: number): Promise<void>;

  // ============================================================================
  // STAKING METHODS
  // Default implementations (can be overridden)
  // ============================================================================

  async stakeIfRequired(chain: string, positionId: string): Promise<void> {
    // Default: no-op (override if protocol has staking)
    console.log(`[${this.protocolName}] Staking not required for ${positionId}`);
  }

  async unstakeIfRequired(chain: string, positionId: string): Promise<void> {
    // Default: no-op (override if protocol has staking)
    console.log(`[${this.protocolName}] Unstaking not required for ${positionId}`);
  }

  // ============================================================================
  // REWARD METHODS
  // Subclasses must implement harvest logic
  // ============================================================================

  abstract harvestRewards(chain: string, positionId: string): Promise<HarvestResult>;

  // ============================================================================
  // POSITION STATE
  // Subclasses must implement position state fetching
  // ============================================================================

  abstract getPositionState(chain: string, positionId: string): Promise<PositionState>;

  // ============================================================================
  // NORMALIZATION
  // Subclasses must implement opportunity normalization
  // ============================================================================

  abstract normalizeOpportunity(
    chain: string,
    poolAddress: string
  ): Promise<NormalizedOpportunity>;

  // Optional/Default implementations for the rest of IProtocolAdapter interface
  // This allows rapid integration of new DEXs for discovery/scoring without needing full execution capability right away

  async getEligibleFarms(chain: string, poolAddress: string): Promise<any[]> {
    return [];
  }

  async getWalletEligiblePairs(chain: string, walletAddress: string): Promise<string[]> {
    return [];
  }

  async quoteEntry(chain: string, poolAddress: string, amounts: { token0: number; token1: number }): Promise<any> {
    throw new Error("Method not implemented for " + this.protocolName);
  }

  async quoteExit(chain: string, poolAddress: string, liquidity: string): Promise<any> {
    throw new Error("Method not implemented for " + this.protocolName);
  }

  async openPosition(chain: string, poolAddress: string, amounts: { token0: number; token1: number }, slippage: number): Promise<any> {
    throw new Error("Method not implemented for " + this.protocolName);
  }

  async addLiquidity(chain: string, positionId: string, amounts: { token0: number; token1: number }, slippage: number): Promise<any> {
    throw new Error("Method not implemented for " + this.protocolName);
  }

  async removeLiquidity(chain: string, positionId: string, liquidity: string, slippage: number): Promise<any> {
    throw new Error("Method not implemented for " + this.protocolName);
  }

  async stakeIfRequired(chain: string, positionId: string): Promise<any> {
    throw new Error("Method not implemented for " + this.protocolName);
  }

  async unstakeIfRequired(chain: string, positionId: string): Promise<any> {
    throw new Error("Method not implemented for " + this.protocolName);
  }

  async harvestRewards(chain: string, positionId: string): Promise<any> {
    throw new Error("Method not implemented for " + this.protocolName);
  }

  async getPositionState(chain: string, positionId: string): Promise<any> {
    throw new Error("Method not implemented for " + this.protocolName);
  }

  // ============================================================================
  // HELPER METHODS
  // Shared utilities for all adapters
  // ============================================================================

  protected validateChain(chain: string): void {
    if (!this.supportedChains.includes(chain)) {
      throw new Error(
        `[${this.protocolName}] Chain ${chain} not supported. Supported: ${this.supportedChains.join(", ")}`
      );
    }
  }

  protected generateOpportunityId(chain: string, poolAddress: string): string {
    return `${this.protocolName}-${chain}-${poolAddress}`.toLowerCase();
  }

  protected calculateTotalYield(baseYield: number, farmRewardYield: number): number {
    return baseYield + farmRewardYield;
  }

  protected estimateGasCost(chain: string, operationType: "entry" | "exit" | "harvest"): number {
    // Simplified gas estimation (should be enhanced with real gas price feeds)
    const gasEstimates: Record<string, Record<string, number>> = {
      ethereum: { entry: 15, exit: 12, harvest: 8 },
      bsc: { entry: 2, exit: 1.5, harvest: 1 },
      polygon: { entry: 0.5, exit: 0.4, harvest: 0.2 },
      arbitrum: { entry: 1, exit: 0.8, harvest: 0.5 },
      optimism: { entry: 1, exit: 0.8, harvest: 0.5 },
      base: { entry: 0.8, exit: 0.6, harvest: 0.4 },
      avalanche: { entry: 1.5, exit: 1.2, harvest: 0.8 },
    };

    const chainGas = gasEstimates[chain.toLowerCase()] || gasEstimates.polygon;
    return chainGas[operationType] || 1;
  }
}