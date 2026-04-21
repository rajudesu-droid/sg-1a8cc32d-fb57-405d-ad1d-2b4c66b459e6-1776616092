/**
 * Action Handler Service
 * Centralized service for handling all user-triggered actions across the app
 * Routes actions through proper engines with validation, mode-awareness, and sync
 */

import { orchestrator } from "@/core/orchestrator";
import { syncEngine } from "@/core/sync";
import type { AppMode } from "@/core/contracts";

export type ActionResult = {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
};

export type ActionContext = {
  mode: AppMode;
  userId?: string;
  walletAddress?: string;
  metadata?: Record<string, any>;
};

class ActionHandlerService {
  /**
   * Validate action is allowed in current mode
   */
  private validateModePermission(action: string, mode: AppMode): { allowed: boolean; reason?: string } {
    // Demo mode: All simulation actions allowed
    if (mode === "demo") {
      return { allowed: true };
    }

    // Shadow mode: Only read-only and preview actions allowed
    if (mode === "shadow") {
      const readOnlyActions = [
        "view_details",
        "preview_action",
        "refresh_data",
        "calculate_plan",
        "scan_opportunities",
        "check_balances",
      ];
      
      if (readOnlyActions.some(a => action.includes(a))) {
        return { allowed: true };
      }
      
      return { 
        allowed: false, 
        reason: "Shadow mode is read-only. Switch to Demo or Live mode to execute actions." 
      };
    }

    // Live mode: Check specific action permissions and readiness
    if (mode === "live") {
      // TODO: Add live mode readiness checks
      return { allowed: true };
    }

    return { allowed: false, reason: "Invalid mode" };
  }

