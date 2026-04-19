// ============================================================================
// PROTOCOL REGISTRY
// Centralized management for all supported DeFi protocols and DEXs
// ============================================================================

import type { IProtocolAdapter, ProtocolConfig, ChainConfig } from "./types";
import { UniswapV3Adapter } from "./adapters/UniswapV3Adapter";
import { PancakeSwapV3Adapter } from "./adapters/PancakeSwapV3Adapter";

export class ProtocolRegistry {
  private adapters: Map<string, IProtocolAdapter> = new Map();
  private configs: Map<string, ProtocolConfig> = new Map();
  private chains: Map<string, ChainConfig> = new Map();

  constructor() {
    this.initializeDefaultChains();
    this.initializeDefaultProtocols();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initializeDefaultChains() {
    const defaultChains: ChainConfig[] = [
      { name: "ethereum", enabled: true, rpcUrl: "", explorerUrl: "https://etherscan.io", nativeToken: "ETH", maxCapital: 100000, gasPriceMultiplier: 1.2 },
      { name: "bsc", enabled: true, rpcUrl: "", explorerUrl: "https://bscscan.com", nativeToken: "BNB", maxCapital: 50000, gasPriceMultiplier: 1.1 },
      { name: "polygon", enabled: true, rpcUrl: "", explorerUrl: "https://polygonscan.com", nativeToken: "POL", maxCapital: 50000, gasPriceMultiplier: 1.1 },
      { name: "arbitrum", enabled: true, rpcUrl: "", explorerUrl: "https://arbiscan.io", nativeToken: "ETH", maxCapital: 50000, gasPriceMultiplier: 1.1 },
      { name: "optimism", enabled: true, rpcUrl: "", explorerUrl: "https://optimistic.etherscan.io", nativeToken: "ETH", maxCapital: 50000, gasPriceMultiplier: 1.1 },
      { name: "base", enabled: true, rpcUrl: "", explorerUrl: "https://basescan.org", nativeToken: "ETH", maxCapital: 50000, gasPriceMultiplier: 1.1 },
      { name: "avalanche", enabled: true, rpcUrl: "", explorerUrl: "https://snowtrace.io", nativeToken: "AVAX", maxCapital: 50000, gasPriceMultiplier: 1.1 },
    ];

    defaultChains.forEach(chain => this.chains.set(chain.name, chain));
  }

  private initializeDefaultProtocols() {
    // 1. Register Adapters
    this.registerAdapter(new UniswapV3Adapter());
    this.registerAdapter(new PancakeSwapV3Adapter());

    // 2. Register Configs (Whitelist/Controls)
    const defaultConfigs: ProtocolConfig[] = [
      {
        name: "Uniswap V3",
        type: "concentrated_liquidity_dex",
        chains: ["ethereum", "polygon", "arbitrum", "optimism", "base", "bsc"],
        enabled: true,
        whitelisted: true,
        adapterClass: "UniswapV3Adapter",
        riskLevel: "low",
        auditStatus: "audited",
        maxCapitalPerPool: 25000,
        maxCapitalTotal: 100000,
      },
      {
        name: "PancakeSwap V3",
        type: "concentrated_liquidity_dex",
        chains: ["bsc", "ethereum", "arbitrum", "base", "polygon"],
        enabled: true,
        whitelisted: true,
        adapterClass: "PancakeSwapV3Adapter",
        riskLevel: "medium",
        auditStatus: "audited",
        maxCapitalPerPool: 15000,
        maxCapitalTotal: 50000,
      },
      // Stubs for future adapters (UI will show them, but won't execute unless adapter exists)
      {
        name: "SushiSwap",
        type: "standard_amm_dex",
        chains: ["ethereum", "polygon", "arbitrum", "avalanche"],
        enabled: false, // Disabled by default until adapter is built
        whitelisted: true,
        adapterClass: "SushiSwapAdapter",
        riskLevel: "medium",
        auditStatus: "audited",
        maxCapitalPerPool: 10000,
        maxCapitalTotal: 30000,
      },
      {
        name: "Curve",
        type: "stable_amm",
        chains: ["ethereum", "arbitrum", "polygon", "optimism"],
        enabled: false,
        whitelisted: true,
        adapterClass: "CurveAdapter",
        riskLevel: "low",
        auditStatus: "audited",
        maxCapitalPerPool: 50000,
        maxCapitalTotal: 200000,
      },
      {
        name: "Aerodrome",
        type: "yield_farming",
        chains: ["base"],
        enabled: false,
        whitelisted: true,
        adapterClass: "AerodromeAdapter",
        riskLevel: "medium",
        auditStatus: "audited",
        maxCapitalPerPool: 10000,
        maxCapitalTotal: 40000,
      }
    ];

    defaultConfigs.forEach(config => this.configs.set(config.name, config));
  }

  // ============================================================================
  // REGISTRATION & MANAGEMENT
  // ============================================================================

  registerAdapter(adapter: IProtocolAdapter) {
    this.adapters.set(adapter.protocolName, adapter);
  }

  getAdapter(protocolName: string): IProtocolAdapter | undefined {
    return this.adapters.get(protocolName);
  }

  getEnabledAdapters(): IProtocolAdapter[] {
    const enabledProtocols = this.getEnabledProtocols();
    return enabledProtocols
      .map(config => this.adapters.get(config.name))
      .filter((adapter): adapter is IProtocolAdapter => adapter !== undefined);
  }

  // ============================================================================
  // CONFIGURATION GETTERS
  // ============================================================================

  getAllProtocolConfigs(): ProtocolConfig[] {
    return Array.from(this.configs.values());
  }

  getEnabledProtocols(): ProtocolConfig[] {
    return this.getAllProtocolConfigs().filter(c => c.enabled && c.whitelisted);
  }

  getAllChainConfigs(): ChainConfig[] {
    return Array.from(this.chains.values());
  }

  getEnabledChains(): ChainConfig[] {
    return this.getAllChainConfigs().filter(c => c.enabled);
  }

  isChainEnabled(chain: string): boolean {
    return this.chains.get(chain)?.enabled === true;
  }

  isProtocolEnabled(protocolName: string): boolean {
    const config = this.configs.get(protocolName);
    return config?.enabled === true && config?.whitelisted === true;
  }

  // ============================================================================
  // SETTINGS MANAGEMENT (For Admin UI)
  // ============================================================================

  updateProtocolConfig(protocolName: string, updates: Partial<ProtocolConfig>) {
    const current = this.configs.get(protocolName);
    if (current) {
      this.configs.set(protocolName, { ...current, ...updates });
    }
  }

  updateChainConfig(chainName: string, updates: Partial<ChainConfig>) {
    const current = this.chains.get(chainName);
    if (current) {
      this.chains.set(chainName, { ...current, ...updates });
    }
  }
}

// Export singleton
export const protocolRegistry = new ProtocolRegistry();