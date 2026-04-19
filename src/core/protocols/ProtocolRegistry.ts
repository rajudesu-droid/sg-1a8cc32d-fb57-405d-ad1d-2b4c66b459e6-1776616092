// ============================================================================
// PROTOCOL REGISTRY
// Centralized management for all supported DeFi protocols and DEXs
// ============================================================================

import type { IProtocolAdapter, ProtocolConfig, ChainConfig } from "./types";
import { UniswapV3Adapter } from "./adapters/UniswapV3Adapter";
import { PancakeSwapV3Adapter } from "./adapters/PancakeSwapV3Adapter";
import { SushiSwapAdapter } from "./adapters/SushiSwapAdapter";
import { CurveAdapter } from "./adapters/CurveAdapter";
import { BalancerAdapter } from "./adapters/BalancerAdapter";
import type { BaseProtocolAdapter } from "./BaseProtocolAdapter";
import type { ProtocolType } from "./types";

interface ProtocolRegistryEntry {
  name: string;
  type: ProtocolType;
  chains: string[];
  enabled: boolean;
  whitelisted: boolean;
  adapterClass: string;
}

export class ProtocolRegistry {
  private adapters: Map<string, BaseProtocolAdapter> = new Map();
  private configs: Map<string, ProtocolConfig> = new Map();
  private chains: Map<string, ChainConfig> = new Map();
  private registry: ProtocolRegistryEntry[] = [
    {
      name: "Uniswap V3",
      type: "concentrated_liquidity_dex",
      chains: ["ethereum", "arbitrum", "optimism", "polygon", "base"],
      enabled: true,
      whitelisted: true,
      adapterClass: "UniswapV3Adapter",
    },
    {
      name: "PancakeSwap V3",
      type: "concentrated_liquidity_dex",
      chains: ["bsc", "ethereum", "arbitrum"],
      enabled: true,
      whitelisted: true,
      adapterClass: "PancakeSwapV3Adapter",
    },
    {
      name: "SushiSwap",
      type: "standard_amm_dex",
      chains: ["ethereum", "arbitrum", "polygon", "optimism", "base", "avalanche"],
      enabled: true,
      whitelisted: true,
      adapterClass: "SushiSwapAdapter",
    },
    {
      name: "Curve",
      type: "standard_amm_dex",
      chains: ["ethereum", "arbitrum", "polygon", "optimism"],
      enabled: true,
      whitelisted: true,
      adapterClass: "CurveAdapter",
    },
    {
      name: "Balancer",
      type: "standard_amm_dex",
      chains: ["ethereum", "arbitrum", "polygon", "optimism", "base"],
      enabled: true,
      whitelisted: true,
      adapterClass: "BalancerAdapter",
    },
    {
      name: "Camelot",
      type: "standard_amm_dex",
      chains: ["arbitrum"],
      enabled: false,
      whitelisted: true,
      adapterClass: "CamelotAdapter",
    },
    {
      name: "Aerodrome",
      type: "standard_amm_dex",
      chains: ["base"],
      enabled: false,
      whitelisted: true,
      adapterClass: "AerodromeAdapter",
    },
    {
      name: "Velodrome",
      type: "standard_amm_dex",
      chains: ["optimism"],
      enabled: false,
      whitelisted: true,
      adapterClass: "VelodromeAdapter",
    },
    {
      name: "Trader Joe",
      type: "concentrated_liquidity_dex",
      chains: ["avalanche", "arbitrum", "bsc"],
      enabled: false,
      whitelisted: true,
      adapterClass: "TraderJoeAdapter",
    },
    {
      name: "QuickSwap",
      type: "concentrated_liquidity_dex",
      chains: ["polygon"],
      enabled: false,
      whitelisted: true,
      adapterClass: "QuickSwapAdapter",
    },
  ];

  constructor() {
    this.initializeDefaultChains();
    this.initializeDefaultProtocols();
    this.initializeAdapters();
  }

  private initializeAdapters() {
    // Initialize enabled adapters
    this.adapters.set("UniswapV3Adapter", new UniswapV3Adapter());
    this.adapters.set("PancakeSwapV3Adapter", new PancakeSwapV3Adapter());
    this.adapters.set("SushiSwapAdapter", new SushiSwapAdapter());
    this.adapters.set("CurveAdapter", new CurveAdapter());
    this.adapters.set("BalancerAdapter", new BalancerAdapter());
    
    console.log(`[ProtocolRegistry] Initialized ${this.adapters.size} protocol adapters`);
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
        type: "standard_amm_dex",
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

  registerAdapter(adapter: BaseProtocolAdapter) {
    this.adapters.set(adapter.protocolName, adapter);
  }

  getAdapter(protocolName: string): BaseProtocolAdapter | undefined {
    return this.adapters.get(protocolName);
  }

  getEnabledAdapters(): BaseProtocolAdapter[] {
    const enabledProtocols = this.getEnabledProtocols();
    return enabledProtocols
      .map(config => this.adapters.get(config.name))
      .filter((adapter): adapter is BaseProtocolAdapter => adapter !== undefined);
  }

  getAllProtocols(): ProtocolRegistryEntry[] {
    return this.registry;
  }

  getAllChains(): ChainConfig[] {
    if (this.chains.size === 0) {
      this.initializeDefaultChains();
    }
    return Array.from(this.chains.values());
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