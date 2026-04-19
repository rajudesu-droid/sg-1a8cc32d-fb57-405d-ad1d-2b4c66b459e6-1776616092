import { AppLayout } from "@/components/AppLayout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Search, Activity, DollarSign, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store";
import { ModeBanner } from "@/components/ModeBanner";
import { orchestrator } from "@/core/orchestrator";
import { opportunityEngine } from "@/core/engines";

type SortOption = "recommended" | "apy" | "tvl" | "risk";
type RiskFilter = "all" | "low" | "medium" | "high";

export default function Opportunities() {
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [chainFilter, setChainFilter] = useState<string>("all");
  const [protocolFilter, setProtocolFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const { toast } = useToast();
  const mode = useAppStore((state) => state.mode);
  const opportunities = useAppStore((state) => state.opportunities);
  const [isScanning, setIsScanning] = useState(false);

  // Listen for mode changes
  useEffect(() => {
    const unsubscribe = orchestrator.subscribe((event) => {
      if (event.type === "mode_changed") {
        handleRefreshPools();
      }
    });
    
    // Initial scan if empty
    if (opportunities.length === 0) {
      handleRefreshPools();
    }
    
    return () => unsubscribe();
  }, []);

  const handleRefreshPools = async () => {
    setIsScanning(true);
    toast({
      title: "Scanning Protocols",
      description: `Discovering opportunities across DEXs...`,
    });
    
    const { assets } = useAppStore.getState().wallet;
    await opportunityEngine.scanPools(assets);
    setIsScanning(false);
  };

  const getRiskLevel = (score: number) => {
    if (score < 30) return "low";
    if (score < 60) return "medium";
    return "high";
  };

  const filteredOpportunities = opportunities
    .filter(opp => {
      const riskLevel = getRiskLevel(opp.riskScore);
      if (riskFilter !== "all" && riskLevel !== riskFilter) return false;
      if (chainFilter !== "all" && opp.chain !== chainFilter) return false;
      if (protocolFilter !== "all" && opp.protocolName !== protocolFilter) return false;
      const pairName = `${opp.token0Symbol}/${opp.token1Symbol || ''}`;
      if (searchTerm && !pairName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "recommended") return b.netScore - a.netScore;
      if (sortBy === "apy") return b.totalYield - a.totalYield;
      if (sortBy === "tvl") return b.tvl - a.tvl;
      if (sortBy === "risk") return a.riskScore - b.riskScore;
      return 0;
    });

  const getRiskBadgeColor = (level: string) => {
    if (level === "low") return "border-success/50 text-success bg-success/10";
    if (level === "medium") return "border-accent/50 text-accent bg-accent/10";
    return "border-destructive/50 text-destructive bg-destructive/10";
  };

  const handleQuickDeploy = (opp: any) => {
    if (mode.current === "shadow") {
      toast({
        title: "Shadow Mode - Action Simulated",
        description: `Would deploy to ${opp.token0Symbol}/${opp.token1Symbol} on ${opp.protocolName}.`,
        variant: "default",
      });
      return;
    }

    toast({
      title: mode.current === "demo" ? "Simulating Deployment" : "Deploying Position",
      description: `${mode.current === "demo" ? "Simulating" : "Opening"} LP position on ${opp.protocolName}`,
    });
  };

  const uniqueChains = Array.from(new Set(opportunities.map(o => o.chain)));
  const uniqueProtocols = Array.from(new Set(opportunities.map(o => o.protocolName)));

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">LP Opportunities</h1>
            <p className="text-muted-foreground">
              Discover and compare liquidity pool opportunities across supported DEXes
            </p>
          </div>
          <Button onClick={handleRefreshPools} disabled={isScanning}>
            {isScanning ? "Scanning..." : "Scan Protocols"}
          </Button>
        </div>

        {/* Summary Report */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredOpportunities.length}</div>
              <p className="text-xs text-muted-foreground">Available pools</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average APY</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">
                {filteredOpportunities.length > 0
                  ? (
                      filteredOpportunities.reduce((sum, o) => sum + o.totalYield, 0) /
                      filteredOpportunities.length
                    ).toFixed(2)
                  : "0.00"}
                %
              </div>
              <p className="text-xs text-muted-foreground">Across all pools</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Highest Yield</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                {filteredOpportunities.length > 0
                  ? Math.max(...filteredOpportunities.map((o) => o.totalYield)).toFixed(2)
                  : "0.00"}
                %
              </div>
              <p className="text-xs text-muted-foreground">Best opportunity</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total TVL</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(filteredOpportunities.reduce((sum, o) => sum + o.tvl, 0) / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">Combined liquidity</p>
            </CardContent>
          </Card>
        </div>

        <ModeBanner />

        <Card className="card-gradient border-border/50">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search pairs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={chainFilter} onValueChange={setChainFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Chains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chains</SelectItem>
                  {uniqueChains.map(chain => (
                    <SelectItem key={chain} value={chain}>{chain}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={protocolFilter} onValueChange={setProtocolFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Protocols" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Protocols</SelectItem>
                  {uniqueProtocols.map(protocol => (
                    <SelectItem key={protocol} value={protocol}>{protocol}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="apy">Highest APY</SelectItem>
                  <SelectItem value="tvl">Highest TVL</SelectItem>
                  <SelectItem value="risk">Lowest Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Opportunities Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOpportunities.map((opp) => {
            const riskLevel = getRiskLevel(opp.riskScore);
            const pairName = opp.token1Symbol ? `${opp.token0Symbol}/${opp.token1Symbol}` : opp.token0Symbol;
            
            return (
              <Card key={opp.id} className="card-gradient border-border/50 transition-all hover:border-primary/50 flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {pairName}
                        {opp.whitelisted && (
                          <Badge variant="outline" className="text-[10px] h-5 border-emerald-500/30 text-emerald-500">Verified</Badge>
                        )}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {opp.protocolName}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {opp.chain}
                        </Badge>
                        {opp.feeTier && (
                          <Badge variant="outline" className="text-xs">
                            {opp.feeTier}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {opp.netScore > 70 && (
                      <Badge className="bg-primary/20 text-primary border-primary/50 shrink-0">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Top
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 flex-1 flex flex-col">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Total Yield</p>
                      <p className="text-xl font-semibold metric-positive">{opp.totalYield.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Risk Score</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-mono font-semibold">{opp.riskScore}</p>
                        <Badge variant="outline" className={`text-xs ${getRiskBadgeColor(riskLevel)}`}>
                          {riskLevel}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/30 flex-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Base Yield</span>
                      <span className="font-mono font-medium">{opp.baseYield.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Reward APR</span>
                      <span className="font-mono font-medium">{opp.farmRewardYield.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">TVL</span>
                      <span className="font-mono font-medium">${(opp.tvl / 1000000).toFixed(2)}M</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">24h Volume</span>
                      <span className="font-mono font-medium">${(opp.volume24h / 1000000).toFixed(2)}M</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/30">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleQuickDeploy(opp)}
                      disabled={mode.current === "shadow"}
                    >
                      {mode.current === "shadow" ? "Preview Only" : "Quick Deploy"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredOpportunities.length === 0 && (
          <Card className="card-gradient border-border/50">
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No opportunities found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search term</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}