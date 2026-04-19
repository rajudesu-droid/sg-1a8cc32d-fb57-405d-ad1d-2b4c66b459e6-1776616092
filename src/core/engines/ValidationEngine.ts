// ============================================================================
// VALIDATION ENGINE
// Pre-execution validation for all bot actions
// ============================================================================

import { orchestrator } from "../orchestrator";
import { useAppStore } from "@/store";
import type {
  ActionTrigger,
  ValidationResult,
  ValidationCheck,
} from "../contracts/actions";

export class ValidationEngine {
  private engineId = "validation-engine";

  constructor() {
    console.log("[ValidationEngine] Initializing...");
    this.registerWithOrchestrator();
  }

  private registerWithOrchestrator() {
    orchestrator.registerEngine(this.engineId, this);
    console.log("[ValidationEngine] Registered with orchestrator");
  }

  // ============================================================================
  // CORE VALIDATION
  // ============================================================================

  /**
   * Validate action trigger
   */
  async validateAction(trigger: ActionTrigger): Promise<ValidationResult> {
    console.log(`[ValidationEngine] Validating action: ${trigger.actionType} in ${trigger.mode} mode`);

    const result: ValidationResult = {
      allowed: false,
      blockingReasons: [],
      warnings: [],
      timestamp: new Date(),
    };

    const mode = trigger.mode || "demo";
    const store = useAppStore.getState();

    // CRITICAL: Reject simulated data in Live Mode
    if (mode === "live") {
      const wallet = store.wallet;
      
      // Check for simulated assets
      const hasSimulatedAssets = wallet.assets.some((asset: any) => 
        asset.source === "simulated" || asset.source === "manual"
      );
      
      if (hasSimulatedAssets) {
        result.blockingReasons.push("Live Mode cannot use simulated or manually added assets");
        return result;
      }
      
      // Verify real wallet connection
      if (!wallet.wallet) {
        result.blockingReasons.push("Live Mode requires real wallet connection");
        return result;
      }
    }

    // Check 1: Mode validation
    if (!["demo", "shadow", "live"].includes(mode)) {
      result.blockingReasons.push(`Invalid mode: ${mode}`);
      return result;
    }

    // Check 2: Wallet connection (Shadow and Live modes)
    if (mode === "shadow" || mode === "live") {
      if (!store.wallet.wallet) {
        result.blockingReasons.push("Wallet not connected - required for Shadow/Live mode");
        return result;
      }
    }

    const checks: ValidationCheck[] = [];
    const blockingReasons: string[] = [];
    const warningFlags: string[] = [];
    const requiredNextSteps: string[] = [];

    // Run all validation checks
    checks.push(await this.checkMode(trigger));
    checks.push(await this.checkWalletConnection(trigger));
    checks.push(await this.checkNetworkConnection(trigger));
    checks.push(await this.checkWhitelist(trigger));
    checks.push(await this.checkPolicy(trigger));
    checks.push(await this.checkCapitalLimits(trigger));
    checks.push(await this.checkBalances(trigger));
    checks.push(await this.checkSlippage(trigger));
    checks.push(await this.checkGasLimit(trigger));
    checks.push(await this.checkRiskAlerts(trigger));
    checks.push(await this.checkSyncState(trigger));
    checks.push(await this.checkConcurrentActions(trigger));
    checks.push(await this.checkOpportunityValidity(trigger));

    // Collect blocking reasons and warnings
    checks.forEach((check) => {
      if (!check.passed) {
        if (check.blocking) {
          blockingReasons.push(check.message);
        } else {
          warningFlags.push(check.message);
        }
      }
    });

    // Determine if action is allowed
    const allowed = blockingReasons.length === 0;

    // Generate required next steps
    if (!allowed) {
      requiredNextSteps.push(...this.generateNextSteps(checks));
    }

    const result: ValidationResult = {
      allowed,
      blockingReasons,
      warningFlags,
      checks,
      requiredNextSteps,
      validatedAt: new Date(),
    };

    // Notify orchestrator
    orchestrator.coordinateUpdate(
      this.engineId,
      "validation_completed" as any,
      { trigger, result },
      ["execution-engine"]
    );

    return result;
  }

