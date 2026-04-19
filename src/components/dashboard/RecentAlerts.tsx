import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { useAppStore } from "@/store";
import { formatDistanceToNow } from "date-fns";

export function RecentAlerts() {
  const alerts = useAppStore((state) => state.alerts);

  const getAlertIcon = (type: "info" | "success" | "warning" | "error") => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-accent" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getAlertVariant = (type: "info" | "success" | "warning" | "error") => {
    switch (type) {
      case "success":
        return "default";
      case "warning":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatTimestamp = (timestamp: Date | string) => {
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "Recently";
    }
  };

  return (
    <Card className="card-gradient border-border/50">
      <CardHeader>
        <CardTitle>Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/30 p-3"
              >
                {getAlertIcon(alert.type)}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{alert.title}</p>
                    <Badge variant={getAlertVariant(alert.type)} className="text-xs">
                      {alert.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(alert.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">No recent alerts</p>
            <p className="text-xs text-muted-foreground">
              Alerts will appear here when actions are executed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}