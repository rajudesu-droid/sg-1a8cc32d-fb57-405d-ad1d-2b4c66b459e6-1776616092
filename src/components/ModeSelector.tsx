import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Beaker, Eye, Zap, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { orchestrator } from "@/core/orchestrator";

export function ModeSelector() {
  const mode = useAppStore((state) => state.mode);
  const setMode = useAppStore((state) => state.setMode);
  const { toast } = useToast();

  const handleModeChange = async (newMode: "demo" | "shadow" | "live") => {
    if (newMode === mode.current) return;

    // Show warning for Live Mode
    if (newMode === "live") {
      toast({
        title: "⚠️ Switching to Live Mode",
        description: "Real funds will be used. All actions will be executed on-chain.",
        variant: "destructive",
      });
    }

    // Update mode in store
    setMode(newMode);

    // Trigger data refresh via orchestrator
    orchestrator.publish({
      type: "mode.changed",
      source: "ModeSelector",
      data: { newMode, previousMode: mode.current },
      affectedModules: ["wallet", "portfolio", "opportunities", "positions", "rewards"],
    });

    // Show confirmation toast
    const modeLabels = {
      demo: "Demo Mode - Simulated Data",
      shadow: "Shadow Mode - Read-Only View",
      live: "Live Mode - Real Execution",
    };

    toast({
      title: "Mode Changed",
      description: modeLabels[newMode],
    });
  };

  const getModeIcon = () => {
    switch (mode.current) {
      case "demo":
        return <Beaker className="h-4 w-4" />;
      case "shadow":
        return <Eye className="h-4 w-4" />;
      case "live":
        return <Zap className="h-4 w-4" />;
    }
  };

  const getModeColor = () => {
    switch (mode.current) {
      case "demo":
        return "bg-secondary text-secondary-foreground";
      case "shadow":
        return "bg-accent/20 text-accent border-accent/50";
      case "live":
        return "bg-primary text-primary-foreground";
    }
  };

  const getModeDescription = () => {
    switch (mode.current) {
      case "demo":
        return "All data is simulated. No real funds.";
      case "shadow":
        return "Read-only mode. Real data, no execution.";
      case "live":
        return "Live execution enabled. Real funds at risk.";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 ${getModeColor()} hover:opacity-90`}
        >
          {getModeIcon()}
          <span className="font-semibold">{mode.label}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Select Mode</p>
            <p className="text-xs text-muted-foreground">{getModeDescription()}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleModeChange("demo")}
          className={mode.current === "demo" ? "bg-secondary" : ""}
        >
          <div className="flex items-center gap-3 w-full">
            <Beaker className="h-4 w-4 text-secondary-foreground" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Demo Mode</span>
                {mode.current === "demo" && (
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Simulated data • Safe testing
              </p>
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleModeChange("shadow")}
          className={mode.current === "shadow" ? "bg-accent/10" : ""}
        >
          <div className="flex items-center gap-3 w-full">
            <Eye className="h-4 w-4 text-accent" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Shadow Mode</span>
                {mode.current === "shadow" && (
                  <Badge variant="outline" className="text-xs border-accent text-accent">
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Read-only • Real data • No execution
              </p>
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleModeChange("live")}
          className={mode.current === "live" ? "bg-primary/10" : ""}
        >
          <div className="flex items-center gap-3 w-full">
            <Zap className="h-4 w-4 text-primary" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Live Mode</span>
                {mode.current === "live" && (
                  <Badge className="text-xs">Active</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real execution • Funds at risk
              </p>
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="px-2 py-2">
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-2">
            {mode.current === "live" ? (
              <>
                <AlertTriangle className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Live mode executes real transactions. Ensure policies are configured correctly.
                </p>
              </>
            ) : (
              <>
                <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Switch to Live mode to enable real execution with your connected wallet.
                </p>
              </>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}