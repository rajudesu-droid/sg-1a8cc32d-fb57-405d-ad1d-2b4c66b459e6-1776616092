/**
 * Application Initialization
 * Bootstraps all engines and establishes the centralized architecture
 */

import { orchestrator } from "./orchestrator";
import { syncEngine } from "./sync";
import { codeImpactEngine } from "./analysis/CodeImpact";

// Import all engines (they auto-register)
import {
  walletEngine,
  portfolioEngine,
  opportunityEngine,
  positionEngine,
  rewardsEngine,
  withdrawalEngine,
  policyEngine,
  multiProtocolScanner,
  validationEngine,
  triggerEngine,
  executionEngine,
} from "./engines";
import { protocolRegistry } from "./protocols/ProtocolRegistry";
import { performanceMonitor } from "./performance/PerformanceMonitor";
import { cacheManager } from "./performance/CacheManager";
import { pollingManager } from "./performance/PollingManager";
import { incrementalRefreshService } from "./performance/IncrementalRefreshService";

export async function initializeApp(): Promise<void> {
  console.log("=== LP Yield Autopilot Initialization ===");

  // Step 1: Initialize Protocol Registry
  console.log("[Init] Protocol registry initialized with adapters");

  // Step 2: Register sync engine
  orchestrator.registerEngine("sync", syncEngine);
  console.log("[Init] Sync engine registered");

  // Step 3: Register code impact engine
  orchestrator.registerEngine("codeImpact", codeImpactEngine);
  console.log("[Init] Code impact engine registered");

  // Step 4: Initialize performance monitoring
  performanceMonitor.reset();
  console.log("[Init] Performance monitoring initialized");

  // Step 5: Initialize cache manager
  cacheManager.clear();
  console.log("[Init] Cache manager initialized");

  // Step 6: Start polling manager
  const mode = "demo"; // Will be set from store later
  pollingManager.startPolling("active_positions", mode, async () => {
    await incrementalRefreshService.refreshActivePositions(mode);
  });
  pollingManager.startPolling("opportunities", mode, async () => {
    await multiProtocolScanner.scanOpportunities();
  });
  pollingManager.startPolling("wallet_balances", mode, async () => {
    await incrementalRefreshService.refreshWalletBalances(mode);
  });
  console.log("[Init] Polling manager started");

  // Step 7: Verify all domain engines are registered
  const engines = orchestrator.getAllEngines();
  console.log("[Init] Registered engines:", engines);

  // Step 8: Verify health of all engines
  const healthStatus = await orchestrator.healthCheck();
  console.log("[Init] Health check:", healthStatus);

  // Step 9: Subscribe sync engine to orchestrator events
  orchestrator.subscribe((event) => {
    if (event.type === "sync_required") {
      syncEngine.syncAffectedModules(event.affectedModules);
    }
  });
  console.log("[Init] Sync engine subscribed to orchestrator events");

  // Step 10: Initial data load
  console.log("[Init] Loading initial data...");
  await syncEngine.syncAll();

  console.log("=== Initialization Complete ===");
  console.log(`[Init] ${protocolRegistry.getEnabledAdapters().length} protocols enabled`);
  console.log(`[Init] ${protocolRegistry.getEnabledChains().length} chains supported`);
  console.log(`[Init] Execution engine: ${executionEngine ? 'READY' : 'NOT FOUND'}`);
  console.log(`[Init] Validation engine: ${validationEngine ? 'READY' : 'NOT FOUND'}`);
  console.log(`[Init] Trigger engine: ${triggerEngine ? 'READY' : 'NOT FOUND'}`);
  console.log(`[Init] Performance monitoring: ACTIVE`);
  console.log(`[Init] Cache manager: ACTIVE`);
  console.log(`[Init] Polling manager: ACTIVE`);
}

// Export engine instances for direct access when needed
export {
  orchestrator,
  syncEngine,
  codeImpactEngine,
  walletEngine,
  portfolioEngine,
  opportunityEngine,
  positionEngine,
  rewardsEngine,
  withdrawalEngine,
  policyEngine,
};