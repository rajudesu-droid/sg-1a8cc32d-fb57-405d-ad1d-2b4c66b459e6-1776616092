import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Wallet, DollarSign, TrendingDown, Info, CalendarDays, Clock, Target, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PortfolioMetricsProps {
  mode: "demo" | "shadow" | "live";
}

export function PortfolioMetrics({ mode }: PortfolioMetricsProps) {
  const getModeLabel = () => {
    if (mode === "demo") return { text: "Simulated", color: "bg-muted text-muted-foreground" };
    if (mode === "shadow") return { text: "Estimated", color: "bg-accent/20 text-accent" };
    return { text: "Live", color: "bg-success/20 text-success" };
  };

  const modeLabel = getModeLabel();

  // Earnings KPIs
  const earningsKPIs = [
    {
      label: "Daily Earnings",
      value: "$24.80",
      realized: "$12.40",
      projected: "$12.40",
      icon: Clock,
      note: mode === "demo" 
        ? "Simulated fees + rewards for today"
        : mode === "shadow"
        ? "Estimated based on current positions"
        : "Today's realized + projected fees",
      color: "text-primary",
    },
    {
      label: "Monthly Earnings",
      value: "$744.00",
      realized: "$186.50",
      projected: "$557.50",
      icon: CalendarDays,
      note: mode === "demo"
        ? "Simulated Apr 2026 total"
        : mode === "shadow"
        ? "Estimated Apr 2026 total"
        : "Apr realized ($186.50) + projected to month-end",
      color: "text-primary",
    },
    {
      label: "Realized Earnings",
      value: "$351.30",
      realized: "$351.30",
      projected: "$0.00",
      icon: TrendingUp,
      note: mode === "demo"
        ? "Simulated claimed fees + rewards"
        : mode === "shadow"
        ? "N/A - no execution in Shadow mode"
        : "Actually claimed fees + rewards (all-time)",
      color: "text-success",
    },
    {
      label: "Projected 30-Day",
      value: "$744.00",
      realized: "$0.00",
      projected: "$744.00",
      icon: Target,
      note: mode === "demo"
        ? "Simulated 30-day projection"
        : "Estimated based on current APYs (not guaranteed)",
      color: "text-accent",
    },
  ];

  // Portfolio KPIs
  const portfolioKPIs = [
    {
      label: "Total Portfolio Value",
      value: "$18,805.60",
      change: "+$405.90",
      changePercent: "+2.21%",
      icon: Wallet,
      note: "Deployed positions + idle balances",
      color: "text-foreground",
    },
    {
      label: "Deployed Capital",
      value: "$18,400.00",
      change: "+3.2%",
      icon: Sparkles,
      note: "Active in LP positions across 3 chains",
      color: "text-primary",
    },
    {
      label: "Idle Capital",
      value: "$405.60",
      change: "2.2%",
      icon: DollarSign,
      note: "Available for deployment",
      color: "text-muted-foreground",
    },
    {
      label: "Estimated Net APY",
      value: "11.8%",
      change: "Weighted",
      icon: TrendingUp,
      note: mode === "demo"
        ? "Simulated weighted average APY"
        : "Weighted average across active positions",
      color: "text-success",
    },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Mode Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-xs ${modeLabel.color}`}>
            {mode === "demo" ? "Demo Mode" : mode === "shadow" ? "Shadow Mode" : "Live Mode"} - {modeLabel.text}
          </Badge>
          {mode !== "live" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  {mode === "demo" 
                    ? "All values are simulated. No real funds or transactions."
                    : "Read-only mode. Showing estimates based on current positions. No execution."}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Earnings KPIs */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Earnings Overview</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {earningsKPIs.map((metric, index) => (
              <Card key={index} className="card-gradient border-border/50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <metric.icon className={`h-4 w-4 ${metric.color}`} />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">{metric.note}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{metric.label}</p>
                      <p className={`text-2xl font-semibold ${metric.color} font-mono`}>
                        {metric.value}
                      </p>
                    </div>
                    {mode === "live" && parseFloat(metric.realized.replace(/[$,]/g, "")) > 0 && (
                      <div className="pt-2 border-t border-border/30 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Realized</span>
                          <span className="font-mono text-success">{metric.realized}</span>
                        </div>
                        {parseFloat(metric.projected.replace(/[$,]/g, "")) > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Projected</span>
                            <span className="font-mono text-accent">{metric.projected}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground/70 pt-1">{metric.note}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Portfolio KPIs */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Portfolio Metrics</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {portfolioKPIs.map((metric, index) => (
              <Card key={index} className="card-gradient border-border/50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <metric.icon className={`h-4 w-4 ${metric.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{metric.label}</p>
                      <p className={`text-2xl font-semibold ${metric.color}`}>
                        {metric.value}
                      </p>
                      {metric.change && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {metric.change} {metric.changePercent && `(${metric.changePercent})`}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground/70 pt-1">{metric.note}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}