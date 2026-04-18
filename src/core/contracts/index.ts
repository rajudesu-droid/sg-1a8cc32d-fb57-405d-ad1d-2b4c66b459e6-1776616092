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
export type AssetSource = "auto-detected" | "manual";

export interface Asset {
  id: string;
  chainFamily: ChainFamily;
  network: string;
  assetKind: AssetKind;
  tokenStandard?: string;
  address?: string; // contract/mint/issuer
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  source: AssetSource;
  isNative: boolean;
  priceUsd?: number;
  valueUsd?: number;
  lastUpdated: Date;
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

// ==================== OPPORTUNITY ====================
export type RiskLevel = "low" | "medium" | "high";

export interface Opportunity {
  id: string;
  pair: string;
  token0: string;
  token1: string;
  dex: string;
  chain: string;
  feeTier: string;
  tvl: string;
  volume24h: string;
  feeApy: string;
  rewardApy: string;
  netApy: string;
  riskScore: number;
  riskLevel: RiskLevel;
  recommended: boolean;
  score: number; // Risk-adjusted score
  poolAddress?: string;
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
  | "positions_updated"
  | "rewards_updated"
  | "policy_updated"
  | "withdrawal_planned"
  | "audit_logged"
  | "simulation_updated"
  | "sync_required";

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