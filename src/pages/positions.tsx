import { AppLayout } from "@/components/AppLayout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, Coins, Target, Activity, AlertTriangle, RefreshCw, Search, DollarSign, Filter, ExternalLink, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store";
import { ModeBanner } from "@/components/ModeBanner";
import { orchestrator } from "@/core/orchestrator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { actionHandler } from "@/services/ActionHandlerService";
import type { ActionContext } from "@/services/ActionHandlerService";

type PositionStatus = "active" | "out-of-range" | "closed";

interface Position {
  id: string;
  pair: string;
  chain: string;
  dex: string;
  status: PositionStatus;
  valueUsd: number;
  rangeMin: number;
  rangeMax: number;
  currentPrice: number;
  liquidity: number;
  accruedFees: number;
  accruedRewards: number;
  health: number;
  openedAt: string;
}

export default function Positions() {
  const [filterStatus, setFilterStatus] = useState<PositionStatus | "all">("all");
  const [filterChain, setFilterChain] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const mode = useAppStore((state) => state.mode);
  const storePositions = useAppStore((state) => state.positions);

  // Listen for mode changes
  useEffect(() => {
    const unsubscribe = orchestrator.subscribe((event) => {
      if (event.type === "mode_changed") {
        console.log("[Positions] Mode changed, refreshing positions");
      }
    });
    return () => unsubscribe();
  }, []);

  // Use store positions if available, otherwise use mock data
  const displayPositions = storePositions.length > 0 ? storePositions : [];

  const filteredPositions = displayPositions.filter((position: any) => {
    const matchesStatus = filterStatus === "all" || position.status === filterStatus;
    const matchesChain = filterChain === "all" || position.chain === filterChain;
    const matchesSearch = position.pair.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesChain && matchesSearch;
  });

  const getActionContext = (): ActionContext => ({
    mode: mode.current,
    metadata: { source: "positions_page" },
  });

  const handleAddLiquidity = async (position: any) => {
    setActionLoading(`add-${position.id}`);
    try {
      const result = await actionHandler.addLiquidity(position.id, 1000, getActionContext());
      
      toast({
        title: result.success ? "Liquidity Added" : "Action Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Action Failed",
        description: "Failed to add liquidity",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleHarvest = async (position: any) => {
    setActionLoading(`harvest-${position.id}`);
    try {
      const result = await actionHandler.harvestRewards(position.id, getActionContext());
      
      toast({
        title: result.success ? "Harvest Complete" : "Action Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Action Failed",
        description: "Failed to harvest rewards",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompound = async (position: any) => {
    setActionLoading(`compound-${position.id}`);
    try {
      const result = await actionHandler.compoundRewards(position.id, getActionContext());
      
      toast({
        title: result.success ? "Compound Complete" : "Action Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Action Failed",
        description: "Failed to compound rewards",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRebalance = async (position: any) => {
    setActionLoading(`rebalance-${position.id}`);
    try {
      const result = await actionHandler.rebalancePosition(position.id, getActionContext());
      
      toast({
        title: result.success ? "Rebalance Complete" : "Action Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Action Failed",
        description: "Failed to rebalance position",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleClosePosition = async (position: any) => {
    setActionLoading(`close-${position.id}`);
    try {
      const result = await actionHandler.closePosition(position.id, getActionContext());
      
      toast({
        title: result.success ? "Position Closed" : "Action Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Action Failed",
        description: "Failed to close position",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = (position: any) => {
    toast({
      title: "Position Details",
      description: `Opening detailed view for ${position.pair}`,
    });
  };

  const getPageTitle = () => {
    switch (mode.current) {
      case "demo": return "Simulated Positions";
      case "shadow": return "Recommended Positions";
      case "live": return "Active Positions";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Active Positions</h1>
          <p className="text-muted-foreground">Monitor and manage your liquidity provider positions</p>
        </div>

        {/* Summary Report */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredPositions.length}</div>
              <p className="text-xs text-muted-foreground">Open LP positions</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value Locked</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${filteredPositions.reduce((sum, p) => sum + p.valueUsd, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Deployed capital</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accrued Fees</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">
                +${filteredPositions.reduce((sum, p) => sum + p.accruedFees, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Pending harvest</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net PnL</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                +${filteredPositions
                  .reduce(
                    (sum, p) =>
                      sum + (p.accruedFees + p.accruedRewards),
                    0
                  )
                  .toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Profit & loss</p>
            </CardContent>
          </Card>
        </div>

        {/* Mode Banner */}
        <ModeBanner />

        {/* Filters */}
        <Card className="card-gradient border-border/50">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by pair..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as PositionStatus | "all")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="out-of-range">Out of Range</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Chain</label>
                <Select value={filterChain} onValueChange={setFilterChain}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Chains</SelectItem>
                    <SelectItem value="Ethereum">Ethereum</SelectItem>
                    <SelectItem value="BSC">BSC</SelectItem>
                    <SelectItem value="Polygon">Polygon</SelectItem>
                    <SelectItem value="Avalanche">Avalanche</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" className="w-full">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Positions Grid */}
        <div className="grid gap-4">
          {filteredPositions.map((position) => (
            <Card key={position.id} className="card-gradient border-border/50">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">{position.pair}</h3>
                        <Badge variant="outline" className="text-xs">
                          {position.chain}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {position.dex}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Opened {new Date(position.openedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <Badge
                      variant={
                        position.status === "active"
                          ? "default"
                          : position.status === "out-of-range"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {position.status === "active"
                        ? "In Range"
                        : position.status === "out-of-range"
                        ? "Out of Range"
                        : "Closed"}
                    </Badge>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Liquidity</p>
                      <p className="text-sm font-semibold">{position.liquidity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Accrued Fees</p>
                      <p className="text-sm font-semibold metric-positive">{position.accruedFees}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Rewards</p>
                      <p className="text-sm font-semibold metric-positive">{position.accruedRewards}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Health</p>
                      <p
                        className={`text-sm font-semibold ${
                          position.health >= 80
                            ? "metric-positive"
                            : position.health >= 60
                            ? "text-accent"
                            : "metric-negative"
                        }`}
                      >
                        {position.health}%
                      </p>
                    </div>
                  </div>

                  {/* Range Info */}
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Range:</span>
                      <span className="font-mono">
                        ${position.rangeMin} - ${position.rangeMax}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Current Price:</span>
                      <span className="font-mono font-semibold">${position.currentPrice}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        className="gap-2" 
                        onClick={() => handleAddLiquidity(position)}
                        disabled={mode.current === "shadow" || actionLoading === `add-${position.id}`}
                      >
                        {actionLoading === `add-${position.id}` ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-4 w-4" />
                            Add Liquidity
                          </>
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-2" 
                        onClick={() => handleHarvest(position)}
                        disabled={mode.current === "shadow" || actionLoading === `harvest-${position.id}` || position.accruedRewards <= 0}
                      >
                        {actionLoading === `harvest-${position.id}` ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Harvesting...
                          </>
                        ) : (
                          <>
                            <Coins className="h-4 w-4" />
                            Harvest
                          </>
                        )}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleViewDetails(position)}>
                        View Details
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleCompound(position)}
                        disabled={mode.current === "shadow" || actionLoading === `compound-${position.id}` || position.accruedRewards <= 0}
                      >
                        {actionLoading === `compound-${position.id}` ? "Compounding..." : "Compound"}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleRebalance(position)}
                        disabled={mode.current === "shadow" || actionLoading === `rebalance-${position.id}`}
                      >
                        {actionLoading === `rebalance-${position.id}` ? "Rebalancing..." : "Rebalance"}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleClosePosition(position)}
                        disabled={mode.current === "shadow" || actionLoading === `close-${position.id}`}
                      >
                        {actionLoading === `close-${position.id}` ? "Closing..." : "Close Position"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPositions.length === 0 && (
          <Card className="card-gradient border-border/50">
            <CardContent className="p-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No positions found matching your filters
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}