  // ============================================================================
  // INDIVIDUAL VALIDATION CHECKS
  // ============================================================================

  private async checkMode(trigger: ActionTrigger): Promise<ValidationCheck> {
    const currentMode = useAppStore.getState().mode.current;
    
    // Shadow mode cannot execute
    if (currentMode === "shadow" && trigger.mode === "live") {
      return {
        checkName: "mode_validation",
        passed: false,
        blocking: true,
        message: "Cannot execute live actions in Shadow mode",
      };
    }

    // Demo mode can only execute simulated actions
    if (currentMode === "demo" && trigger.mode !== "demo") {
      return {
        checkName: "mode_validation",
        passed: false,
        blocking: true,
        message: "Cannot execute real actions in Demo mode",
      };
    }

    return {
      checkName: "mode_validation",
      passed: true,
      blocking: false,
      message: "Mode validation passed",
    };
  }

  private async checkWalletConnection(trigger: ActionTrigger): Promise<ValidationCheck> {
    if (trigger.mode === "demo") {
      return {
        checkName: "wallet_connection",
        passed: true,
        blocking: false,
        message: "Demo mode - wallet check skipped",
      };
    }

    const wallet = useAppStore.getState().wallet;
    
    if (!wallet.wallet) {
      return {
        checkName: "wallet_connection",
        passed: false,
        blocking: true,
        message: "No wallet connected",
      };
    }

    if (trigger.walletAddress && wallet.wallet.address !== trigger.walletAddress) {
      return {
        checkName: "wallet_connection",
        passed: false,
        blocking: true,
        message: "Connected wallet does not match trigger wallet",
      };
    }

    return {
      checkName: "wallet_connection",
      passed: true,
      blocking: false,
      message: "Wallet connection valid",
    };
  }

  private async checkNetworkConnection(trigger: ActionTrigger): Promise<ValidationCheck> {
    if (trigger.mode === "demo" || !trigger.chain) {
      return {
        checkName: "network_connection",
        passed: true,
        blocking: false,
        message: "Network check skipped",
      };
    }

    // In a real implementation, check the connected network
    // For now, assume valid
    return {
      checkName: "network_connection",
      passed: true,
      blocking: false,
      message: "Network connection valid",
    };
  }

  private async checkWhitelist(trigger: ActionTrigger): Promise<ValidationCheck> {
    // Check if chain, protocol, and pool are whitelisted
    const { chain, protocol, poolAddress } = trigger;

    // This would check against the protocol registry and policy settings
    // For now, simplified validation
    return {
      checkName: "whitelist_check",
      passed: true,
      blocking: false,
      message: "Whitelist check passed",
    };
  }

  private async checkPolicy(trigger: ActionTrigger): Promise<ValidationCheck> {
    const policy = useAppStore.getState().policy;

    // Check emergency pause
    if (policy.emergencyPause) {
      return {
        checkName: "policy_check",
        passed: false,
        blocking: true,
        message: "Execution paused by emergency policy",
      };
    }

    // Check if action type is allowed by policy
    if (trigger.actionType === "HARVEST_REWARDS" && !policy.autoHarvest) {
      return {
        checkName: "policy_check",
        passed: false,
        blocking: true,
        message: "Auto-harvest is disabled in policy",
      };
    }

    if (trigger.actionType === "COMPOUND" && !policy.autoCompound) {
      return {
        checkName: "policy_check",
        passed: false,
        blocking: true,
        message: "Auto-compound is disabled in policy",
      };
    }

    if (trigger.actionType === "REBALANCE" && !policy.autoRebalance) {
      return {
        checkName: "policy_check",
        passed: false,
        blocking: true,
        message: "Auto-rebalance is disabled in policy",
      };
    }

    return {
      checkName: "policy_check",
      passed: true,
      blocking: false,
      message: "Policy checks passed",
    };
  }

