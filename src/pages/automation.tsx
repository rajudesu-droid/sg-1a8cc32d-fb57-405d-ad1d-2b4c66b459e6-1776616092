import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ModeBanner } from "@/components/ModeBanner";
import { Save, Zap, Shield, DollarSign, Activity, AlertTriangle, Eye, RefreshCw, Play, Square } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store";
import { orchestrator } from "@/core/orchestrator";
import { actionHandler } from "@/services/ActionHandlerService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Zap, Shield, DollarSign, Activity, AlertTriangle, Eye, RefreshCw, Play, Square } from "lucide-react";

export default function Automation() {
  const mode = useAppStore((state) => state.mode);
  const policy = useAppStore((state) => state.policy);
  const updatePolicy = useAppStore((state) => state.setPolicy);
  const { toast } = useToast();

  const [localPolicy, setLocalPolicy] = useState(policy);
  const [saveLoading, setSaveLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);

  useEffect(() => {
    setLocalPolicy(policy);
  }, [policy]);

  const getActionContext = () => ({
    mode: mode.current,
    metadata: { source: "automation_page" },
  });

  const handleSaveRules = async () => {
    if (mode.current === "shadow") {
      toast({
        title: "Shadow Mode",
        description: "Policy changes are preview-only in Shadow mode",
      });
      return;
    }

    setSaveLoading(true);
    try {
      updatePolicy(localPolicy);
      await orchestrator.publishEvent({
        type: "policy_updated",
        source: "automation_page",
        timestamp: new Date(),
        affectedModules: ["policy"],
        data: { policy: localPolicy },
      });

      toast({
        title: "Rules Saved",
        description: "Automation rules updated successfully",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save automation rules",
        variant: "destructive",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleResetRules = async () => {
    if (mode.current === "shadow") {
      toast({
        title: "Shadow Mode",
        description: "Policy changes are preview-only in Shadow mode",
      });
      return;
    }

    setResetLoading(true);
    try {
      const defaultPolicy = {
        autoHarvest: false,
        harvestFrequency: "daily" as const,
        autoCompound: false,
        autoRebalance: false,
        rebalanceFrequency: "weekly" as const,
        autoDeployIdle: false,
        minIdleAmount: 100,
        maxAutoDeployAmount: 1000,
        deployStrategy: "best_score" as const,
        minAutoDeployScore: 75,
        deployFrequency: "hourly" as const,
        diversifyDeployments: false,
        maxConcurrentPositions: 5,
        minHarvestAmount: 50,
        minRebalanceEdge: 5,
        dailyGasBudget: 100,
        minPoolScore: 70,
        maxPerPool: 10000,
        maxPerChain: 50000,
        maxTotalDeployed: 100000,
        emergencyPause: false,
        pausedChains: [],
        pausedDexes: [],
      };

      setLocalPolicy(defaultPolicy);
      updatePolicy(defaultPolicy);

      await orchestrator.publishEvent({
        type: "policy_updated",
        source: "automation_page",
        timestamp: new Date(),
        affectedModules: ["policy"],
        data: { policy: defaultPolicy },
      });

      toast({
        title: "Rules Reset",
        description: "Automation rules reset to defaults",
      });
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: "Failed to reset rules",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleEmergencyPause = async () => {
    if (mode.current === "shadow") {
      toast({
        title: "Shadow Mode",
        description: "Emergency pause is preview-only in Shadow mode",
      });
      return;
    }

    setPauseLoading(true);
    try {
      const result = await actionHandler.emergencyPause(getActionContext());
      toast({
        title: result.success ? "Emergency Pause Activated" : "Pause Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });

      if (result.success) {
        setLocalPolicy({ ...localPolicy, emergencyPause: true });
        updatePolicy({ ...localPolicy, emergencyPause: true });
      }
    } catch (error) {
      toast({
        title: "Pause Failed",
        description: "Failed to activate emergency pause",
        variant: "destructive",
      });
    } finally {
      setPauseLoading(false);
    }
  };

  const handleResumeAutomation = async () => {
    if (mode.current === "shadow") {
      toast({
        title: "Shadow Mode",
        description: "Cannot resume automation in Shadow mode",
      });
      return;
    }

    setPauseLoading(true);
    try {
      const updatedPolicy = { ...localPolicy, emergencyPause: false };
      setLocalPolicy(updatedPolicy);
      updatePolicy(updatedPolicy);

      await orchestrator.publishEvent({
        type: "policy_updated",
        source: "automation_page",
        timestamp: new Date(),
        affectedModules: ["policy"],
        data: { policy: updatedPolicy },
      });

      toast({
        title: "Automation Resumed",
        description: "Emergency pause deactivated",
      });
    } catch (error) {
      toast({
        title: "Resume Failed",
        description: "Failed to resume automation",
        variant: "destructive",
      });
    } finally {
      setPauseLoading(false);
    }
  };

  const updateField = (key: keyof typeof localPolicy, value: any) => {
    setLocalPolicy(prev => ({ ...prev, [key]: value }));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Automation & Rules</h1>
            <p className="text-muted-foreground">
              Configure automated LP management policies
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={mode.current === "demo" ? "secondary" : mode.current === "shadow" ? "outline" : "default"}>
              {mode.current === "demo" ? "Demo Mode" : mode.current === "shadow" ? "Shadow Mode" : "Live Mode"}
            </Badge>
            <Button 
              variant="outline" 
              onClick={handleResetRules}
              disabled={resetLoading || mode.current === "shadow"}
            >
              {resetLoading ? (
                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Resetting...</>
              ) : (
                <><RefreshCw className="mr-2 h-4 w-4" /> Reset to Defaults</>
              )}
            </Button>
            <Button 
              onClick={handleSaveRules}
              disabled={saveLoading || mode.current === "shadow"}
            >
              {saveLoading ? (
                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Save Rules</>
              )}
            </Button>
          </div>
        </div>

        {/* Summary Report */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {[localPolicy.autoHarvest, localPolicy.autoCompound, localPolicy.autoRebalance, localPolicy.autoDeployIdle].filter(Boolean).length}/4
              </div>
              <p className="text-xs text-muted-foreground">Automation enabled</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emergency Status</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {localPolicy.emergencyPause ? (
                  <span className="text-amber-400">PAUSED</span>
                ) : (
                  <span className="text-emerald-400">ACTIVE</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">System state</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Gas Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${localPolicy.dailyGasBudget}</div>
              <p className="text-xs text-muted-foreground">Maximum spend</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Controls</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">{localPolicy.minRebalanceEdge}%</div>
              <p className="text-xs text-muted-foreground">Min better opportunity</p>
            </CardContent>
          </Card>
        </div>

        <ModeBanner />

        {/* Shadow Mode Notice */}
        {mode.current === "shadow" && (
          <Card className="card-gradient border-accent/20 border">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Eye className="h-5 w-5 text-accent flex-shrink-0" />
                <div>
                  <p className="font-semibold">Shadow Mode - Preview Only</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Automation rules are displayed for preview. No actions will be executed in Shadow mode. Switch to Demo or Live to enable automation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {localPolicy.emergencyPause && (
          <Alert className="border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription>
              <strong>Emergency Stop Active:</strong> All automation is paused. Review and manually approve to resume.
            </AlertDescription>
          </Alert>
        )}

        {/* Emergency Controls */}
        <Card className="card-gradient border-border/50 border-amber-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Emergency Controls
            </CardTitle>
            <CardDescription>
              Immediately stop all automation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!localPolicy.emergencyPause ? (
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleEmergencyPause}
                disabled={pauseLoading || mode.current === "shadow"}
              >
                {pauseLoading ? (
                  <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Activating...</>
                ) : (
                  <><AlertTriangle className="mr-2 h-4 w-4" /> Emergency Pause All</>
                )}
              </Button>
            ) : (
              <>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    All automation is paused. Click below to resume.
                  </AlertDescription>
                </Alert>
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={handleResumeAutomation}
                  disabled={pauseLoading || mode.current === "shadow"}
                >
                  {pauseLoading ? (
                    <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Resuming...</>
                  ) : (
                    <><Play className="mr-2 h-4 w-4" /> Resume Automation</>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Automation Rules */}
        <Card className="card-gradient border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> Automation Rules</CardTitle>
            <CardDescription>Enable automated actions for position management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-harvest">Auto-Harvest Rewards</Label>
                  <p className="text-xs text-muted-foreground">Automatically claim rewards when threshold is met</p>
                </div>
                <Switch 
                  id="auto-harvest" 
                  checked={localPolicy.autoHarvest}
                  onCheckedChange={(checked) => updateField('autoHarvest', checked)}
                  disabled={localPolicy.emergencyPause}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-compound">Auto-Compound Rewards</Label>
                  <p className="text-xs text-muted-foreground">Automatically add harvested rewards back to positions</p>
                </div>
                <Switch 
                  id="auto-compound" 
                  checked={localPolicy.autoCompound}
                  onCheckedChange={(checked) => updateField('autoCompound', checked)}
                  disabled={localPolicy.emergencyPause}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-rebalance">Auto-Rebalance Positions</Label>
                  <p className="text-xs text-muted-foreground">Automatically move capital to better opportunities</p>
                </div>
                <Switch 
                  id="auto-rebalance" 
                  checked={localPolicy.autoRebalance}
                  onCheckedChange={(checked) => updateField('autoRebalance', checked)}
                  disabled={localPolicy.emergencyPause}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Auto-Deploy Idle Funds */}
        <Card className="card-gradient border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> 
              Auto-Deploy Idle Funds
            </CardTitle>
            <CardDescription>
              Automatically deploy idle capital to high-scoring opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Master Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-deploy-idle">Enable Auto-Deploy</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically deploy idle wallet funds to qualifying opportunities
                  </p>
                </div>
                <Switch 
                  id="auto-deploy-idle" 
                  checked={localPolicy.autoDeployIdle}
                  onCheckedChange={(checked) => updateField('autoDeployIdle', checked)}
                  disabled={localPolicy.emergencyPause}
                />
              </div>

              {localPolicy.autoDeployIdle && (
                <>
                  <Separator />

                  {/* Minimum Idle Threshold */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="min-idle-amount">Minimum Idle Amount (USD)</Label>
                      <span className="text-sm font-mono text-muted-foreground">
                        ${localPolicy.minIdleAmount || 100}
                      </span>
                    </div>
                    <Input 
                      id="min-idle-amount" 
                      type="number" 
                      step="50"
                      min="0"
                      value={localPolicy.minIdleAmount || 100}
                      onChange={(e) => updateField('minIdleAmount', Number(e.target.value))}
                      disabled={localPolicy.emergencyPause}
                    />
                    <p className="text-xs text-muted-foreground">
                      Only deploy when idle balance exceeds this amount
                    </p>
                  </div>

                  <Separator />

                  {/* Maximum Auto-Deploy Amount */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="max-auto-deploy">Maximum Per Deployment (USD)</Label>
                      <span className="text-sm font-mono text-muted-foreground">
                        ${localPolicy.maxAutoDeployAmount || 1000}
                      </span>
                    </div>
                    <Input 
                      id="max-auto-deploy" 
                      type="number" 
                      step="100"
                      min="0"
                      value={localPolicy.maxAutoDeployAmount || 1000}
                      onChange={(e) => updateField('maxAutoDeployAmount', Number(e.target.value))}
                      disabled={localPolicy.emergencyPause}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum amount to deploy in a single transaction
                    </p>
                  </div>

                  <Separator />

                  {/* Deployment Strategy */}
                  <div className="space-y-2">
                    <Label htmlFor="deploy-strategy">Deployment Strategy</Label>
                    <Select 
                      value={localPolicy.deployStrategy || "best_score"}
                      onValueChange={(value) => updateField('deployStrategy', value)}
                      disabled={localPolicy.emergencyPause}
                    >
                      <SelectTrigger id="deploy-strategy">
                        <SelectValue placeholder="Select strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="best_score">Best Overall Score</SelectItem>
                        <SelectItem value="highest_apy">Highest APY</SelectItem>
                        <SelectItem value="lowest_risk">Lowest Risk</SelectItem>
                        <SelectItem value="balanced">Balanced (Score + APY)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Strategy for selecting opportunities to deploy idle funds
                    </p>
                  </div>

                  <Separator />

                  {/* Minimum Pool Score */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="min-auto-deploy-score">Minimum Opportunity Score</Label>
                      <span className="text-sm font-mono text-muted-foreground">
                        {localPolicy.minAutoDeployScore || 75}
                      </span>
                    </div>
                    <Input 
                      id="min-auto-deploy-score" 
                      type="number" 
                      step="5"
                      min="0"
                      max="100"
                      value={localPolicy.minAutoDeployScore || 75}
                      onChange={(e) => updateField('minAutoDeployScore', Number(e.target.value))}
                      disabled={localPolicy.emergencyPause}
                    />
                    <p className="text-xs text-muted-foreground">
                      Only deploy to opportunities with score above this threshold
                    </p>
                  </div>

                  <Separator />

                  {/* Deployment Frequency */}
                  <div className="space-y-2">
                    <Label htmlFor="deploy-frequency">Deployment Check Frequency</Label>
                    <Select 
                      value={localPolicy.deployFrequency || "hourly"}
                      onValueChange={(value) => updateField('deployFrequency', value)}
                      disabled={localPolicy.emergencyPause}
                    >
                      <SelectTrigger id="deploy-frequency">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="continuous">Continuous (Every 5 min)</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      How often to check for idle funds and deploy
                    </p>
                  </div>

                  <Separator />

                  {/* Diversification */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="diversify-deployments">Diversify Deployments</Label>
                      <p className="text-xs text-muted-foreground">
                        Split idle funds across multiple opportunities
                      </p>
                    </div>
                    <Switch 
                      id="diversify-deployments" 
                      checked={localPolicy.diversifyDeployments || false}
                      onCheckedChange={(checked) => updateField('diversifyDeployments', checked)}
                      disabled={localPolicy.emergencyPause}
                    />
                  </div>

                  {localPolicy.diversifyDeployments && (
                    <>
                      <div className="space-y-2 pl-4 border-l-2 border-border">
                        <Label htmlFor="max-positions">Maximum Concurrent Positions</Label>
                        <Input 
                          id="max-positions" 
                          type="number" 
                          step="1"
                          min="1"
                          max="20"
                          value={localPolicy.maxConcurrentPositions || 5}
                          onChange={(e) => updateField('maxConcurrentPositions', Number(e.target.value))}
                          disabled={localPolicy.emergencyPause}
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum number of positions to maintain across all protocols
                        </p>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Risk Management Alert */}
                  <Alert className="border-accent/20 bg-accent/5">
                    <AlertTriangle className="h-4 w-4 text-accent" />
                    <AlertDescription className="text-xs">
                      <strong>Risk Notice:</strong> Auto-deployment uses your defined risk limits (Max Per Pool, Max Per Chain) to ensure safe capital allocation. Review your risk limits below before enabling.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Thresholds */}
        <Card className="card-gradient border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Action Thresholds</CardTitle>
            <CardDescription>Set minimum values for automated actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="min-harvest">Minimum Harvest Value (USD)</Label>
                <Input 
                  id="min-harvest" type="number" 
                  value={localPolicy.minHarvestAmount}
                  onChange={(e) => updateField('minHarvestAmount', Number(e.target.value))}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="rebalance-threshold">Rebalance Threshold (%)</Label>
                <Input 
                  id="rebalance-threshold" type="number" step="0.1"
                  value={localPolicy.minRebalanceEdge}
                  onChange={(e) => updateField('minRebalanceEdge', Number(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Limits */}
        <Card className="card-gradient border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Risk Limits</CardTitle>
            <CardDescription>Set maximum risk tolerance levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="daily-gas">Daily Gas Budget (USD)</Label>
                <Input 
                  id="daily-gas" type="number"
                  value={localPolicy.dailyGasBudget}
                  onChange={(e) => updateField('dailyGasBudget', Number(e.target.value))}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="max-per-pool">Maximum Per Pool (USD)</Label>
                <Input 
                  id="max-per-pool" type="number"
                  value={localPolicy.maxPerPool}
                  onChange={(e) => updateField('maxPerPool', Number(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}