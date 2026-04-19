/**
 * Asset Identity Utilities
 * Strict multi-chain asset identification system
 * 
 * CRITICAL: Never rely on symbol alone for asset matching
 * Same-symbol assets on different chains are DIFFERENT assets
 */

import type { Asset, ChainFamily } from "../contracts";

/**
 * Asset Identity - Unique identifier for any asset across all chains
 */
export interface AssetIdentity {
  // Chain context
  chainFamily: ChainFamily;
  network: string;
  
  // Asset type
  assetKind: "native" | "token" | "lp" | "position";
  
  // Token identification (where applicable)
  tokenStandard?: string;  // ERC20, BEP20, TRC20, SPL, etc.
  contractAddress?: string;  // EVM/TRON tokens
  mintAddress?: string;  // Solana tokens
  issuer?: string;  // XRPL issued assets
  currency?: string;  // XRPL issued assets
  
  // Display metadata (NOT used for matching)
  symbol: string;
  name?: string;
  decimals: number;
}

/**
 * Create unique asset ID string
 * Format depends on chain family and asset kind
 */
export function createAssetId(identity: AssetIdentity): string {
  const { chainFamily, network, assetKind } = identity;
  
  // Native assets
  if (assetKind === "native") {
    return `${chainFamily}:${network}:native`;
  }
  
  // EVM tokens (Ethereum, BSC, Polygon, Avalanche, etc.)
  if (chainFamily === "evm" && identity.contractAddress) {
    return `${chainFamily}:${network}:${identity.contractAddress.toLowerCase()}`;
  }
  
  // Solana SPL tokens
  if (chainFamily === "solana" && identity.mintAddress) {
    return `${chainFamily}:${network}:${identity.mintAddress}`;
  }
  
  // TRON TRC20 tokens
  if (chainFamily === "tron" && identity.contractAddress) {
    return `${chainFamily}:${network}:${identity.contractAddress}`;
  }
  
  // XRPL issued assets
  if (chainFamily === "xrpl" && identity.issuer && identity.currency) {
    return `${chainFamily}:${network}:${identity.issuer}:${identity.currency}`;
  }
  
  // Fallback (should not reach here in production)
  console.warn("[AssetIdentity] Incomplete identity, falling back to symbol", identity);
  return `${chainFamily}:${network}:${identity.symbol}`;
}

/**
 * Parse asset ID back to identity components
 */
export function parseAssetId(assetId: string): Partial<AssetIdentity> {
  const parts = assetId.split(":");
  
  if (parts.length < 3) {
    throw new Error(`Invalid asset ID format: ${assetId}`);
  }
  
  const [chainFamily, network, identifier] = parts;
  
  const identity: Partial<AssetIdentity> = {
    chainFamily: chainFamily as ChainFamily,
    network,
  };
  
  // Native asset
  if (identifier === "native") {
    identity.assetKind = "native";
    return identity;
  }
  
  // EVM token (contract address)
  if (chainFamily === "evm") {
    identity.assetKind = "token";
    identity.contractAddress = identifier;
    return identity;
  }
  
  // Solana token (mint address)
  if (chainFamily === "solana") {
    identity.assetKind = "token";
    identity.mintAddress = identifier;
    return identity;
  }
  
  // TRON token (contract address)
  if (chainFamily === "tron") {
    identity.assetKind = "token";
    identity.contractAddress = identifier;
    return identity;
  }
  
  // XRPL issued asset (issuer:currency)
  if (chainFamily === "xrpl" && parts.length === 4) {
    identity.assetKind = "token";
    identity.issuer = parts[2];
    identity.currency = parts[3];
    return identity;
  }
  
  return identity;
}

/**
 * Compare two asset identities for exact match
 * Returns true only if they represent the same asset on the same chain
 */
export function assetsMatch(a: AssetIdentity | Asset, b: AssetIdentity | Asset): boolean {
  // Create IDs and compare
  const idA = createAssetId(a);
  const idB = createAssetId(b);
  
  return idA === idB;
}

/**
 * Find asset in array by identity
 * NEVER use symbol-only matching
 */
export function findAssetByIdentity(
  assets: (Asset | AssetIdentity)[],
  identity: AssetIdentity
): (Asset | AssetIdentity) | undefined {
  const targetId = createAssetId(identity);
  
  return assets.find(asset => {
    const assetId = createAssetId(asset);
    return assetId === targetId;
  });
}

/**
 * Filter assets by identity criteria
 */
