/**
 * Execution Monitor Component
 * Real-time display of bot execution activity, validation status, and action queue
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Shield
} from "lucide-react";
import { useAppStore } from "@/store";
import { useState, useEffect } from "react";

export function ExecutionMonitor() {
  const executionJobs = useAppStore((state) => state.executionJobs);
  const mode = useAppStore((state) => state.mode);
  
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);

  useEffect(() => {
    const active = executionJobs.filter(j => 
      ["pending", "validating", "planning", "previewing", "awaiting_authorization", "executing"].includes(j.status)
    );
    const completed = executionJobs.filter(j => 
      ["completed", "failed", "cancelled"].includes(j.status)
    ).slice(0, 5);

    setActiveJobs(active);
    setCompletedJobs(completed);
  }, [executionJobs]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "failed":
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "executing":
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case "awaiting_authorization":
        return <Shield className="w-4 h-4 text-amber-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/50";
      case "failed":
      case "cancelled":
        return "bg-red-500/10 text-red-500 border-red-500/50";
      case "executing":
        return "bg-blue-500/10 text-blue-500 border-blue-500/50";
      case "awaiting_authorization":
        return "bg-amber-500/10 text-amber-500 border-amber-500/50";
      default:
        return "bg-muted/50 text-muted-foreground border-border";
    }
  };

  const getApprovalSteps = (job: any) => {
    if (!job.actionPlan?.substeps) return [];
    
    return job.actionPlan.substeps.filter((step: any) => 
      step.operation === "approve_token" && step.requiredApproval
    );
  };

  const getBlockingReasons = (job: any) => {
    if (!job.executionPreview?.validationStatus) return [];
    return job.executionPreview.validationStatus.blockingReasons || [];
  };

  const hasBlockers = (job: any) => {
    const blockers = getBlockingReasons(job);
    return blockers.length > 0;
  };

  return (
    <Card className="card-gradient border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Execution Monitor
          {activeJobs.length > 0 && (
            <Badge variant="outline" className="ml-auto">
              {activeJobs.length} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeJobs.length === 0 && completedJobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No active or recent executions</p>
            <p className="text-xs mt-1">
              Automated actions will appear here when triggered
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active Jobs */}
            {activeJobs.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground">Active</div>
                {activeJobs.map((job) => {
                  const approvalSteps = getApprovalSteps(job);
                  const blockingReasons = getBlockingReasons(job);
                  const isBlocked = hasBlockers(job);
                  
                  return (
                    <div 
                      key={job.id}
                      className="border border-border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <span className="font-medium text-sm">
                            {job.actionType.replace(/_/g, " ")}
                          </span>
                        </div>
                        <Badge variant="outline" className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </div>

                      {job.poolAddress && (
                        <div className="text-xs text-muted-foreground">
                          Pool: {job.poolAddress.slice(0, 6)}...{job.poolAddress.slice(-4)}
                        </div>
                      )}

                      {/* CRITICAL: Show Blocking Reasons */}
                      {isBlocked && mode.current === "live" && (
                        <Alert className="border-red-500/50 bg-red-500/10">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <AlertDescription className="text-xs">
                            <strong className="text-red-500">EXECUTION BLOCKED:</strong>
                            <ul className="mt-1 ml-4 list-disc">
                              {blockingReasons.map((reason: string, idx: number) => (
                                <li key={idx} className="text-red-400">{reason}</li>
                              ))}
                            </ul>
                            <div className="mt-2 text-muted-foreground">
                              Live Mode cannot proceed with stale or unsafe state. 
                              Resolve blockers or switch to Demo/Shadow mode.
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Approval Steps */}
                      {approvalSteps.length > 0 && !isBlocked && (
                        <Alert className="border-amber-500/50 bg-amber-500/10">
                          <Shield className="h-4 w-4 text-amber-500" />
                          <AlertDescription className="text-xs">
                            <strong>Approvals Required:</strong> {approvalSteps.length} token approval(s)
                            <ul className="mt-1 ml-4 list-disc">
                              {approvalSteps.map((step: any, idx: number) => (
                                <li key={idx}>
                                  {step.requiredApproval.token} ({step.requiredApproval.amount === Number.MAX_SAFE_INTEGER ? "Unlimited" : step.requiredApproval.amount})
                                </li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      {job.status === "awaiting_authorization" && !isBlocked && (
                        <Alert className="border-blue-500/50 bg-blue-500/10">
                          <AlertTriangle className="h-4 w-4 text-blue-500" />
                          <AlertDescription className="text-xs">
                            Waiting for user approval. Review the action preview and authorize to continue.
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Progress */}
                      {job.executionResult && !isBlocked && (
                        <div className="text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-muted-foreground">Progress:</span>
                            <span className="font-medium">
                              {job.executionResult.completedSteps} / {job.executionResult.totalSteps} steps
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div 
                              className="bg-primary rounded-full h-1.5 transition-all"
                              style={{ 
                                width: `${(job.executionResult.completedSteps / job.executionResult.totalSteps) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Completed Jobs */}
            {completedJobs.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground">Recent</div>
                {completedJobs.map((job) => (
                  <div 
                    key={job.id}
                    className="border border-border rounded-lg p-3 opacity-75 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <span className="font-medium text-sm">
                          {job.actionType.replace(/_/g, " ")}
                        </span>
                      </div>
                      <Badge variant="outline" className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </div>

                    {job.completedAt && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(job.completedAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}