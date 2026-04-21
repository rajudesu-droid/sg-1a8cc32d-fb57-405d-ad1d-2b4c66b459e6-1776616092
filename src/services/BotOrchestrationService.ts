/**
 * Bot Orchestration Service
 * Manages the automation bot lifecycle (start, stop, status)
 */

import { orchestrator } from "@/core/orchestrator";
import { supabase } from "@/integrations/supabase/client";

export interface BotStatus {
  isRunning: boolean;
  startedAt: Date | null;
  lastActionAt: Date | null;
  totalActions: number;
  mode: "demo" | "shadow" | "live";
}

export interface BotConfig {
  mode: "demo" | "shadow" | "live";
  checkIntervalMs: number; // How often to check for opportunities
  autoHarvest: boolean;
  autoCompound: boolean;
  autoRebalance: boolean;
}

class BotOrchestrationService {
  private runningInterval: ReturnType<typeof setInterval> | null = null;
  private status: BotStatus = {
    isRunning: false,
    startedAt: null,
    lastActionAt: null,
    totalActions: 0,
    mode: "demo",
  };

  /**
   * Start the automation bot
   */
  async startBot(config: BotConfig): Promise<boolean> {
    console.log("[BotOrchestration] Starting bot with config:", config);

    if (this.status.isRunning) {
      console.warn("[BotOrchestration] Bot is already running");
      return false;
    }

    try {
      // Update status
      this.status = {
        isRunning: true,
        startedAt: new Date(),
        lastActionAt: null,
        totalActions: 0,
        mode: config.mode,
      };

      // Persist status to database
      await this.saveBotStatus();

      // Start the automation loop
      this.runningInterval = setInterval(() => {
        this.automationLoop(config);
      }, config.checkIntervalMs);

      // Run immediately on start
      await this.automationLoop(config);

      console.log("[BotOrchestration] Bot started successfully");
      return true;
    } catch (error) {
      console.error("[BotOrchestration] Failed to start bot:", error);
      this.status.isRunning = false;
      return false;
    }
  }

  /**
   * Stop the automation bot
   */
  async stopBot(): Promise<boolean> {
    console.log("[BotOrchestration] Stopping bot");

    if (!this.status.isRunning) {
      console.warn("[BotOrchestration] Bot is not running");
      return false;
    }

    try {
      // Clear interval
      if (this.runningInterval) {
        clearInterval(this.runningInterval);
        this.runningInterval = null;
      }

      // Update status
      this.status.isRunning = false;

      // Persist status to database
      await this.saveBotStatus();

      console.log("[BotOrchestration] Bot stopped successfully");
      return true;
    } catch (error) {
      console.error("[BotOrchestration] Failed to stop bot:", error);
      return false;
    }
  }

  /**
   * Get current bot status
   */
  getStatus(): BotStatus {
    return { ...this.status };
  }

  /**
   * Main automation loop
   */
  private async automationLoop(config: BotConfig): Promise<void> {
    console.log("[BotOrchestration] Running automation loop");

    try {
      // Load user policy to check what automation is enabled
      const policy = await this.loadPolicy();

      if (!policy) {
        console.warn("[BotOrchestration] No policy found, skipping automation");
        return;
      }

      // Check for opportunities
      const opportunities = await this.checkOpportunities(config.mode);

      // Execute automation actions based on policy
      let actionsExecuted = 0;

      // Auto-harvest
      if (config.autoHarvest && policy.autoHarvest) {
        const harvested = await this.executeAutoHarvest(config.mode, policy);
        actionsExecuted += harvested;
      }

      // Auto-compound
      if (config.autoCompound && policy.autoCompound) {
        const compounded = await this.executeAutoCompound(config.mode, policy);
        actionsExecuted += compounded;
      }

      // Auto-rebalance
      if (config.autoRebalance && policy.autoRebalance) {
        const rebalanced = await this.executeAutoRebalance(config.mode, opportunities, policy);
        actionsExecuted += rebalanced;
      }

      // Update status
      if (actionsExecuted > 0) {
        this.status.lastActionAt = new Date();
        this.status.totalActions += actionsExecuted;
        await this.saveBotStatus();
      }

      console.log(`[BotOrchestration] Loop complete. Actions executed: ${actionsExecuted}`);
    } catch (error) {
      console.error("[BotOrchestration] Error in automation loop:", error);
    }
  }

