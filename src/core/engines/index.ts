/**
 * Engines Initialization & Export
 * Central registry for all domain engines
 */

export { WalletEngine } from "./WalletEngine";
export { PortfolioEngine } from "./PortfolioEngine";
export { OpportunityEngine } from "./OpportunityEngine";
export { PositionEngine } from "./PositionEngine";
export { RewardsEngine } from "./RewardsEngine";
export { WithdrawalEngine } from "./WithdrawalEngine";
export { PolicyEngine } from "./PolicyEngine";
export { MultiProtocolOpportunityEngine, multiProtocolScanner } from "./MultiProtocolOpportunityEngine";

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