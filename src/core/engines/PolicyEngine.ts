/**
 * Policy Engine
 * Manages automation rules, thresholds, and guardrails
 */

import { orchestrator } from "@/core/orchestrator";
import { useAppStore } from "@/store";
import type { PolicyRules, EngineResult, AppEvent } from "@/core/contracts";

export class PolicyEngine {
  constructor() {
    orchestrator.registerEngine("policy", this);
  }

  // ==================== UPDATE POLICY TASK ====================
  async updatePolicy(updates: Partial<PolicyRules>): Promise<EngineResult<PolicyRules>> {
    console.log("[PolicyEngine] Updating policy:", updates);

    const currentPolicy = useAppStore.getState().policy;
    const updatedPolicy = { ...currentPolicy, ...updates };

    // Validate policy rules
    const validation = this.validatePolicy(updatedPolicy);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(", "),
        affectedModules: [],
        events: [],
      };
    }

    useAppStore.getState().setPolicy(updatedPolicy);

    await orchestrator.coordinateUpdate(
      "policy",
      "policy_updated",
      { policy: updatedPolicy },
      ["automation-page", "dashboard"]
    );

    return {
      success: true,
      data: updatedPolicy,
      affectedModules: ["automation-page", "dashboard"],
      events: [],
    };
  }

  // ==================== VALIDATE POLICY TASK ====================
  validatePolicy(policy: PolicyRules): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (policy.minHarvestAmount < 0) {
      errors.push("Minimum harvest amount must be positive");
    }

    if (policy.minRebalanceEdge < 0 || policy.minRebalanceEdge > 100) {
      errors.push("Minimum rebalance edge must be between 0-100%");
    }

    if (policy.dailyGasBudget < 0) {
      errors.push("Daily gas budget must be positive");
    }

    if (policy.minPoolScore < 0 || policy.minPoolScore > 100) {
      errors.push("Minimum pool score must be between 0-100");
    }

    if (policy.maxPerPool <= 0) {
      errors.push("Max per pool must be positive");
    }

    if (policy.maxPerChain <= 0) {
      errors.push("Max per chain must be positive");
    }

    if (policy.maxTotalDeployed <= 0) {
      errors.push("Max total deployed must be positive");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // ==================== CHECK ELIGIBILITY TASK ====================
  async checkActionEligibility(
    action: "harvest" | "compound" | "rebalance" | "deploy",
    context: Record<string, any>
  ): Promise<{ eligible: boolean; reason: string }> {
    const policy = useAppStore.getState().policy;

    if (policy.emergencyPause) {
      return { eligible: false, reason: "Emergency pause is active" };
    }

    switch (action) {
      case "harvest":
        if (context.amount < policy.minHarvestAmount) {
          return { 
            eligible: false, 
            reason: `Amount below minimum ($${policy.minHarvestAmount})` 
          };
        }
        break;

      case "rebalance":
        if (context.edgePercentage < policy.minRebalanceEdge) {
          return { 
            eligible: false, 
            reason: `Edge below threshold (${policy.minRebalanceEdge}%)` 
          };
        }
        break;

      case "deploy":
        if (context.poolScore < policy.minPoolScore) {
          return { 
            eligible: false, 
            reason: `Pool score below minimum (${policy.minPoolScore})` 
          };
        }
        if (context.amount > policy.maxPerPool) {
          return { 
            eligible: false, 
            reason: `Exceeds max per pool ($${policy.maxPerPool})` 
          };
        }
        break;
    }

    return { eligible: true, reason: "Action allowed by policy" };
  }

  // ==================== EVENT HANDLER ====================
  async handleEvent(event: AppEvent): Promise<void> {
    console.log("[PolicyEngine] Handling event:", event.type);
  }

  // ==================== HEALTH ====================
  isHealthy(): boolean {
    return true;
  }
}

export const policyEngine = new PolicyEngine();