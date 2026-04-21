import { useState, useEffect, useRef } from "react";
import { Activity, Pause, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { orchestrator } from "@/core/orchestrator";
import { useAppStore } from "@/store";

interface ActivityMessage {
  id: string;
  type: "search" | "discover" | "invest" | "rebalance" | "harvest" | "compound" | "error" | "warning" | "info";
  message: string;
  timestamp: Date;
}

const activityColors = {
  search: "bg-blue-500/10 text-blue-500 border-blue-500/50",
  discover: "bg-cyan-500/10 text-cyan-500 border-cyan-500/50",
  invest: "bg-green-500/10 text-green-500 border-green-500/50",
  rebalance: "bg-amber-500/10 text-amber-500 border-amber-500/50",
  harvest: "bg-emerald-500/10 text-emerald-500 border-emerald-500/50",
  compound: "bg-teal-500/10 text-teal-500 border-teal-500/50",
  error: "bg-red-500/10 text-red-500 border-red-500/50",
  warning: "bg-orange-500/10 text-orange-500 border-orange-500/50",
  info: "bg-slate-500/10 text-slate-500 border-slate-500/50",
};

const activityLabels = {
  search: "SEARCH",
  discover: "FOUND",
  invest: "INVESTED",
  rebalance: "REBALANCE",
  harvest: "HARVEST",
  compound: "COMPOUND",
  error: "ERROR",
  warning: "WARNING",
  info: "INFO",
};

export function LiveActivityBar() {
  const [activities, setActivities] = useState<ActivityMessage[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mode = useAppStore((state) => state.mode);
  const botRunning = useAppStore((state) => state.botRunning);

  // Auto-scroll to latest message
  useEffect(() => {
    if (!isPaused && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [activities, isPaused]);

  // Listen to orchestrator events
  useEffect(() => {
    const unsubscribe = orchestrator.subscribe((event) => {
      // Convert orchestrator events to activity messages
      let activityType: ActivityMessage["type"] = "info";
      let message = "";

      switch (event.type) {
        case "opportunity_scanned":
          activityType = "search";
          message = `Scanning opportunities on ${event.data?.protocol || "DEX"}...`;
          break;
        case "opportunity_discovered":
          activityType = "discover";
          message = `Found ${event.data?.count || 1} opportunities with score > ${event.data?.minScore || 70}`;
          break;
        case "position_opened":
          activityType = "invest";
          message = `Invested $${event.data?.amount || "0"} in ${event.data?.pair || "pool"} on ${event.data?.chain || "chain"}`;
          break;
        case "position_rebalanced":
          activityType = "rebalance";
          message = `Rebalanced position: ${event.data?.pair || "pool"} - moved to better opportunity`;
          break;
        case "rewards_harvested":
          activityType = "harvest";
          message = `Harvested $${event.data?.amount || "0"} in rewards from ${event.data?.pair || "pool"}`;
          break;
        case "rewards_compounded":
          activityType = "compound";
          message = `Compounded $${event.data?.amount || "0"} rewards back into ${event.data?.pair || "pool"}`;
          break;
        case "action_failed":
          activityType = "error";
          message = `Failed: ${event.data?.error || "Unknown error"}`;
          break;
        case "policy_updated":
          activityType = "info";
          message = "Automation policy updated";
          break;
        case "bot_started":
          activityType = "info";
          message = "Automation bot started";
          break;
        case "bot_stopped":
          activityType = "info";
          message = "Automation bot stopped";
          break;
        default:
          return; // Don't create activity for unhandled events
      }

      const newActivity: ActivityMessage = {
        id: `${Date.now()}-${Math.random()}`,
        type: activityType,
        message,
        timestamp: new Date(),
      };

      setActivities((prev) => [...prev.slice(-19), newActivity]); // Keep last 20
    });

    return () => unsubscribe();
  }, []);

  // Simulate activity in Demo mode when bot is running
  useEffect(() => {
    if (mode.current === "demo" && botRunning) {
      const simulationInterval = setInterval(() => {
        const simulations: Array<{ type: ActivityMessage["type"]; messages: string[] }> = [
          {
            type: "search",
            messages: [
              "Scanning Uniswap V3 pools on Ethereum...",
              "Searching PancakeSwap V3 opportunities on BSC...",
              "Analyzing Sushiswap pools on Arbitrum...",
              "Checking Curve pools on Polygon...",
            ],
          },
          {
            type: "discover",
            messages: [
              "Found 12 opportunities with score > 75",
              "Discovered 5 high-yield pools matching criteria",
              "Located 8 pools with favorable risk/reward",
              "Identified 3 optimal rebalance opportunities",
            ],
          },
          {
            type: "invest",
            messages: [
              "Invested $1,200 in ETH/USDC 0.05% on Ethereum",
              "Deployed $850 to WBTC/ETH 0.3% on Arbitrum",
              "Added $500 to BNB/BUSD 0.1% on BSC",
              "Opened position in MATIC/USDT 0.05% on Polygon",
            ],
          },
          {
            type: "rebalance",
            messages: [
              "Rebalancing: Moving funds from low-yield ETH/DAI to ETH/USDC",
              "Closing out-of-range position and redeploying capital",
              "Optimizing portfolio: Shifting to higher APY opportunity",
            ],
          },
          {
            type: "harvest",
            messages: [
              "Harvested $45.23 in fees from WBTC/ETH pool",
              "Claimed $78.90 rewards from UNI/ETH position",
              "Collected $32.15 in LP fees from multiple pools",
            ],
          },
          {
            type: "compound",
            messages: [
              "Compounded $45.23 rewards back into WBTC/ETH position",
              "Reinvested $78.90 into UNI/ETH pool",
              "Auto-compounded $32.15 across active positions",
            ],
          },
        ];

        const randomCategory = simulations[Math.floor(Math.random() * simulations.length)];
        const randomMessage = randomCategory.messages[Math.floor(Math.random() * randomCategory.messages.length)];

        const newActivity: ActivityMessage = {
          id: `${Date.now()}-${Math.random()}`,
          type: randomCategory.type,
          message: randomMessage,
          timestamp: new Date(),
        };

        setActivities((prev) => [...prev.slice(-19), newActivity]);
      }, 3000); // New message every 3 seconds

      return () => clearInterval(simulationInterval);
    }
  }, [mode, botRunning]);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsVisible(true)}
          className="bg-background/95 backdrop-blur-sm border-border shadow-lg"
        >
          <Activity className="h-4 w-4 mr-2" />
          Show Activity
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border shadow-2xl">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Header */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-semibold text-foreground">Live Activity</span>
            {botRunning && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/50 text-xs">
                Running
              </Badge>
            )}
          </div>

          {/* Scrolling Activity Feed */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollBehavior: isPaused ? "auto" : "smooth" }}
          >
            <div className="flex items-center gap-3 py-1">
              {activities.length === 0 ? (
                <div className="text-sm text-muted-foreground italic">
                  Waiting for automation activity...
                </div>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-2 flex-shrink-0 px-3 py-1.5 rounded-md border bg-card/50"
                  >
                    <Badge variant="outline" className={`text-xs font-mono ${activityColors[activity.type]}`}>
                      {activityLabels[activity.type]}
                    </Badge>
                    <span className="text-sm text-foreground whitespace-nowrap">{activity.message}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {activity.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsPaused(!isPaused)}
              className="h-8 w-8 p-0"
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsVisible(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}