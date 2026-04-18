/**
 * Engines Initialization & Export
 * Central registry for all domain engines
 */

export * from "./WalletEngine";
export * from "./PortfolioEngine";
export * from "./OpportunityEngine";
export * from "./PositionEngine";
export * from "./RewardsEngine";
export * from "./WithdrawalEngine";
export * from "./PolicyEngine";

// Initialize all engines by importing them
// This ensures they register themselves with the orchestrator
import "./WalletEngine";
import "./PortfolioEngine";
import "./OpportunityEngine";
import "./PositionEngine";
import "./RewardsEngine";
import "./WithdrawalEngine";
import "./PolicyEngine";

console.log("[Engines] All domain engines initialized and registered");