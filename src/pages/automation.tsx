import { AppLayout } from "@/components/AppLayout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Zap, 
  Settings2, 
  Shield, 
  AlertTriangle, 
  Activity,
  Clock,
  DollarSign,
  TrendingUp,
  Target,
  Wallet,
  Globe,
  Eye,
  Save,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store";
import { ModeBanner } from "@/components/ModeBanner";
import { orchestrator } from "@/core/orchestrator";

export default function Automation() {
  const [autoHarvest, setAutoHarvest] = useState(true);
  const [autoCompound, setAutoCompound] = useState(true);
  const [autoRebalance, setAutoRebalance] = useState(false);
  const [autoDeploy, setAutoDeploy] = useState(false);
  const [emergencyPauseAll, setEmergencyPauseAll] = useState(false);
  
  const [harvestFrequency, setHarvestFrequency] = useState("daily");
  const [rebalanceFrequency, setRebalanceFrequency] = useState("weekly");
  const [minHarvestAmount, setMinHarvestAmount] = useState("50");
  const [minRebalanceEdge, setMinRebalanceEdge] = useState("5");
  const [maxDailyGas, setMaxDailyGas] = useState("100");
  const [minScoreThreshold, setMinScoreThreshold] = useState([70]);
  const [maxPerPool, setMaxPerPool] = useState("10000");
  const [maxPerChain, setMaxPerChain] = useState("50000");
  const [maxTotalDeployed, setMaxTotalDeployed] = useState("100000");
  const [pausedChains, setPausedChains] = useState<string[]>([]);
  const [pausedDexes, setPausedDexes] = useState<string[]>([]);

  const { toast } = useToast();
  const mode = useAppStore((state) => state.mode);
  const policy = useAppStore((state) => state.policy);
  const setPolicy = useAppStore((state) => state.setPolicy);

  // Listen for mode changes
  useEffect(() => {
    const unsubscribe = orchestrator.subscribe((event) => {
      if (event.type === "mode_changed") {
        console.log("[Automation] Mode changed, updating policy view");
      }
    });
    return () => unsubscribe();
  }, []);

  const toggleChainPause = (chain: string) => {
    setPausedChains(prev => prev.includes(chain) ? prev.filter(c => c !== chain) : [...prev, chain]);
  };

  const toggleDexPause = (dex: string) => {
    setPausedDexes(prev => prev.includes(dex) ? prev.filter(d => d !== dex) : [...prev, dex]);
  };

  const handleSavePolicy = () => {
    setPolicy({
      autoHarvest,
      autoCompound,
      autoRebalance,
      emergencyPause: emergencyPauseAll,
    } as any);

    const modeLabel = mode.current === "demo" ? "simulated" : mode.current === "shadow" ? "shadow" : "live";
    toast({
      title: `Policy Saved (${mode.label})`,
      description: `Automation rules updated for ${modeLabel} mode`,
    });
  };

  const handleTestRules = () => {
    if (mode.current === "shadow") {
      toast({
        title: "Shadow Mode - Preview Only",
        description: "Policy rules are shown for preview. Switch to Demo or Live to test execution.",
        variant: "default",
      });
      return;
    }

    toast({
      title: mode.current === "demo" ? "Testing Simulated Rules" : "Testing Policy Rules",
      description: `${mode.current === "demo" ? "Simulating" : "Running"} policy validation checks`,
    });
  };

  const handleEmergencyStop = () => {
    if (mode.current === "shadow") {
      toast({
        title: "Shadow Mode - No Active Automation",
        description: "No automation is running in Shadow mode.",
        variant: "default",
      });
      return;
    }

    setEmergencyPauseAll(true);
    toast({
      title: "Emergency Stop Activated",
      description: mode.current === "demo" 
        ? "All simulated automation has been paused" 
        : "All automated actions have been paused",
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
            <p className="text-muted-foreground">Configure automated LP management rules and guardrails</p>
          </div>
          <Button onClick={savePolicy} disabled={!hasChanges}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
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
                  policy.autoHarvest,
                  policy.autoCompound,
                  policy.autoRebalance,
                  policy.autoDeploy,
                ].filter(Boolean).length}
                /4
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
                {policy.emergencyPause ? (
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
              <div className="text-2xl font-bold">${policy.maxDailyGasBudget}</div>
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
                {policy.minPoolScore}%
              </div>
              <p className="text-xs text-muted-foreground">Min pool score</p>
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

        {emergencyPauseAll && (
          <Alert className="border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription>
              <strong>Emergency Stop Active:</strong> All automation is paused. Review and manually approve to resume.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="automation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="automation">Automation Rules</TabsTrigger>
            <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
            <TabsTrigger value="limits">Capital Limits</TabsTrigger>
            <TabsTrigger value="emergency">Emergency Controls</TabsTrigger>
          </TabsList>

          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Automated Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="auto-harvest" className="text-base font-medium">Auto-Harvest</Label>
                        <Badge variant={autoHarvest ? "default" : "secondary"}>
                          {autoHarvest ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Automatically claim accrued fees and rewards when thresholds are met
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <Select value={harvestFrequency} onValueChange={setHarvestFrequency}>
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Every Hour</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground">Check frequency</span>
                      </div>
                    </div>
                    <Switch
                      id="auto-harvest"
                      checked={autoHarvest}
                      onCheckedChange={setAutoHarvest}
                      disabled={emergencyPauseAll}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="auto-compound" className="text-base font-medium">Auto-Compound</Label>
                        <Badge variant={autoCompound ? "default" : "secondary"}>
                          {autoCompound ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Reinvest harvested rewards back into positions automatically
                      </p>
                    </div>
                    <Switch
                      id="auto-compound"
                      checked={autoCompound}
                      onCheckedChange={setAutoCompound}
                      disabled={emergencyPauseAll}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="auto-rebalance" className="text-base font-medium">Auto-Rebalance</Label>
                        <Badge variant={autoRebalance ? "default" : "secondary"}>
                          {autoRebalance ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Adjust position ranges when out-of-range or superior opportunities exist
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <Select value={rebalanceFrequency} onValueChange={setRebalanceFrequency}>
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground">Check frequency</span>
                      </div>
                    </div>
                    <Switch
                      id="auto-rebalance"
                      checked={autoRebalance}
                      onCheckedChange={setAutoRebalance}
                      disabled={emergencyPauseAll}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="auto-deploy" className="text-base font-medium">Auto-Deploy Idle Funds</Label>
                        <Badge variant={autoDeploy ? "default" : "secondary"}>
                          {autoDeploy ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Deploy idle capital to whitelisted opportunities that meet score threshold
                      </p>
                    </div>
                    <Switch
                      id="auto-deploy"
                      checked={autoDeploy}
                      onCheckedChange={setAutoDeploy}
                      disabled={emergencyPauseAll}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="thresholds" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Action Thresholds
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="min-harvest">Minimum Harvest Amount</Label>
                      <span className="text-sm font-mono">${minHarvestAmount}</span>
                    </div>
                    <Input
                      id="min-harvest"
                      type="number"
                      value={minHarvestAmount}
                      onChange={(e) => setMinHarvestAmount(e.target.value)}
                      placeholder="50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Only harvest when rewards exceed this value
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="min-rebalance">Minimum Rebalance Edge (%)</Label>
                      <span className="text-sm font-mono">{minRebalanceEdge}%</span>
                    </div>
                    <Input
                      id="min-rebalance"
                      type="number"
                      value={minRebalanceEdge}
                      onChange={(e) => setMinRebalanceEdge(e.target.value)}
                      placeholder="5"
                    />
                    <p className="text-xs text-muted-foreground">
                      New opportunity must exceed current position by this margin
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="max-gas">Daily Gas Budget</Label>
                      <span className="text-sm font-mono">${maxDailyGas}</span>
                    </div>
                    <Input
                      id="max-gas"
                      type="number"
                      value={maxDailyGas}
                      onChange={(e) => setMaxDailyGas(e.target.value)}
                      placeholder="100"
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum total gas spend per day across all actions
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Minimum Pool Score</Label>
                      <span className="text-sm font-mono">{minScoreThreshold[0]}/100</span>
                    </div>
                    <Slider
                      value={minScoreThreshold}
                      onValueChange={setMinScoreThreshold}
                      min={0}
                      max={100}
                      step={5}
                      className="py-4"
                    />
                    <p className="text-xs text-muted-foreground">
                      Only deploy to opportunities above this risk-adjusted score
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="limits" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Capital Allocation Limits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="max-pool">Maximum Per Pool</Label>
                      <span className="text-sm font-mono">${Number(maxPerPool).toLocaleString()}</span>
                    </div>
                    <Input
                      id="max-pool"
                      type="number"
                      value={maxPerPool}
                      onChange={(e) => setMaxPerPool(e.target.value)}
                      placeholder="10000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum capital deployable to a single pool
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="max-chain">Maximum Per Chain</Label>
                      <span className="text-sm font-mono">${Number(maxPerChain).toLocaleString()}</span>
                    </div>
                    <Input
                      id="max-chain"
                      type="number"
                      value={maxPerChain}
                      onChange={(e) => setMaxPerChain(e.target.value)}
                      placeholder="50000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum total capital deployable per blockchain
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="max-total">Maximum Total Deployed</Label>
                      <span className="text-sm font-mono">${Number(maxTotalDeployed).toLocaleString()}</span>
                    </div>
                    <Input
                      id="max-total"
                      type="number"
                      value={maxTotalDeployed}
                      onChange={(e) => setMaxTotalDeployed(e.target.value)}
                      placeholder="100000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum total capital across all positions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emergency" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Emergency Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/50 bg-destructive/10">
                    <div className="space-y-1">
                      <Label htmlFor="emergency-pause" className="text-base font-medium">Emergency Pause All</Label>
                      <p className="text-sm text-muted-foreground">
                        Immediately stop all automated actions across all chains
                      </p>
                    </div>
                    <Switch
                      id="emergency-pause"
                      checked={emergencyPauseAll}
                      onCheckedChange={setEmergencyPauseAll}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-medium">Pause Specific Chains</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Ethereum", "BSC", "Polygon", "Avalanche"].map((chain) => (
                        <div
                          key={chain}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            pausedChains.includes(chain)
                              ? "border-destructive/50 bg-destructive/10"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => toggleChainPause(chain)}
                        >
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span className="text-sm font-medium">{chain}</span>
                          </div>
                          <Badge variant={pausedChains.includes(chain) ? "destructive" : "secondary"} className="text-xs">
                            {pausedChains.includes(chain) ? "Paused" : "Active"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-medium">Pause Specific DEXes</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Uniswap V3", "PancakeSwap V3", "Trader Joe", "Curve"].map((dex) => (
                        <div
                          key={dex}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            pausedDexes.includes(dex)
                              ? "border-destructive/50 bg-destructive/10"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => toggleDexPause(dex)}
                        >
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            <span className="text-sm font-medium">{dex}</span>
                          </div>
                          <Badge variant={pausedDexes.includes(dex) ? "destructive" : "secondary"} className="text-xs">
                            {pausedDexes.includes(dex) ? "Paused" : "Active"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={handleTestRules}
            disabled={mode.current === "shadow"}
          >
            {mode.current === "shadow" ? "Preview Only" : "Test Policy Rules"}
          </Button>
          <Button onClick={handleSavePolicy}>
            Save Policy Changes
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}