export function filterAssetsByIdentity(
  assets: (Asset | AssetIdentity)[],
  criteria: Partial<AssetIdentity>
): (Asset | AssetIdentity)[] {
  return assets.filter(asset => {
    // Chain family match
    if (criteria.chainFamily && asset.chainFamily !== criteria.chainFamily) {
      return false;
    }
    
    // Network match
    if (criteria.network && asset.network !== criteria.network) {
      return false;
    }
    
    // Asset kind match
    if (criteria.assetKind && asset.assetKind !== criteria.assetKind) {
      return false;
    }
    
    // Contract address match (case-insensitive for EVM)
    if (criteria.contractAddress) {
      const criteriaAddr = criteria.contractAddress.toLowerCase();
      const assetAddr = asset.contractAddress?.toLowerCase();
      if (criteriaAddr !== assetAddr) {
        return false;
      }
    }
    
    // Mint address match (Solana)
    if (criteria.mintAddress && asset.mintAddress !== criteria.mintAddress) {
      return false;
    }
    
    // XRPL issuer match
    if (criteria.issuer && asset.issuer !== criteria.issuer) {
      return false;
    }
    
    // XRPL currency match
    if (criteria.currency && asset.currency !== criteria.currency) {
      return false;
    }
    
    return true;
  });
}

/**
 * Group assets by symbol (for display only)
 * Returns map of symbol -> array of assets
 */
export function groupAssetsBySymbol(
  assets: (Asset | AssetIdentity)[]
): Map<string, (Asset | AssetIdentity)[]> {
  const groups = new Map<string, (Asset | AssetIdentity)[]>();
  
  for (const asset of assets) {
    const symbol = asset.symbol;
    const existing = groups.get(symbol) || [];
    existing.push(asset);
    groups.set(symbol, existing);
  }
  
  return groups;
}

/**
 * Get human-readable asset identifier
 * For UI display: "USDT (Ethereum)", "USDT (BSC)", etc.
 */
export function getAssetDisplayName(identity: AssetIdentity | Asset): string {
  const networkName = getNetworkDisplayName(identity.network);
  
  if (identity.assetKind === "native") {
    return `${identity.symbol} (Native ${networkName})`;
  }
  
  return `${identity.symbol} (${networkName})`;
}

/**
 * Get network display name
 */
function getNetworkDisplayName(network: string): string {
  const displayNames: Record<string, string> = {
    "ethereum": "Ethereum",
    "eth": "Ethereum",
    "bsc": "BSC",
    "binance": "BSC",
    "polygon": "Polygon",
    "matic": "Polygon",
    "avalanche": "Avalanche",
    "avax": "Avalanche",
    "arbitrum": "Arbitrum",
    "optimism": "Optimism",
    "solana": "Solana",
    "sol": "Solana",
    "tron": "TRON",
    "xrpl": "XRPL",
    "ripple": "XRPL",
    "bitcoin": "Bitcoin",
    "btc": "Bitcoin",
  };
  
  return displayNames[network.toLowerCase()] || network;
}

/**
 * Validate asset identity is complete
 */
export function validateAssetIdentity(identity: Partial<AssetIdentity>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Required fields
  if (!identity.chainFamily) {
    errors.push("Missing chainFamily");
  }
  
  if (!identity.network) {
    errors.push("Missing network");
  }
  
  if (!identity.assetKind) {
    errors.push("Missing assetKind");
  }
  
  if (!identity.symbol) {
    errors.push("Missing symbol");
  }
  
  if (identity.decimals === undefined || identity.decimals === null) {
    errors.push("Missing decimals");
  }
  
  // Chain-specific requirements
  if (identity.chainFamily === "evm" && identity.assetKind === "token") {
    if (!identity.contractAddress) {
      errors.push("EVM tokens require contractAddress");
    }
  }
  
  if (identity.chainFamily === "solana" && identity.assetKind === "token") {
    if (!identity.mintAddress) {
      errors.push("Solana tokens require mintAddress");
    }
  }
  
  if (identity.chainFamily === "tron" && identity.assetKind === "token") {
    if (!identity.contractAddress) {
      errors.push("TRON tokens require contractAddress");
    }
  }
  
  if (identity.chainFamily === "xrpl" && identity.assetKind === "token") {
    if (!identity.issuer || !identity.currency) {
      errors.push("XRPL tokens require issuer and currency");
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extract identity from asset
 */
export function extractIdentity(asset: Asset): AssetIdentity {
  return {
    chainFamily: asset.chainFamily,
    network: asset.network,
    assetKind: asset.assetKind,
    tokenStandard: asset.tokenStandard,
    contractAddress: asset.contractAddress,
    mintAddress: asset.mintAddress,
    issuer: asset.issuer,
    currency: asset.currency,
    symbol: asset.symbol,
    name: asset.name,
    decimals: asset.decimals,
  };
}

/**
 * CRITICAL: Never use this in production validation or execution
 * For search/filter UI only
 */
export function findAssetsBySymbol(
  assets: (Asset | AssetIdentity)[],
  symbol: string
): (Asset | AssetIdentity)[] {
  console.warn(
    "[AssetIdentity] Symbol-only search used - this should only be for UI display, never for validation or execution"
  );
  
  return assets.filter(asset => 
    asset.symbol.toLowerCase() === symbol.toLowerCase()
  );
}