
<![CDATA[
/**
 * Server Audit Service
 * Append-only server-side audit log
 * 
 * CRITICAL: All fund-critical actions must be logged
 */

import { supabase } from "@/integrations/supabase/client";
import type { AuditActionType } from "@/core/contracts";

export interface ServerAuditLog {
  id: string;
  action_type: AuditActionType;
  actor: string;
  mode: "demo" | "shadow" | "live";
  wallet_address?: string;
  user_id?: string;
  execution_record_id?: string;
  details: Record<string, any>;
  success: boolean;
  error_message?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class ServerAuditService {
  /**
   * Log action to server-side audit trail
   * 
   * CRITICAL: Append-only, immutable records
   */
  async log(params: {
    actionType: AuditActionType;
    actor: string;
    mode: "demo" | "shadow" | "live";
    walletAddress?: string;
    executionRecordId?: string;
    details: Record<string, any>;
    success: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
  }): Promise<ServerAuditLog | null> {
    console.log(`[ServerAuditService] Logging action: ${params.actionType}`);

    const { data, error } = await supabase
      .from("audit_logs")
      .insert({
        action_type: params.actionType,
        actor: params.actor,
        mode: params.mode,
        wallet_address: params.walletAddress,
        execution_record_id: params.executionRecordId,
        details: params.details,
        success: params.success,
        error_message: params.errorMessage,
        metadata: params.metadata,
      })
      .select()
      .single();

    if (error) {
      console.error(`[ServerAuditService] Failed to log action:`, error);
      return null;
    }

    return this.mapLog(data);
  }

  /**
   * Get audit logs for wallet
   */
  async getWalletLogs(
    walletAddress: string,
    options?: {
      mode?: "demo" | "shadow" | "live";
      actionType?: AuditActionType;
      limit?: number;
    }
  ): Promise<ServerAuditLog[]> {
    let query = supabase
      .from("audit_logs")
      .select("*")
      .eq("wallet_address", walletAddress)
      .order("timestamp", { ascending: false });

    if (options?.mode) {
      query = query.eq("mode", options.mode);
    }

    if (options?.actionType) {
      query = query.eq("action_type", options.actionType);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error(`[ServerAuditService] Failed to fetch logs:`, error);
      return [];
    }

    return data.map((log) => this.mapLog(log));
  }

  /**
   * Get logs for execution record
   */
  async getExecutionLogs(executionRecordId: string): Promise<ServerAuditLog[]> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("execution_record_id", executionRecordId)
      .order("timestamp", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((log) => this.mapLog(log));
  }

  /**
   * Map database log to interface
   */
  private mapLog(data: any): ServerAuditLog {
    return {
      id: data.id,
      action_type: data.action_type,
      actor: data.actor,
      mode: data.mode,
      wallet_address: data.wallet_address,
      user_id: data.user_id,
      execution_record_id: data.execution_record_id,
      details: data.details,
      success: data.success,
      error_message: data.error_message,
      timestamp: new Date(data.timestamp),
      metadata: data.metadata,
    };
  }
}

export const serverAuditService = new ServerAuditService();
