import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store";
import { PortfolioMetrics } from "@/components/dashboard/PortfolioMetrics";
import { ActivePositions } from "@/components/dashboard/ActivePositions";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import { NetworkBalances } from "@/components/dashboard/NetworkBalances";
import { ConnectedWallets } from "@/components/dashboard/ConnectedWallets";

export default function Dashboard() {
  const { toast } = useToast();
  const mode = useAppStore((state) => state.mode);
  const [botRunning, setBotRunning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const handleStartBot = async () => {
    setIsStarting(true);
    
    // Simulate bot initialization
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setBotRunning(true);
    setIsStarting(false);
    
    toast({
      title: "Automation Started",
      description: `LP Autopilot is now running in ${mode} mode`,
    });
  };

  const handleStopBot = () => {
    setBotRunning(false);
    
    toast({
      title: "Automation Stopped",
      description: "All automated actions have been paused",
      variant: "destructive",
    });
  };

  const getModeLabel = () => {
    switch (mode) {
      case "demo": return "Demo";
      case "shadow": return "Shadow";
      case "live": return "Live";
      default: return "Demo";
    }
  };

  const getModeVariant = () => {
    switch (mode) {
      case "demo": return "secondary" as const;
      case "shadow": return "outline" as const;
      case "live": return "default" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Portfolio overview and automation status
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={getModeVariant()}>
              {getModeLabel()} Mode
            </Badge>
            {botRunning ? (
              <Button onClick={handleStopBot} variant="destructive" className="gap-2">
                <Pause className="h-4 w-4" />
                Stop Bot
              </Button>
            ) : (
              <Button onClick={handleStartBot} disabled={isStarting} className="gap-2">
                <Play className="h-4 w-4" />
                {isStarting ? "Starting..." : "Start Bot"}
              </Button>
            )}
          </div>
        </div>

        {/* Bot Status Banner */}
        {botRunning && (
          <div className="rounded-lg border border-success bg-success/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success">
                <Play className="h-5 w-5 text-background" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-success">Automation Active</h3>
                <p className="text-sm text-muted-foreground">
                  LP Autopilot is monitoring opportunities and executing policies in {mode} mode
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm text-success">Live</span>
              </div>
            </div>
          </div>
        )}

        {/* Mode Warning for Demo */}
        {mode === "demo" && (
          <div className="rounded-lg border border-accent bg-accent/10 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-accent flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Demo Mode:</strong> All positions and earnings are simulated. No real funds or transactions.
              </p>
            </div>
          </div>
        )}

        {/* Metrics */}
        <PortfolioMetrics mode={mode} />

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <ActivePositions />
          <RecentAlerts />
        </div>

        {/* Bottom Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <NetworkBalances />
          <ConnectedWallets />
        </div>
      </div>
    </AppLayout>
  );
}