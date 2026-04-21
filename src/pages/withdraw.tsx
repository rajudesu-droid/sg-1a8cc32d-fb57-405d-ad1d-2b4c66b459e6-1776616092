import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingDown, Zap, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/store";

export default function Withdraw() {
  const positions = useAppStore((state) => state.positions);
  const mode = useAppStore((state) => state.mode);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // Calculate totals from real positions
  const totalPositionValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
  const totalPositions = positions.length;

  const handleOptimize = () => {
    console.log("Optimize withdrawal plan for:", withdrawAmount);
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
                  <Button onClick={handleOptimize} className="w-full">
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Optimal Unwind Plan
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
                      if (a.rangeStatus === "out_of_range" && b.rangeStatus !== "out_of_range") return -1;
                      if (a.rangeStatus !== "out_of_range" && b.rangeStatus === "out_of_range") return 1;
                      return b.currentValue - a.currentValue;
                    })
                    .map((position) => (
                      <div
                        key={position.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/30"
                      >
                        <div>
                          <div className="font-semibold">{position.poolPair}</div>
                          <div className="text-sm text-muted-foreground">
                            {position.protocol} • {position.chain}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            ${position.currentValue.toLocaleString()}
                          </div>
                          <Badge
                            variant={position.rangeStatus === "out_of_range" ? "destructive" : "default"}
                            className="text-xs"
                          >
                            {position.rangeStatus === "in_range" ? "In Range" : "Out of Range"}
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