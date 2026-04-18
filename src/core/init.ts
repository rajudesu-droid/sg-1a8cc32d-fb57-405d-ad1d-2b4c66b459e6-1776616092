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
} from "./engines";

export async function initializeApp(): Promise<void> {
  console.log("=== LP Yield Autopilot Initialization ===");

  // Step 1: Register sync engine
  orchestrator.registerEngine("sync", syncEngine);
  console.log("[Init] Sync engine registered");

  // Step 2: Register code impact engine
  orchestrator.registerEngine("codeImpact", codeImpactEngine);
  console.log("[Init] Code impact engine registered");

  // Step 3: Verify all domain engines are registered
  const engines = orchestrator.getAllEngines();
  console.log("[Init] Registered engines:", engines);

  // Step 4: Verify health of all engines
  const healthStatus = await orchestrator.healthCheck();
  console.log("[Init] Health check:", healthStatus);

  // Step 5: Subscribe sync engine to orchestrator events
  orchestrator.subscribe((event) => {
    if (event.type === "sync_required") {
      syncEngine.syncAffectedModules(event.affectedModules);
    }
  });
  console.log("[Init] Sync engine subscribed to orchestrator events");

  // Step 6: Initial data load
  console.log("[Init] Loading initial data...");
  await syncEngine.syncAll();

  console.log("=== Initialization Complete ===");
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