  /**
   * Check for opportunities
   */
  private async checkOpportunities(mode: string): Promise<any[]> {
    console.log(`[BotOrchestration] Checking opportunities in ${mode} mode`);
    
    // TODO: Integrate with OpportunityEngine when ready
    // For now, return empty array - will be implemented when opportunity scanning is ready
    return [];
  }

  /**
   * Execute auto-harvest
   */
  private async executeAutoHarvest(mode: string, policy: any): Promise<number> {
    console.log(`[BotOrchestration] Checking harvest conditions in ${mode} mode`);
    
    try {
      // Get all positions from store
      const { useAppStore } = await import("@/store");
      const positions = useAppStore.getState().positions;
      
      if (!positions || positions.length === 0) {
        console.log("[BotOrchestration] No positions found for harvesting");
        return 0;
      }

      let harvested = 0;

      // Check each position for harvestable rewards
      for (const position of positions) {
        // Skip if position has no rewards or rewards below threshold
        if (!position.accruedRewards || position.accruedRewards <= 0) {
          continue;
        }

        // Calculate USD value of rewards (assume 1:1 for now, will be replaced with real price fetch)
        const rewardValueUSD = position.accruedRewards;

        // Check if rewards exceed minimum harvest threshold
        const minHarvestAmount = policy.minHarvestAmount || 50;
        if (rewardValueUSD >= minHarvestAmount) {
          console.log(`[BotOrchestration] Harvesting position ${position.id}: $${rewardValueUSD.toFixed(2)} in rewards`);
          
          // Publish harvest event via orchestrator
          const { orchestrator } = await import("@/core/orchestrator");
          await orchestrator.publishEvent({
            type: "rewards_harvested",
            source: "bot_automation",
            timestamp: new Date(),
            affectedModules: ["positions", "rewards"],
            data: {
              positionId: position.id,
              pair: position.pair,
              amount: rewardValueUSD,
            },
          });

          harvested++;
          
          // Add alert to store
          useAppStore.getState().addAlert({
            id: `harvest-${position.id}-${Date.now()}`,
            type: "success",
            title: "Auto-Harvest Executed",
            message: `Harvested $${rewardValueUSD.toFixed(2)} from ${position.pair}`,
            timestamp: new Date(),
          });
        } else {
          console.log(`[BotOrchestration] Position ${position.id} rewards ($${rewardValueUSD.toFixed(2)}) below threshold ($${minHarvestAmount})`);
        }
      }

      if (harvested > 0) {
        console.log(`[BotOrchestration] Successfully harvested ${harvested} position(s)`);
      } else {
        console.log("[BotOrchestration] No positions met harvest threshold");
      }

      return harvested;
    } catch (error) {
      console.error("[BotOrchestration] Error in executeAutoHarvest:", error);
      return 0;
    }
  }

