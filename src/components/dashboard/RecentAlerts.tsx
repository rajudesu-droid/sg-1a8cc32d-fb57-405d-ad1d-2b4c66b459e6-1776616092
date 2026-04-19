import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Bell } from "lucide-react";
import { useAppStore } from "@/store";
import { format } from "date-fns";

export function RecentAlerts() {
  const alerts = useAppStore((state) => state.alerts);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-accent" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getAlertVariant = (type: string) => {
    switch (type) {
      case "error":
        return "destructive" as const;
      case "warning":
        return "outline" as const;
      case "success":
        return "default" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <Card className="card-gradient border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Alerts</CardTitle>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 rounded-lg border border-border/30 bg-card/30 p-3">
                {getAlertIcon(alert.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm">{alert.title}</p>
                    <Badge variant={getAlertVariant(alert.type)} className="text-xs">
                      {alert.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{alert.message}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {format(alert.timestamp, "MMM dd, HH:mm:ss")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
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