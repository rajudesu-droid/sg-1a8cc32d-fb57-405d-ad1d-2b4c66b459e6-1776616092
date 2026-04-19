/**
 * Execution Center - Admin page for monitoring and managing all execution jobs
 */

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { executionEngine } from "@/core/engines";
import type { ExecutionJob } from "@/core/execution/ExecutionJob";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PlayCircle, 
  PauseCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Filter,
  RefreshCw
} from "lucide-react";

export default function Admin() {
  const [activeJobs, setActiveJobs] = useState<ExecutionJob[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterMode, setFilterMode] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const loadJobs = () => {
      const jobs = executionEngine.getActiveJobs();
      setActiveJobs(jobs);
    };

    loadJobs();

    if (autoRefresh) {
      const interval = setInterval(loadJobs, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      queued: { color: "bg-slate-500", icon: Clock },
      validating: { color: "bg-blue-500", icon: PlayCircle },
      planning: { color: "bg-blue-500", icon: PlayCircle },
      previewing: { color: "bg-blue-500", icon: PlayCircle },
      awaiting_authorization: { color: "bg-amber-500", icon: PauseCircle },
      executing: { color: "bg-cyan-500 animate-pulse", icon: PlayCircle },
      completed: { color: "bg-emerald-500", icon: CheckCircle2 },
      failed: { color: "bg-red-500", icon: XCircle },
      paused: { color: "bg-orange-500", icon: PauseCircle },
      cancelled: { color: "bg-gray-500", icon: XCircle },
    };

    const config = variants[status] || variants.queued;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const filteredJobs = activeJobs.filter((job) => {
    if (filterStatus !== "all" && job.status !== filterStatus) return false;
    if (filterMode !== "all" && job.mode !== filterMode) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Execution Center</h1>
            <p className="text-muted-foreground">Monitor and manage all automated execution jobs</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
              {autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh OFF"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeJobs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">
                {activeJobs.filter((j) => j.status === "executing").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                {activeJobs.filter((j) => j.status === "completed").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">
                {activeJobs.filter((j) => j.status === "failed").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Tabs value={filterStatus} onValueChange={setFilterStatus}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="executing">Executing</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="failed">Failed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Mode</label>
              <Tabs value={filterMode} onValueChange={setFilterMode}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="demo">Demo</TabsTrigger>
                  <TabsTrigger value="shadow">Shadow</TabsTrigger>
                  <TabsTrigger value="live">Live</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        <Card>
          <CardHeader>
            <CardTitle>Execution Jobs</CardTitle>
            <CardDescription>
              {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No execution jobs found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusBadge(job.status)}
                          <Badge variant="outline">{job.mode}</Badge>
                          <Badge variant="outline">{job.priority}</Badge>
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{job.actionType}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{job.reasonCode}</p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Protocol: {job.protocol || "N/A"}</div>
                          <div>Chain: {job.chain || "N/A"}</div>
                          <div>Source: {job.sourceEngine}</div>
                          <div>Created: {new Date(job.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {job.actionPlan && (
                          <div className="text-sm mb-2">
                            <div className="text-muted-foreground">Progress</div>
                            <div className="font-mono">
                              {job.executionResult?.completedSteps || 0}/{job.actionPlan.totalSteps}
                            </div>
                          </div>
                        )}
                        {job.errorInfo && (
                          <Badge variant="destructive" className="mt-2">
                            {job.errorInfo.category}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Error details */}
                    {job.errorInfo && (
                      <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                        <p className="text-sm text-red-400">{job.errorInfo.message}</p>
                        {job.errorInfo.retryCount > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Retry attempts: {job.errorInfo.retryCount}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Execution logs */}
                    {job.executionResult?.logs && job.executionResult.logs.length > 0 && (
                      <div className="mt-3 p-3 bg-muted/30 rounded-md">
                        <div className="text-xs font-medium mb-2">Execution Log:</div>
                        <div className="text-xs font-mono space-y-1 text-muted-foreground">
                          {job.executionResult.logs.map((log, idx) => (
                            <div key={idx}>→ {log}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}