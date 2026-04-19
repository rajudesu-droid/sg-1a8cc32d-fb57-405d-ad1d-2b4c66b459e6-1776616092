/**
 * Shared Type Contracts
 * Single source of truth for all data models across the application
 */

// ==================== MODE ====================
export type AppMode = "demo" | "shadow" | "live";

export interface ModeState {
  current: AppMode;
  canExecute: boolean;
  label: string;
}

// ==================== WALLET ====================
export type ChainFamily = "evm" | "solana" | "tron" | "bitcoin" | "xrpl";
export type AssetKind = "native" | "token" | "lp" | "position";
export type AssetSource = "detected" | "manual" | "simulated";

export interface Asset {
  id: string;  // Unique asset ID from createAssetId()
  
  // Chain context
  chainFamily: ChainFamily;
  network: string;
  
  // Asset type
  assetKind: AssetKind;
  tokenStandard?: string;  // ERC20, BEP20, TRC20, SPL, etc.
  
  // Token identification (chain-specific)
  contractAddress?: string;  // EVM/TRON tokens
  mintAddress?: string;      // Solana tokens
  issuer?: string;           // XRPL issued assets
  currency?: string;         // XRPL issued assets
  
  // Display metadata
  symbol: string;
  name?: string;
  decimals: number;
  logoUrl?: string;
  
  // Balance and value
  balance: string;
  balanceRaw?: string;
  priceUsd?: number;
  valueUsd?: number;
  
  // Source tracking
  source: AssetSource;
  
  // Additional metadata
  isNative?: boolean;
  verified?: boolean;
  lastUpdated?: Date;
}

export interface Wallet {
  id: string;
  address: string;
  chainId: number;
  network: string;
  isConnected: boolean;
  connectedAt?: Date;
  sessionId?: string;
}

export interface WalletState {
  wallet: Wallet | null;
  assets: Asset[];
  totalValueUsd: number;
  isLoading: boolean;
  error: string | null;
}

// ==================== PORTFOLIO ====================
export interface PortfolioMetrics {
  totalValue: number;
  deployedCapital: number;
  idleCapital: number;
  netApy: number;
  dailyEarnings: EarningsBreakdown;
  monthlyEarnings: EarningsBreakdown;
  realizedEarnings: number;
  projected30Day: number;
  assetsByNetwork: Record<string, NetworkBalance>;
}

export interface EarningsBreakdown {
  total: number;
  realized: number;
  projected: number;
  label: string; // Mode-aware label
}

export interface NetworkBalance {
  network: string;
  assets: Asset[];
  totalValue: number;
  percentage: number;
}

// ==================== OPPORTUNITIES ====================
export interface Opportunity {
  // Identity
  id: string;
  protocolName: string;
  protocolType: "concentrated_liquidity_dex" | "standard_amm_dex" | "farm_staking" | "yield_farming" | "reward_program";
  chain: string;
  poolAddress: string;
  poolType: "concentrated_liquidity" | "stable_amm" | "weighted_pool" | "volatile_amm" | "farm" | "single_stake";
  
  // Token pair
  token0Symbol: string;
  token0Address: string;
  token1Symbol?: string;
  token1Address?: string;
  feeTier?: string;
  
  // Metrics
  tvl: number;
  volume24h: number;
  baseYield: number;
  farmRewardYield: number;
  totalYield: number;
  
  // Reward info
  rewardTokens: Array<{
    symbol: string;
    address: string;
    apr: number;
    liquidityUsd: number;
  }>;
  
  // Risk metrics
  liquidityDepth: number;
  estimatedSlippage: number;
  gasCostEntry: number;
  gasCostExit: number;
  concentrationRisk: number;
  volatilityRisk: number;
  impermanentLossRisk: number;
  contractRisk: number;
  
  // Scoring
  riskScore: number;
  qualityScore: number;
  netScore: number;
  
  // Status
  whitelisted: boolean;
  enabled: boolean;
  strategyCompatible: boolean;
  
