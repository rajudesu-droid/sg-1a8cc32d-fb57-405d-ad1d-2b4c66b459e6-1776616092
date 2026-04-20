/**
 * Admin Dashboard
 * View execution records and audit logs from server-side truth
 * 
 * CRITICAL: This is the authoritative execution history
 */

import { AppLayout } from "@/components/AppLayout";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Database, 
  FileText, 
  Search, 
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAppStore } from "@/store";
import { executionRecordService } from "@/services/ExecutionRecordService";
import { serverAuditService } from "@/services/ServerAuditService";
import type { ExecutionRecord } from "@/services/ExecutionRecordService";
import type { ServerAuditLog } from "@/services/ServerAuditService";

export default function AdminPage() {
  const wallet = useAppStore((state) => state.wallet);
  const mode = useAppStore((state) => state.mode);
  
  const [executionRecords, setExecutionRecords] = useState<ExecutionRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<ServerAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMode, setSelectedMode] = useState<"all" | "demo" | "shadow" | "live">("all");

  useEffect(() => {
    if (wallet.wallet) {
      loadServerSideRecords();
    }
  }, [wallet.wallet?.address]);

  const loadServerSideRecords = async () => {
    if (!wallet.wallet) return;
    
    setIsLoading(true);
    
    try {
      // Load execution records
      const records = await executionRecordService.getWalletRecords(
        wallet.wallet.address,
        {
          mode: selectedMode === "all" ? undefined : selectedMode as "demo" | "shadow" | "live",
          limit: 50,
        }
      );
      setExecutionRecords(records);
      
      // Load audit logs
      const logs = await serverAuditService.getWalletLogs(
        wallet.wallet.address,
        {
          mode: selectedMode === "all" ? undefined : selectedMode as "demo" | "shadow" | "live",
          limit: 100,
        }
      );
      setAuditLogs(logs);
      
      console.log(`[Admin] Loaded ${records.length} execution records and ${logs.length} audit logs`);
    } catch (error) {
      console.error("[Admin] Failed to load server-side records:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "failed":
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "executing":
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
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
      default:
        return "bg-muted/50 text-muted-foreground border-border";
    }
  };

  const filteredRecords = executionRecords.filter(record => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      record.action_type.toLowerCase().includes(search) ||
      record.action_id.toLowerCase().includes(search) ||
      record.protocol?.toLowerCase().includes(search) ||
      record.chain?.toLowerCase().includes(search)
    );
  });

  const filteredLogs = auditLogs.filter(log => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      log.action_type.toLowerCase().includes(search) ||
      log.actor.toLowerCase().includes(search)
    );
  });

  return (
    <AppLayout>
      <SEO
        title="Admin Dashboard - LP Yield Autopilot"
        description="Server-side execution records and audit logs"
      />

      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Authoritative server-side execution history and audit trail
          </p>
        </div>

        {/* Wallet Connection Required */}
        {!wallet.wallet && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription>
              Connect your wallet to view execution records and audit logs.
            </AlertDescription>
          </Alert>
        )}

        {wallet.wallet && (
          <>
            {/* Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      placeholder="Action type, protocol, chain..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mode">Mode</Label>
                    <select
                      id="mode"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      value={selectedMode}
                      onChange={(e) => setSelectedMode(e.target.value as any)}
                    >
                      <option value="all">All Modes</option>
                      <option value="demo">Demo</option>
                      <option value="shadow">Shadow</option>
                      <option value="live">Live</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={loadServerSideRecords}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="records" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="records" className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Execution Records
                  <Badge variant="outline">{filteredRecords.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="audit" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Audit Logs
                  <Badge variant="outline">{filteredLogs.length}</Badge>
                </TabsTrigger>
              </TabsList>

              {/* Execution Records */}
              <TabsContent value="records" className="space-y-4">
                {filteredRecords.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Database className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">
                        No execution records found.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredRecords.map((record) => (
                    <Card key={record.id} className="card-gradient">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                              {getStatusIcon(record.status)}
                              {record.action_type.replace(/_/g, " ")}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {record.mode}
                              </Badge>
                              {record.protocol && (
                                <Badge variant="secondary" className="text-xs">
                                  {record.protocol}
                                </Badge>
                              )}
                              {record.chain && (
                                <Badge variant="outline" className="text-xs">
                                  {record.chain}
                                </Badge>
                              )}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Action ID:</span>
                            <span className="font-mono text-xs">
                              {record.action_id.substring(0, 16)}...
                            </span>
                          </div>
                          {record.tx_hashes && record.tx_hashes.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Transactions:</span>
                              <span className="font-mono text-xs">
                                {record.tx_hashes.length} tx(s)
                              </span>
                            </div>
                          )}
                          {record.gas_used && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Gas Used:</span>
                              <span className="font-mono text-xs">
                                {record.gas_used.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {record.total_cost_usd && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Cost:</span>
                              <span className="font-mono text-xs">
                                ${record.total_cost_usd.toFixed(4)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Created:</span>
                            <span className="text-xs">
                              {record.created_at.toLocaleString()}
                            </span>
                          </div>
                          {record.completed_at && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Completed:</span>
                              <span className="text-xs">
                                {record.completed_at.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Reconciliation Status */}
                        {record.reconciliation_result && (
                          <Alert className={
                            record.critical_discrepancies && record.critical_discrepancies > 0
                              ? "border-amber-500/50 bg-amber-500/10"
                              : "border-green-500/50 bg-green-500/10"
                          }>
                            {record.critical_discrepancies && record.critical_discrepancies > 0 ? (
                              <>
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <AlertDescription className="text-xs">
                                  <strong className="text-amber-500">State Drift Detected</strong>
                                  <div className="mt-1">
                                    Total discrepancies: {(record.reconciliation_result as any).totalDiscrepancies}
                                    <br />
                                    Critical: {record.critical_discrepancies}
                                  </div>
                                </AlertDescription>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <AlertDescription className="text-xs text-green-400">
                                  State verified onchain - no discrepancies
                                </AlertDescription>
                              </>
                            )}
                          </Alert>
                        )}

                        {/* Error Message */}
                        {record.error_message && (
                          <Alert className="border-red-500/50 bg-red-500/10">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <AlertDescription className="text-xs text-red-400">
                              {record.error_message}
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Audit Logs */}
              <TabsContent value="audit" className="space-y-4">
                {filteredLogs.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">
                        No audit logs found.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredLogs.map((log) => (
                    <Card key={log.id} className="card-gradient">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-base">
                              {log.success ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              {log.action_type.replace(/_/g, " ")}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {log.timestamp.toLocaleString()}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {log.mode}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Actor:</span>
                            <span className="font-mono">
                              {log.actor.substring(0, 6)}...{log.actor.substring(38)}
                            </span>
                          </div>
                          {log.execution_record_id && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Execution ID:</span>
                              <span className="font-mono">
                                {log.execution_record_id.substring(0, 16)}...
                              </span>
                            </div>
                          )}
                        </div>

                        {log.error_message && (
                          <Alert className="border-red-500/50 bg-red-500/10">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <AlertDescription className="text-xs text-red-400">
                              {log.error_message}
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppLayout>
  );
}