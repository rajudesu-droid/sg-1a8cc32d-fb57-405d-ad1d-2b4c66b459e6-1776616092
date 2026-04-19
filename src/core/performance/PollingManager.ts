// ============================================================================
// POLLING MANAGER
// Manages different refresh cadences based on mode, priority, and importance
// ============================================================================

import { useAppStore } from "@/store";

interface PollingConfig {
  category: string;
  mode: "demo" | "shadow" | "live";
  priority: "urgent" | "high" | "normal" | "low" | "background";
  intervalMs: number;
}

export class PollingManager {
  private intervals = new Map<string, NodeJS.Timeout>();
  
  /**
   * Polling intervals by category and mode (milliseconds)
   */
  private pollingConfigs: PollingConfig[] = [
    // DEMO MODE - Fast for simulation feedback
    { category: "active_positions", mode: "demo", priority: "urgent", intervalMs: 2000 },
    { category: "wallet_balances", mode: "demo", priority: "high", intervalMs: 3000 },
    { category: "opportunities", mode: "demo", priority: "normal", intervalMs: 10000 },
    { category: "portfolio_summary", mode: "demo", priority: "high", intervalMs: 3000 },
    { category: "execution_jobs", mode: "demo", priority: "urgent", intervalMs: 1000 },
    
    // SHADOW MODE - Moderate for read-only monitoring
    { category: "active_positions", mode: "shadow", priority: "high", intervalMs: 5000 },
    { category: "wallet_balances", mode: "shadow", priority: "high", intervalMs: 5000 },
    { category: "opportunities", mode: "shadow", priority: "normal", intervalMs: 15000 },
    { category: "portfolio_summary", mode: "shadow", priority: "normal", intervalMs: 5000 },
    { category: "execution_jobs", mode: "shadow", priority: "normal", intervalMs: 3000 },
    
    // LIVE MODE - Optimized for real execution
    { category: "active_positions", mode: "live", priority: "urgent", intervalMs: 3000 },
    { category: "wallet_balances", mode: "live", priority: "urgent", intervalMs: 3000 },
    { category: "opportunities", mode: "live", priority: "high", intervalMs: 10000 },
    { category: "portfolio_summary", mode: "live", priority: "high", intervalMs: 3000 },
    { category: "execution_jobs", mode: "live", priority: "urgent", intervalMs: 1000 },
    
    // Background/Archive data (mode-agnostic)
    { category: "audit_logs", mode: "demo", priority: "background", intervalMs: 30000 },
    { category: "audit_logs", mode: "shadow", priority: "background", intervalMs: 30000 },
    { category: "audit_logs", mode: "live", priority: "background", intervalMs: 30000 },
  ];

  /**
   * Get polling interval for a category in current mode
   */
  getInterval(category: string, mode?: "demo" | "shadow" | "live"): number {
    const currentMode = mode || useAppStore.getState().mode.current;
    
    const config = this.pollingConfigs.find(
      (c) => c.category === category && c.mode === currentMode
    );
    
    return config?.intervalMs || 10000; // Default 10s
  }

  /**
   * Start polling for a category
   */
  startPolling(
    category: string,
    callback: () => void | Promise<void>,
    mode?: "demo" | "shadow" | "live"
  ): void {
    const interval = this.getInterval(category, mode);
    const key = `${category}-${mode || useAppStore.getState().mode.current}`;
    
    // Clear existing if any
    this.stopPolling(category);
    
    // Start new interval
    const timer = setInterval(async () => {
      try {
        await callback();
      } catch (error) {
        console.error(`[PollingManager] Error in ${category} polling:`, error);
      }
    }, interval);
    
    this.intervals.set(key, timer);
    console.log(`[PollingManager] Started polling ${category} every ${interval}ms`);
  }

  /**
   * Stop polling for a category
   */
  stopPolling(category: string): void {
    for (const [key, timer] of this.intervals.entries()) {
      if (key.startsWith(category)) {
        clearInterval(timer);
        this.intervals.delete(key);
        console.log(`[PollingManager] Stopped polling ${category}`);
      }
    }
  }

  /**
   * Stop all polling
   */
  stopAll(): void {
    for (const timer of this.intervals.values()) {
      clearInterval(timer);
    }
    this.intervals.clear();
    console.log("[PollingManager] Stopped all polling");
  }

  /**
   * Update polling when mode changes
   */
  onModeChange(newMode: "demo" | "shadow" | "live"): void {
    console.log(`[PollingManager] Mode changed to ${newMode}, updating intervals`);
    
    // Restart all active pollings with new intervals
    const activeCategories = new Set<string>();
    for (const key of this.intervals.keys()) {
      const category = key.split("-")[0];
      activeCategories.add(category);
    }
    
    // Will need to restart with new callbacks - handled by components
    console.log(`[PollingManager] ${activeCategories.size} categories need restart`);
  }
}

export const pollingManager = new PollingManager();