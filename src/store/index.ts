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
  portfolio: PortfolioMetrics | null;
  setPortfolio: (portfolio: PortfolioMetrics) => void;

  // ==================== OPPORTUNITIES ====================
  opportunities: Opportunity[];
  setOpportunities: (opportunities: Opportunity[]) => void;
  addOpportunity: (opportunity: Opportunity) => void;

  // ==================== POSITIONS ====================
  positions: Position[];
  setPositions: (positions: Position[]) => void;
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
    timestamp: Date;
  }>;
  addAlert: (alert: {
    id: string;
    type: "info" | "success" | "warning" | "error";
    title: string;
    message: string;
    timestamp: Date;
  }) => void;
  clearAlerts: () => void;
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
          set((state) => ({
            mode: {
              current: mode,
              canExecute: mode === "live",
              label: mode === "demo" ? "Demo Mode" : mode === "shadow" ? "Shadow Mode" : "Live Mode",
            },
          })),

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
        setPortfolio: (portfolio) => set({ portfolio }),

        // ==================== OPPORTUNITIES ====================
        opportunities: [],
        setOpportunities: (opportunities) => set({ opportunities }),
        addOpportunity: (opportunity) =>
          set((state) => ({
            opportunities: [...state.opportunities, opportunity],
          })),

        // ==================== POSITIONS ====================
        positions: [],
        setPositions: (positions) => set({ positions }),
        addPosition: (position) =>
          set((state) => ({
            positions: [...state.positions, position],
          })),
        updatePosition: (id, updates) =>
          set((state) => ({
            positions: state.positions.map((p) => (p.id === id ? { ...p, ...updates } : p)),
          })),
        removePosition: (id) =>
          set((state) => ({
            positions: state.positions.filter((p) => p.id !== id),
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
        addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),
        clearAlerts: () => set({ alerts: [] }),
      }),
      {
        name: "lp-yield-autopilot-storage",
        partialize: (state) => ({
          mode: state.mode,
          policy: state.policy,
          simulation: state.simulation,
        }),
      }
    )
  )
);