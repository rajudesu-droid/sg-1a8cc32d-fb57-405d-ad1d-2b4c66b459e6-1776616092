<![CDATA[
// ============================================================================
// PERFORMANCE MONITOR
// Tracks execution latency and identifies bottlenecks
// ============================================================================

interface LatencyMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  operation: string;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  p95Latency: number;
  count: number;
  lastUpdated: Date;
}

export class PerformanceMonitor {
  private metrics: Map<string, LatencyMetric[]> = new Map();
  private activeOperations: Map<string, number> = new Map();
  private maxMetricsPerOperation = 100; // Keep last 100 samples
  
  private warningThresholds: Record<string, number> = {
    "trigger_detection": 50,      // ms
    "validation": 100,
    "action_planning": 200,
    "preview_generation": 100,
    "execution_start": 500,
    "execution_step": 2000,
    "sync_propagation": 100,
    "page_refresh": 200,
    "opportunity_scan": 5000,
    "balance_refresh": 1000,
  };

  /**
   * Start tracking an operation
   */
  startOperation(operationId: string, operation: string, metadata?: Record<string, any>): void {
    this.activeOperations.set(operationId, performance.now());
    
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
  }

  /**
   * End tracking an operation
   */
  endOperation(operationId: string, operation: string, metadata?: Record<string, any>): number {
    const startTime = this.activeOperations.get(operationId);
    if (!startTime) {
      console.warn(`[PerformanceMonitor] Operation ${operationId} not found`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    this.activeOperations.delete(operationId);

    // Record metric
    const metrics = this.metrics.get(operation) || [];
    metrics.push({
      operation,
      startTime,
      endTime,
      duration,
      metadata,
    });

    // Keep only recent metrics
    if (metrics.length > this.maxMetricsPerOperation) {
      metrics.shift();
    }

    this.metrics.set(operation, metrics);

    // Check threshold
    const threshold = this.warningThresholds[operation];
    if (threshold && duration > threshold) {
      console.warn(
        `[PerformanceMonitor] ⚠️ SLOW: ${operation} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`,
        metadata
      );
    }

    return duration;
  }

  /**
   * Get statistics for an operation
   */
  getStats(operation: string): PerformanceStats | null {
    const metrics = this.metrics.get(operation);
    if (!metrics || metrics.length === 0) return null;

    const durations = metrics
      .filter((m) => m.duration !== undefined)
      .map((m) => m.duration!);

    if (durations.length === 0) return null;

    const sorted = [...durations].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);

    return {
      operation,
      avgLatency: durations.reduce((a, b) => a + b, 0) / durations.length,
      minLatency: Math.min(...durations),
      maxLatency: Math.max(...durations),
      p95Latency: sorted[p95Index] || sorted[sorted.length - 1],
      count: durations.length,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get all performance statistics
   */
  getAllStats(): PerformanceStats[] {
    const stats: PerformanceStats[] = [];
    
    for (const operation of this.metrics.keys()) {
      const stat = this.getStats(operation);
      if (stat) stats.push(stat);
    }

    return stats.sort((a, b) => b.avgLatency - a.avgLatency);
  }

  /**
   * Get slow operations (above threshold)
   */
  getSlowOperations(): PerformanceStats[] {
    return this.getAllStats().filter((stat) => {
      const threshold = this.warningThresholds[stat.operation];
      return threshold && stat.avgLatency > threshold;
    });
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.activeOperations.clear();
  }

  /**
   * Track async operation
   */
  async trackAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const operationId = `${operation}-${Date.now()}-${Math.random()}`;
    this.startOperation(operationId, operation, metadata);

    try {
      const result = await fn();
      this.endOperation(operationId, operation, metadata);
      return result;
    } catch (error) {
      this.endOperation(operationId, operation, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Track sync operation
   */
  track<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const operationId = `${operation}-${Date.now()}-${Math.random()}`;
    this.startOperation(operationId, operation, metadata);

    try {
      const result = fn();
      this.endOperation(operationId, operation, metadata);
      return result;
    } catch (error) {
      this.endOperation(operationId, operation, { ...metadata, error: true });
      throw error;
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();
