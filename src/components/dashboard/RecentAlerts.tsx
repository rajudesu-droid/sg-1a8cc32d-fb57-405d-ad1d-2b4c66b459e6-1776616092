import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info, TrendingDown } from "lucide-react";

const alerts = [
  {
    id: "1",
    type: "warning" as const,
    message: "MATIC/USDC position out of range",
    time: "5 minutes ago",
    icon: AlertTriangle,
  },
  {
    id: "2",
    type: "info" as const,
    message: "ETH/USDC ready to harvest",
    time: "2 hours ago",
    icon: Info,
  },
  {
    id: "3",
    type: "warning" as const,
    message: "High gas prices detected",
    time: "3 hours ago",
    icon: AlertCircle,
  },
  {
    id: "4",
    type: "info" as const,
    message: "New opportunity: AVAX/USDC",
    time: "5 hours ago",
    icon: TrendingDown,
  },
];

export function RecentAlerts() {
  return (
    <Card className="card-gradient border-border/50">
      <CardHeader>
        <CardTitle>Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div 
              key={alert.id}
              className="flex gap-3 rounded-lg border border-border/50 bg-card/30 p-3 text-sm"
            >
              <div className={`mt-0.5 ${
                alert.type === "warning" ? "text-accent" : "text-primary"
              }`}>
                <alert.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="leading-tight">{alert.message}</p>
                <p className="text-xs text-muted-foreground">{alert.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}