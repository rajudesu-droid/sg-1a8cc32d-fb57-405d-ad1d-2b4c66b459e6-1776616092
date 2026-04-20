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
import { Save, Zap, Shield, DollarSign, Activity, AlertTriangle, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store";
import { userPreferencesService } from "@/services/UserPreferencesService";
import type { UserPolicy } from "@/services/UserPreferencesService";

export default function Automation() {
  const mode = useAppStore((state) => state.mode);
  
  const [autoHarvest, setAutoHarvest] = useState(false);
  const [autoCompound, setAutoCompound] = useState(false);
  const [autoRebalance, setAutoRebalance] = useState(false);
  const [emergencyPause, setEmergencyPause] = useState(false);
  
  const [minHarvestValue, setMinHarvestValue] = useState("50");
  const [compoundThreshold, setCompoundThreshold] = useState("100");
  const [rebalanceThreshold, setRebalanceThreshold] = useState("5.0");
  
  const [maxPerPool, setMaxPerPool] = useState("10000");
  const [maxPerChain, setMaxPerChain] = useState("50000");
  const [maxTotalDeployed, setMaxTotalDeployed] = useState("100000");
  
  const [dailyGasBudget, setDailyGasBudget] = useState("100");
  const [maxGasPrice, setMaxGasPrice] = useState("100");
  const [maxSlippage, setMaxSlippage] = useState("2.0");
  const [maxImpermanentLoss, setMaxImpermanentLoss] = useState("10.0");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load policy on mount
  useEffect(() => {
    loadPolicy();
  }, []);

  const loadPolicy = async () => {
    setLoading(true);
    try {
      const policy = await userPreferencesService.loadPolicy();
      
      if (policy) {
        setAutoHarvest(policy.autoHarvest);
        setAutoCompound(policy.autoCompound);
        setAutoRebalance(policy.autoRebalance);
        setEmergencyPause(policy.emergencyPause);
        
        setMinHarvestValue(policy.minHarvestValue.toString());
        setCompoundThreshold(policy.compoundThreshold.toString());
        setRebalanceThreshold(policy.rebalanceThreshold.toString());
        
        setMaxPerPool(policy.maxPerPool.toString());
        setMaxPerChain(policy.maxPerChain.toString());
        setMaxTotalDeployed(policy.maxTotalDeployed.toString());
        
        setDailyGasBudget(policy.dailyGasBudget.toString());
        setMaxGasPrice(policy.maxGasPrice.toString());
        setMaxSlippage(policy.maxSlippage.toString());
        setMaxImpermanentLoss(policy.maxImpermanentLoss.toString());
      }
    } catch (error) {
      console.error("[Automation] Failed to load policy:", error);
      toast({
        title: "Error Loading Policy",
        description: "Failed to load your saved automation policy. Using defaults.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePolicy = async () => {
    setSaving(true);
    try {
      const policy: UserPolicy = {
        autoHarvest,
        autoCompound,
        autoRebalance,
        emergencyPause,
        minHarvestValue: parseFloat(minHarvestValue),
        compoundThreshold: parseFloat(compoundThreshold),
        rebalanceThreshold: parseFloat(rebalanceThreshold),
        maxPerPool: parseFloat(maxPerPool),
        maxPerChain: parseFloat(maxPerChain),
        maxTotalDeployed: parseFloat(maxTotalDeployed),
        dailyGasBudget: parseFloat(dailyGasBudget),
        maxGasPrice: parseFloat(maxGasPrice),
        maxSlippage: parseFloat(maxSlippage),
        maxImpermanentLoss: parseFloat(maxImpermanentLoss),
      };

      const success = await userPreferencesService.savePolicy(policy);

      if (success) {
        toast({
          title: "Policy Saved",
          description: "All automation rules and guardrails have been saved successfully",
        });
      } else {
        throw new Error("Failed to save policy");
      }
    } catch (error) {
      console.error("[Automation] Failed to save policy:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save automation policy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setAutoHarvest(false);
    setAutoCompound(false);
    setAutoRebalance(false);
    setEmergencyPause(false);
    
    setMinHarvestValue("50");
    setCompoundThreshold("100");
    setRebalanceThreshold("5.0");
    
    setMaxPerPool("10000");
    setMaxPerChain("50000");
    setMaxTotalDeployed("100000");
    
    setDailyGasBudget("100");
    setMaxGasPrice("100");
    setMaxSlippage("2.0");
    setMaxImpermanentLoss("10.0");

    toast({
      title: "Policy Reset",
      description: "All automation rules have been reset to defaults (not saved yet)",
    });
  };

  const handleEmergencyStop = () => {
    setEmergencyPause(true);
    setAutoHarvest(false);
    setAutoCompound(false);
    setAutoRebalance(false);
    
    toast({
      title: "Emergency Stop Activated",
      description: "All automation has been paused. Click Save Changes to persist.",
      variant: "destructive",
    });
  };

  const getPageTitle = () => {
    switch (mode.current) {
      case "demo": return "Simulated Automation Rules";
      case "shadow": return "Automation Rules (Preview)";
      case "live": return "Automation & Policy Configuration";
    }
  };

  const getPageDescription = () => {
    switch (mode.current) {
      case "demo": return "Configure simulated automation behavior and policy guardrails";
      case "shadow": return "Preview automation rules (no execution in Shadow mode)";
      case "live": return "Configure automation behavior and policy guardrails for live execution";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Automation & Policy</h1>
            <p className="text-muted-foreground">
              Configure automated actions and safety guardrails
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleEmergencyStop} disabled={loading || saving}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Emergency Stop
            </Button>
            <Button onClick={handleSavePolicy} disabled={loading || saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
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
                {[
                  autoHarvest,
                  autoCompound,
                  autoRebalance,
                ].filter(Boolean).length}
                /3
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
                {emergencyPause ? (
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
              <div className="text-2xl font-bold">${dailyGasBudget}</div>
              <p className="text-xs text-muted-foreground">Maximum spend</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Controls</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">
                {rebalanceThreshold}%
              </div>
              <p className="text-xs text-muted-foreground">Min better opportunity</p>
            </CardContent>
          </Card>
        </div>

        {/* Mode Banner */}
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

        {emergencyPause && (
          <Alert className="border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription>
              <strong>Emergency Stop Active:</strong> All automation is paused. Review and manually approve to resume.
            </AlertDescription>
          </Alert>
        )}

        {/* Automation Rules */}
        <Card className="card-gradient border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Automation Rules
            </CardTitle>
            <CardDescription>
              Enable automated actions for position management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-harvest">Auto-Harvest Rewards</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically claim rewards when threshold is met
                  </p>
                </div>
                <Switch 
                  id="auto-harvest" 
                  checked={autoHarvest}
                  onCheckedChange={setAutoHarvest}
                  disabled={loading || emergencyPause}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-compound">Auto-Compound Rewards</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically add harvested rewards back to positions
                  </p>
                </div>
                <Switch 
                  id="auto-compound" 
                  checked={autoCompound}
                  onCheckedChange={setAutoCompound}
                  disabled={loading || emergencyPause}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-rebalance">Auto-Rebalance Positions</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically move capital to better opportunities
                  </p>
                </div>
                <Switch 
                  id="auto-rebalance" 
                  checked={autoRebalance}
                  onCheckedChange={setAutoRebalance}
                  disabled={loading || emergencyPause}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="emergency-pause">Emergency Pause</Label>
                  <p className="text-xs text-muted-foreground">
                    Immediately stop all automated actions
                  </p>
                </div>
                <Switch 
                  id="emergency-pause" 
                  checked={emergencyPause}
                  onCheckedChange={setEmergencyPause}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thresholds */}
        <Card className="card-gradient border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Action Thresholds
            </CardTitle>
            <CardDescription>
              Set minimum values for automated actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="min-harvest">Minimum Harvest Value (USD)</Label>
                <Input 
                  id="min-harvest" 
                  type="number" 
                  value={minHarvestValue}
                  onChange={(e) => setMinHarvestValue(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Only harvest rewards worth more than this amount
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="compound-threshold">Compound Threshold (USD)</Label>
                <Input 
                  id="compound-threshold" 
                  type="number" 
                  value={compoundThreshold}
                  onChange={(e) => setCompoundThreshold(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Only compound rewards worth more than this amount
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="rebalance-threshold">Rebalance Threshold (%)</Label>
                <Input 
                  id="rebalance-threshold" 
                  type="number" 
                  step="0.1"
                  value={rebalanceThreshold}
                  onChange={(e) => setRebalanceThreshold(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Rebalance when new opportunity is this % better
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Capital Guardrails */}
        <Card className="card-gradient border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Capital Guardrails
            </CardTitle>
            <CardDescription>
              Set maximum capital limits for safety
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max-per-pool">Maximum Per Pool (USD)</Label>
                <Input 
                  id="max-per-pool" 
                  type="number"
                  value={maxPerPool}
                  onChange={(e) => setMaxPerPool(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Never deploy more than this amount to a single pool
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="max-per-chain">Maximum Per Chain (USD)</Label>
                <Input 
                  id="max-per-chain" 
                  type="number"
                  value={maxPerChain}
                  onChange={(e) => setMaxPerChain(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Never deploy more than this amount to a single blockchain
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="max-total">Maximum Total Deployed (USD)</Label>
                <Input 
                  id="max-total" 
                  type="number"
                  value={maxTotalDeployed}
                  onChange={(e) => setMaxTotalDeployed(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Never deploy more than this amount across all positions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Limits */}
        <Card className="card-gradient border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Risk Limits
            </CardTitle>
            <CardDescription>
              Set maximum risk tolerance levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="daily-gas">Daily Gas Budget (USD)</Label>
                <Input 
                  id="daily-gas" 
                  type="number"
                  value={dailyGasBudget}
                  onChange={(e) => setDailyGasBudget(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum daily spending on transaction fees
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="max-gas-price">Maximum Gas Price (Gwei)</Label>
                <Input 
                  id="max-gas-price" 
                  type="number"
                  value={maxGasPrice}
                  onChange={(e) => setMaxGasPrice(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Never submit transactions with gas price higher than this
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="max-slippage">Maximum Slippage (%)</Label>
                <Input 
                  id="max-slippage" 
                  type="number" 
                  step="0.1"
                  value={maxSlippage}
                  onChange={(e) => setMaxSlippage(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Cancel transactions if slippage would exceed this %
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="max-il">Maximum Impermanent Loss (%)</Label>
                <Input 
                  id="max-il" 
                  type="number" 
                  step="0.1"
                  value={maxImpermanentLoss}
                  onChange={(e) => setMaxImpermanentLoss(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Close positions if IL would exceed this %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={handleResetDefaults} disabled={loading || saving}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSavePolicy} disabled={loading || saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}