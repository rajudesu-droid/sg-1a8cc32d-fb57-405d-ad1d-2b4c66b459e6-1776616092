import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Zap, Shield, Activity, Pause, Play, AlertTriangle } from "lucide-react";

export default function Automation() {
  const [policies, setPolicies] = useState({
    autoDeploy: false,
    autoHarvest: true,
    autoCompound: true,
    autoRebalance: false,
  });

  const [thresholds, setThresholds] = useState({
    minHarvestAmount: 10,
    minRebalanceEdge: 5,
    maxDailyGas: 50,
  });

  const [capitalLimits, setCapitalLimits] = useState({
    maxPerPool: 5000,
    maxPerChain: 10000,
    maxTotalDeployed: 25000,
  });

  const [isPaused, setIsPaused] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Automation & Policies</h1>
            <p className="text-muted-foreground mt-1">Configure automation rules and risk controls</p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={isPaused ? "destructive" : "outline"} className="text-xs">
              {isPaused ? "Paused" : "Active"}
            </Badge>
            <Button
              variant={isPaused ? "default" : "destructive"}
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              className="gap-2"
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4" />
                  Emergency Pause
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="card-gradient border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Automation Policies
              </CardTitle>
              <CardDescription>
                Enable or disable automated actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="auto-deploy">Auto-Deploy Idle Funds</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically deploy idle assets to top-scored opportunities
                    </p>
                  </div>
                  <Switch
                    id="auto-deploy"
                    checked={policies.autoDeploy}
                    onCheckedChange={(checked) =>
                      setPolicies({ ...policies, autoDeploy: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="auto-harvest">Auto-Harvest Rewards</Label>
                    <p className="text-xs text-muted-foreground">
                      Claim rewards when threshold is met
                    </p>
                  </div>
                  <Switch
                    id="auto-harvest"
                    checked={policies.autoHarvest}
                    onCheckedChange={(checked) =>
                      setPolicies({ ...policies, autoHarvest: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="auto-compound">Auto-Compound</Label>
                    <p className="text-xs text-muted-foreground">
                      Reinvest harvested rewards into positions
                    </p>
                  </div>
                  <Switch
                    id="auto-compound"
                    checked={policies.autoCompound}
                    onCheckedChange={(checked) =>
                      setPolicies({ ...policies, autoCompound: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="auto-rebalance">Auto-Rebalance</Label>
                    <p className="text-xs text-muted-foreground">
                      Rebalance out-of-range or underperforming positions
                    </p>
                  </div>
                  <Switch
                    id="auto-rebalance"
                    checked={policies.autoRebalance}
                    onCheckedChange={(checked) =>
                      setPolicies({ ...policies, autoRebalance: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Action Thresholds
              </CardTitle>
              <CardDescription>
                Minimum thresholds for automated actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="min-harvest">Min Harvest Amount</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="min-harvest"
                        type="number"
                        value={thresholds.minHarvestAmount}
                        onChange={(e) =>
                          setThresholds({
                            ...thresholds,
                            minHarvestAmount: Number(e.target.value),
                          })
                        }
                        className="w-24 text-right"
                      />
                      <span className="text-sm text-muted-foreground">USDC</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Only harvest when rewards exceed this value
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="min-rebalance">Min Rebalance Edge</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="min-rebalance"
                        type="number"
                        value={thresholds.minRebalanceEdge}
                        onChange={(e) =>
                          setThresholds({
                            ...thresholds,
                            minRebalanceEdge: Number(e.target.value),
                          })
                        }
                        className="w-24 text-right"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minimum projected yield improvement to trigger rebalance
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="max-gas">Max Daily Gas Budget</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="max-gas"
                        type="number"
                        value={thresholds.maxDailyGas}
                        onChange={(e) =>
                          setThresholds({
                            ...thresholds,
                            maxDailyGas: Number(e.target.value),
                          })
                        }
                        className="w-24 text-right"
                      />
                      <span className="text-sm text-muted-foreground">USDC</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Maximum gas spend per day across all chains
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="card-gradient border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Capital Limits
            </CardTitle>
            <CardDescription>
              Maximum capital deployment guardrails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-3">
                <Label htmlFor="max-pool">Max Per Pool</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="max-pool"
                    type="number"
                    value={capitalLimits.maxPerPool}
                    onChange={(e) =>
                      setCapitalLimits({
                        ...capitalLimits,
                        maxPerPool: Number(e.target.value),
                      })
                    }
                    className="text-right"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">USDC</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Maximum capital in any single pool
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="max-chain">Max Per Chain</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="max-chain"
                    type="number"
                    value={capitalLimits.maxPerChain}
                    onChange={(e) =>
                      setCapitalLimits({
                        ...capitalLimits,
                        maxPerChain: Number(e.target.value),
                      })
                    }
                    className="text-right"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">USDC</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Maximum capital on any single chain
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="max-total">Max Total Deployed</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="max-total"
                    type="number"
                    value={capitalLimits.maxTotalDeployed}
                    onChange={(e) =>
                      setCapitalLimits({
                        ...capitalLimits,
                        maxTotalDeployed: Number(e.target.value),
                      })
                    }
                    className="text-right"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">USDC</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Maximum total deployed capital
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient border-accent/20 border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-accent" />
              Emergency Controls
            </CardTitle>
            <CardDescription>
              Manual override and safety mechanisms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-medium">Emergency Pause</p>
                <p className="text-sm text-muted-foreground">
                  Immediately halt all automated actions. Manual actions remain available.
                </p>
              </div>
              <Button
                variant={isPaused ? "default" : "destructive"}
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? "Resume All" : "Pause All"}
              </Button>
            </div>

            <Separator />

            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-medium">Whitelist Management</p>
                <p className="text-sm text-muted-foreground">
                  Configure supported chains, DEXes, and specific pools
                </p>
              </div>
              <Button variant="outline">
                Manage Whitelist
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline">
            Test Policy Rules
          </Button>
          <Button>
            Save Policy Changes
          </Button>
          <Button variant="destructive" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Emergency Stop All
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}