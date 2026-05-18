/* eslint-disable @typescript-eslint/no-empty-object-type */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      actions: {
        Row: {
          action_type: string
          created_at: string | null
          details: Json | null
          error_message: string | null
          execution_mode: string
          gas_used: number | null
          id: string
          portfolio_id: string
          position_id: string | null
          success: boolean | null
          tx_hash: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          execution_mode: string
          gas_used?: number | null
          id?: string
          portfolio_id: string
          position_id?: string | null
          success?: boolean | null
          tx_hash?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          execution_mode?: string
          gas_used?: number | null
          id?: string
          portfolio_id?: string
          position_id?: string | null
          success?: boolean | null
          tx_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actions_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_kind: string
          chain_family: string
          contract_address: string | null
          created_at: string | null
          currency_code: string | null
          decimals: number
          id: string
          issuer: string | null
          logo_url: string | null
          mint_address: string | null
          name: string
          network: string
          portfolio_id: string
          symbol: string
          token_standard: string | null
          updated_at: string | null
        }
        Insert: {
          asset_kind: string
          chain_family: string
          contract_address?: string | null
          created_at?: string | null
          currency_code?: string | null
          decimals?: number
          id?: string
          issuer?: string | null
          logo_url?: string | null
          mint_address?: string | null
          name: string
          network: string
          portfolio_id: string
          symbol: string
          token_standard?: string | null
          updated_at?: string | null
        }
        Update: {
          asset_kind?: string
          chain_family?: string
          contract_address?: string | null
          created_at?: string | null
          currency_code?: string | null
          decimals?: number
          id?: string
          issuer?: string | null
          logo_url?: string | null
          mint_address?: string | null
          name?: string
          network?: string
          portfolio_id?: string
          symbol?: string
          token_standard?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_type: string
          actor: string
          details: Json
          error_message: string | null
          execution_record_id: string | null
          id: string
          metadata: Json | null
          mode: string
          success: boolean
          timestamp: string | null
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          action_type: string
          actor: string
          details: Json
          error_message?: string | null
          execution_record_id?: string | null
          id?: string
          metadata?: Json | null
          mode: string
          success: boolean
          timestamp?: string | null
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          action_type?: string
          actor?: string
          details?: Json
          error_message?: string | null
          execution_record_id?: string | null
          id?: string
          metadata?: Json | null
          mode?: string
          success?: boolean
          timestamp?: string | null
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_execution_record_id_fkey"
            columns: ["execution_record_id"]
            isOneToOne: false
            referencedRelation: "execution_records"
            referencedColumns: ["id"]
          },
        ]
      }
      balances: {
        Row: {
          asset_id: string
          created_at: string | null
          id: string
          last_updated: string | null
          portfolio_id: string
          price_override: number | null
          quantity: number
        }
        Insert: {
          asset_id: string
          created_at?: string | null
          id?: string
          last_updated?: string | null
          portfolio_id: string
          price_override?: number | null
          quantity?: number
        }
        Update: {
          asset_id?: string
          created_at?: string | null
          id?: string
          last_updated?: string | null
          portfolio_id?: string
          price_override?: number | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "balances_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balances_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_records: {
        Row: {
          action_id: string
          action_plan_snapshot: Json | null
          action_type: string
          allowances_after: Json | null
          allowances_before: Json | null
          balances_after: Json | null
          balances_before: Json | null
          chain: string | null
          completed_at: string | null
          created_at: string | null
          critical_discrepancies: number | null
          discrepancy_flags: string[] | null
          error_message: string | null
          gas_used: number | null
          id: string
          metadata: Json | null
          mode: string
          pool_address: string | null
          positions_after: Json | null
          positions_before: Json | null
          preview_snapshot: Json | null
          protocol: string | null
          receipts: Json | null
          reconciled_at: string | null
          reconciliation_result: Json | null
          rewards_after: Json | null
          rewards_before: Json | null
          spender_addresses: string[] | null
          started_at: string | null
          state_drift_detected: boolean | null
          status: string
          target_contracts: string[] | null
          total_cost_usd: number | null
          tx_hashes: string[] | null
          user_id: string | null
          validation_snapshot: Json | null
          wallet_address: string
        }
        Insert: {
          action_id: string
          action_plan_snapshot?: Json | null
          action_type: string
          allowances_after?: Json | null
          allowances_before?: Json | null
          balances_after?: Json | null
          balances_before?: Json | null
          chain?: string | null
          completed_at?: string | null
          created_at?: string | null
          critical_discrepancies?: number | null
          discrepancy_flags?: string[] | null
          error_message?: string | null
          gas_used?: number | null
          id?: string
          metadata?: Json | null
          mode: string
          pool_address?: string | null
          positions_after?: Json | null
          positions_before?: Json | null
          preview_snapshot?: Json | null
          protocol?: string | null
          receipts?: Json | null
          reconciled_at?: string | null
          reconciliation_result?: Json | null
          rewards_after?: Json | null
          rewards_before?: Json | null
          spender_addresses?: string[] | null
          started_at?: string | null
          state_drift_detected?: boolean | null
          status: string
          target_contracts?: string[] | null
          total_cost_usd?: number | null
          tx_hashes?: string[] | null
          user_id?: string | null
          validation_snapshot?: Json | null
          wallet_address: string
        }
        Update: {
          action_id?: string
          action_plan_snapshot?: Json | null
          action_type?: string
          allowances_after?: Json | null
          allowances_before?: Json | null
          balances_after?: Json | null
          balances_before?: Json | null
          chain?: string | null
          completed_at?: string | null
          created_at?: string | null
          critical_discrepancies?: number | null
          discrepancy_flags?: string[] | null
          error_message?: string | null
          gas_used?: number | null
          id?: string
          metadata?: Json | null
          mode?: string
          pool_address?: string | null
          positions_after?: Json | null
          positions_before?: Json | null
          preview_snapshot?: Json | null
          protocol?: string | null
          receipts?: Json | null
          reconciled_at?: string | null
          reconciliation_result?: Json | null
          rewards_after?: Json | null
          rewards_before?: Json | null
          spender_addresses?: string[] | null
          started_at?: string | null
          state_drift_detected?: boolean | null
          status?: string
          target_contracts?: string[] | null
          total_cost_usd?: number | null
          tx_hashes?: string[] | null
          user_id?: string | null
          validation_snapshot?: Json | null
          wallet_address?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          calculated_at: string | null
          concentration_risk: number
          farm_reward_apy: number | null
          fee_apy: number
          id: string
          il_risk: number
          net_score: number
          pool_id: string
          recommended_max_price: number | null
          recommended_min_price: number | null
          tvl: number
          volatility_risk: number
          volume_24h: number
        }
        Insert: {
          calculated_at?: string | null
          concentration_risk: number
          farm_reward_apy?: number | null
          fee_apy: number
          id?: string
          il_risk: number
          net_score: number
          pool_id: string
          recommended_max_price?: number | null
          recommended_min_price?: number | null
          tvl: number
          volatility_risk: number
          volume_24h: number
        }
        Update: {
          calculated_at?: string | null
          concentration_risk?: number
          farm_reward_apy?: number | null
          fee_apy?: number
          id?: string
          il_risk?: number
          net_score?: number
          pool_id?: string
          recommended_max_price?: number | null
          recommended_min_price?: number | null
          tvl?: number
          volatility_risk?: number
          volume_24h?: number
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "supported_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      policies: {
        Row: {
          auto_compound: boolean | null
          auto_deploy: boolean | null
          auto_harvest: boolean | null
          auto_rebalance: boolean | null
          created_at: string | null
          emergency_pause: boolean | null
          id: string
          max_capital_per_chain_usd: number | null
          max_capital_per_pool_usd: number | null
          max_daily_gas_budget_usd: number | null
          max_total_deployed_usd: number | null
          min_harvest_value_usd: number | null
          min_opportunity_score: number | null
          min_rebalance_edge_percent: number | null
          portfolio_id: string
          updated_at: string | null
          whitelisted_chains: Json | null
          whitelisted_dexes: Json | null
        }
        Insert: {
          auto_compound?: boolean | null
          auto_deploy?: boolean | null
          auto_harvest?: boolean | null
          auto_rebalance?: boolean | null
          created_at?: string | null
          emergency_pause?: boolean | null
          id?: string
          max_capital_per_chain_usd?: number | null
          max_capital_per_pool_usd?: number | null
          max_daily_gas_budget_usd?: number | null
          max_total_deployed_usd?: number | null
          min_harvest_value_usd?: number | null
          min_opportunity_score?: number | null
          min_rebalance_edge_percent?: number | null
          portfolio_id: string
          updated_at?: string | null
          whitelisted_chains?: Json | null
          whitelisted_dexes?: Json | null
        }
        Update: {
          auto_compound?: boolean | null
          auto_deploy?: boolean | null
          auto_harvest?: boolean | null
          auto_rebalance?: boolean | null
          created_at?: string | null
          emergency_pause?: boolean | null
          id?: string
          max_capital_per_chain_usd?: number | null
          max_capital_per_pool_usd?: number | null
          max_daily_gas_budget_usd?: number | null
          max_total_deployed_usd?: number | null
          min_harvest_value_usd?: number | null
          min_opportunity_score?: number | null
          min_rebalance_edge_percent?: number | null
          portfolio_id?: string
          updated_at?: string | null
          whitelisted_chains?: Json | null
          whitelisted_dexes?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: true
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          mode: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          mode: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          mode?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          closed_at: string | null
          created_at: string | null
          current_price: number | null
          entry_price: number
          entry_timestamp: string | null
          entry_value_usd: number
          estimated_il_usd: number | null
          health_score: number | null
          id: string
          is_in_range: boolean | null
          max_price: number | null
          min_price: number | null
          pool_id: string
          portfolio_id: string
          status: string
          token0_amount: number
          token1_amount: number
          total_fees_usd: number | null
          total_rewards_usd: number | null
          updated_at: string | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string | null
          current_price?: number | null
          entry_price: number
          entry_timestamp?: string | null
          entry_value_usd: number
          estimated_il_usd?: number | null
          health_score?: number | null
          id?: string
          is_in_range?: boolean | null
          max_price?: number | null
          min_price?: number | null
          pool_id: string
          portfolio_id: string
          status?: string
          token0_amount: number
          token1_amount: number
          total_fees_usd?: number | null
          total_rewards_usd?: number | null
          updated_at?: string | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string | null
          current_price?: number | null
          entry_price?: number
          entry_timestamp?: string | null
          entry_value_usd?: number
          estimated_il_usd?: number | null
          health_score?: number | null
          id?: string
          is_in_range?: boolean | null
          max_price?: number | null
          min_price?: number | null
          pool_id?: string
          portfolio_id?: string
          status?: string
          token0_amount?: number
          token1_amount?: number
          total_fees_usd?: number | null
          total_rewards_usd?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "positions_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "supported_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rewards: {
        Row: {
          amount: number
          claimed_at: string | null
          created_at: string | null
          id: string
          is_claimed: boolean | null
          position_id: string
          reward_token_address: string
          reward_token_symbol: string
          value_usd: number | null
        }
        Insert: {
          amount: number
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          is_claimed?: boolean | null
          position_id: string
          reward_token_address: string
          reward_token_symbol: string
          value_usd?: number | null
        }
        Update: {
          amount?: number
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          is_claimed?: boolean | null
          position_id?: string
          reward_token_address?: string
          reward_token_symbol?: string
          value_usd?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rewards_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      supported_assets: {
        Row: {
          asset_kind: string
          chain_family: string
          coingecko_id: string | null
          contract_address: string | null
          created_at: string | null
          currency_code: string | null
          decimals: number
          id: string
          is_active: boolean | null
          issuer: string | null
          logo_url: string | null
          mint_address: string | null
          name: string
          network: string
          symbol: string
          updated_at: string | null
        }
        Insert: {
          asset_kind: string
          chain_family: string
          coingecko_id?: string | null
          contract_address?: string | null
          created_at?: string | null
          currency_code?: string | null
          decimals?: number
          id?: string
          is_active?: boolean | null
          issuer?: string | null
          logo_url?: string | null
          mint_address?: string | null
          name: string
          network: string
          symbol: string
          updated_at?: string | null
        }
        Update: {
          asset_kind?: string
          chain_family?: string
          coingecko_id?: string | null
          contract_address?: string | null
          created_at?: string | null
          currency_code?: string | null
          decimals?: number
          id?: string
          is_active?: boolean | null
          issuer?: string | null
          logo_url?: string | null
          mint_address?: string | null
          name?: string
          network?: string
          symbol?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      supported_pools: {
        Row: {
          chain_family: string
          created_at: string | null
          dex: string
          fee_tier: number
          id: string
          is_active: boolean | null
          network: string
          pool_address: string
          pool_type: string
          token0_address: string
          token0_symbol: string
          token1_address: string
          token1_symbol: string
        }
        Insert: {
          chain_family: string
          created_at?: string | null
          dex: string
          fee_tier: number
          id?: string
          is_active?: boolean | null
          network: string
          pool_address: string
          pool_type: string
          token0_address: string
          token0_symbol: string
          token1_address: string
          token1_symbol: string
        }
        Update: {
          chain_family?: string
          created_at?: string | null
          dex?: string
          fee_tier?: number
          id?: string
          is_active?: boolean | null
          network?: string
          pool_address?: string
          pool_type?: string
          token0_address?: string
          token0_symbol?: string
          token1_address?: string
          token1_symbol?: string
        }
        Relationships: []
      }
      user_policies: {
        Row: {
          auto_compound: boolean | null
          auto_harvest: boolean | null
          auto_rebalance: boolean | null
          compound_threshold: number | null
          created_at: string | null
          daily_gas_budget: number | null
          emergency_pause: boolean | null
          id: string
          max_gas_price: number | null
          max_impermanent_loss: number | null
          max_per_chain: number | null
          max_per_pool: number | null
          max_slippage: number | null
          max_total_deployed: number | null
          min_harvest_value: number | null
          rebalance_threshold: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auto_compound?: boolean | null
          auto_harvest?: boolean | null
          auto_rebalance?: boolean | null
          compound_threshold?: number | null
          created_at?: string | null
          daily_gas_budget?: number | null
          emergency_pause?: boolean | null
          id?: string
          max_gas_price?: number | null
          max_impermanent_loss?: number | null
          max_per_chain?: number | null
          max_per_pool?: number | null
          max_slippage?: number | null
          max_total_deployed?: number | null
          min_harvest_value?: number | null
          rebalance_threshold?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auto_compound?: boolean | null
          auto_harvest?: boolean | null
          auto_rebalance?: boolean | null
          compound_threshold?: number | null
          created_at?: string | null
          daily_gas_budget?: number | null
          emergency_pause?: boolean | null
          id?: string
          max_gas_price?: number | null
          max_impermanent_loss?: number | null
          max_per_chain?: number | null
          max_per_pool?: number | null
          max_slippage?: number | null
          max_total_deployed?: number | null
          min_harvest_value?: number | null
          rebalance_threshold?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          auto_approve: boolean | null
          created_at: string | null
          debug_mode: boolean | null
          default_slippage: number | null
          discord_alerts: boolean | null
          email_alerts: boolean | null
          enabled_chains: string[] | null
          enabled_protocols: Json | null
          id: string
          notify_actions: boolean | null
          notify_harvest: boolean | null
          notify_out_of_range: boolean | null
          notify_rebalance: boolean | null
          push_alerts: boolean | null
          testnet_mode: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auto_approve?: boolean | null
          created_at?: string | null
          debug_mode?: boolean | null
          default_slippage?: number | null
          discord_alerts?: boolean | null
          email_alerts?: boolean | null
          enabled_chains?: string[] | null
          enabled_protocols?: Json | null
          id?: string
          notify_actions?: boolean | null
          notify_harvest?: boolean | null
          notify_out_of_range?: boolean | null
          notify_rebalance?: boolean | null
          push_alerts?: boolean | null
          testnet_mode?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auto_approve?: boolean | null
          created_at?: string | null
          debug_mode?: boolean | null
          default_slippage?: number | null
          discord_alerts?: boolean | null
          email_alerts?: boolean | null
          enabled_chains?: string[] | null
          enabled_protocols?: Json | null
          id?: string
          notify_actions?: boolean | null
          notify_harvest?: boolean | null
          notify_out_of_range?: boolean | null
          notify_rebalance?: boolean | null
          push_alerts?: boolean | null
          testnet_mode?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      withdrawal_plans: {
        Row: {
          created_at: string | null
          executed_at: string | null
          execution_plan: Json
          final_amount_estimate: number | null
          id: string
          portfolio_id: string
          requested_amount_usd: number
          status: string
          target_token_symbol: string
          total_gas_estimate_usd: number | null
          total_slippage_estimate_usd: number | null
        }
        Insert: {
          created_at?: string | null
          executed_at?: string | null
          execution_plan: Json
          final_amount_estimate?: number | null
          id?: string
          portfolio_id: string
          requested_amount_usd: number
          status?: string
          target_token_symbol: string
          total_gas_estimate_usd?: number | null
          total_slippage_estimate_usd?: number | null
        }
        Update: {
          created_at?: string | null
          executed_at?: string | null
          execution_plan?: Json
          final_amount_estimate?: number | null
          id?: string
          portfolio_id?: string
          requested_amount_usd?: number
          status?: string
          target_token_symbol?: string
          total_gas_estimate_usd?: number | null
          total_slippage_estimate_usd?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_plans_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
