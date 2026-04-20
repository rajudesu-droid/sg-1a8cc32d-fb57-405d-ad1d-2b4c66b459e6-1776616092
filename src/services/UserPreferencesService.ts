/**
 * User Preferences Service
 * Handles saving and loading user settings across the app
 */

import { supabase } from "@/integrations/supabase/client";

export interface UserPreferences {
  enabledChains: string[];
  enabledProtocols: Array<{ id: string; enabled: boolean }>;
  defaultSlippage: number;
  autoApprove: boolean;
  notifyOutOfRange: boolean;
  notifyHarvest: boolean;
  notifyRebalance: boolean;
  notifyActions: boolean;
  emailAlerts: boolean;
  pushAlerts: boolean;
  discordAlerts: boolean;
  debugMode: boolean;
  testnetMode: boolean;
}

export interface UserPolicy {
  autoHarvest: boolean;
  autoCompound: boolean;
  autoRebalance: boolean;
  emergencyPause: boolean;
  minHarvestValue: number;
  compoundThreshold: number;
  rebalanceThreshold: number;
  maxPerPool: number;
  maxPerChain: number;
  maxTotalDeployed: number;
  dailyGasBudget: number;
  maxGasPrice: number;
  maxSlippage: number;
  maxImpermanentLoss: number;
}

