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
  // ============================================================================

  abstract getSupportedPools(chain: string): Promise<string[]>;

  async getEligibleFarms(chain: string, walletAddress?: string): Promise<string[]> {
    return [];
  }

  // ============================================================================
  // METRICS METHODS
  // ============================================================================

  abstract getPoolMetrics(chain: string, poolAddress: string): Promise<PoolMetrics>;
  abstract getRewardMetrics(chain: string, poolAddress: string): Promise<RewardMetrics>;

  // ============================================================================
  // WALLET INTEGRATION
  // ============================================================================

  async getWalletEligiblePairs(chain: string, walletAddress: string): Promise<string[]> {
    return [];
  }

  // ============================================================================
  // QUOTE METHODS
  // ============================================================================

  async quoteEntry(chain: string, poolAddress: string, amountUsd: number): Promise<EntryQuote> {
    throw new Error("Method not implemented for " + this.protocolName);
  }

  async quoteExit(chain: string, poolAddress: string, positionId: string): Promise<ExitQuote> {
    throw new Error("Method not implemented for " + this.protocolName);
  }

  // ============================================================================
  // EXECUTION METHODS
  // ============================================================================

  async openPosition(chain: string, poolAddress: string, params: PositionParams): Promise<string> {
    throw new Error("Method not implemented for " + this.protocolName);
  }

  async addLiquidity(chain: string, positionId: string, amountUsd: number): Promise<void> {
    throw new Error("Method not implemented for " + this.protocolName);
  }

  async removeLiquidity(chain: string, positionId: string, percentage: number): Promise<void> {
    throw new Error("Method not implemented for " + this.protocolName);
  }

  // ============================================================================
  // STAKING METHODS
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
  // ============================================================================

  async harvestRewards(chain: string, positionId: string): Promise<HarvestResult> {
    throw new Error("Method not implemented for " + this.protocolName);
  }

  // ============================================================================
  // POSITION STATE
  // ============================================================================

  async getPositionState(chain: string, positionId: string): Promise<PositionState> {
    throw new Error("Method not implemented for " + this.protocolName);
  }

  // ============================================================================
  // NORMALIZATION
  // ============================================================================

  abstract normalizeOpportunity(chain: string, poolAddress: string): Promise<NormalizedOpportunity>;

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