/**
 * Engines Initialization & Export
 * Central registry for all domain engines
 */

export { WalletEngine, walletEngine } from "./WalletEngine";
export { PortfolioEngine, portfolioEngine } from "./PortfolioEngine";
export { OpportunityEngine, opportunityEngine } from "./OpportunityEngine";
export { PositionEngine, positionEngine } from "./PositionEngine";
export { RewardsEngine, rewardsEngine } from "./RewardsEngine";
export { WithdrawalEngine, withdrawalEngine } from "./WithdrawalEngine";
export { PolicyEngine, policyEngine } from "./PolicyEngine";
export { MultiProtocolOpportunityEngine, multiProtocolScanner } from "./MultiProtocolOpportunityEngine";
export { ValidationEngine, validationEngine } from "./ValidationEngine";
export { TriggerEngine, triggerEngine } from "./TriggerEngine";
export { AutomatedExecutionEngine, executionEngine } from "./AutomatedExecutionEngine";

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