import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, TrendingUp, DollarSign, Wallet, Activity } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppStore } from "@/store";

interface PortfolioMetricsProps {
  mode: "demo" | "shadow" | "live";
}

export function PortfolioMetrics({ mode }: PortfolioMetricsProps) {
  const portfolio = useAppStore((state) => state.portfolio);

  const getModeLabel = (baseLabel: string) => {
    switch (mode) {
      case "demo":
        return `${baseLabel} (Simulated)`;
      case "shadow":
        return `${baseLabel} (Estimated)`;
      case "live":
        return baseLabel;
    }
  };

  const getValueLabel = (label: string) => {
    switch (mode) {
      case "demo":
        return `${label} - Simulated`;
      case "shadow":
        return `${label} - Estimated from wallet data`;
      case "live":
        return `${label} - Realized from live positions`;
    }
  };

  const getDailyEarningsNote = () => {
    switch (mode) {
      case "demo":
        return "Simulated daily earnings from demo positions. Based on mock fee accrual and farm rewards.";
      case "shadow":
        return "Projected daily earnings based on current wallet assets and available opportunities. No positions open yet.";
      case "live":
        return "Realized fees + rewards from active positions today, plus projected earnings from current APY.";
    }
  };

  const getMonthlyEarningsNote = () => {
    switch (mode) {
      case "demo":
        return "Simulated monthly earnings. Calculated from demo position performance over 30 days.";
      case "shadow":
        return "Projected monthly earnings if recommended positions were opened. Based on current market conditions.";
      case "live":
        return "Month-to-date realized earnings + projected remainder based on current positions and APY.";
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {/* Total Portfolio Value */}
      <Card className="card-gradient border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {getModeLabel("Portfolio Value")}
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${Number(portfolio.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === "demo" ? "Simulated total" : mode === "shadow" ? "Estimated value" : "Real-time value"}
          </p>
        </CardContent>
      </Card>

      {/* Deployed Capital */}
      <Card className="card-gradient border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {getModeLabel("Deployed Capital")}
          </CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${Number(portfolio.deployedCapital || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === "demo" ? "In simulated positions" : mode === "shadow" ? "Recommended deployment" : "In active positions"}
          </p>
        </CardContent>
      </Card>

      {/* Idle Capital */}
      <Card className="card-gradient border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {getModeLabel("Idle Capital")}
          </CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${Number(portfolio.idleCapital || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === "demo" ? "Simulated undeployed" : mode === "shadow" ? "Available in wallet" : "Undeployed funds"}
          </p>
        </CardContent>
      </Card>

      {/* Daily Earnings */}
      <Card className="card-gradient border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getModeLabel("Daily Earnings")}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{getDailyEarningsNote()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold metric-positive">
            +${Number((portfolio.dailyEarnings as any)?.total ?? portfolio.dailyEarnings ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === "demo" ? "Simulated today" : mode === "shadow" ? "Projected per day" : "Realized + Projected"}
          </p>
        </CardContent>
      </Card>

      {/* Monthly Earnings */}
      <Card className="card-gradient border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getModeLabel("Monthly Earnings")}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{getMonthlyEarningsNote()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold metric-positive">
            +${Number((portfolio.monthlyEarnings as any)?.total ?? portfolio.monthlyEarnings ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === "demo" ? "Simulated MTD" : mode === "shadow" ? "Projected 30d" : "MTD + Projected"}
          </p>
        </CardContent>
      </Card>

      {/* Net APY */}
      <Card className="card-gradient border-border/50 md:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {getModeLabel("Net APY")}
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold metric-positive">
            {portfolio.netApy.toFixed(2)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === "demo" ? "Simulated portfolio APY" : mode === "shadow" ? "Projected if deployed" : "Current portfolio APY"}
          </p>
        </CardContent>
      </Card>

      {/* Realized Earnings */}
      <Card className="card-gradient border-border/50 md:col-span-2 lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getModeLabel("Realized Earnings")}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    {mode === "demo"
                      ? "Simulated cumulative earnings from all demo actions."
                      : mode === "shadow"
                      ? "No realized earnings in Shadow mode. Switch to Live to execute."
                      : "All-time realized fees and rewards from harvested positions."}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <DollarSign className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold metric-positive">
            +${Number(portfolio.realizedEarnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === "demo" ? "Simulated all-time" : mode === "shadow" ? "No execution yet" : "All-time claimed"}
          </p>
        </CardContent>
      </Card>

      {/* Projected 30-Day Earnings */}
      <Card className="card-gradient border-border/50 md:col-span-2 lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getModeLabel("Projected 30-Day")}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    {mode === "demo"
                      ? "Simulated forward-looking 30-day earnings estimate based on current demo positions."
                      : mode === "shadow"
                      ? "Projected earnings if recommended positions were deployed for 30 days."
                      : "Forward-looking estimate based on current positions, APY, and market conditions."}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            +${Number(portfolio.projected30Day || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === "demo" ? "Simulated projection" : mode === "shadow" ? "If positions opened" : "Based on current APY"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}