  /**
   * Execute wallet connection
   */
  async connectWallet(context: ActionContext): Promise<ActionResult> {
    try {
      console.log("[ActionHandler] Connecting wallet...");

      // Validate mode allows wallet actions
      const permission = this.validateModePermission("connect_wallet", context.mode);
      if (!permission.allowed) {
        return { success: false, message: permission.reason || "Action not allowed" };
      }

      // Publish wallet connection event
      await orchestrator.publishEvent({
        type: "wallet_updated",
        source: "action_handler",
        timestamp: new Date(),
        affectedModules: ["wallet", "portfolio"],
        data: { mode: context.mode },
      });

      // Trigger sync
      await syncEngine.syncAll();

      return { 
        success: true, 
        message: "Wallet connected successfully" 
      };
    } catch (error) {
      console.error("[ActionHandler] Connect wallet failed:", error);
      return { 
        success: false, 
        message: "Failed to connect wallet",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Execute wallet disconnection
   */
  async disconnectWallet(context: ActionContext): Promise<ActionResult> {
    try {
      console.log("[ActionHandler] Disconnecting wallet...");

      // Publish wallet disconnection event
      await orchestrator.publishEvent({
        type: "wallet_updated",
        source: "action_handler",
        timestamp: new Date(),
        affectedModules: ["wallet", "portfolio"],
        data: { mode: context.mode },
      });

      // Trigger sync
      await syncEngine.syncAll();

      return { 
        success: true, 
        message: "Wallet disconnected successfully" 
      };
    } catch (error) {
      console.error("[ActionHandler] Disconnect wallet failed:", error);
      return { 
        success: false, 
        message: "Failed to disconnect wallet",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Refresh wallet balances
   */
  async refreshBalances(context: ActionContext): Promise<ActionResult> {
    try {
      console.log("[ActionHandler] Refreshing balances...");

      // Publish balance refresh event
      await orchestrator.publishEvent({
        type: "assets_updated",
        source: "action_handler",
        timestamp: new Date(),
        affectedModules: ["wallet", "portfolio"],
        data: { mode: context.mode },
      });

      // Trigger sync
      await syncEngine.syncAll();

      return { 
        success: true, 
        message: "Balances refreshed successfully" 
      };
    } catch (error) {
      console.error("[ActionHandler] Refresh balances failed:", error);
      return { 
        success: false, 
        message: "Failed to refresh balances",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Refresh opportunities
   */
  async refreshOpportunities(context: ActionContext): Promise<ActionResult> {
    try {
      console.log("[ActionHandler] Refreshing opportunities...");

      // Publish opportunities refresh event
      await orchestrator.publishEvent({
        type: "opportunities_updated",
        source: "action_handler",
        timestamp: new Date(),
        affectedModules: ["opportunity"],
        data: { mode: context.mode },
      });

      // Trigger sync
      await syncEngine.syncAffectedModules(["opportunity"]);

      return { 
        success: true, 
        message: "Opportunities refreshed successfully" 
      };
    } catch (error) {
      console.error("[ActionHandler] Refresh opportunities failed:", error);
      return { 
        success: false, 
        message: "Failed to refresh opportunities",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Harvest rewards from position
   */
  async harvestRewards(positionId: string, context: ActionContext): Promise<ActionResult> {
    try {
      console.log("[ActionHandler] Harvesting rewards from position:", positionId);

      // Validate mode allows execution
      const permission = this.validateModePermission("harvest_rewards", context.mode);
      if (!permission.allowed) {
        return { success: false, message: permission.reason || "Action not allowed" };
      }

      // Publish harvest action
      await orchestrator.publishEvent({
        type: "action_triggered",
        source: "action_handler",
        timestamp: new Date(),
        affectedModules: ["positions", "rewards", "portfolio"],
        data: {
          type: "harvest_rewards",
          payload: { positionId },
          metadata: context,
        },
      });

      // Trigger sync
      await syncEngine.syncAffectedModules(["position", "rewards", "portfolio"]);

      return { 
        success: true, 
        message: context.mode === "demo" 
          ? "Simulated harvest completed" 
          : "Rewards harvested successfully",
        data: { positionId }
      };
    } catch (error) {
      console.error("[ActionHandler] Harvest failed:", error);
      return { 
        success: false, 
        message: "Failed to harvest rewards",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Compound rewards into position
   */
  async compoundRewards(positionId: string, context: ActionContext): Promise<ActionResult> {
    try {
      console.log("[ActionHandler] Compounding rewards for position:", positionId);

      // Validate mode allows execution
      const permission = this.validateModePermission("compound_rewards", context.mode);
      if (!permission.allowed) {
        return { success: false, message: permission.reason || "Action not allowed" };
      }

      // Publish compound action
      await orchestrator.publishEvent({
        type: "action_triggered",
        source: "action_handler",
        timestamp: new Date(),
        affectedModules: ["positions", "rewards", "portfolio"],
        data: {
          type: "compound_rewards",
          payload: { positionId },
          metadata: context,
        },
      });

      // Trigger sync
      await syncEngine.syncModules(["positions", "rewards", "portfolio"]);

      return { 
        success: true, 
        message: context.mode === "demo" 
          ? "Simulated compound completed" 
          : "Rewards compounded successfully",
        data: { positionId }
      };
    } catch (error) {
      console.error("[ActionHandler] Compound failed:", error);
      return { 
        success: false, 
        message: "Failed to compound rewards",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Rebalance position
   */
  async rebalancePosition(positionId: string, context: ActionContext): Promise<ActionResult> {
    try {
      console.log("[ActionHandler] Rebalancing position:", positionId);

      // Validate mode allows execution
      const permission = this.validateModePermission("rebalance_position", context.mode);
      if (!permission.allowed) {
        return { success: false, message: permission.reason || "Action not allowed" };
      }

      // Publish rebalance action
      await orchestrator.publishEvent({
        type: "action_triggered",
        source: "action_handler",
        timestamp: new Date(),
        affectedModules: ["positions", "portfolio"],
        data: {
          type: "rebalance_position",
          payload: { positionId },
          metadata: context,
        },
      });

      // Trigger sync
      await syncEngine.syncAffectedModules(["position", "portfolio"]);

      return { 
        success: true, 
        message: context.mode === "demo" 
          ? "Simulated rebalance completed" 
          : "Position rebalanced successfully",
        data: { positionId }
      };
    } catch (error) {
      console.error("[ActionHandler] Rebalance failed:", error);
      return { 
        success: false, 
        message: "Failed to rebalance position",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Close position
   */
  async closePosition(positionId: string, context: ActionContext): Promise<ActionResult> {
    try {
      console.log("[ActionHandler] Closing position:", positionId);

      // Validate mode allows execution
      const permission = this.validateModePermission("close_position", context.mode);
      if (!permission.allowed) {
        return { success: false, message: permission.reason || "Action not allowed" };
      }

      // Publish close action
      await orchestrator.publishEvent({
        type: "action_triggered",
        source: "action_handler",
        timestamp: new Date(),
        affectedModules: ["positions", "portfolio", "wallet"],
        data: {
          type: "close_position",
          payload: { positionId },
          metadata: context,
        },
      });

      // Trigger sync
      await syncEngine.syncAffectedModules(["position", "portfolio", "wallet"]);

      return { 
        success: true, 
        message: context.mode === "demo" 
          ? "Simulated position closure completed" 
          : "Position closed successfully",
        data: { positionId }
      };
    } catch (error) {
      console.error("[ActionHandler] Close position failed:", error);
      return { 
        success: false, 
        message: "Failed to close position",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Add liquidity to position
   */
  async addLiquidity(positionId: string, amount: number, context: ActionContext): Promise<ActionResult> {
    try {
      console.log("[ActionHandler] Adding liquidity to position:", positionId, amount);

      // Validate mode allows execution
      const permission = this.validateModePermission("add_liquidity", context.mode);
      if (!permission.allowed) {
        return { success: false, message: permission.reason || "Action not allowed" };
      }

      // Publish add liquidity action
      await orchestrator.publishEvent({
        type: "action_triggered",
        source: "action_handler",
        timestamp: new Date(),
        affectedModules: ["positions", "portfolio", "wallet"],
        data: {
          type: "add_liquidity",
          payload: { positionId, amount },
          metadata: context,
        },
      });

      // Trigger sync
      await syncEngine.syncAffectedModules(["position", "portfolio", "wallet"]);

      return { 
        success: true, 
        message: context.mode === "demo" 
          ? "Simulated liquidity addition completed" 
          : "Liquidity added successfully",
        data: { positionId, amount }
      };
    } catch (error) {
      console.error("[ActionHandler] Add liquidity failed:", error);
      return { 
        success: false, 
        message: "Failed to add liquidity",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Emergency pause all automation
   */
  async emergencyPause(context: ActionContext): Promise<ActionResult> {
    try {
      console.log("[ActionHandler] Emergency pause triggered");

      // Publish emergency pause event
      await orchestrator.publishEvent({
        type: "policy_updated",
        source: "action_handler",
        timestamp: new Date(),
        affectedModules: ["policy"],
        data: { mode: context.mode },
      });

      // Stop bot if running
      const { botOrchestrationService } = await import("@/services/BotOrchestrationService");
      await botOrchestrationService.stopBot();

      // Trigger sync
      await syncEngine.syncAffectedModules(["policy"]);

      return { 
        success: true, 
        message: "Emergency pause activated - all automation stopped" 
      };
    } catch (error) {
      console.error("[ActionHandler] Emergency pause failed:", error);
      return { 
        success: false, 
        message: "Failed to activate emergency pause",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Generate withdrawal plan
   */
  async generateWithdrawalPlan(amount: number, context: ActionContext): Promise<ActionResult> {
    try {
      console.log("[ActionHandler] Generating withdrawal plan for:", amount);

      // Publish withdrawal plan event
      await orchestrator.publishEvent({
        type: "withdrawal_planned",
        source: "action_handler",
        timestamp: new Date(),
        affectedModules: ["withdrawal"],
        data: { amount, mode: context.mode },
      });

      // TODO: Call WithdrawalEngine.generatePlan()

      return { 
        success: true, 
        message: "Withdrawal plan generated successfully",
        data: { amount }
      };
    } catch (error) {
      console.error("[ActionHandler] Generate withdrawal plan failed:", error);
      return { 
        success: false, 
        message: "Failed to generate withdrawal plan",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

export const actionHandler = new ActionHandlerService();