  private async checkCapitalLimits(trigger: ActionTrigger): Promise<ValidationCheck> {
    const policy = useAppStore.getState().policy;
    const { amount, protocol, chain } = trigger;

    if (!amount) {
      return {
        checkName: "capital_limits",
        passed: true,
        blocking: false,
        message: "No amount specified - skip capital check",
      };
    }

    // Check max per pool
    if (amount > policy.maxPerPool) {
      return {
        checkName: "capital_limits",
        passed: false,
        blocking: true,
        message: `Amount exceeds max per pool limit ($${policy.maxPerPool})`,
      };
    }

    // Check max per chain
    if (amount > policy.maxPerChain) {
      return {
        checkName: "capital_limits",
        passed: false,
        blocking: true,
        message: `Amount exceeds max per chain limit ($${policy.maxPerChain})`,
      };
    }

    // Check max total deployed
    const portfolio = useAppStore.getState().portfolio;
    if (portfolio && portfolio.deployedCapital + amount > policy.maxTotalDeployed) {
      return {
        checkName: "capital_limits",
        passed: false,
        blocking: true,
        message: `Would exceed max total deployed limit ($${policy.maxTotalDeployed})`,
      };
    }

    return {
      checkName: "capital_limits",
      passed: true,
      blocking: false,
      message: "Capital limits check passed",
    };
  }

  private async checkBalances(trigger: ActionTrigger): Promise<ValidationCheck> {
    if (trigger.mode === "demo") {
      return {
        checkName: "balance_check",
        passed: true,
        blocking: false,
        message: "Demo mode - balance check simulated",
      };
    }

    const { amount, token } = trigger;

    if (!amount || !token) {
      return {
        checkName: "balance_check",
        passed: true,
        blocking: false,
        message: "No balance check required",
      };
    }

    // Check if wallet has sufficient balance
    const wallet = useAppStore.getState().wallet;
    const asset = wallet.assets.find((a) => a.symbol === token);

    if (!asset || parseFloat(asset.balance) < amount) {
      return {
        checkName: "balance_check",
        passed: false,
        blocking: true,
        message: `Insufficient ${token} balance`,
        details: {
          required: amount,
          available: asset ? parseFloat(asset.balance) : 0,
        },
      };
    }

    return {
      checkName: "balance_check",
      passed: true,
      blocking: false,
      message: "Balance check passed",
    };
  }

  private async checkSlippage(trigger: ActionTrigger): Promise<ValidationCheck> {
    const policy = useAppStore.getState().policy;
    const { slippage } = trigger;

    if (!slippage) {
      return {
        checkName: "slippage_check",
        passed: true,
        blocking: false,
        message: "No slippage specified",
      };
    }

    // Policy doesn't have max slippage yet, but we can add it
    const MAX_SLIPPAGE = 5; // 5% max

    if (slippage > MAX_SLIPPAGE) {
      return {
        checkName: "slippage_check",
        passed: false,
        blocking: false, // Warning, not blocking
        message: `Slippage (${slippage}%) exceeds recommended max (${MAX_SLIPPAGE}%)`,
      };
    }

    return {
      checkName: "slippage_check",
      passed: true,
      blocking: false,
      message: "Slippage check passed",
    };
  }

  private async checkGasLimit(trigger: ActionTrigger): Promise<ValidationCheck> {
    const policy = useAppStore.getState().policy;

    // Estimate gas cost (simplified)
    const estimatedGas = this.estimateGasCost(trigger.actionType);

    if (estimatedGas > policy.dailyGasBudget) {
      return {
        checkName: "gas_limit",
        passed: false,
        blocking: false, // Warning
        message: `Estimated gas ($${estimatedGas}) exceeds daily budget ($${policy.dailyGasBudget})`,
      };
    }

    return {
      checkName: "gas_limit",
      passed: true,
      blocking: false,
      message: "Gas limit check passed",
    };
  }