  /**
   * Execute auto-compound
   */
  private async executeAutoCompound(mode: string, policy: any): Promise<number> {
    console.log(`[BotOrchestration] Checking compound conditions in ${mode} mode`);
    
    try {
      // Get all positions from store
      const { useAppStore } = await import("@/store");
      const positions = useAppStore.getState().positions;
      
      if (!positions || positions.length === 0) {
        console.log("[BotOrchestration] No positions found for compounding");
        return 0;
      }

      let compounded = 0;

      // Check each position for rewards that were recently harvested and can be compounded
      for (const position of positions) {
        // For compounding, we need harvested rewards (not unclaimed)
        // This would be tracked separately - for now, skip if no recent harvest
        if (!position.accruedRewards || position.accruedRewards <= 0) {
          continue;
        }

        const rewardValueUSD = position.accruedRewards;

        // Check if harvested rewards exceed compound threshold (use minHarvestAmount as proxy)
        const compoundThreshold = policy.minHarvestAmount || 50;
        if (rewardValueUSD >= compoundThreshold) {
          console.log(`[BotOrchestration] Compounding position ${position.id}: $${rewardValueUSD.toFixed(2)} in rewards`);
          
          // Publish compound event via orchestrator
          const { orchestrator } = await import("@/core/orchestrator");
          await orchestrator.publishEvent({
            type: "rewards_compounded",
            source: "bot_automation",
            timestamp: new Date(),
            affectedModules: ["positions", "rewards"],
            data: {
              positionId: position.id,
              pair: position.pair,
              amount: rewardValueUSD,
            },
          });

          compounded++;
          
          // Add alert to store
          useAppStore.getState().addAlert({
            id: `compound-${position.id}-${Date.now()}`,
            type: "success",
            title: "Auto-Compound Executed",
            message: `Compounded $${rewardValueUSD.toFixed(2)} into ${position.pair}`,
            timestamp: new Date(),
          });
        } else {
          console.log(`[BotOrchestration] Position ${position.id} rewards ($${rewardValueUSD.toFixed(2)}) below compound threshold ($${compoundThreshold})`);
        }
      }

      if (compounded > 0) {
        console.log(`[BotOrchestration] Successfully compounded ${compounded} position(s)`);
      } else {
        console.log("[BotOrchestration] No positions met compound threshold");
      }

      return compounded;
    } catch (error) {
      console.error("[BotOrchestration] Error in executeAutoCompound:", error);
      return 0;
    }
  }

  /**
   * Execute auto-rebalance
   */
  private async executeAutoRebalance(mode: string, opportunities: any[], policy: any): Promise<number> {
    console.log(`[BotOrchestration] Checking rebalance conditions in ${mode} mode`);
    
    try {
      // Get all positions from store
      const { useAppStore } = await import("@/store");
      const positions = useAppStore.getState().positions;
      
      if (!positions || positions.length === 0) {
        console.log("[BotOrchestration] No positions found for rebalancing");
        return 0;
      }

      let rebalanced = 0;

      // Check each position for rebalance opportunities
      for (const position of positions) {
        // Check if position is out of range or underperforming
        const isOutOfRange = position.status === "out-of-range";
        const currentAPY = 0; // APY tracking placeholder

        // Find better opportunities for the same token pair
        const minRebalanceEdge = policy.minRebalanceEdge || 5;
        const betterOpportunities = opportunities.filter(opp => {
          // Same pair, different pool or protocol
          return opp.pair === position.pair && 
                 opp.estimatedAPY > currentAPY * (1 + minRebalanceEdge / 100);
        });

        if (betterOpportunities.length > 0 || isOutOfRange) {
          const bestOpp = betterOpportunities[0];
          const apyImprovement = bestOpp ? ((bestOpp.estimatedAPY - currentAPY) / (currentAPY || 1) * 100).toFixed(2) : "N/A";
          
          console.log(`[BotOrchestration] Rebalancing position ${position.id}: ${isOutOfRange ? 'Out of range' : `+${apyImprovement}% APY improvement`}`);
          
          // Publish rebalance event via orchestrator
          const { orchestrator } = await import("@/core/orchestrator");
          await orchestrator.publishEvent({
            type: "position_rebalanced",
            source: "bot_automation",
            timestamp: new Date(),
            affectedModules: ["positions"],
            data: {
              positionId: position.id,
              pair: position.pair,
              reason: isOutOfRange ? "out-of-range" : "better_opportunity",
              targetOpportunity: bestOpp?.id,
            },
          });

          rebalanced++;
          
          // Add alert to store
          useAppStore.getState().addAlert({
            id: `rebalance-${position.id}-${Date.now()}`,
            type: "info",
            title: "Auto-Rebalance Executed",
            message: `Rebalanced ${position.pair}: ${isOutOfRange ? 'Out of range' : `+${apyImprovement}% APY improvement`}`,
            timestamp: new Date(),
          });
        }
      }

      if (rebalanced > 0) {
        console.log(`[BotOrchestration] Successfully rebalanced ${rebalanced} position(s)`);
      } else {
        console.log("[BotOrchestration] No positions met rebalance criteria");
      }

      return rebalanced;
    } catch (error) {
      console.error("[BotOrchestration] Error in executeAutoRebalance:", error);
      return 0;
    }
  }

