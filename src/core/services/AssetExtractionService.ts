/**
 * Asset Extraction Service
 * Extracts tradeable assets from the appropriate source based on mode
 * 
 * CRITICAL: Mode-aware asset sourcing
 * - Demo Mode: Use Paper Wallet / simulated portfolio assets
 * - Shadow Mode: Use real wallet assets (read-only)
 * - Live Mode: Use real connected wallet assets
 */

import { useAppStore } from "@/store";
import type { Asset } from "@/core/contracts";

export interface TradeableAsset {
  // Identity
  chainFamily: "evm" | "solana" | "tron" | "bitcoin" | "xrpl";
  network: string;
  assetKind: "native" | "token" | "lp" | "position";
  tokenStandard?: string;
  
  // Basic info
  symbol: string;
  name: string;
  decimals: number;
  
  // Address/identifier
  contractAddress?: string;
  mintAddress?: string;
  issuer?: string;
  currencyCode?: string;
  
  // Amounts
  quantity: number;
  valueUsd?: number;
  
  // Metadata
  source: "real_wallet" | "simulated" | "manual";
  addedAt?: Date;
}

class AssetExtractionService {
  /**
   * Get tradeable assets based on current mode
   */
  getTradeableAssets(): TradeableAsset[] {
    const mode = useAppStore.getState().mode.current;
    
    console.log(`[AssetExtraction] Getting tradeable assets for ${mode} mode`);
    
    switch (mode) {
      case "demo":
        return this.getDemoAssets();
      case "shadow":
        return this.getShadowAssets();
      case "live":
        return this.getLiveAssets();
      default:
        return [];
    }
  }

  /**
   * Demo Mode: Get assets from Paper Wallet / simulated portfolio
   */
  private getDemoAssets(): TradeableAsset[] {
    const paperWallets = useAppStore.getState().paperWallets;
    
    console.log(`[AssetExtraction] Demo Mode: Found ${paperWallets.length} Paper Wallets`);
    
    // Extract all tokens from all paper wallets
    const tokens = paperWallets.flatMap(wallet => wallet.tokens || []);
    
    console.log(`[AssetExtraction] Demo Mode: Found ${tokens.length} tokens in Paper Wallets`);
    
    // Convert paper wallet tokens to TradeableAsset format
    const tradeable = tokens.map(token => ({
      chainFamily: this.getChainFamily(token.network),
      network: token.network.toLowerCase(),
      assetKind: "token" as const,
      tokenStandard: this.getTokenStandard(token.network),
      symbol: token.symbol,
      name: token.name,
      decimals: 18, // Default for most tokens
      contractAddress: undefined, // Paper wallet tokens don't have addresses yet
      mintAddress: undefined,
      issuer: undefined,
      currencyCode: undefined,
      quantity: token.quantity,
      valueUsd: token.totalValue,
      source: "simulated" as const,
      addedAt: new Date(),
    }));
    
    console.log(`[AssetExtraction] Demo Mode: ${tradeable.length} tradeable assets (Paper Wallet tokens)`);
    
    return tradeable;
  }

  /**
   * Shadow Mode: Get assets from real wallet (read-only)
   */
  private getShadowAssets(): TradeableAsset[] {
    const wallet = useAppStore.getState().wallet;
    const assets = wallet?.assets || [];
    
    console.log(`[AssetExtraction] Shadow Mode: Found ${assets.length} real wallet assets`);
    
    // Filter to tradeable assets only
    const tradeable = assets
      .filter(asset => 
        asset.assetKind === "native" || 
        asset.assetKind === "token"
      )
      .map(asset => this.normalizeAsset(asset, "real_wallet"));
    
    console.log(`[AssetExtraction] Shadow Mode: ${tradeable.length} tradeable assets`);
    
    return tradeable;
  }

  /**
   * Live Mode: Get assets from connected wallet
   */
  private getLiveAssets(): TradeableAsset[] {
    const wallet = useAppStore.getState().wallet;
    const assets = wallet?.assets || [];
    
    console.log(`[AssetExtraction] Live Mode: Found ${assets.length} connected wallet assets`);
    
    // Filter to tradeable assets only
    const tradeable = assets
      .filter(asset => 
        asset.assetKind === "native" || 
        asset.assetKind === "token"
      )
      .map(asset => this.normalizeAsset(asset, "real_wallet"));
    
    console.log(`[AssetExtraction] Live Mode: ${tradeable.length} tradeable assets`);
    
    return tradeable;
  }

  /**
   * Normalize an asset to standard format
   */
  private normalizeAsset(
    asset: Asset, 
    source: "real_wallet" | "simulated" | "manual"
  ): TradeableAsset {
    return {
      chainFamily: asset.chainFamily,
      network: asset.network,
      assetKind: asset.assetKind,
      tokenStandard: asset.tokenStandard,
      symbol: asset.symbol,
      name: asset.name || asset.symbol,
      decimals: asset.decimals,
      contractAddress: asset.contractAddress,
      mintAddress: asset.mintAddress,
      issuer: asset.issuer,
      currencyCode: (asset as any).currency,
      quantity: (asset as any).balance || 0,
      valueUsd: asset.valueUsd,
      source: source,
      addedAt: new Date(),
    };
  }

  /**
   * Get summary of available assets by network
   */
  getAssetSummary(): {
    totalAssets: number;
    byNetwork: Record<string, number>;
    bySource: Record<string, number>;
  } {
    const assets = this.getTradeableAssets();
    
    const byNetwork: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    
    assets.forEach(asset => {
      byNetwork[asset.network] = (byNetwork[asset.network] || 0) + 1;
      bySource[asset.source] = (bySource[asset.source] || 0) + 1;
    });
    
    return {
      totalAssets: assets.length,
      byNetwork,
      bySource,
    };
  }

  /**
   * Get chain family from network name
   */
  private getChainFamily(network: string): "evm" | "solana" | "tron" | "bitcoin" | "xrpl" {
    const net = network.toLowerCase();
    if (net.includes("solana")) return "solana";
    if (net.includes("tron")) return "tron";
    if (net.includes("bitcoin") || net.includes("btc")) return "bitcoin";
    if (net.includes("xrp")) return "xrpl";
    return "evm"; // Default to EVM
  }

  /**
   * Get token standard from network
   */
  private getTokenStandard(network: string): string | undefined {
    const net = network.toLowerCase();
    if (net.includes("ethereum") || net.includes("polygon") || net.includes("bsc") || 
        net.includes("arbitrum") || net.includes("optimism") || net.includes("base") ||
        net.includes("avalanche")) {
      return "ERC20";
    }
    if (net.includes("solana")) return "SPL";
    if (net.includes("tron")) return "TRC20";
    return undefined;
  }
}

export const assetExtractionService = new AssetExtractionService();