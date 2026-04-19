// ============================================================================
// TRIGGER ENGINE
// Receives and queues execution requests from all sources
// ============================================================================

import { orchestrator } from "../orchestrator";
import { useAppStore } from "@/store";
import type {
  ActionTrigger,
  ActionType,
  TriggerSource,
  ActionUrgency,
  ExecutionMode,
} from "../contracts/actions";

interface TriggerOptions {
  actionType: ActionType;
  source: TriggerSource;
  mode?: ExecutionMode;
  urgency?: ActionUrgency;
  
  walletAddress?: string;
  chain?: string;
  protocol?: string;
  poolAddress?: string;
  positionId?: string;
  
  amount?: number;
  token?: string;
  slippage?: number;
  
  reason: string;
  metadata?: Record<string, any>;
  
  expiresIn?: number; // milliseconds
}

export class TriggerEngine {
  private engineId = "trigger-engine";
  private triggerQueue: ActionTrigger[] = [];

  constructor() {
    console.log("[TriggerEngine] Initializing...");
    this.registerWithOrchestrator();
  }

  private registerWithOrchestrator() {
    orchestrator.registerEngine(this.engineId, this);
    console.log("[TriggerEngine] Registered with orchestrator");
  }

  // ============================================================================
  // TRIGGER CREATION
  // ============================================================================

  async createTrigger(options: TriggerOptions): Promise<ActionTrigger> {
    const mode = options.mode || useAppStore.getState().mode.current;
    const urgency = options.urgency || "normal";

    const trigger: ActionTrigger = {
      id: this.generateTriggerId(),
      actionType: options.actionType,
      source: options.source,
      mode,
      urgency,
      
      walletAddress: options.walletAddress,
      chain: options.chain,
      protocol: options.protocol,
      poolAddress: options.poolAddress,
      positionId: options.positionId,
      
      amount: options.amount,
      token: options.token,
      slippage: options.slippage,
      
      reason: options.reason,
      metadata: options.metadata,
      
      triggeredAt: new Date(),
      expiresAt: options.expiresIn
        ? new Date(Date.now() + options.expiresIn)
        : undefined,
    };

    // Add to queue
    this.triggerQueue.push(trigger);

    console.log(`[TriggerEngine] Created trigger: ${trigger.id} (${trigger.actionType})`);

    // Notify orchestrator
    orchestrator.coordinateUpdate(
      this.engineId,
      "action_triggered" as any,
      { trigger },
      ["execution-engine", "audit-engine"]
    );

    return trigger;
  }

  // ============================================================================
  // CONVENIENCE METHODS FOR COMMON TRIGGERS
  // ============================================================================

  async triggerEnterPosition(
    protocol: string,
    poolAddress: string,
    amount: number,
    token: string,
    reason: string,
    source: TriggerSource = "user_manual"
  ): Promise<ActionTrigger> {
    return this.createTrigger({
      actionType: "ADD_LIQUIDITY",
      source,
      protocol,
      poolAddress,
      amount,
      token,
      slippage: 1.5,
      reason,
      urgency: "normal",
    });
  }

  async triggerHarvest(
    positionId: string,
    reason: string,
    source: TriggerSource = "harvest_engine"
  ): Promise<ActionTrigger> {
    return this.createTrigger({
      actionType: "HARVEST_REWARDS",
      source,
      positionId,
      reason,
      urgency: "normal",
    });
  }

  async triggerCompound(
    positionId: string,
    reason: string,
    source: TriggerSource = "farming_strategy"
  ): Promise<ActionTrigger> {
    return this.createTrigger({
      actionType: "COMPOUND",
      source,
      positionId,
      reason,
      urgency: "normal",
    });
  }

  async triggerRebalance(
    positionId: string,
    reason: string,
    source: TriggerSource = "rebalance_engine"
  ): Promise<ActionTrigger> {
    return this.createTrigger({
      actionType: "REBALANCE",
      source,
      positionId,
      reason,
      urgency: "high",
    });
  }

  async triggerExit(
    positionId: string,
    amount: number,
    reason: string,
    source: TriggerSource = "user_manual"
  ): Promise<ActionTrigger> {
    return this.createTrigger({
      actionType: "EXIT_POSITION",
      source,
      positionId,
      amount,
      reason,
      urgency: "high",
    });
  }

  async triggerWithdraw(
    amount: number,
    token: string,
    reason: string,
    source: TriggerSource = "withdrawal_engine"
  ): Promise<ActionTrigger> {
    return this.createTrigger({
      actionType: "WITHDRAW_FUNDS",
      source,
      amount,
      token,
      reason,
      urgency: "high",
    });
  }

  async triggerEmergencyPause(
    reason: string,
    source: TriggerSource = "risk_engine"
  ): Promise<ActionTrigger> {
    return this.createTrigger({
      actionType: "EMERGENCY_PAUSE",
      source,
      reason,
      urgency: "critical",
    });
  }

  // ============================================================================
  // QUEUE MANAGEMENT
  // ============================================================================

  getQueuedTriggers(): ActionTrigger[] {
    return [...this.triggerQueue];
  }

  getPendingCount(): number {
    return this.triggerQueue.length;
  }

  clearExpiredTriggers(): number {
    const now = new Date();
    const before = this.triggerQueue.length;
    
    this.triggerQueue = this.triggerQueue.filter((trigger) => {
      if (trigger.expiresAt && trigger.expiresAt < now) {
        console.log(`[TriggerEngine] Expired trigger: ${trigger.id}`);
        return false;
      }
      return true;
    });

    const removed = before - this.triggerQueue.length;
    if (removed > 0) {
      console.log(`[TriggerEngine] Cleared ${removed} expired triggers`);
    }
    
    return removed;
  }

  removeTrigger(triggerId: string): boolean {
    const before = this.triggerQueue.length;
    this.triggerQueue = this.triggerQueue.filter((t) => t.id !== triggerId);
    return this.triggerQueue.length < before;
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private generateTriggerId(): string {
    return `trigger-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    this.clearExpiredTriggers();
    return {
      healthy: true,
      message: `TriggerEngine operational - ${this.triggerQueue.length} queued`,
    };
  }
}

export const triggerEngine = new TriggerEngine();