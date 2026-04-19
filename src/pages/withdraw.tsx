import { AppLayout } from "@/components/AppLayout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, TrendingDown, AlertCircle, CheckCircle2, Play, ArrowDownToLine, DollarSign, Target, Coins, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store";
import { ModeBanner } from "@/components/ModeBanner";
import { orchestrator } from "@/core/orchestrator";

const mockUnwindPlan = [
  {
    position: "MATIC/USDC",
    chain: "Polygon",
    action: "Close 100%",
    deployed: "$4,600.00",
    value: "$4,570.90",
    fees: "$52.10",
    gasEstimate: "$2.40",
    slippage: "$8.20",
    netProceeds: "$4,612.40",
    reason: "Out of range, lowest future yield",
  },
  {
    position: "BNB/BUSD",
    chain: "BSC",
    action: "Close 60%",
    deployed: "$3,360.00",
    value: "$3,426.42",
    fees: "$46.92",
    gasEstimate: "$1.80",
    slippage: "$6.40",
    netProceeds: "$3,465.14",
    reason: "Partial close for remaining target",
  },
];

export default function Withdraw() {
  const [targetAmount, setTargetAmount] = useState("8000");
  const [targetToken, setTargetToken] = useState("USDC");
  const [planGenerated, setPlanGenerated] = useState(false);
  const { toast } = useToast();
  const mode = useAppStore((state) => state.mode);

  const mockPositions = [
    { currentValue: 5234.67, accruedFees: 124.30, accruedRewards: 18.40 },
    { currentValue: 3210.45, accruedFees: 87.20, accruedRewards: 12.60 },
  ];

  const optimizedPlan = { totalGas: 4.20 };

  // Listen for mode changes
  useEffect(() => {
    const unsubscribe = orchestrator.subscribe((event) => {
      if (event.type === "mode_changed") {
        console.log("[Withdraw] Mode changed, clearing withdrawal plan");
        setPlanGenerated(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const totalNetProceeds = mockUnwindPlan.reduce(
    (sum, plan) => sum + parseFloat(plan.netProceeds.replace(/[$,]/g, "")),
    0
  );

  const totalGas = mockUnwindPlan.reduce(
    (sum, plan) => sum + parseFloat(plan.gasEstimate.replace(/[$,]/g, "")),
    0
  );

  const totalSlippage = mockUnwindPlan.reduce(
    (sum, plan) => sum + parseFloat(plan.slippage.replace(/[$,]/g, "")),
    0
  );

  const handleGeneratePlan = () => {
    setPlanGenerated(true);
    const modeLabel = mode.current === "demo" ? "simulated" : mode.current === "shadow" ? "estimated" : "optimized";
    toast({
      title: `Plan Generated (${mode.label})`,
      description: `${mode.current === "demo" ? "Simulated" : mode.current === "shadow" ? "Estimated" : "Optimized"} withdrawal plan created for $${targetAmount} ${targetToken}`,
    });
  };

  const handlePreviewPlan = () => {
    toast({
      title: `Previewing ${mode.label} Withdrawal`,
      description: "Opening detailed preview of withdrawal plan",
    });
  };

  const handleExecuteWithdrawal = () => {
    if (mode.current === "shadow") {
      toast({
        title: "Shadow Mode - Read Only",
        description: "Cannot execute withdrawals in Shadow mode. Switch to Demo or Live.",
        variant: "default",
      });
      return;
    }

    toast({
      title: mode.current === "demo" ? "Simulating Withdrawal" : "Executing Withdrawal",
      description: `${mode.current === "demo" ? "Simulating" : "Processing"} withdrawal plan across selected positions`,
      variant: "destructive",
    });
  };

  const handleCancel = () => {
    setPlanGenerated(false);
    setTargetAmount("8000");
    toast({
      title: "Plan Cancelled",
      description: "Withdrawal plan has been cleared",
    });
  };

  const handleModifyPlan = () => {
    toast({
      title: "Modifying Plan",
      description: "Opening plan editor",
    });
  };

  const getPageTitle = () => {
    switch (mode.current) {
      case "demo": return "Simulated Withdrawal Optimizer";
      case "shadow": return "Estimated Withdrawal Plan";
      case "live": return "Optimized Withdrawal";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Withdrawal Optimizer</h1>
          <p className="text-muted-foreground">
            Plan optimized position unwinding to minimize gas and slippage
          </p>
        </div>

        {/* Summary Report */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Withdrawable</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${mockPositions.reduce((sum, p) => sum + p.currentValue, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Available to withdraw</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockPositions.length}</div>
              <p className="text-xs text-muted-foreground">Open positions</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Rewards</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">
                +$
                {mockPositions
                  .reduce((sum, p) => sum + p.accruedFees + p.accruedRewards, 0)
                  .toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Unclaimed earnings</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estimated Gas</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${optimizedPlan ? optimizedPlan.totalGas.toFixed(2) : "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">Withdrawal cost</p>
            </CardContent>
          </Card>
        </div>

        {/* Mode Banner */}
        <ModeBanner />

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="card-gradient border-border/50 lg:col-span-2">
            <CardHeader>
              <CardTitle>Withdrawal Input</CardTitle>
              <CardDescription>
                Enter the amount you want to withdraw
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="text-lg font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="token">Receive Token</Label>
                  <Select value={targetToken} onValueChange={setTargetToken}>
                    <SelectTrigger id="token">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="USDT">USDT</SelectItem>
                      <SelectItem value="DAI">DAI</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={handleGeneratePlan}>
                Generate Optimal Unwind Plan
              </Button>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Portfolio Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Total</span>
                  <span className="font-semibold">$18,400.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">After Withdrawal</span>
                  <span className="font-semibold">$10,400.00</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining APY</span>
                  <span className="font-semibold metric-positive">13.2%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {planGenerated && (
          <>
            <Card className="card-gradient border-border/50">
              <CardHeader>
                <CardTitle>Recommended Unwind Plan</CardTitle>
                <CardDescription>
                  Positions selected for optimal closure with minimal cost
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockUnwindPlan.map((plan, index) => (
                  <div key={index}>
                    <div className="rounded-lg border border-border/50 bg-card/30 p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{plan.position}</h3>
                            <Badge variant="outline" className="text-xs">
                              {plan.chain}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                plan.action.includes("100%")
                                  ? "border-destructive/50 text-destructive"
                                  : "border-accent/50 text-accent"
                              }`}
                            >
                              {plan.action}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{plan.reason}</p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Net Proceeds</p>
                          <p className="text-lg font-semibold metric-positive">{plan.netProceeds}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Deployed</p>
                          <p className="font-mono">{plan.deployed}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Current Value</p>
                          <p className="font-mono">{plan.value}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Accrued Fees</p>
                          <p className="font-mono metric-positive">{plan.fees}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Gas Cost</p>
                          <p className="font-mono metric-negative">{plan.gasEstimate}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Slippage</p>
                          <p className="font-mono metric-negative">{plan.slippage}</p>
                        </div>
                      </div>
                    </div>
                    {index < mockUnwindPlan.length - 1 && (
                      <div className="flex justify-center py-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="card-gradient border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Position Value</span>
                    <span className="font-mono font-semibold">$7,997.32</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">+ Accrued Fees</span>
                    <span className="font-mono metric-positive">+$99.02</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">- Total Gas</span>
                    <span className="font-mono metric-negative">-${totalGas.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">- Total Slippage</span>
                    <span className="font-mono metric-negative">-${totalSlippage.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Final Amount</span>
                    <span className="font-mono font-semibold metric-positive">
                      ${totalNetProceeds.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-gradient border-primary/20 border">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <p className="font-semibold">Optimization Summary</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Prioritized out-of-range positions to minimize yield destruction</li>
                      <li>• Selected lower-gas chains first (Polygon before Ethereum)</li>
                      <li>• Preserved highest-performing positions (ETH/USDC stays active)</li>
                      <li>• Estimated total execution time: ~3-5 minutes across 2 transactions</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button className="gap-2" onClick={handlePreviewPlan}>
                <Play className="h-4 w-4" />
                Preview Withdrawal Plan
              </Button>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={handleModifyPlan}>
                Modify Plan
              </Button>
              <Button 
                variant="destructive" 
                className="gap-2" 
                onClick={handleExecuteWithdrawal}
                disabled={mode.current === "shadow"}
              >
                <ArrowDownToLine className="h-4 w-4" />
                {mode.current === "shadow" ? "Read Only" : "Execute Withdrawal Plan"}
              </Button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}