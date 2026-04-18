import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Wallet, DollarSign, Coins, Calendar, TrendingDown, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function PortfolioMetrics() {
  const metrics = [
    {
      label: "Total Portfolio Value",
      value: "$28,085.93",
      change: "+$405.90",
      changePercent: "+1.47%",
      icon: Wallet,
      colorClass: "text-primary",
    },
    {
      label: "Deployed Capital",
      value: "$18,400.00",
      sublabel: "65.5% of portfolio",
      icon: TrendingUp,
      colorClass: "text-success",
    },
    {
      label: "Idle Capital",
      value: "$9,685.93",
      sublabel: "Available for deployment",
      icon: Coins,
      colorClass: "text-muted-foreground",
    },
    {
      label: "Total Claimable Rewards",
      value: "$351.30",
      sublabel: "Across all positions",
      icon: DollarSign,
      colorClass: "text-primary",
    },
  ];

  const earningsMetrics = [
    {
      label: "Daily Earnings",
      realized: "$12.40",
      projected: "$24.80",
      icon: Calendar,
      tooltip: "Realized: Actual fees/rewards earned today. Projected: Estimated based on current APY.",
    },
    {
      label: "Monthly Earnings (Apr)",
      realized: "$186.50",
      projected: "$744.00",
      icon: TrendingUp,
      tooltip: "Realized: Actual fees/rewards earned this calendar month. Projected: Estimated month-end total based on current positions.",
    },
    {
      label: "Projected 30-Day",
      value: "$744.00",
      sublabel: "Based on current positions",
      icon: TrendingUp,
      colorClass: "text-accent",
      tooltip: "Estimated earnings over the next 30 days assuming current positions, APY, and market conditions remain constant. Not guaranteed.",
    },
    {
      label: "Estimated Net APY",
      value: "11.8%",
      sublabel: "Weighted across positions",
      icon: TrendingUp,
      colorClass: "text-success",
      tooltip: "Portfolio-weighted average APY across all active positions, net of estimated gas costs.",
    },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="card-gradient border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <p className="text-xs text-muted-foreground font-medium">{metric.label}</p>
                    <p className="text-2xl font-semibold">{metric.value}</p>
                    {metric.change && (
                      <p className={`text-xs ${metric.change.startsWith('+') ? 'metric-positive' : 'metric-negative'}`}>
                        {metric.change} ({metric.changePercent})
                      </p>
                    )}
                    {metric.sublabel && (
                      <p className="text-xs text-muted-foreground">{metric.sublabel}</p>
                    )}
                  </div>
                  <div className={`rounded-lg bg-card/50 p-2 ${metric.colorClass}`}>
                    <metric.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">Earnings Metrics</h2>
            <Badge variant="outline" className="text-xs bg-muted/50">
              Demo Mode - Simulated
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {earningsMetrics.map((metric) => (
              <Card key={metric.label} className="card-gradient border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground font-medium">{metric.label}</p>
                      {metric.tooltip && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs">{metric.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div className={`rounded-lg bg-card/50 p-1.5 ${metric.colorClass || 'text-primary'}`}>
                      <metric.icon className="h-4 w-4" />
                    </div>
                  </div>

                  {metric.realized !== undefined ? (
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Realized</p>
                        <p className="text-xl font-semibold metric-positive">{metric.realized}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Projected</p>
                        <p className="text-lg font-mono text-accent">{metric.projected}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-2xl font-semibold">{metric.value}</p>
                      {metric.sublabel && (
                        <p className="text-xs text-muted-foreground">{metric.sublabel}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}