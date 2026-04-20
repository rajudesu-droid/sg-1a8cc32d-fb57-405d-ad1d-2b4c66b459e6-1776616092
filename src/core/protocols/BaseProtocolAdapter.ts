// ============================================================================
// BASE PROTOCOL ADAPTER
// Abstract base class that all protocol adapters extend
// ============================================================================

import type {
  ProtocolAdapter,
  ProtocolMetadata,
  AdapterCapabilities,
  AdapterReadiness,
  Pool,
  Farm,
  PoolMetrics,
  RewardMetrics,
  QuoteResult,
  PositionState,
  ExecutionParams,
} from "./types";

/**
 * Base Protocol Adapter
 * Abstract class with common functionality
 * 
 * CRITICAL: Adapters must declare their readiness level
 */
export abstract class BaseProtocolAdapter implements ProtocolAdapter {
  protected protocolName: string;
  protected capabilities: AdapterCapabilities;

  constructor(protocolName: string) {
    this.protocolName = protocolName;
    this.capabilities = this.getDefaultCapabilities();
  }

  // ==================== METADATA ====================
  
  abstract getMetadata(): ProtocolMetadata;

  /**
   * Get adapter readiness level
   * Override in subclass to set appropriate level
   */
  getReadiness(): AdapterReadiness {
    return this.capabilities.readiness;
  }

  /**
   * Get adapter capabilities
   */
  getCapabilities(): AdapterCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Check if adapter can be used in given mode
   */
  canUseInMode(mode: "demo" | "shadow" | "live"): boolean {
    const readiness = this.getReadiness();
    
    if (mode === "demo") return true;  // All adapters work in demo
    if (mode === "shadow") return readiness === "shadow" || readiness === "live";
    if (mode === "live") return readiness === "live";
    
    return false;
  }

  /**
   * Get blocking issues preventing live-ready status
   */
  getBlockingIssues(): string[] {
    return this.capabilities.blockingIssues || [];
  }

  /**
   * Default capabilities (all false)
   * Subclasses must override to declare their capabilities
   */
  protected getDefaultCapabilities(): AdapterCapabilities {
    return {
      realPoolDiscovery: false,
      realPoolMetrics: false,
      realQuotes: false,
      realRewards: false,
      realPositionState: false,
      realExecution: false,
      testedOnTestnet: false,
      auditedContracts: false,
      readiness: "demo",
      blockingIssues: [
        "Pool discovery uses mock data",
        "Pool metrics are simulated",
        "Quotes are estimated, not real",
        "Reward data is placeholder",
        "Position state is simulated",
        "Execution paths not implemented",
        "Not tested on testnet",
        "Contract addresses not audited",
      ],
    };
  }

  // ==================== ABSTRACT METHODS ====================
  
  abstract getSupportedPools(chain: string): Promise<Pool[]>;
  abstract getEligibleFarms(chain: string): Promise<Farm[]>;
  abstract getPoolMetrics(poolAddress: string, chain: string): Promise<PoolMetrics>;
  abstract getRewardMetrics(poolAddress: string, chain: string): Promise<RewardMetrics>;
  abstract getWalletEligiblePairs(walletAddress: string, chain: string): Promise<string[]>;
  abstract quoteEntry(params: ExecutionParams): Promise<QuoteResult>;
  abstract quoteExit(params: ExecutionParams): Promise<QuoteResult>;
  abstract getPositionState(positionId: string, walletAddress: string, chain: string): Promise<PositionState>;
  
  // Execution methods (default to throwing error if not implemented)
  async openPosition(params: ExecutionParams): Promise<string> {
    throw new Error(`${this.protocolName}: openPosition not implemented`);
  }
  
  async addLiquidity(params: ExecutionParams): Promise<string> {
    throw new Error(`${this.protocolName}: addLiquidity not implemented`);
  }
  
  async removeLiquidity(params: ExecutionParams): Promise<string> {
    throw new Error(`${this.protocolName}: removeLiquidity not implemented`);
  }
  
  async stakeIfRequired(params: ExecutionParams): Promise<string | null> {
    return null;  // No staking by default
  }
  
  async unstakeIfRequired(params: ExecutionParams): Promise<string | null> {
    return null;  // No staking by default
  }
  
  async harvestRewards(params: ExecutionParams): Promise<string> {
    throw new Error(`${this.protocolName}: harvestRewards not implemented`);
  }
}