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
  AdapterCapabilities,
  AdapterReadiness,
  ProtocolMetadata
} from "./types";

export abstract class BaseProtocolAdapter implements IProtocolAdapter {
  public abstract protocolName: string;
  public abstract protocolType: ProtocolType;
  public abstract supportedChains: string[];

  protected capabilities: AdapterCapabilities;

  constructor() {
    this.capabilities = this.getDefaultCapabilities();
  }

  // ==================== METADATA & READINESS ====================
  
  getMetadata(): ProtocolMetadata {
    return {
      name: this.protocolName,
      version: "1.0.0",
      description: `${this.protocolName} protocol adapter`,
      chains: this.supportedChains,
      capabilities: this.getCapabilities(),
    };
  }

  getReadiness(): AdapterReadiness {
    return this.capabilities.readiness;
  }

  getCapabilities(): AdapterCapabilities {
    return { ...this.capabilities };
  }

  canUseInMode(mode: "demo" | "shadow" | "live"): boolean {
    const readiness = this.getReadiness();
    if (mode === "demo") return true;
    if (mode === "shadow") return readiness === "shadow" || readiness === "live";
    if (mode === "live") return readiness === "live";
    return false;
  }

  getBlockingIssues(): string[] {
    return this.capabilities.blockingIssues || [];
  }

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
        "Adapter uses placeholder implementation",
        "Not approved for live execution"
      ],
    };
  }

  // ==================== ABSTRACT METHODS ====================
  
  abstract getSupportedPools(chain: string): Promise<string[]>;
  abstract getEligibleFarms(chain: string, walletAddress?: string): Promise<string[]>;
  abstract getPoolMetrics(chain: string, poolAddress: string): Promise<PoolMetrics>;
  abstract getRewardMetrics(chain: string, poolAddress: string): Promise<RewardMetrics>;
  abstract getWalletEligiblePairs(chain: string, walletAddress: string): Promise<string[]>;
  abstract quoteEntry(chain: string, poolAddress: string, amountUsd: number): Promise<EntryQuote>;
  abstract quoteExit(chain: string, poolAddress: string, positionId: string): Promise<ExitQuote>;
  abstract openPosition(chain: string, poolAddress: string, params: PositionParams): Promise<string>;
  abstract addLiquidity(chain: string, positionId: string, amountUsd: number): Promise<void>;
  abstract removeLiquidity(chain: string, positionId: string, percentage: number): Promise<void>;
  abstract stakeIfRequired(chain: string, positionId: string): Promise<void>;
  abstract unstakeIfRequired(chain: string, positionId: string): Promise<void>;
  abstract harvestRewards(chain: string, positionId: string): Promise<HarvestResult>;
  abstract getPositionState(chain: string, positionId: string): Promise<PositionState>;
  abstract normalizeOpportunity(chain: string, poolAddress: string): Promise<NormalizedOpportunity>;

  // ==================== PROTECTED HELPERS ====================

  protected validateChain(chain: string): void {
    if (!this.supportedChains.includes(chain)) {
      throw new Error(`Chain ${chain} is not supported by ${this.protocolName}`);
    }
  }

  protected generateOpportunityId(chain: string, poolAddress: string): string {
    return `${this.protocolName.toLowerCase().replace(/\s+/g, '-')}-${chain}-${poolAddress.toLowerCase()}`;
  }

  protected estimateGasCost(chain: string, action: "entry" | "exit" | "harvest"): number {
    // Basic gas estimator fallback
    const baseGas = action === "entry" ? 15 : action === "exit" ? 12 : 8;
    return chain === "ethereum" ? baseGas * 3 : baseGas * 0.1;
  }
}