class UserPreferencesService {
  /**
   * Load user preferences from database
   */
  async loadPreferences(): Promise<UserPreferences | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("[UserPreferencesService] No authenticated user");
        return null;
      }

      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No preferences found - return defaults
          console.log("[UserPreferencesService] No preferences found, using defaults");
          return this.getDefaultPreferences();
        }
        throw error;
      }

      return {
        enabledChains: data.enabled_chains || [],
        enabledProtocols: data.enabled_protocols || [],
        defaultSlippage: parseFloat(data.default_slippage) || 2.0,
        autoApprove: data.auto_approve || false,
        notifyOutOfRange: data.notify_out_of_range ?? true,
        notifyHarvest: data.notify_harvest ?? true,
        notifyRebalance: data.notify_rebalance ?? false,
        notifyActions: data.notify_actions ?? true,
        emailAlerts: data.email_alerts ?? true,
        pushAlerts: data.push_alerts ?? true,
        discordAlerts: data.discord_alerts ?? false,
        debugMode: data.debug_mode ?? false,
        testnetMode: data.testnet_mode ?? false,
      };
    } catch (error) {
      console.error("[UserPreferencesService] Failed to load preferences:", error);
      return null;
    }
  }

  /**
   * Save user preferences to database
   */
  async savePreferences(preferences: UserPreferences): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("[UserPreferencesService] No authenticated user");
        return false;
      }

      // Check if preferences exist
      const { data: existing } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", user.id)
        .single();

      const payload = {
        user_id: user.id,
        enabled_chains: preferences.enabledChains,
        enabled_protocols: preferences.enabledProtocols,
        default_slippage: preferences.defaultSlippage,
        auto_approve: preferences.autoApprove,
        notify_out_of_range: preferences.notifyOutOfRange,
        notify_harvest: preferences.notifyHarvest,
        notify_rebalance: preferences.notifyRebalance,
        notify_actions: preferences.notifyActions,
        email_alerts: preferences.emailAlerts,
        push_alerts: preferences.pushAlerts,
        discord_alerts: preferences.discordAlerts,
        debug_mode: preferences.debugMode,
        testnet_mode: preferences.testnetMode,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        // Update existing preferences
        const { error } = await supabase
          .from("user_preferences")
          .update(payload as any)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Insert new preferences
        const { error } = await supabase
          .from("user_preferences")
          .insert(payload as any);

        if (error) throw error;
      }

      console.log("[UserPreferencesService] Preferences saved successfully");
      return true;
    } catch (error) {
      console.error("[UserPreferencesService] Failed to save preferences:", error);
      return false;
    }
  }

  /**
   * Load user policy from database
   */
  async loadPolicy(): Promise<UserPolicy | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("[UserPreferencesService] No authenticated user");
        return null;
      }

      const { data, error } = await supabase
        .from("user_policies")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No policy found - return defaults
          console.log("[UserPreferencesService] No policy found, using defaults");
          return this.getDefaultPolicy();
        }
        throw error;
      }

      return {
        autoHarvest: data.auto_harvest ?? false,
        autoCompound: data.auto_compound ?? false,
        autoRebalance: data.auto_rebalance ?? false,
        emergencyPause: data.emergency_pause ?? false,
        minHarvestValue: parseFloat(data.min_harvest_value) || 50,
        compoundThreshold: parseFloat(data.compound_threshold) || 100,
        rebalanceThreshold: parseFloat(data.rebalance_threshold) || 5.0,
        maxPerPool: parseFloat(data.max_per_pool) || 10000,
        maxPerChain: parseFloat(data.max_per_chain) || 50000,
        maxTotalDeployed: parseFloat(data.max_total_deployed) || 100000,
        dailyGasBudget: parseFloat(data.daily_gas_budget) || 100,
        maxGasPrice: parseFloat(data.max_gas_price) || 100,
        maxSlippage: parseFloat(data.max_slippage) || 2.0,
        maxImpermanentLoss: parseFloat(data.max_impermanent_loss) || 10.0,
      };
    } catch (error) {
      console.error("[UserPreferencesService] Failed to load policy:", error);
      return null;
    }
  }

  /**
   * Save user policy to database
   */
  async savePolicy(policy: UserPolicy): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("[UserPreferencesService] No authenticated user");
        return false;
      }

      // Check if policy exists
      const { data: existing } = await supabase
        .from("user_policies")
        .select("id")
        .eq("user_id", user.id)
        .single();

      const payload = {
        user_id: user.id,
        auto_harvest: policy.autoHarvest,
        auto_compound: policy.autoCompound,
        auto_rebalance: policy.autoRebalance,
        emergency_pause: policy.emergencyPause,
        min_harvest_value: policy.minHarvestValue,
        compound_threshold: policy.compoundThreshold,
        rebalance_threshold: policy.rebalanceThreshold,
        max_per_pool: policy.maxPerPool,
        max_per_chain: policy.maxPerChain,
        max_total_deployed: policy.maxTotalDeployed,
        daily_gas_budget: policy.dailyGasBudget,
        max_gas_price: policy.maxGasPrice,
        max_slippage: policy.maxSlippage,
        max_impermanent_loss: policy.maxImpermanentLoss,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        // Update existing policy
        const { error } = await supabase
          .from("user_policies")
          .update(payload as any)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Insert new policy
        const { error } = await supabase
          .from("user_policies")
          .insert(payload as any);

        if (error) throw error;
      }

      console.log("[UserPreferencesService] Policy saved successfully");
      return true;
    } catch (error) {
      console.error("[UserPreferencesService] Failed to save policy:", error);
      return false;
    }
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      enabledChains: [],
      enabledProtocols: [],
      defaultSlippage: 2.0,
      autoApprove: false,
      notifyOutOfRange: true,
      notifyHarvest: true,
      notifyRebalance: false,
      notifyActions: true,
      emailAlerts: true,
      pushAlerts: true,
      discordAlerts: false,
      debugMode: false,
      testnetMode: false,
    };
  }

  /**
   * Get default policy
   */
  private getDefaultPolicy(): UserPolicy {
    return {
      autoHarvest: false,
      autoCompound: false,
      autoRebalance: false,
      emergencyPause: false,
      minHarvestValue: 50,
      compoundThreshold: 100,
      rebalanceThreshold: 5.0,
      maxPerPool: 10000,
      maxPerChain: 50000,
      maxTotalDeployed: 100000,
      dailyGasBudget: 100,
      maxGasPrice: 100,
      maxSlippage: 2.0,
      maxImpermanentLoss: 10.0,
    };
  }
}

export const userPreferencesService = new UserPreferencesService();