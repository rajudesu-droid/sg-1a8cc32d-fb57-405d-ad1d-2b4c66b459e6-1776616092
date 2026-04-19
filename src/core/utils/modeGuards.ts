/**
 * Mode Guard Utilities
 * Enforce hard separation between Demo, Shadow, and Live modes
 */

import { useAppStore } from "@/store";

/**
 * Check if data source is valid for current mode
 */
export function isValidDataSourceForMode(
  source: "detected" | "manual" | "simulated",
  mode: "demo" | "shadow" | "live"
): boolean {
  switch (mode) {
    case "demo":
      // Demo: All sources allowed (simulated, manual, detected)
      return true;
      
    case "shadow":
      // Shadow: Only detected real data
      return source === "detected";
      
    case "live":
      // Live: Only detected real data
      return source === "detected";
      
    default:
      return false;
  }
}

/**
 * Filter assets by mode
 */
export function filterAssetsByMode(
  assets: Array<{ source: "detected" | "manual" | "simulated"; [key: string]: any }>,
  mode: "demo" | "shadow" | "live"
): typeof assets {
  return assets.filter((asset) => isValidDataSourceForMode(asset.source, mode));
}

/**
 * Check if transaction hash is real (not simulated)
 */
export function isRealTransactionHash(txHash: string | undefined): boolean {
  if (!txHash) return false;
  
  // Real tx hashes:
  // - Start with 0x
  // - Are 66 characters long (0x + 64 hex chars)
  // - Do NOT contain "SIM"
  
  return (
    txHash.startsWith("0x") &&
    txHash.length === 66 &&
    !txHash.includes("SIM") &&
    /^0x[0-9a-fA-F]{64}$/.test(txHash)
  );
}

/**
 * Validate execution result for mode
 */
export function isValidExecutionForMode(
  result: { status: string; transactions?: Array<{ txHash: string }> },
  mode: "demo" | "shadow" | "live"
): { valid: boolean; reason?: string } {
  if (mode === "demo") {
    // Demo: Simulated execution is valid
    return { valid: true };
  }
  
  if (mode === "shadow") {
    // Shadow: Preview only, no execution
    return result.status === "completed" && (!result.transactions || result.transactions.length === 0)
      ? { valid: true }
      : { valid: false, reason: "Shadow mode should not execute transactions" };
  }
  
  if (mode === "live") {
    // Live: Must have real transaction hashes
    if (result.status === "completed") {
      if (!result.transactions || result.transactions.length === 0) {
        return { valid: false, reason: "Live mode completion requires real transaction hashes" };
      }
      
      for (const tx of result.transactions) {
        if (!isRealTransactionHash(tx.txHash)) {
          return { valid: false, reason: `Invalid transaction hash: ${tx.txHash}` };
        }
      }
    }
    
    return { valid: true };
  }
  
  return { valid: false, reason: "Unknown mode" };
}

/**
 * Get data source label for UI
 */
export function getDataSourceLabel(source: "detected" | "manual" | "simulated"): string {
  switch (source) {
    case "detected":
      return "Real";
    case "manual":
      return "Manual";
    case "simulated":
      return "Simulated";
  }
}

/**
 * Check if current mode allows execution
 */
export function canExecuteInMode(mode: "demo" | "shadow" | "live"): boolean {
  return mode === "demo" || mode === "live";
}

/**
 * Get portfolio data for current mode
 */
export function getPortfolioForMode(mode: "demo" | "shadow" | "live") {
  const store = useAppStore.getState();
  
  switch (mode) {
    case "demo":
      return store.demoPortfolio || store.portfolio;
    case "shadow":
      return store.shadowPortfolio || store.portfolio;
    case "live":
      return store.livePortfolio || store.portfolio;
    default:
      return null;
  }
}

/**
 * Get positions for current mode
 */
export function getPositionsForMode(mode: "demo" | "shadow" | "live") {
  const store = useAppStore.getState();
  
  switch (mode) {
    case "demo":
      return store.demoPositions;
    case "shadow":
      return store.shadowPositions;
    case "live":
      return store.livePositions;
    default:
      return [];
  }
}

/**
 * Assert live mode has no simulated data
 */
export function assertNoSimulatedDataInLiveMode(): { valid: boolean; errors: string[] } {
  const store = useAppStore.getState();
  const errors: string[] = [];
  
  if (store.mode.current !== "live") {
    return { valid: true, errors: [] };
  }
  
  // Check wallet assets
  const simulatedAssets = store.wallet.assets.filter(
    (a: any) => a.source === "simulated" || a.source === "manual"
  );
  if (simulatedAssets.length > 0) {
    errors.push(`Found ${simulatedAssets.length} simulated/manual assets in Live mode`);
  }
  
  // Check if using demo portfolio in live mode
  if (store.portfolio === store.demoPortfolio) {
    errors.push("Live mode is using demo portfolio data");
  }
  
  // Check if using demo positions in live mode
  if (store.positions === store.demoPositions) {
    errors.push("Live mode is using demo positions");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}