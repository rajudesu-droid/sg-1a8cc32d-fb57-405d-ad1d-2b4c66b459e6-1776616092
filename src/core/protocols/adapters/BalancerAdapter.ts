import { BaseProtocolAdapter } from "../BaseProtocolAdapter";
import type {
  PoolMetrics,
  RewardMetrics,
  EntryQuote,
  ExitQuote,
  PositionParams,
  HarvestResult,
  PositionState,
  NormalizedOpportunity,
  ProtocolType
} from "../types";

export class BalancerAdapter extends BaseProtocolAdapter {
  public protocolName = "Balancer";
  public protocolType = "standard_amm_dex" as ProtocolType;
  public supportedChains = ["ethereum", "arbitrum", "polygon", "optimism"];

  constructor() {
    super();
    this.capabilities = {
      realPoolDiscovery: false,
      realPoolMetrics: false,
      realQuotes: false,
      realRewards: false,
      realPositionState: false,
      realExecution: false,
      testedOnTestnet: false,
      auditedContracts: false,
      readiness: "demo", // STRICTLY DEMO ONLY - Not safe for live execution
      blockingIssues: [
        "Adapter uses placeholder mock data",
        "No real contract reads implemented",
        "Execution paths not scaffolded",
        "Not safe for live environments"
      ]
    };
  }

  async getSupportedPools(chain: string): Promise<string[]> {
    this.validateChain(chain);
    return [];
  }

  async getEligibleFarms(chain: string, walletAddress?: string): Promise<string[]> {
    return [];
  }

  async getPoolMetrics(chain: string, poolAddress: string): Promise<PoolMetrics> {
    this.validateChain(chain);
    return { tvl: 0, volume24h: 0, baseYield: 0, liquidityDepth: 0, estimatedSlippage: 0 };
  }

  async getRewardMetrics(chain: string, poolAddress: string): Promise<RewardMetrics> {
    return { rewardTokens: [], farmRewardYield: 0 };
  }

  async getWalletEligiblePairs(chain: string, walletAddress: string): Promise<string[]> {
    return [];
  }

  async quoteEntry(chain: string, poolAddress: string, amountUsd: number): Promise<EntryQuote> {
    return { expectedLpTokens: 0, priceImpact: 0, gasCostUsd: 0, minOutputTokens: 0, route: [] };
  }

  async quoteExit(chain: string, poolAddress: string, positionId: string): Promise<ExitQuote> {
    return { expectedToken0: 0, expectedToken1: 0, priceImpact: 0, gasCostUsd: 0, minOutputUsd: 0 };
  }

  async openPosition(chain: string, poolAddress: string, params: PositionParams): Promise<string> {
    throw new Error(`[Balancer] Adapter not approved for execution in live mode`);
  }

  async addLiquidity(chain: string, positionId: string, amountUsd: number): Promise<void> {
    throw new Error(`[Balancer] Adapter not approved for execution in live mode`);
  }

  async removeLiquidity(chain: string, positionId: string, percentage: number): Promise<void> {
    throw new Error(`[Balancer] Adapter not approved for execution in live mode`);
  }

  async stakeIfRequired(chain: string, positionId: string): Promise<void> {
    throw new Error(`[Balancer] Adapter not approved for execution in live mode`);
  }

  async unstakeIfRequired(chain: string, positionId: string): Promise<void> {
    throw new Error(`[Balancer] Adapter not approved for execution in live mode`);
  }

  async harvestRewards(chain: string, positionId: string): Promise<HarvestResult> {
    throw new Error(`[Balancer] Adapter not approved for execution in live mode`);
  }

  async getPositionState(chain: string, positionId: string): Promise<PositionState> {
    this.validateChain(chain);
    return {
      positionId, poolAddress: "", chain, protocol: this.protocolName,
      token0Symbol: "TKN0", token0Amount: 0, currentValueUsd: 0, initialValueUsd: 0,
      accruedFeesUsd: 0, accruedRewardsUsd: 0, isStaked: false,
      lastHarvest: new Date(), openedAt: new Date()
    };
  }

  async normalizeOpportunity(chain: string, poolAddress: string): Promise<NormalizedOpportunity> {
    this.validateChain(chain);
    return {
      id: this.generateOpportunityId(chain, poolAddress),
      protocolName: this.protocolName, protocolType: this.protocolType,
      chain, poolAddress, poolType: "weighted_pool",
      token0Symbol: "TKN0", token0Address: "0x0",
      token1Symbol: "TKN1", token1Address: "0x0",
      tvl: 0, volume24h: 0, baseYield: 0, farmRewardYield: 0,
      totalYield: 0, rewardTokens: [], liquidityDepth: 0, estimatedSlippage: 0,
      gasCostEntry: 0, gasCostExit: 0, concentrationRisk: 0, volatilityRisk: 0,
      impermanentLossRisk: 0, contractRisk: 50, riskScore: 50, qualityScore: 50,
      netScore: 50, whitelisted: false, enabled: false, strategyCompatible: false,
      lastUpdated: new Date(),
    };
  }
}