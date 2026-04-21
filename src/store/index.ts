/**
 * Centralized Application Store
 * Single source of truth for all app state
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  AppMode,
  ModeState,
  WalletState,
  PortfolioMetrics,
  Opportunity,
  Position,
  RewardsState,
  PolicyRules,
  WithdrawalPlan,
  AuditLog,
  SimulationState,
} from "@/core/contracts";

interface AppState {
  // ==================== MODE ====================
  mode: ModeState;
  setMode: (mode: AppMode) => void;

  // ==================== WALLET ====================
  wallet: WalletState;
  setWallet: (wallet: Partial<WalletState>) => void;

  // ==================== PORTFOLIO ====================
  // Mode-specific portfolio states
  portfolio: PortfolioMetrics | null;  // Current active mode portfolio
  demoPortfolio: PortfolioMetrics | null;  // Demo mode only
  shadowPortfolio: PortfolioMetrics | null;  // Shadow mode only
  livePortfolio: PortfolioMetrics | null;  // Live mode only
  
  setPortfolio: (portfolio: PortfolioMetrics) => void;
  setDemoPortfolio: (portfolio: PortfolioMetrics | null) => void;
  setShadowPortfolio: (portfolio: PortfolioMetrics | null) => void;
  setLivePortfolio: (portfolio: PortfolioMetrics | null) => void;

  // ==================== OPPORTUNITIES ====================
  opportunities: Opportunity[];
  setOpportunities: (opportunities: Opportunity[]) => void;
  addOpportunity: (opportunity: Opportunity) => void;
  removeOpportunity: (id: string) => void;

  // ==================== POSITIONS ====================
  // Mode-specific positions
  positions: Position[];  // Current active mode positions
  demoPositions: Position[];  // Demo mode only
  shadowPositions: Position[];  // Shadow mode only (read-only)
  livePositions: Position[];  // Live mode only
  
  setPositions: (positions: Position[]) => void;
  setDemoPositions: (positions: Position[]) => void;
  setShadowPositions: (positions: Position[]) => void;
  setLivePositions: (positions: Position[]) => void;
  addPosition: (position: Position) => void;
  updatePosition: (id: string, updates: Partial<Position>) => void;
  removePosition: (id: string) => void;

  // ==================== REWARDS ====================
  rewards: RewardsState;
  setRewards: (rewards: RewardsState) => void;

  // ==================== POLICY ====================
  policy: PolicyRules;
  setPolicy: (policy: Partial<PolicyRules>) => void;

  // ==================== WITHDRAWAL ====================
  withdrawalPlan: WithdrawalPlan | null;
  setWithdrawalPlan: (plan: WithdrawalPlan | null) => void;

  // ==================== AUDIT LOG ====================
  auditLogs: AuditLog[];
  addAuditLog: (log: AuditLog) => void;

  // ==================== EXECUTION JOBS ====================
  executionJobs: any[];
  addExecutionJob: (job: any) => void;
  updateExecutionJob: (id: string, updates: any) => void;

  // ==================== SIMULATION ====================
  simulation: SimulationState;
  setSimulation: (simulation: Partial<SimulationState>) => void;

  // ==================== SYNC STATUS ====================
  lastSyncTime: Date | null;
  setLastSyncTime: (time: Date) => void;
  isSyncing: boolean;
  setIsSyncing: (syncing: boolean) => void;

  // ==================== STORE STATE ====================
  alerts: Array<{
    id: string;
    type: "info" | "success" | "warning" | "error";
    title: string;
    message: string;
    timestamp: Date | string; // Support both Date and string for serialization
  }>;
  addAlert: (alert: {
    id: string;
    type: "info" | "success" | "warning" | "error";
    title: string;
    message: string;
    timestamp: Date | string;
  }) => void;
  clearAlerts: () => void;

  // ==================== BOT STATUS ====================
  botRunning: boolean;
  setBotRunning: (running: boolean) => void;

  // ==================== PAPER WALLET ====================
  paperWallets: Array<{
    id: string;
    name: string;
    address: string;
    chains: string[];
    tokens: Array<{
      symbol: string;
      name: string;
      network: string;
      quantity: number;
      priceUsd: number;
      totalValue: number;
    }>;
    totalValue: number;
    createdAt: Date | string;
  }>;
  addPaperWallet: (wallet: {
    id: string;
    name: string;
    address: string;
    chains: string[];
    tokens: Array<{
      symbol: string;
      name: string;
      network: string;
      quantity: number;
      priceUsd: number;
      totalValue: number;
    }>;
    totalValue: number;
    createdAt: Date | string;
  }) => void;
  updatePaperWallet: (id: string, tokens: Array<{
    symbol: string;
    name: string;
    network: string;
    quantity: number;
    priceUsd: number;
    totalValue: number;
  }>) => void;
  deletePaperWallet: (id: string) => void;
  refreshPaperWalletPrices: (priceMap: Map<string, number>) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // ==================== MODE ====================
        mode: {
          current: "demo",
          canExecute: false,
          label: "Demo Mode",
        },
        setMode: (mode) =>
          set((state) => {
            // When mode changes, load mode-specific data
            let portfolio = null;
            let positions: Position[] = [];
            
            if (mode === "demo") {
              portfolio = state.demoPortfolio;
              positions = state.demoPositions;
            } else if (mode === "shadow") {
              portfolio = state.shadowPortfolio;
              positions = state.shadowPositions;
            } else if (mode === "live") {
              portfolio = state.livePortfolio;
              positions = state.livePositions;
            }
            
            return {
              mode: {
                current: mode,
                canExecute: mode === "live",
                label: mode === "demo" ? "Demo Mode" : mode === "shadow" ? "Shadow Mode" : "Live Mode",
              },
              portfolio,
              positions,
            };
          }),

        // ==================== WALLET ====================
        wallet: {
          wallet: null,
          assets: [],
          totalValueUsd: 0,
          isLoading: false,
          error: null,
        },
        setWallet: (wallet) =>
          set((state) => ({
            wallet: { ...state.wallet, ...wallet },
          })),

        // ==================== PORTFOLIO ====================
        portfolio: null,
        demoPortfolio: null,
        shadowPortfolio: null,
        livePortfolio: null,
        
        setPortfolio: (portfolio) => set({ portfolio }),
        setDemoPortfolio: (portfolio) => set({ demoPortfolio: portfolio }),
        setShadowPortfolio: (portfolio) => set({ shadowPortfolio: portfolio }),
        setLivePortfolio: (portfolio) => set({ livePortfolio: portfolio }),

        // ==================== OPPORTUNITIES ====================
        opportunities: [],
        setOpportunities: (opportunities) => set({ opportunities }),
        addOpportunity: (opportunity) => set((state) => ({ 
          opportunities: [...state.opportunities, opportunity] 
        })),
        removeOpportunity: (id) => set((state) => ({
          opportunities: state.opportunities.filter((o) => o.id !== id),
        })),

        // ==================== POSITIONS ====================
        positions: [],
        demoPositions: [],
        shadowPositions: [],
        livePositions: [],
        
        setPositions: (positions) => set({ positions }),
        setDemoPositions: (positions) => set({ demoPositions: positions }),
        setShadowPositions: (positions) => set({ shadowPositions: positions }),
        setLivePositions: (positions) => set({ livePositions: positions }),
        
        addPosition: (position) => set((state) => ({
          positions: [...state.positions, position],
        })),
        
        updatePosition: (id, updates) => set((state) => ({
          positions: state.positions.map(p => p.id === id ? { ...p, ...updates } : p),
        })),
        
        removePosition: (id) => set((state) => ({
          positions: state.positions.filter(p => p.id !== id),
        })),

        // ==================== REWARDS ====================
        rewards: {
          total: 0,
          claimable: 0,
          byPosition: {},
        },
        setRewards: (rewards) => set({ rewards }),

        // ==================== POLICY ====================
        policy: {
          autoHarvest: false,
          harvestFrequency: "daily",
          autoCompound: false,
          autoRebalance: false,
          rebalanceFrequency: "weekly",
          autoDeployIdle: false,
          autoReinvest: false,
          minHarvestAmount: 50,
          minRebalanceEdge: 5,
          dailyGasBudget: 100,
          minPoolScore: 65,
          maxPerPool: 10000,
          maxPerChain: 50000,
          maxTotalDeployed: 100000,
          emergencyPause: false,
          pausedChains: [],
          pausedDexes: [],
        },
        setPolicy: (policy) =>
          set((state) => ({
            policy: { ...state.policy, ...policy },
          })),

        // ==================== WITHDRAWAL ====================
        withdrawalPlan: null,
        setWithdrawalPlan: (plan) => set({ withdrawalPlan: plan }),

        // ==================== AUDIT LOG ====================
        auditLogs: [],
        addAuditLog: (log) =>
          set((state) => ({
            auditLogs: [...state.auditLogs, log],
          })),

        // ==================== EXECUTION JOBS ====================
        executionJobs: [],
        addExecutionJob: (job) =>
          set((state) => ({
            executionJobs: [job, ...state.executionJobs],
          })),
        updateExecutionJob: (id, updates) =>
          set((state) => ({
            executionJobs: state.executionJobs.map((j) =>
              j.id === id ? { ...j, ...updates } : j
            ),
          })),

        // ==================== SIMULATION ====================
        simulation: {
          manualAssets: [],
          simulatedPositions: [],
          simulatedActions: [],
          totalSimulatedValue: 0,
          totalSimulatedEarnings: 0,
        },
        setSimulation: (simulation) =>
          set((state) => ({
            simulation: { ...state.simulation, ...simulation },
          })),

        // ==================== SYNC STATUS ====================
        lastSyncTime: null,
        setLastSyncTime: (time) => set({ lastSyncTime: time }),
        isSyncing: false,
        setIsSyncing: (syncing) => set({ isSyncing: syncing }),

        // ==================== STORE STATE ====================
        alerts: [],
        addAlert: (alert) => set((state) => ({ 
          alerts: [{
            ...alert,
            timestamp: alert.timestamp instanceof Date ? alert.timestamp.toISOString() : alert.timestamp
          }, ...state.alerts] 
        })),
        clearAlerts: () => set({ alerts: [] }),

        // ==================== BOT STATUS ====================
        botRunning: false,
        setBotRunning: (running) => set({ botRunning: running }),

        // ==================== PAPER WALLET ====================
        paperWallets: [],
        addPaperWallet: (wallet) => set((state) => ({ 
          paperWallets: [...state.paperWallets, {
            ...wallet,
            createdAt: wallet.createdAt instanceof Date ? wallet.createdAt.toISOString() : wallet.createdAt
          }] 
        })),
        updatePaperWallet: (id, tokens) => set((state) => ({
          paperWallets: state.paperWallets.map((wallet) =>
            wallet.id === id
              ? {
                  ...wallet,
                  tokens,
                  totalValue: tokens.reduce((sum, t) => sum + t.totalValue, 0),
                }
              : wallet
          ),
        })),
        deletePaperWallet: (id) => set((state) => ({
          paperWallets: state.paperWallets.filter((w) => w.id !== id),
        })),
        refreshPaperWalletPrices: (priceMap) => set((state) => {
          const updatedWallets = state.paperWallets.map((wallet) => {
            const updatedTokens = wallet.tokens.map((token) => {
              const newPrice = priceMap.get(token.symbol);
              if (newPrice !== undefined && newPrice > 0) {
                return {
                  ...token,
                  priceUsd: newPrice,
                  totalValue: token.quantity * newPrice,
                };
              }
              return token;
            });
            
            const newTotalValue = updatedTokens.reduce((sum, t) => sum + t.totalValue, 0);
            
            return {
              ...wallet,
              tokens: updatedTokens,
              totalValue: newTotalValue,
            };
          });
          
          return { paperWallets: updatedWallets };
        }),
      }),
      {
        name: "lp-yield-autopilot-storage",
        partialize: (state) => ({
          mode: state.mode,
          wallet: state.wallet,
          portfolio: state.portfolio,
          policy: state.policy,
          simulation: state.simulation,
          botRunning: state.botRunning,
          paperWallets: state.paperWallets, // Persist paper wallets
          // Don't persist alerts - they should be fresh on each session
        }),
      }
    )
  )
);