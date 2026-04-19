import { useAppStore } from "@/store";
import { AlertTriangle, Info, Eye } from "lucide-react";

export function ModeBanner() {
  const mode = useAppStore((state) => state.mode);

  if (mode.current === "demo") {
    return (
      <div className="rounded-lg border border-accent/50 bg-accent/10 p-4">
        <div className="flex items-center gap-3">
          <Info className="h-5 w-5 text-accent flex-shrink-0" />
          <div>
            <p className="text-sm">
              <strong className="text-foreground">Demo Mode:</strong> All data is simulated. No real funds or blockchain transactions. Perfect for testing strategies safely.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (mode.current === "shadow") {
    return (
      <div className="rounded-lg border border-primary/50 bg-primary/10 p-4">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5 text-primary flex-shrink-0" />
          <div>
            <p className="text-sm">
              <strong className="text-foreground">Shadow Mode:</strong> Read-only view with real wallet data. Recommendations and planned actions shown, but nothing will be executed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (mode.current === "live") {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div>
            <p className="text-sm">
              <strong className="text-foreground">Live Mode:</strong> Real blockchain execution enabled. All approved actions will use real funds. Policy rules are enforced. Emergency pause available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}