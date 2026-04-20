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
import type { AdapterReadiness } from "./types";

interface ProtocolRegistryEntry {
  name: string;
  type: ProtocolType;
  chains: string[];
  enabled: boolean;
  whitelisted: boolean;
  adapterClass: string;
}

/**
 * Protocol Registry
 * Central registry of all supported protocol adapters
 * 
 * CRITICAL: Enforces adapter readiness levels
 */
class ProtocolRegistry {
  private adapters: Map<string, IProtocolAdapter> = new Map();

  constructor() {
    this.registerAdapters();
    console.log("[ProtocolRegistry] Initialized with adapters:", 
      Array.from(this.adapters.keys())
    );
  }

  /**
   * Register all protocol adapters
   */
  private registerAdapters(): void {
    const adapters: IProtocolAdapter[] = [
      new UniswapV3Adapter(),
      new PancakeSwapV3Adapter(),
      new SushiSwapAdapter(),
      new CurveAdapter(),
      new BalancerAdapter(),
    ];

    for (const adapter of adapters) {
      this.adapters.set(adapter.protocolName.toLowerCase(), adapter);
      console.log(
        `[ProtocolRegistry] Registered ${adapter.protocolName} - Readiness: ${adapter.getReadiness()}`
      );
    }
  }

  /**
   * Get adapter by protocol name
   */
  getAdapter(protocolName: string): IProtocolAdapter | undefined {
    return this.adapters.get(protocolName.toLowerCase());
  }

  /**
   * Get all registered adapters
   */
  getAllAdapters(): IProtocolAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get adapters available for given mode
   * 
   * CRITICAL: Filters by readiness level
   */
  getAvailableAdapters(mode: "demo" | "shadow" | "live"): IProtocolAdapter[] {
    return this.getAllAdapters().filter(adapter => 
      adapter.canUseInMode(mode)
    );
  }

  /**
   * Get adapters by readiness level
   */
  getAdaptersByReadiness(readiness: AdapterReadiness): IProtocolAdapter[] {
    return this.getAllAdapters().filter(adapter => 
      adapter.getReadiness() === readiness
    );
  }

  /**
   * Check if protocol is available in mode
   */
  isProtocolAvailable(protocolName: string, mode: "demo" | "shadow" | "live"): boolean {
    const adapter = this.getAdapter(protocolName);
    return adapter ? adapter.canUseInMode(mode) : false;
  }

  /**
   * Get protocol readiness status
   */
  getProtocolReadiness(protocolName: string): {
    readiness: AdapterReadiness;
    blockingIssues: string[];
    canUseInDemo: boolean;
    canUseInShadow: boolean;
    canUseInLive: boolean;
  } | null {
    const adapter = this.getAdapter(protocolName);
    
    if (!adapter) return null;
    
    return {
      readiness: adapter.getReadiness(),
      blockingIssues: adapter.getBlockingIssues(),
      canUseInDemo: adapter.canUseInMode("demo"),
      canUseInShadow: adapter.canUseInMode("shadow"),
      canUseInLive: adapter.canUseInMode("live"),
    };
  }
}

export const protocolRegistry = new ProtocolRegistry();