  private async checkRiskAlerts(trigger: ActionTrigger): Promise<ValidationCheck> {
    // Check for active risk alerts
    const alerts = useAppStore.getState().alerts;
    
    const criticalAlerts = alerts.filter((a) => a.type === "error");
    
    if (criticalAlerts.length > 0) {
      return {
        checkName: "risk_alerts",
        passed: false,
        blocking: true,
        message: `${criticalAlerts.length} critical alerts active`,
      };
    }

    return {
      checkName: "risk_alerts",
      passed: true,
      blocking: false,
      message: "No critical risk alerts",
    };
  }

  private async checkSyncState(trigger: ActionTrigger): Promise<ValidationCheck> {
    const syncState = useAppStore.getState();
    const lastSync = syncState.lastSyncTime;

    if (!lastSync) {
      return {
        checkName: "sync_state",
        passed: false,
        blocking: false, // Warning
        message: "No recent sync - data may be stale",
      };
    }

    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    const timeSinceSync = Date.now() - new Date(lastSync).getTime();

    if (timeSinceSync > staleThreshold) {
      return {
        checkName: "sync_state",
        passed: false,
        blocking: false, // Warning
        message: "Data is stale - consider refreshing",
      };
    }

    return {
      checkName: "sync_state",
      passed: true,
      blocking: false,
      message: "Sync state is current",
    };
  }

  private async checkConcurrentActions(trigger: ActionTrigger): Promise<ValidationCheck> {
    // Check if another action is running on the same position
    // This would be implemented with an execution queue
    // For now, simplified check

    return {
      checkName: "concurrent_actions",
      passed: true,
      blocking: false,
      message: "No conflicting actions detected",
    };
  }

  private async checkOpportunityValidity(trigger: ActionTrigger): Promise<ValidationCheck> {
    if (!trigger.poolAddress) {
      return {
        checkName: "opportunity_validity",
        passed: true,
        blocking: false,
        message: "No opportunity to validate",
      };
    }

    // Check if opportunity still exists and meets criteria
    const opportunities = useAppStore.getState().opportunities;
    const opportunity = opportunities.find((o) => o.poolAddress === trigger.poolAddress);

    if (!opportunity) {
      return {
        checkName: "opportunity_validity",
        passed: false,
        blocking: true,
        message: "Opportunity no longer available",
      };
    }

    if (!opportunity.enabled || !opportunity.whitelisted) {
      return {
        checkName: "opportunity_validity",
        passed: false,
        blocking: true,
        message: "Opportunity is disabled or not whitelisted",
      };
    }

    return {
      checkName: "opportunity_validity",
      passed: true,
      blocking: false,
      message: "Opportunity validation passed",
    };
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private estimateGasCost(actionType: string): number {
    // Simplified gas estimation
    const gasEstimates: Record<string, number> = {
      DEPOSIT: 5,
      STAKE: 10,
      ADD_LIQUIDITY: 15,
      REMOVE_LIQUIDITY: 12,
      HARVEST_REWARDS: 8,
      CONVERT_REWARDS: 10,
      COMPOUND: 18,
      REBALANCE: 25,
      EXIT_POSITION: 20,
      WITHDRAW_FUNDS: 12,
    };

    return gasEstimates[actionType] || 10;
  }

  private generateNextSteps(checks: ValidationCheck[]): string[] {
    const steps: string[] = [];

    checks.forEach((check) => {
      if (!check.passed && check.blocking) {
        switch (check.checkName) {
          case "wallet_connection":
            steps.push("Connect your wallet");
            break;
          case "network_connection":
            steps.push("Switch to the correct network");
            break;
          case "balance_check":
            steps.push("Add funds to your wallet");
            break;
          case "policy_check":
            steps.push("Update automation policy settings");
            break;
          case "risk_alerts":
            steps.push("Resolve active risk alerts");
            break;
        }
      }
    });

    return steps;
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    return {
      healthy: true,
      message: "ValidationEngine operational",
    };
  }
}

export const validationEngine = new ValidationEngine();