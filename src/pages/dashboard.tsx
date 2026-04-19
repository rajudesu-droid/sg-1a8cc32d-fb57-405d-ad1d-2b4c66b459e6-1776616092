import { AppLayout } from "@/components/AppLayout";
import { useAppStore } from "@/store";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  DollarSign,
  Activity,
  AlertTriangle,
  Wallet,
  PiggyBank,
  Target,
  Info,
  TrendingDown,
  Calendar,
  Coins,
  Percent,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PortfolioMetrics } from "@/components/dashboard/PortfolioMetrics";
import { ActivePositions } from "@/components/dashboard/ActivePositions";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import { NetworkBalances } from "@/components/dashboard/NetworkBalances";
import { ConnectedWallets } from "@/components/dashboard/ConnectedWallets";
import { ExecutionMonitor } from "@/components/ExecutionMonitor";
import { ModeBanner } from "@/components/ModeBanner";
import { orchestrator } from "@/core/orchestrator";
import { useRouter } from "next/router";

export default function Dashboard() {
  const mode = useAppStore((state) => state.mode);
  const wallet = useAppStore((state) => state.wallet);
  const paperWallets = useAppStore((state) => state.paperWallets);
  const portfolio = useAppStore((state) => state.portfolio);
  const positions = useAppStore((state) => state.positions);
  const botRunning = useAppStore((state) => state.botRunning);
  const router = useRouter();

  const [portfolioData, setPortfolioData] = useState({
    totalValue: 0,
    deployedCapital: 0,
    idleCapital: 0,
    netApy: 0,
    dailyEarnings: 0 as number | { realized: number; projected: number },
    monthlyEarnings: 0 as number | { realized: number; projected: number },
    realizedEarnings: 0,
    projected30Day: 0,
  });

  // Listen for mode changes
  useEffect(() => {
    const unsubscribe = orchestrator.subscribe((event) => {
      if (event.type === "mode_changed") {
        console.log("[Dashboard] Mode changed, updating portfolio view");
      }
    });
    return () => unsubscribe();
  }, []);

  // Update portfolio data based on mode
  useEffect(() => {
    if (mode.current === "demo") {
      // Demo mode - aggregate data from paper wallets
      if (paperWallets.length === 0) {
        setPortfolioData({
          totalValue: 0,
          deployedCapital: 0,
          idleCapital: 0,
          netApy: 0,
          dailyEarnings: 0,
          monthlyEarnings: 0,
          realizedEarnings: 0,
          projected30Day: 0,
        });
      } else {
        const totalValue = paperWallets.reduce((sum, w) => sum + w.totalValue, 0);
        
        setPortfolioData({
          totalValue,
          deployedCapital: 0,
          idleCapital: totalValue,
          netApy: 0,
          dailyEarnings: 0,
          monthlyEarnings: 0,
          realizedEarnings: 0,
          projected30Day: 0,
        });
      }
    } else if (mode.current === "shadow") {
      // Shadow mode - estimated values from connected wallet
      if (wallet.wallet) {
        const totalValue = wallet.assets.reduce(
          (sum, asset) => sum + (parseFloat(asset.balance) || 0) * (asset.priceUsd || 0),
          0
        );

        setPortfolioData({
          totalValue,
          deployedCapital: 0,
          idleCapital: totalValue,
          netApy: 0,
          dailyEarnings: 0,
          monthlyEarnings: 0,
          realizedEarnings: 0,
          projected30Day: 0,
        });
      } else {
        setPortfolioData({
          totalValue: 0,
          deployedCapital: 0,
          idleCapital: 0,
          netApy: 0,
          dailyEarnings: 0,
          monthlyEarnings: 0,
          realizedEarnings: 0,
          projected30Day: 0,
        });
      }
    } else if (mode.current === "live") {
      // Live mode - real data from portfolio
      setPortfolioData({
        totalValue: portfolio?.totalValue || 0,
        deployedCapital: portfolio?.deployedCapital || 0,
        idleCapital: portfolio?.idleCapital || 0,
        netApy: portfolio?.netApy || 0,
        dailyEarnings: portfolio?.dailyEarnings || 0,
        monthlyEarnings: portfolio?.monthlyEarnings || 0,
        realizedEarnings: portfolio?.realizedEarnings || 0,
        projected30Day: portfolio?.projected30Day || 0,
      });
    }
  }, [mode.current, wallet.wallet, wallet.assets, portfolio, paperWallets]);

  const getPageTitle = () => {
    switch (mode.current) {
      case "demo":
        return "Dashboard";
      case "shadow":
        return "Dashboard";
      case "live":
        return "Dashboard";
      default:
        return "Dashboard";
    }
  };

  const getModeLabel = () => {
    switch (mode.current) {
      case "demo":
        return "Simulated";
      case "shadow":
        return "Estimated";
      case "live":
        return "Live";
      default:
        return "";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
            <p className="text-muted-foreground">Portfolio overview and automation status</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={mode.current === "demo" ? "secondary" : mode.current === "shadow" ? "outline" : "default"}>
              {mode.current === "demo" ? "Demo Mode" : mode.current === "shadow" ? "Shadow Mode" : "Live Mode"}
            </Badge>
            {mode.current === "demo" && (
              <Button onClick={() => router.push("/wallets")} variant="default">
                Start Bot
              </Button>
            )}
            {mode.current !== "demo" && botRunning && (
              <Badge variant="default" className="bg-emerald-500">
                Bot Running
              </Badge>
            )}
          </div>
        </div>

        {/* Mode Banner */}
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-sm">
            <strong>{mode.current === "demo" ? "Demo Mode" : mode.current === "shadow" ? "Shadow Mode" : "Live Mode"}:</strong>{" "}
            {mode.current === "demo"
              ? "All data is simulated. No real funds or blockchain transactions. Perfect for testing strategies safely."
              : mode.current === "shadow"
              ? "Read-only wallet connection. Recommendations shown but nothing is executed. Review mode only."
              : "Real blockchain execution. Policy rules are enforced. Emergency pause available."}
          </AlertDescription>
        </Alert>

        {/* Portfolio Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Portfolio Value */}
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Portfolio Value ({getModeLabel()})
              </CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      {mode.current === "demo"
                        ? "Total value of all simulated assets across paper wallets"
                        : mode.current === "shadow"
                        ? "Estimated total value from connected wallet balances"
                        : "Real-time total value of all assets and positions"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${portfolioData.totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {mode.current === "demo" ? "Simulated total" : mode.current === "shadow" ? "Estimated total" : "Current total"}
              </p>
            </CardContent>
          </Card>

          {/* Deployed Capital */}
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Deployed Capital ({getModeLabel()})
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${portfolioData.deployedCapital.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {mode.current === "demo" ? "Simulated positions" : mode.current === "shadow" ? "Estimated positions" : "Active positions"}
              </p>
            </CardContent>
          </Card>

          {/* Idle Capital */}
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Idle Capital ({getModeLabel()}) <Badge variant="outline" className="ml-1 text-[10px]">■</Badge>
              </CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${portfolioData.idleCapital.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {mode.current === "demo" ? "Simulated undeployed" : mode.current === "shadow" ? "Estimated undeployed" : "Available capital"}
              </p>
            </CardContent>
          </Card>

          {/* Daily Earnings */}
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Daily Earnings ({getModeLabel()})
              </CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      {mode.current === "demo"
                        ? "Simulated earnings for today (realized + projected)"
                        : mode.current === "shadow"
                        ? "Estimated daily earnings if positions were active"
                        : "Realized earnings today + projected for remainder of day"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                +${typeof portfolioData.dailyEarnings === 'number' 
                  ? portfolioData.dailyEarnings.toLocaleString() 
                  : (portfolioData.dailyEarnings.realized + portfolioData.dailyEarnings.projected).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {mode.current === "demo" ? "Simulated today" : mode.current === "shadow" ? "Estimated today" : "Today's earnings"}
              </p>
            </CardContent>
          </Card>

          {/* Monthly Earnings */}
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Earnings ({getModeLabel()})
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                +${typeof portfolioData.monthlyEarnings === 'number'
                  ? portfolioData.monthlyEarnings.toLocaleString()
                  : (portfolioData.monthlyEarnings.realized + portfolioData.monthlyEarnings.projected).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {mode.current === "demo" ? "Simulated MTD" : mode.current === "shadow" ? "Estimated MTD" : "Current month"}
              </p>
            </CardContent>
          </Card>

          {/* Net APY */}
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Net APY ({getModeLabel()})
              </CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolioData.netApy.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {mode.current === "demo" ? "Simulated portfolio APY" : mode.current === "shadow" ? "Estimated APY" : "Annualized yield"}
              </p>
            </CardContent>
          </Card>

          {/* Realized Earnings */}
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Realized Earnings ({getModeLabel()})
              </CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      {mode.current === "demo"
                        ? "Total simulated fees and rewards claimed so far"
                        : mode.current === "shadow"
                        ? "Estimated total if positions were harvested"
                        : "All-time fees and rewards successfully claimed"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                +${portfolioData.realizedEarnings.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {mode.current === "demo" ? "Simulated all-time" : mode.current === "shadow" ? "Estimated potential" : "Lifetime claimed"}
              </p>
            </CardContent>
          </Card>

          {/* Projected 30-Day */}
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Projected 30-Day ({getModeLabel()})
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">
                +${portfolioData.projected30Day.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {mode.current === "demo" ? "Simulated projection" : mode.current === "shadow" ? "Estimated projection" : "30-day forecast"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Dashboard Sections */}
        <div className="grid gap-6 md:grid-cols-2">
          <PortfolioMetrics />
          <ExecutionMonitor />
          <ActivePositions />
          <RecentAlerts />
          <NetworkBalances />
          <ConnectedWallets />
        </div>
      </div>
    </AppLayout>
  );
}