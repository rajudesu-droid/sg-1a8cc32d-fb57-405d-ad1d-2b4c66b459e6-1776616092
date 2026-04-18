/**
 * Central Orchestrator Engine
 * Coordinates all domain engines and ensures synchronized state
 */

import { EventEmitter } from "events";
import type { AppEvent, EventType, AppMode } from "@/core/contracts";

export class CentralOrchestrator extends EventEmitter {
  private static instance: CentralOrchestrator;
  private engineRegistry: Map<string, any> = new Map();
  private eventQueue: AppEvent[] = [];
  private isProcessing = false;

  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  static getInstance(): CentralOrchestrator {
    if (!CentralOrchestrator.instance) {
      CentralOrchestrator.instance = new CentralOrchestrator();
    }
    return CentralOrchestrator.instance;
  }

  // ==================== ENGINE REGISTRY ====================
  registerEngine(name: string, engine: any): void {
    this.engineRegistry.set(name, engine);
    console.log(`[Orchestrator] Engine registered: ${name}`);
  }

  getEngine<T>(name: string): T | undefined {
    return this.engineRegistry.get(name) as T;
  }

  getAllEngines(): string[] {
    return Array.from(this.engineRegistry.keys());
  }

  // ==================== EVENT COORDINATION ====================
  async publishEvent(event: AppEvent): Promise<void> {
    this.eventQueue.push(event);
    this.emit("event", event);
    
    console.log(`[Orchestrator] Event published: ${event.type}`, {
      source: event.source,
      affected: event.affectedModules,
    });

    if (!this.isProcessing) {
      await this.processEventQueue();
    }
  }

  private async processEventQueue(): Promise<void> {
    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (!event) continue;

      // Notify affected modules
      for (const moduleName of event.affectedModules) {
        const engine = this.engineRegistry.get(moduleName);
        if (engine && typeof engine.handleEvent === "function") {
          try {
            await engine.handleEvent(event);
          } catch (error) {
            console.error(`[Orchestrator] Error in ${moduleName}.handleEvent:`, error);
          }
        }
      }

      // Emit to listeners
      this.emit(event.type, event.data);
    }

    this.isProcessing = false;
  }

  // ==================== CROSS-MODULE COORDINATION ====================
  async coordinateUpdate(
    sourceEngine: string,
    eventType: EventType,
    data: any,
    affectedModules: string[]
  ): Promise<void> {
    const event: AppEvent = {
      type: eventType,
      timestamp: new Date(),
      source: sourceEngine,
      data,
      affectedModules,
    };

    await this.publishEvent(event);
  }

  // ==================== MODE CHANGE COORDINATION ====================
  async changeModeAcrossApp(newMode: AppMode): Promise<void> {
    console.log(`[Orchestrator] Mode change initiated: ${newMode}`);

    // Notify all engines about mode change
    const affectedModules = Array.from(this.engineRegistry.keys());
    
    await this.coordinateUpdate(
      "orchestrator",
      "mode_changed",
      { mode: newMode },
      affectedModules
    );

    // Trigger sync engine to refresh all data
    const syncEngine = this.getEngine("sync");
    if (syncEngine && typeof syncEngine.syncAll === "function") {
      await syncEngine.syncAll();
    }
  }

  // ==================== HEALTH CHECK ====================
  getSystemHealth(): {
    healthy: boolean;
    engines: Record<string, boolean>;
    queueLength: number;
  } {
    const engines: Record<string, boolean> = {};
    
    this.engineRegistry.forEach((engine, name) => {
      engines[name] = typeof engine.isHealthy === "function" 
        ? engine.isHealthy() 
        : true;
    });

    const allHealthy = Object.values(engines).every((h) => h);

    return {
      healthy: allHealthy,
      engines,
      queueLength: this.eventQueue.length,
    };
  }

  // ==================== SHUTDOWN ====================
  async shutdown(): Promise<void> {
    console.log("[Orchestrator] Shutting down...");
    
    // Notify all engines
    for (const [name, engine] of this.engineRegistry.entries()) {
      if (typeof engine.cleanup === "function") {
        try {
          await engine.cleanup();
        } catch (error) {
          console.error(`[Orchestrator] Error cleaning up ${name}:`, error);
        }
      }
    }

    this.engineRegistry.clear();
    this.eventQueue = [];
    this.removeAllListeners();
  }
}

// Export singleton instance
export const orchestrator = CentralOrchestrator.getInstance();