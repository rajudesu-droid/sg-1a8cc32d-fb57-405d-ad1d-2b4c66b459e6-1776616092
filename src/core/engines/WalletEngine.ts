/**
 * Wallet Engine
 * Manages wallet connections, asset detection, and balance tracking
 * 
 * CRITICAL: All assets tracked by unique identity, never symbol alone
 */

import { orchestrator } from "../orchestrator";
import { useAppStore } from "@/store";
import type { Wallet, Asset, EngineResult } from "../contracts";
import { createAssetId, extractIdentity } from "../utils/assetIdentity";

/**
 * Wallet Engine
 * Manages wallet connections, asset detection, and balance tracking
 * 
 * CRITICAL: All assets tracked by unique identity, never symbol alone
 */
export class WalletEngine {
  private engineId = "wallet";

  constructor() {
    orchestrator.registerEngine(this.engineId, this);
    console.log("[WalletEngine] Initialized and registered");
  }

  // ==================== CONNECT WALLET TASK ====================
  async connectWallet(wallet: Wallet): Promise<EngineResult<Wallet>> {
    console.log("[WalletEngine] Connecting wallet:", wallet.address);

    useAppStore.getState().setWallet({
      wallet,
      isLoading: false,
      error: null,
    });

    await orchestrator.coordinateUpdate(
      this.engineId,
      "wallet_updated",
      { wallet },
      ["portfolio", "dashboard"]
    );

    return {
      success: true,
      data: wallet,
      affectedModules: ["portfolio", "dashboard"],
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

      // Add current chain native balance (stubbed for now)
      // In production, this would call Moralis/Alchemy/Covalent
      const nativeAsset: Asset = {
        // CRITICAL: Use createAssetId for unique ID
        id: createAssetId({
          chainFamily: "evm",
          network: wallet.network,
          assetKind: "native",
          symbol: this.getNativeSymbol(wallet.chainId),
          name: this.getNativeName(wallet.chainId),
          decimals: 18,
        }),
        chainFamily: "evm",
        network: wallet.network,
        assetKind: "native",
        symbol: this.getNativeSymbol(wallet.chainId),
        name: this.getNativeName(wallet.chainId),
        decimals: 18,
        balance: "2.5",
        source: "detected",
        isNative: true,
        lastUpdated: new Date(),
      };

      detectedAssets.push(nativeAsset);

      // STUB: Real token detection would happen here
      // Example: Detect ERC20 tokens
      /*
      const tokens = await fetchERC20Tokens(wallet.address, wallet.network);
      for (const token of tokens) {
        detectedAssets.push({
          id: createAssetId({
            chainFamily: "evm",
            network: wallet.network,
            assetKind: "token",
            tokenStandard: "ERC20",
            contractAddress: token.address,
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
          }),
          chainFamily: "evm",
          network: wallet.network,
          assetKind: "token",
          tokenStandard: "ERC20",
          contractAddress: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          balance: token.balance,
          source: "detected",
        });
      }
      */

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
    const wallet = useAppStore.getState().wallet.wallet;
    
    if (!wallet) {
      return {
        success: false,
        error: "No wallet connected",
        affectedModules: [],
        events: [],
      };
    }

    return this.detectAssets(wallet);
  }

  // ==================== DISCONNECT WALLET ====================
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
      this.engineId,
      "wallet_updated",
      { wallet: null },
      ["portfolio", "dashboard"]
    );

    return {
      success: true,
      affectedModules: ["portfolio", "dashboard"],
      events: [],
    };
  }

  // ==================== HELPERS ====================
  private getNativeSymbol(chainId: number): string {
    const symbols: Record<number, string> = {
      1: "ETH",
      56: "BNB",
      137: "MATIC",
      43114: "AVAX",
      42161: "ETH",
      10: "ETH",
    };
    return symbols[chainId] || "ETH";
  }

  private getNativeName(chainId: number): string {
    const names: Record<number, string> = {
      1: "Ethereum",
      56: "BNB",
      137: "Polygon",
      43114: "Avalanche",
      42161: "Arbitrum ETH",
      10: "Optimism ETH",
    };
    return names[chainId] || "Ethereum";
  }
}

export const walletEngine = new WalletEngine();