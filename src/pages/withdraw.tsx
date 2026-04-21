import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingDown, Zap, AlertTriangle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { actionHandler } from "@/services/ActionHandlerService";

export default function Withdraw() {
  const positions = useAppStore((state) => state.positions);
  const mode = useAppStore((state) => state.mode);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [optimizeLoading, setOptimizeLoading] = useState(false);
  const { toast } = useToast();

  // Calculate totals from real positions
  const totalPositionValue = positions.reduce((sum, p) => sum + p.valueUsd, 0);
  const totalPositions = positions.length;

  const handleOptimize = async () => {
    if (!withdrawAmount || isNaN(parseFloat(withdrawAmount)) || parseFloat(withdrawAmount) <= 0) {
      toast({ 
        title: "Invalid Amount", 
        description: "Please enter a valid withdrawal amount.", 
        variant: "destructive" 
      });
      return;
    }

    if (parseFloat(withdrawAmount) > totalPositionValue) {
      toast({ 
        title: "Insufficient Funds", 
        description: "Withdrawal amount exceeds total active position value.", 
        variant: "destructive" 
      });
      return;
    }

    setOptimizeLoading(true);
    try {
      const result = await actionHandler.generateWithdrawalPlan(
        parseFloat(withdrawAmount),
        { mode: mode.current, metadata: { source: "withdraw_page" } }
      );
      
      toast({
        title: result.success ? "Plan Generated" : "Generation Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Action Failed",
        description: "Failed to generate withdrawal plan.",
        variant: "destructive",
      });
    } finally {
      setOptimizeLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Optimized Withdrawal</h1>
            <p className="text-muted-foreground">
              Exit positions efficiently with minimum costs
            </p>
          </div>
          <Badge variant={mode.current === "demo" ? "secondary" : mode.current === "shadow" ? "outline" : "default"}>
            {mode.current === "demo" ? "Demo Mode" : mode.current === "shadow" ? "Shadow Mode" : "Live Mode"}
          </Badge>
        </div>

        {positions.length === 0 ? (
          /* Empty State */
          <Card className="card-gradient border-border/50">
            <CardContent className="py-12">
              <div className="text-center">
                <TrendingDown className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Active Positions</h3>
                <p className="text-muted-foreground mb-6">
                  You don&apos;t have any active LP positions to withdraw from.
                </p>
                <Button onClick={() => window.location.href = "/opportunities"}>
                  Explore Opportunities
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Withdrawal Input */}
            <Card className="card-gradient border-border/50">
              <CardHeader>
                <CardTitle>Withdrawal Amount</CardTitle>
                <CardDescription>
                  Enter the amount you want to withdraw
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (USD)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleOptimize} 
                    className="w-full"
                    disabled={optimizeLoading || positions.length === 0}
                  >
                    {optimizeLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Generating Plan...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Generate Optimal Unwind Plan
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="card-gradient border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Position Value
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${totalPositionValue.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Available to withdraw
                  </p>
                </CardContent>
              </Card>

              <Card className="card-gradient border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Positions
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalPositions}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Positions to evaluate
                  </p>
                </CardContent>
              </Card>

              <Card className="card-gradient border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Optimization Status
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-400">Pending</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter amount to generate plan
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Current Positions */}
            <Card className="card-gradient border-border/50">
              <CardHeader>
                <CardTitle>Current Positions</CardTitle>
                <CardDescription>
                  Your active LP positions available for withdrawal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {positions
                    .sort((a, b) => {
                      // Sort by priority: out of range first, then by value
                      if (a.status === "out-of-range" && b.status !== "out-of-range") return -1;
                      if (a.status !== "out-of-range" && b.status === "out-of-range") return 1;
                      return b.valueUsd - a.valueUsd;
                    })
                    .map((position) => (
                      <div
                        key={position.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/30"
                      >
                        <div>
                          <div className="font-semibold">{position.pair}</div>
                          <div className="text-sm text-muted-foreground">
                            {position.dex} • {position.chain}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            ${position.valueUsd.toLocaleString()}
                          </div>
                          <Badge
                            variant={position.status === "out-of-range" ? "destructive" : "default"}
                            className="text-xs"
                          >
                            {position.status === "active" ? "In Range" : "Out of Range"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Unwind Plan Placeholder */}
            {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
              <Card className="card-gradient border-border/50">
                <CardHeader>
                  <CardTitle>Optimized Unwind Plan</CardTitle>
                  <CardDescription>
                    Best strategy to withdraw ${parseFloat(withdrawAmount).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Click &quot;Generate Optimal Unwind Plan&quot; to see the withdrawal strategy</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}