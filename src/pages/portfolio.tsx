import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Target, PieChart, Activity } from "lucide-react";
import { useAppStore } from "@/store";

export default function Portfolio() {
  const mode = useAppStore((state) => state.mode);
  const portfolio = useAppStore((state) => state.portfolio);
  const positions = useAppStore((state) => state.positions);
  const wallet = useAppStore((state) => state.wallet);

  // Calculate portfolio metrics from real data
  const totalValue = portfolio?.totalValue || 0;
  const deployedCapital = portfolio?.deployedCapital || 0;
  const idleCapital = portfolio?.idleCapital || 0;
  const netApy = portfolio?.netApy || 0;
  const totalEarnings = portfolio?.realizedEarnings || 0;

  const hasData = positions.length > 0 || wallet.assets.length > 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Portfolio</h1>
            <p className="text-muted-foreground">
              Complete overview of your assets and performance
            </p>
          </div>
          <Badge variant={mode.current === "demo" ? "secondary" : mode.current === "shadow" ? "outline" : "default"}>
            {mode.current === "demo" ? "Demo Mode" : mode.current === "shadow" ? "Shadow Mode" : "Live Mode"}
          </Badge>
        </div>

        {!hasData ? (
          /* Empty State */
          <Card className="card-gradient border-border/50">
            <CardContent className="py-12">
              <div className="text-center">
                <PieChart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Portfolio Data</h3>
                <p className="text-muted-foreground mb-6">
                  {mode.current === "demo" 
                    ? "Create a paper wallet to get started with Demo Mode"
                    : mode.current === "shadow"
                    ? "Connect a wallet to view your portfolio in Shadow Mode"
                    : "Connect a wallet and open positions to see your portfolio"}
                </p>
                <Button onClick={() => window.location.href = mode.current === "demo" ? "/wallets" : "/opportunities"}>
                  {mode.current === "demo" ? "Create Paper Wallet" : "Get Started"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Portfolio Summary */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="card-gradient border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Portfolio value
                  </p>
                </CardContent>
              </Card>

              <Card className="card-gradient border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Deployed</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${deployedCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    In positions
                  </p>
                </CardContent>
              </Card>

              <Card className="card-gradient border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Idle Capital</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${idleCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Available
                  </p>
                </CardContent>
              </Card>

              <Card className="card-gradient border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net APY</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-400">
                    {netApy.toFixed(2)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Average yield
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Positions Breakdown */}
            <Card className="card-gradient border-border/50">
              <CardHeader>
                <CardTitle>Active Positions</CardTitle>
                <CardDescription>
                  {positions.length === 0 ? "No active positions" : `${positions.length} position(s)`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {positions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No active LP positions</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {positions.map((position) => (
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
                            ${position.valueUsd?.toLocaleString()}
                          </div>
                          <div className="text-sm text-emerald-400">
                            {position.health}% Health
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Earnings Summary */}
            <Card className="card-gradient border-border/50">
              <CardHeader>
                <CardTitle>Earnings Summary</CardTitle>
                <CardDescription>
                  Total earnings across all positions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-400">
                  +${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Lifetime realized earnings
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}