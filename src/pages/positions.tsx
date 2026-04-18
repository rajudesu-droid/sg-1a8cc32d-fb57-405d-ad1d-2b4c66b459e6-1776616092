import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, TrendingUp, TrendingDown, Activity, Droplets, ArrowUpRight, ArrowDownRight, Coins } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const positions = [
  {
    id: "1",
    pair: "ETH/USDC",
    dex: "Uniswap V3",
    chain: "Ethereum",
    feeTier: "0.3%",
    status: "in-range" as const,
    health: 92,
    deployed: "$8,200.00",
    currentValue: "$8,524.30",
    entryPrice: "$1,845.20",
    currentPrice: "$1,952.40",
    rangeLower: "$1,800.00",
    rangeUpper: "$2,100.00",
    fees: "$124.30",
    rewards: "$45.80",
    unrealizedPnL: "+$324.30",
    pnlPercent: "+3.96%",
    il: "-$12.40",
    ilPercent: "-0.15%",
    apy: "12.4%",
    nextAction: "Harvest rewards ($170.10 available)",
  },
  {
    id: "2",
    pair: "BNB/BUSD",
    dex: "PancakeSwap V3",
    chain: "BSC",
    feeTier: "0.25%",
    status: "in-range" as const,
    health: 85,
    deployed: "$5,600.00",
    currentValue: "$5,710.70",
    entryPrice: "$288.40",
    currentPrice: "$295.10",
    rangeLower: "$280.00",
    rangeUpper: "$320.00",
    fees: "$78.20",
    rewards: "$32.50",
    unrealizedPnL: "+$110.70",
    pnlPercent: "+1.98%",
    il: "-$8.60",
    ilPercent: "-0.15%",
    apy: "9.8%",
    nextAction: "Position healthy, no action needed",
  },
  {
    id: "3",
    pair: "MATIC/USDC",
    dex: "Uniswap V3",
    chain: "Polygon",
    feeTier: "0.3%",
    status: "out-of-range" as const,
    health: 42,
    deployed: "$4,600.00",
    currentValue: "$4,570.90",
    entryPrice: "$0.82",
    currentPrice: "$0.72",
    rangeLower: "$0.75",
    rangeUpper: "$0.95",
    fees: "$52.10",
    rewards: "$18.40",
    unrealizedPnL: "-$29.10",
    pnlPercent: "-0.63%",
    il: "-$64.20",
    ilPercent: "-1.40%",
    apy: "6.2%",
    nextAction: "Rebalance to new range or close position",
  },
];

export default function Positions() {
  const [filterStatus, setFilterStatus] = useState<PositionStatus | "all">("all");
  const [filterChain, setFilterChain] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const totalValue = positions.reduce((sum, p) => sum + parseFloat(p.currentValue.replace(/[$,]/g, "")), 0);
  const totalDeployed = positions.reduce((sum, p) => sum + parseFloat(p.deployed.replace(/[$,]/g, "")), 0);
  const inRangeCount = positions.filter(p => p.status === "in-range").length;

  const handleAddLiquidity = (position: Position) => {
    toast({
      title: "Adding Liquidity",
      description: `Increasing position size for ${position.pair}`,
    });
  };

  const handleHarvest = (position: Position) => {
    toast({
      title: "Harvesting Rewards",
      description: `Claiming ${position.accruedFees} in fees and ${position.accruedRewards} in rewards`,
    });
  };

  const handleCompound = (position: Position) => {
    toast({
      title: "Compounding",
      description: `Reinvesting rewards into ${position.pair} position`,
    });
  };

  const handleRebalance = (position: Position) => {
    toast({
      title: "Rebalancing Position",
      description: `Adjusting range for ${position.pair}`,
    });
  };

  const handleClosePosition = (position: Position) => {
    toast({
      title: "Closing Position",
      description: `Withdrawing all liquidity from ${position.pair}`,
      variant: "destructive",
    });
  };

  const handleViewDetails = (position: Position) => {
    toast({
      title: "Position Details",
      description: `Opening detailed view for ${position.pair}`,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">LP Positions</h1>
          <p className="text-muted-foreground mt-1">Active positions and performance tracking</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="card-gradient border-border/50">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Total Position Value</p>
                <p className="text-2xl font-semibold">${totalValue.toLocaleString()}</p>
                <p className="text-xs metric-positive">+$405.90 unrealized</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Active Positions</p>
                <p className="text-2xl font-semibold">{positions.length}</p>
                <p className="text-xs text-muted-foreground">{inRangeCount} in range · {positions.length - inRangeCount} out of range</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Total Fees + Rewards</p>
                <p className="text-2xl font-semibold metric-positive">$351.30</p>
                <p className="text-xs text-muted-foreground">Claimable across all positions</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Positions</TabsTrigger>
            <TabsTrigger value="in-range">In Range</TabsTrigger>
            <TabsTrigger value="out-of-range">Out of Range</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {positions.map((position) => (
              <Card key={position.id} className="card-gradient border-border/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">{position.pair}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {position.dex}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {position.chain}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {position.feeTier}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={`text-xs ${
                            position.status === "in-range"
                              ? "border-success/50 text-success bg-success/10"
                              : "border-accent/50 text-accent bg-accent/10"
                          }`}
                        >
                          {position.status === "in-range" ? "In Range" : "Out of Range"}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <p className="text-xs text-muted-foreground">Health Score</p>
                      <p className={`text-2xl font-semibold ${
                        position.health >= 70 ? "metric-positive" :
                        position.health >= 50 ? "metric-warning" : "metric-negative"
                      }`}>
                        {position.health}
                      </p>
                      <Progress value={position.health} className="w-24 h-2" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Deployed</p>
                      <p className="text-sm font-semibold">{position.deployed}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Current Value</p>
                      <p className="text-sm font-semibold">{position.currentValue}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Unrealized P&L</p>
                      <p className={`text-sm font-semibold ${
                        position.unrealizedPnL.startsWith("+") ? "metric-positive" : "metric-negative"
                      }`}>
                        {position.unrealizedPnL} ({position.pnlPercent})
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">APY</p>
                      <p className="text-sm font-semibold">{position.apy}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Price Range</span>
                      <span className="font-mono">{position.rangeLower} - {position.rangeUpper}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Entry Price</span>
                      <span className="font-mono">{position.entryPrice}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Current Price</span>
                      <span className="font-mono font-semibold">{position.currentPrice}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/30">
                    <div>
                      <p className="text-xs text-muted-foreground">Fees Earned</p>
                      <p className="text-sm font-mono metric-positive">{position.fees}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Rewards</p>
                      <p className="text-sm font-mono metric-positive">{position.rewards}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">IL Impact</p>
                      <p className="text-sm font-mono metric-negative">{position.il} ({position.ilPercent})</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/30">
                    <div className="flex items-start gap-2">
                      <Activity className="h-4 w-4 mt-0.5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Recommended Action</p>
                        <p className="text-sm font-medium">{position.nextAction}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="in-range" className="space-y-4">
            {positions.filter(p => p.status === "in-range").map((position) => (
              <div key={position.id}>Position card here (same as above)</div>
            ))}
          </TabsContent>

          <TabsContent value="out-of-range" className="space-y-4">
            {positions.filter(p => p.status === "out-of-range").map((position) => (
              <div key={position.id}>Position card here (same as above)</div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}