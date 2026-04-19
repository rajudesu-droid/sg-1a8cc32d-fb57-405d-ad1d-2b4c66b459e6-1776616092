/**
 * Execution Monitor Component
 * Real-time display of bot execution activity, validation status, and action queue
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { triggerEngine } from "@/core/engines/TriggerEngine";
import { executionEngine } from "@/core/engines/AutomatedExecutionEngine";
import type { ActionTrigger } from "@/core/contracts/actions";

export function ExecutionMonitor() {
  const [queuedTriggers, setQueuedTriggers] = useState<ActionTrigger[]>([]);
  const [activeExecutions, setActiveExecutions] = useState<number>(0);
  
  useEffect(() => {
    // Poll trigger queue every 2 seconds
    const interval = setInterval(() => {
      const triggers = triggerEngine.getQueuedTriggers();
      setQueuedTriggers(triggers);
      
      // Mock active executions count (in real app, would query executionEngine)
      setActiveExecutions(0);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "ADD_LIQUIDITY":
      case "DEPOSIT":
        return <PlayCircle className="h-4 w-4 text-cyan-400" />;
      case "HARVEST_REWARDS":
        return <Zap className="h-4 w-4 text-amber-400" />;
      case "COMPOUND":
        return <Activity className="h-4 w-4 text-emerald-400" />;
      case "REBALANCE":
        return <AlertTriangle className="h-4 w-4 text-orange-400" />;
      case "EXIT_POSITION":
      case "WITHDRAW_FUNDS":
        return <PauseCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      low: { variant: "secondary", label: "Low" },
      normal: { variant: "default", label: "Normal" },
      high: { variant: "default", label: "High" },
      critical: { variant: "destructive", label: "Critical" },
    };
    
    const config = variants[urgency] || variants.normal;
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="card-gradient border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            <span>Execution Monitor</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {activeExecutions} Active
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {queuedTriggers.length} Queued
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {queuedTriggers.length === 0 && activeExecutions === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No pending actions</p>
            <p className="text-xs text-muted-foreground mt-1">
              All executions complete
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {queuedTriggers.map((trigger, index) => (
              <div key={trigger.id}>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="mt-0.5">
                    {getActionIcon(trigger.actionType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-sm font-medium truncate">
                        {trigger.actionType.replace(/_/g, " ")}
                      </h4>
                      {getUrgencyBadge(trigger.urgency)}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {trigger.reason}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {trigger.protocol && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium">{trigger.protocol}</span>
                        </span>
                      )}
                      {trigger.chain && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium">{trigger.chain}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(trigger.triggeredAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
                {index < queuedTriggers.length - 1 && (
                  <Separator className="my-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}