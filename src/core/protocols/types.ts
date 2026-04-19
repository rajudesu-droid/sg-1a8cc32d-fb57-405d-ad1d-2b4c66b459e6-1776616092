// ============================================================================
// PROTOCOL ADAPTER TYPE DEFINITIONS
// Shared interfaces for all DEX and DeFi protocol adapters
// ============================================================================

export type ProtocolType = 
  | "concentrated_liquidity_dex"
  | "standard_amm_dex"
  | "farm_staking"
  | "yield_farming"
  | "reward_program";

export type PoolType = 
  | "concentrated_liquidity" 
  | "stable_amm" 
  | "weighted_pool" 
  | "volatile_amm"
  | "farm"
  | "single_stake";

// ============================================================================
// NORMALIZED OPPORTUNITY MODEL
// All protocols must convert their data into this unified format
// ============================================================================

export interface NormalizedOpportunity {
  // Identity
  id: string;
  protocolName: string;
  protocolType: ProtocolType;
  chain: string;
  poolAddress: string;
  poolType: PoolType;
  
  // Token pair
  token0Symbol: string;
  token0Address: string;
  token1Symbol?: string; // Optional for single-stake
  token1Address?: string;
  feeTier?: string; // e.g., "0.3%" for concentrated liquidity
  
  // Metrics
  tvl: number; // Total Value Locked in USD
  volume24h: number; // 24h trading volume in USD
  baseYield: number; // Base APY from fees/swaps
  farmRewardYield: number; // Additional farm/reward APY
  totalYield: number; // Combined yield
  
  // Reward info
  rewardTokens: Array<{
    symbol: string;
    address: string;
    apr: number;
    liquidityUsd: number; // Liquidity of reward token itself
  }>;
  
  // Risk metrics
  liquidityDepth: number; // USD at ±2% from current price
  estimatedSlippage: number; // % for $10k swap
  gasCostEntry: number; // USD
  gasCostExit: number; // USD
  concentrationRisk: number; // 0-100 score
  volatilityRisk: number; // 0-100 score
  impermanentLossRisk: number; // 0-100 score
  contractRisk: number; // 0-100 score
  
  // Scoring
  riskScore: number; // 0-100 (higher = riskier)
  qualityScore: number; // 0-100 (higher = better)
  netScore: number; // Final combined score
  
  // Status
  whitelisted: boolean;
  enabled: boolean;
  strategyCompatible: boolean;
  
  // Metadata
  lastUpdated: Date;
}

// ============================================================================
// PROTOCOL ADAPTER INTERFACE
// All protocol adapters must implement this interface
// ============================================================================

export interface IProtocolAdapter {
  // Metadata
  protocolName: string;
  protocolType: ProtocolType;
  supportedChains: string[];
  
  // Discovery
  getSupportedPools(chain: string): Promise<string[]>;
  getEligibleFarms(chain: string, walletAddress?: string): Promise<string[]>;
  
  // Metrics
  getPoolMetrics(chain: string, poolAddress: string): Promise<PoolMetrics>;
  getRewardMetrics(chain: string, poolAddress: string): Promise<RewardMetrics>;
  
  // Wallet integration
  getWalletEligiblePairs(chain: string, walletAddress: string): Promise<string[]>;
  
  // Quotes
  quoteEntry(chain: string, poolAddress: string, amountUsd: number): Promise<EntryQuote>;
  quoteExit(chain: string, poolAddress: string, positionId: string): Promise<ExitQuote>;
  
  // Execution (Live mode only)
  openPosition(chain: string, poolAddress: string, params: PositionParams): Promise<string>;
  addLiquidity(chain: string, positionId: string, amountUsd: number): Promise<void>;
  removeLiquidity(chain: string, positionId: string, percentage: number): Promise<void>;
  
  // Staking (if applicable)
  stakeIfRequired(chain: string, positionId: string): Promise<void>;
  unstakeIfRequired(chain: string, positionId: string): Promise<void>;
  
  // Rewards
  harvestRewards(chain: string, positionId: string): Promise<HarvestResult>;
  
  // Position state
  getPositionState(chain: string, positionId: string): Promise<PositionState>;
  
  // Normalization
  normalizeOpportunity(chain: string, poolAddress: string): Promise<NormalizedOpportunity>;
}

// ============================================================================
// METRICS & SCORING
// ============================================================================

export interface PoolMetrics {
  tvl: number; // USD
  volume24h: number; // USD
  baseYield: number; // APR % (fees)
  liquidityDepth: number; // USD within +/- 2% price impact
  estimatedSlippage: number; // % for standard entry size
  impermanentLossRisk?: number; // 0-100 score
}

export interface RewardMetrics {
  farmRewardYield: number; // APR % (farm rewards)
  rewardTokens: Array<{
    symbol: string;
    address: string;
    apr: number;
    liquidityUsd: number;
    emissionRate?: number; // tokens per day
  }>;
}

export interface EntryQuote {
  expectedLpTokens: number;
  priceImpact: number; // %
  gasCostUsd: number;
  minOutputTokens: number;
  route: string[];
}

export interface ExitQuote {
  expectedToken0: number;
  expectedToken1: number;
  priceImpact: number;
  gasCostUsd: number;
  minOutputUsd: number;
}

export interface PositionParams {
  token0Amount: number;
  token1Amount?: number;
  minPrice?: number; // For concentrated liquidity
  maxPrice?: number; // For concentrated liquidity
  slippageTolerance: number; // %
  deadline: number; // Unix timestamp
}

export interface HarvestResult {
  rewardsHarvested: Array<{
    token: string;
    amount: number;
    valueUsd: number;
  }>;
  gasCostUsd: number;
  netValueUsd: number;
}

export interface PositionState {
  positionId: string;
  poolAddress: string;
  chain: string;
  protocol: string;
  
  // Holdings
  token0Symbol: string;
  token0Amount: number;
  token1Symbol?: string;
  token1Amount?: number;
  
  // Value
  currentValueUsd: number;
  initialValueUsd: number;
  
  // Earnings
  accruedFeesUsd: number;
  accruedRewardsUsd: number;
  
  // Range (for concentrated liquidity)
  inRange?: boolean;
  minPrice?: number;
  maxPrice?: number;
  currentPrice?: number;
  
  // Status
  isStaked: boolean;
  lastHarvest: Date;
  openedAt: Date;
}

// ============================================================================
// PROTOCOL REGISTRY
// Central registry of all supported protocols
// ============================================================================

export interface ProtocolConfig {
  name: string;
  type: ProtocolType;
  chains: string[];
  enabled: boolean;
  whitelisted: boolean;
  adapterClass: string; // Class name for dynamic loading
  riskLevel: "low" | "medium" | "high";
  auditStatus: "audited" | "unaudited" | "unknown";
  maxCapitalPerPool: number; // USD
  maxCapitalTotal: number; // USD across all pools
}

export interface ChainConfig {
  name: string;
  enabled: boolean;
  rpcUrl: string;
  explorerUrl: string;
  nativeToken: string;
  maxCapital: number; // USD
  gasPriceMultiplier: number; // 1.0 = normal, 1.5 = 50% buffer
}