  // Metadata
  lastUpdated: Date | string;
}

// ==================== POSITION ====================
export type PositionStatus = "active" | "out-of-range" | "closed";

export interface Position {
  id: string;
  opportunityId: string;
  pair: string;
  dex: string;
  chain: string;
  status: PositionStatus;
  entryPrice: number;
  currentPrice: number;
  rangeMin: number;
  rangeMax: number;
  liquidity: number;
  valueUsd: number;
  accruedFees: number;
  accruedRewards: number;
  estimatedIL: number;
  health: number; // 0-100
  openedAt: Date;
  lastUpdated: Date;
}

// ==================== REWARDS ====================
export interface Reward {
  id: string;
  positionId: string;
  type: "fee" | "farm" | "incentive";
  token: string;
  amount: number;
  valueUsd: number;
  claimable: boolean;
  lastUpdated: Date;
}

export interface RewardsState {
  total: number;
  claimable: number;
  byPosition: Record<string, Reward[]>;
}

// ==================== POLICY ====================
export interface PolicyRules {
  autoHarvest: boolean;
  harvestFrequency: "hourly" | "daily" | "weekly";
  autoCompound: boolean;
  autoRebalance: boolean;
  rebalanceFrequency: "daily" | "weekly" | "monthly";
  autoDeployIdle: boolean;
  minHarvestAmount: number;
  minRebalanceEdge: number;
  dailyGasBudget: number;
  minPoolScore: number;
  maxPerPool: number;
  maxPerChain: number;
  maxTotalDeployed: number;
  emergencyPause: boolean;
  pausedChains: string[];
  pausedDexes: string[];
}

// ==================== WITHDRAWAL ====================
export interface WithdrawalPlan {
  id: string;
  requestedAmount: number;
  positions: PositionWithdrawal[];
  totalGas: number;
  totalSlippage: number;
  estimatedReceived: number;
  steps: WithdrawalStep[];
  createdAt: Date;
  targetAsset?: Asset;
}

export interface PositionWithdrawal {
  positionId: string;
  pair: string;
  closePercentage: number;
  expectedAmount: number;
  reason: string;
}

export interface WithdrawalStep {
  order: number;
  action: string;
  position: string;
  amount: number;
  gas: number;
  slippage: number;
}

// ==================== AUDIT ====================
export type AuditActionType = 
  | "wallet_connect" 
  | "wallet_disconnect"
  | "position_open"
  | "position_close"
  | "harvest"
  | "compound"
  | "rebalance"
  | "policy_update"
  | "withdrawal"
  | "simulation";

export interface AuditLog {
  id: string;
  timestamp: Date;
  mode: AppMode;
  actionType: AuditActionType;
  actor: string; // wallet address or "system"
  details: Record<string, any>;
  success: boolean;
  error?: string;
}

// ==================== SIMULATION ====================
export interface SimulationState {
  manualAssets: Asset[];
  simulatedPositions: Position[];
  simulatedActions: AuditLog[];
  totalSimulatedValue: number;
  totalSimulatedEarnings: number;
}

// ==================== EVENTS ====================
export type EventType =
  | "mode_changed"
  | "wallet_updated"
  | "assets_updated"
  | "portfolio_updated"
  | "opportunities_updated"
  | "opportunities_scanned"
  | "positions_updated"
  | "position_opened"
  | "position_closed"
  | "rewards_updated"
  | "policy_updated"
  | "withdrawal_planned"
  | "audit_logged"
  | "simulation_updated"
  | "sync_required"
  | "settings_changed"
  | "action_triggered"
  | "validation_completed";

export interface AppEvent {
  type: EventType;
  timestamp: Date;
  source: string;
  data: any;
  affectedModules: string[];
}

// ==================== ENGINE RESPONSES ====================
export interface EngineResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  affectedModules: string[];
  events: AppEvent[];
}

export interface TaskResult<T> extends EngineResult<T> {
  taskName: string;
  duration: number;
}