  /**
   * Load user policy from database
   */
  private async loadPolicy(): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn("[BotOrchestration] No authenticated user");
        return null;
      }

      const { data, error } = await supabase
        .from("user_policies")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("[BotOrchestration] Failed to load policy:", error);
        return null;
      }

      if (!data) {
        console.warn("[BotOrchestration] No policy found for user");
        return null;
      }

      return {
        autoHarvest: data.auto_harvest ?? false,
        autoCompound: data.auto_compound ?? false,
        autoRebalance: data.auto_rebalance ?? false,
        emergencyPause: data.emergency_pause ?? false,
        minHarvestValue: Number(data.min_harvest_value) || 50,
        compoundThreshold: Number(data.compound_threshold) || 100,
        rebalanceThreshold: Number(data.rebalance_threshold) || 5.0,
        maxPerPool: Number(data.max_per_pool) || 10000,
        maxPerChain: Number(data.max_per_chain) || 50000,
        maxTotalDeployed: Number(data.max_total_deployed) || 100000,
        dailyGasBudget: Number(data.daily_gas_budget) || 100,
        maxGasPrice: Number(data.max_gas_price) || 100,
        maxSlippage: Number(data.max_slippage) || 2.0,
        maxImpermanentLoss: Number(data.max_impermanent_loss) || 10.0,
      };
    } catch (error) {
      console.error("[BotOrchestration] Error loading policy:", error);
      return null;
    }
  }

  /**
   * Save bot status to database
   */
  private async saveBotStatus(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn("[BotOrchestration] No authenticated user, skipping status save");
        return;
      }

      // Store bot status in local storage for now (can be moved to database if needed)
      localStorage.setItem("bot_status", JSON.stringify({
        isRunning: this.status.isRunning,
        startedAt: this.status.startedAt?.toISOString(),
        lastActionAt: this.status.lastActionAt?.toISOString(),
        totalActions: this.status.totalActions,
        mode: this.status.mode,
      }));

      console.log("[BotOrchestration] Bot status saved");
    } catch (error) {
      console.error("[BotOrchestration] Failed to save bot status:", error);
    }
  }

  /**
   * Load bot status from storage
   */
  async loadBotStatus(): Promise<void> {
    try {
      const stored = localStorage.getItem("bot_status");
      
      if (!stored) {
        console.log("[BotOrchestration] No stored bot status");
        return;
      }

      const parsed = JSON.parse(stored);

      // Restore status but don't auto-restart the bot
      // User must manually start it again
      this.status = {
        isRunning: false, // Always start as stopped
        startedAt: parsed.startedAt ? new Date(parsed.startedAt) : null,
        lastActionAt: parsed.lastActionAt ? new Date(parsed.lastActionAt) : null,
        totalActions: parsed.totalActions || 0,
        mode: parsed.mode || "demo",
      };

      console.log("[BotOrchestration] Bot status loaded (not auto-started)");
    } catch (error) {
      console.error("[BotOrchestration] Failed to load bot status:", error);
    }
  }
}

export const botOrchestrationService = new BotOrchestrationService();