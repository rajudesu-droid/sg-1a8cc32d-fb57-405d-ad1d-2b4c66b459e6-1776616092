/**
 * Live Readiness Panel
 * Shows system readiness for Live Mode execution
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Shield, CheckCircle2, XCircle, AlertTriangle, Info, Lock, Unlock } from "lucide-react";
import { useState, useEffect } from "react";
import { liveReadinessChecker } from "@/core/validation/LiveReadinessChecker";
import type { LiveReadinessResult, LiveReadinessCheck } from "@/core/validation/LiveReadinessChecker";
import { Button } from "./ui/button";

export function LiveReadinessPanel() {
  const [readinessResult, setReadinessResult] = useState<LiveReadinessResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReadiness();
  }, []);

  const loadReadiness = async () => {
    setLoading(true);
    try {
      const result = await liveReadinessChecker.checkLiveReadiness();
      setReadinessResult(result);
    } catch (error) {
      console.error("[LiveReadinessPanel] Failed to check readiness:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: "pass" | "fail" | "warning") => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "fail":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusColor = (status: "pass" | "fail" | "warning") => {
    switch (status) {
      case "pass":
        return "bg-green-500/10 text-green-500 border-green-500/50";
      case "fail":
        return "bg-red-500/10 text-red-500 border-red-500/50";
      case "warning":
        return "bg-amber-500/10 text-amber-500 border-amber-500/50";
    }
  };

  const groupChecksByCategory = (checks: LiveReadinessCheck[]) => {
    const grouped: Record<string, LiveReadinessCheck[]> = {};
    
    checks.forEach(check => {
      if (!grouped[check.category]) {
        grouped[check.category] = [];
      }
      grouped[check.category].push(check);
    });

    return grouped;
  };

  if (loading) {
    return (
      <Card className="card-gradient border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Live Mode Readiness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse" />
            <p>Checking system readiness...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!readinessResult) {
    return null;
  }

  const groupedChecks = groupChecksByCategory(readinessResult.allChecks);

  return (
    <Card className="card-gradient border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Live Mode Readiness
            </CardTitle>
            <CardDescription>
              System safety checks for real fund execution
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadReadiness}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Status */}
        <Alert className={readinessResult.liveReady ? "border-green-500/50 bg-green-500/10" : "border-red-500/50 bg-red-500/10"}>
          {readinessResult.liveReady ? (
            <Unlock className="h-4 w-4 text-green-500" />
          ) : (
            <Lock className="h-4 w-4 text-red-500" />
          )}
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong className={readinessResult.liveReady ? "text-green-500" : "text-red-500"}>
                  {readinessResult.liveReady ? "LIVE MODE READY" : "LIVE MODE BLOCKED"}
                </strong>
                <div className="text-sm mt-1">
                  {readinessResult.summary.passed} / {readinessResult.summary.totalChecks} checks passed
                  {readinessResult.summary.blocking > 0 && (
                    <span className="text-red-400 ml-2">
                      • {readinessResult.summary.blocking} blocking issue{readinessResult.summary.blocking !== 1 ? "s" : ""}
                    </span>
                  )}
                  {readinessResult.summary.warnings > 0 && (
                    <span className="text-amber-400 ml-2">
                      • {readinessResult.summary.warnings} warning{readinessResult.summary.warnings !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              <Badge variant="outline" className={readinessResult.liveReady ? "bg-green-500/10 text-green-500 border-green-500/50" : "bg-red-500/10 text-red-500 border-red-500/50"}>
                {readinessResult.liveReady ? "Safe for Production" : "Not Ready"}
              </Badge>
            </div>
          </AlertDescription>
        </Alert>

        {/* Blocking Issues */}
        {readinessResult.blockingIssues.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-red-500">Critical Blockers</div>
            <div className="space-y-2">
              {readinessResult.blockingIssues.map((issue, idx) => (
                <Alert key={idx} className="border-red-500/50 bg-red-500/10">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-xs">
                    <div className="font-medium text-red-500">{issue.name}</div>
                    <div className="text-muted-foreground mt-1">{issue.message}</div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {readinessResult.warnings.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-amber-500">Warnings</div>
            <div className="space-y-2">
              {readinessResult.warnings.map((warning, idx) => (
                <Alert key={idx} className="border-amber-500/50 bg-amber-500/10">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-xs">
                    <div className="font-medium text-amber-500">{warning.name}</div>
                    <div className="text-muted-foreground mt-1">{warning.message}</div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* All Checks by Category */}
        <div className="space-y-4">
          <div className="text-sm font-medium text-muted-foreground">All Safety Checks</div>
          {Object.entries(groupedChecks).map(([category, checks], categoryIdx) => (
            <div key={categoryIdx} className="space-y-2">
              <div className="text-sm font-medium">{category}</div>
              <div className="space-y-2">
                {checks.map((check, checkIdx) => (
                  <div key={checkIdx} className="flex items-start justify-between border border-border/50 rounded-lg p-3">
                    <div className="flex items-start gap-2 flex-1">
                      {getStatusIcon(check.status)}
                      <div className="flex-1">
                        <div className="text-sm font-medium">{check.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{check.message}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {check.blocking && (
                        <Badge variant="outline" className="text-xs bg-red-500/10 text-red-500 border-red-500/50">
                          Blocking
                        </Badge>
                      )}
                      <Badge variant="outline" className={`text-xs ${getStatusColor(check.status)}`}>
                        {check.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              {categoryIdx !== Object.keys(groupedChecks).length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </div>

        {/* Info */}
        <Alert className="border-blue-500/50 bg-blue-500/10">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-xs">
            <strong className="text-blue-500">Live Mode Safety:</strong> All blocking checks must pass before Live Mode can execute real transactions. 
            Demo and Shadow modes remain available regardless of Live readiness status.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}