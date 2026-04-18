import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Wallet, DollarSign, Percent } from "lucide-react";

const metrics = [
  {
    label: "Total Value",
    value: "$24,582.40",
    change: "+12.4%",
    trend: "up" as const,
    icon: Wallet,
  },
  {
    label: "Deployed Capital",
    value: "$18,400.00",
    subtitle: "74.8% allocated",
    icon: DollarSign,
  },
  {
    label: "Idle Capital",
    value: "$6,182.40",
    subtitle: "Ready to deploy",
    icon: TrendingUp,
  },
  {
    label: "Net Yield (30d)",
    value: "+8.4%",
    change: "$1,840.20",
    trend: "up" as const,
    icon: Percent,
  },
];

export function PortfolioMetrics() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className="card-gradient border-border/50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">{metric.label}</p>
                <p className="text-2xl font-semibold tracking-tight">{metric.value}</p>
                {metric.subtitle && (
                  <p className="text-xs text-muted-foreground">{metric.subtitle}</p>
                )}
                {metric.change && (
                  <p className={`text-xs font-medium ${
                    metric.trend === "up" ? "metric-positive" : "metric-negative"
                  }`}>
                    {metric.change}
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-primary/10 p-2">
                <metric.icon className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}