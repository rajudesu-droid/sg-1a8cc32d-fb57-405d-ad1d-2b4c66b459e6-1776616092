/**
 * Performance Monitor Component
 * Real-time performance metrics and bottleneck detection
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, Zap, AlertTriangle } from "lucide-react";
import { performanceMonitor } from "@/core/performance/PerformanceMonitor";
import { useEffect, useState } from "react";

interface PerformanceMetrics {
  avgValidation: number;
  avgPlanning: number;
  avgExecution: number;
  avgSync: number;
  slowestOperation: string;
  slowestDuration: number;
}

export function PerformanceMonitorWidget() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    const updateMetrics = () => {
      const report = performanceMonitor.getMetrics();
      
      const getAvg = (opType: string) => {
        const ops = report.operations.filter(op => op.type === opType);
        if (ops.length === 0) return 0;
        return ops.reduce((sum, op) => sum + op.duration, 0) / ops.length;
      };

      const slowest = report.slowest[0];

      setMetrics({
        avgValidation: getAvg("validation"),
        avgPlanning: getAvg("action_planning"),
        avgExecution: getAvg("execution_start"),
        avgSync: getAvg("sync_propagation"),
        slowestOperation: slowest?.type || "none",
        slowestDuration: slowest?.duration || 0,
      });
    };

    // Update every 2 seconds
    const interval = setInterval(updateMetrics, 2000);
    updateMetrics();

    return () => clearInterval(interval);
  }, []);

  if (!metrics) {
    return null;
  }

  const getSeverityColor = (ms: number) => {
    if (ms < 100) return "text-emerald-400";
    if (ms < 500) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <Card className="card-gradient border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <CardTitle>Performance</CardTitle>
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400">
            Low-Latency
          </Badge>
        </div>
        <CardDescription>Average execution latency (ms)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Validation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Validation</span>
            </div>
            <span className={`font-mono text-sm ${getSeverityColor(metrics.avgValidation)}`}>
              {metrics.avgValidation.toFixed(0)}ms
            </span>
          </div>

          {/* Planning */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Planning</span>
            </div>
            <span className={`font-mono text-sm ${getSeverityColor(metrics.avgPlanning)}`}>
              {metrics.avgPlanning.toFixed(0)}ms
            </span>
          </div>

          {/* Execution */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Execution</span>
            </div>
            <span className={`font-mono text-sm ${getSeverityColor(metrics.avgExecution)}`}>
              {metrics.avgExecution.toFixed(0)}ms
            </span>
          </div>

          {/* Sync */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Sync</span>
            </div>
            <span className={`font-mono text-sm ${getSeverityColor(metrics.avgSync)}`}>
              {metrics.avgSync.toFixed(0)}ms
            </span>
          </div>

          {/* Slowest operation */}
          {metrics.slowestDuration > 500 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                <span>
                  Bottleneck: {metrics.slowestOperation} ({metrics.slowestDuration.toFixed(0)}ms)
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}