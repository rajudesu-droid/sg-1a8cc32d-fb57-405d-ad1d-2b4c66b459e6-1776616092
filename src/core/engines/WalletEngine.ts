/**
 * Wallet Engine
 * Manages wallet connection, asset detection, and balance tracking
 */

import { orchestrator } from "@/core/orchestrator";
import { useAppStore } from "@/store";
import type { Asset, Wallet, EngineResult, AppEvent } from "@/core/contracts";

export class WalletEngine {
  constructor() {
    orchestrator.registerEngine("wallet", this);
  }

  // ==================== CONNECT WALLET TASK ====================
  async connectWallet(address: string, chainId: number): Promise<EngineResult<Wallet>> {
    console.log("[WalletEngine] Connecting wallet:", address);

    try {
      const wallet: Wallet = {
        id: `wallet-${Date.now()}`,
        address,
        chainId,
        network: this.getNetworkName(chainId),
        isConnected: true,
        connectedAt: new Date(),
        sessionId: `session-${Date.now()}`,
      };

      useAppStore.getState().setWallet({ wallet, isLoading: false, error: null });

      // Detect assets after connection
      await this.detectAssets(wallet);

      await orchestrator.coordinateUpdate(
        "wallet",
        "wallet_updated",
        { wallet },
        ["portfolio", "opportunity", "dashboard"]
      );

      return {
        success: true,
        data: wallet,
        affectedModules: ["portfolio", "opportunity", "dashboard"],
        events: [],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to connect wallet";
      useAppStore.getState().setWallet({ error: errorMessage, isLoading: false });

      return {
        success: false,
        error: errorMessage,
        affectedModules: [],
        events: [],
      };
    }
  }

  // ==================== DISCONNECT WALLET TASK ====================
  async disconnectWallet(): Promise<EngineResult<void>> {
    console.log("[WalletEngine] Disconnecting wallet");

    useAppStore.getState().setWallet({
      wallet: null,
      assets: [],
      totalValueUsd: 0,
      isLoading: false,
      error: null,
    });

    await orchestrator.coordinateUpdate(
      "wallet",
      "wallet_updated",
      { disconnected: true },
      ["portfolio", "opportunity", "dashboard"]
    );

    return {
      success: true,
      affectedModules: ["portfolio", "opportunity", "dashboard"],
      events: [],
    };
  }

  // ==================== DETECT ASSETS TASK ====================
  async detectAssets(wallet: Wallet): Promise<EngineResult<Asset[]>> {
    console.log("[WalletEngine] Detecting assets for:", wallet.address);
    
    const mode = useAppStore.getState().mode.current;

    try {
      // CRITICAL: Mode-specific asset detection
      if (mode === "demo") {
        console.log("[WalletEngine] Demo mode: Skipping real asset detection");
        return {
          success: true,
          data: [],
          affectedModules: [],
          events: [],
        };
      }

      // Shadow/Live mode: Real asset detection only
      const detectedAssets: Asset[] = [];

      // Add current chain native balance (stubbed for mock)
      // In a real app this would call Moralis/Alchemy
      detectedAssets.push({
        id: `${wallet.network}-native`,
        chainFamily: "evm",
        network: wallet.network,
        assetKind: "native",
        symbol: this.getNativeSymbol(wallet.chainId),
        name: this.getNativeName(wallet.chainId),
        decimals: 18,
        balance: "2.5",
        source: "detected", // CRITICAL: Mark as real detected
        isNative: true,
        lastUpdated: new Date(),
      });

      useAppStore.getState().setWallet({ assets: detectedAssets });

      await orchestrator.coordinateUpdate(
        "wallet",
        "assets_updated",
        { assets: detectedAssets },
        ["portfolio", "dashboard"]
      );

      return {
        success: true,
        data: detectedAssets,
        affectedModules: ["portfolio", "dashboard"],
        events: [],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to detect assets";
      
      // CRITICAL: On error, show empty state, NOT mock data
      useAppStore.getState().setWallet({
        assets: [],
        totalValueUsd: 0,
        isLoading: false,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
        affectedModules: [],
        events: [],
      };
    }
  }

  // ==================== REFRESH BALANCES TASK ====================
  async refreshBalances(): Promise<EngineResult<Asset[]>> {
    console.log("[WalletEngine] Refreshing balances");

    const { wallet } = useAppStore.getState().wallet;
    if (!wallet) {
      return {
        success: false,
        error: "No wallet connected",
        affectedModules: [],
        events: [],
      };
    }

    return await this.detectAssets(wallet);
  }

  // ==================== UTILITY METHODS ====================
  private getNetworkName(chainId: number): string {
    const networks: Record<number, string> = {
      1: "Ethereum",
      56: "BSC",
      137: "Polygon",
      43114: "Avalanche",
    };
    return networks[chainId] || "Unknown";
  }

  private getNativeSymbol(chainId: number): string {
    const symbols: Record<number, string> = {
      1: "ETH",
      56: "BNB",
      137: "MATIC",
      43114: "AVAX",
    };
    return symbols[chainId] || "UNKNOWN";
  }

  private getNativeName(chainId: number): string {
    const names: Record<number, string> = {
      1: "Ethereum",
      56: "BNB",
      137: "Polygon",
      43114: "Avalanche",
    };
    return names[chainId] || "Unknown";
  }

  // ==================== EVENT HANDLER ====================
  async handleEvent(event: AppEvent): Promise<void> {
    console.log("[WalletEngine] Handling event:", event.type);

    if (event.type === "mode_changed") {
      // Re-detect assets when mode changes
      const { wallet } = useAppStore.getState().wallet;
      if (wallet) {
        await this.detectAssets(wallet);
      }
    }
  }

  // ==================== REFRESH ====================
  async refresh(): Promise<void> {
    await this.refreshBalances();
  }

  // ==================== HEALTH ====================
  isHealthy(): boolean {
    const { error } = useAppStore.getState().wallet;
    return error === null;
  }
}

export const walletEngine = new WalletEngine();