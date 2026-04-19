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
} from "./engines";
import { protocolRegistry } from "./protocols/ProtocolRegistry";

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

  // Step 4: Verify all domain engines are registered
  const engines = orchestrator.getAllEngines();
  console.log("[Init] Registered engines:", engines);

  // Step 5: Verify health of all engines
  const healthStatus = await orchestrator.healthCheck();
  console.log("[Init] Health check:", healthStatus);

  // Step 6: Subscribe sync engine to orchestrator events
  orchestrator.subscribe((event) => {
    if (event.type === "sync_required") {
      syncEngine.syncAffectedModules(event.affectedModules);
    }
  });
  console.log("[Init] Sync engine subscribed to orchestrator events");

  // Step 7: Initial data load
  console.log("[Init] Loading initial data...");
  await syncEngine.syncAll();

  console.log("=== Initialization Complete ===");
  console.log(`[Init] ${protocolRegistry.getEnabledAdapters().length} protocols enabled`);
  console.log(`[Init] ${protocolRegistry.getEnabledChains().length} chains supported`);
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